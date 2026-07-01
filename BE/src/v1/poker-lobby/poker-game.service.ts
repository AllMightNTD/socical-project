import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { Server } from 'socket.io';
import { GameHand, HandStage } from '../entities/game_hand.entity';
import { HandAction } from '../entities/hand_action.entity';
import { HandPlayer } from '../entities/hand_player.entity';
import { PokerTable } from '../entities/poker_table.entity';
import { SystemRevenue } from '../entities/system_revenue.entity';
import { TableSession } from '../entities/table_session.entity';
import { PokerBotAI } from './poker-bot.ai';
import { PokerGameEngine } from './poker-game.engine';
import { PokerLobbyService } from './poker-lobby.service';
import { PokerStateService } from './poker-state.service';

@Injectable()
export class PokerGameService {
  private logger = new Logger(PokerGameService.name);
  private server: Server;

  // Quản lý Timers hành động (Key: roomId)
  private actionTimers = new Map<string, { timeout: NodeJS.Timeout; expiresAt: number; currentSeat: number }>();
  // Quản lý Disconnect Protection (Key: roomId:userId)
  private disconnectTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly lobbyService: PokerLobbyService,
    private readonly stateService: PokerStateService,
  ) { }

  setServer(server: Server) {
    this.server = server;
  }

  cancelDisconnectTimeout(roomId: string, userId: string) {
    const dcKey = `${roomId}:${userId}`;
    if (this.disconnectTimeouts.has(dcKey)) {
      clearTimeout(this.disconnectTimeouts.get(dcKey));
      this.disconnectTimeouts.delete(dcKey);
      this.logger.log(`Canceled disconnect timeout for user ${userId} on table ${roomId}`);
    }
  }

  /**
   * Xử lý khi mất kết nối mạng (Disconnect Protection 30s)
   */
  async handlePlayerConnectionLost(roomId: string, userId: string) {
    const seats = await this.stateService.getAllSeats(roomId);
    const playerSeat = seats.find(s => s.user_id === userId);

    if (
      !playerSeat ||
      playerSeat.status === 'folded' ||
      playerSeat.status === 'sitting_out' ||
      // All-in players (stack = 0) không cần hành động nữa.
      // Không thay đổi status để Run the Board và Showdown vẫn tính họ đúng.
      (playerSeat.status === 'active' && parseInt(playerSeat.stack || '0') === 0)
    ) {
      return;
    }

    // Đánh dấu disconnected trên Redis
    await this.stateService.setSeat(roomId, playerSeat.seat_number, {
      status: 'disconnected',
      disconnected_at: Date.now().toString(),
    });

    this.server.to(`table_${roomId}`).emit('table:player-disconnected', {
      user_id: userId,
      seat_number: playerSeat.seat_number,
    });

    // Thiết lập đếm ngược 30 giây bảo vệ
    const dcKey = `${roomId}:${userId}`;
    const timeout = setTimeout(async () => {
      this.logger.warn(`Disconnect Protection expired for user ${userId} on table ${roomId}`);
      this.disconnectTimeouts.delete(dcKey);

      // Chuyển sang trạng thái sit_out ở ván tiếp theo
      await this.stateService.setSeat(roomId, playerSeat.seat_number, {
        status: 'sitting_out',
      });

      // Nếu đang tới lượt đi của họ, ép Fold/Check ngay lập tức
      const tableState = await this.stateService.getTableState(roomId);
      if (tableState && parseInt(tableState.current_turn_seat) === playerSeat.seat_number) {
        await this.executeAutoAction(roomId, playerSeat.seat_number);
      }
      await this.checkAndNotifyWaitingState(roomId);
    }, 30000);

    this.disconnectTimeouts.set(dcKey, timeout);
  }

  /**
   * Helper: Broadcast danh sách yêu cầu xin ngồi vào bàn
   */
  async broadcastSitRequests(roomId: string) {
    try {
      const redis = this.stateService.getRedisClient();
      const requestsRaw = await redis.hgetall(`table:${roomId}:sit-requests`);
      const list = Object.values(requestsRaw).map(v => JSON.parse(v));
      this.server.to(`table_${roomId}`).emit('table:sit-requests-list', { requests: list });
    } catch (err) {
      this.logger.error(`Error broadcasting sit requests: ${err.message}`);
    }
  }

  /**
   * Xử lý chi tiết hành động cược
   */
  async processPlayerAction(
    roomId: string,
    seatNumber: number,
    actionType: string,
    amount: number,
  ) {
    const tableState = await this.stateService.getTableState(roomId);
    const seats = await this.stateService.getAllSeats(roomId);
    const activeSeat = seats.find(s => s.seat_number === seatNumber);

    let stack = parseInt(activeSeat.stack);
    let currentBet = parseInt(activeSeat.current_bet || '0');
    let highestBet = parseInt(tableState.current_highest_bet || '0');
    const originalHighestBet = highestBet;
    let lastFullRaiseSize = parseInt(tableState.last_full_raise_size || '0');
    const dbTableForBB = await PokerTable.findOne({ where: { id: roomId } });
    const bbAmount = dbTableForBB ? parseInt(dbTableForBB.big_blind || '100') : 100;
    if (lastFullRaiseSize === 0) lastFullRaiseSize = bbAmount;

    let actionCost = 0;
    let actualAction = actionType.toLowerCase();
    let isFullRaise = false;

    // 1. Phân loại và tính toán chi phí chip
    if (actualAction === 'fold') {
      await this.stateService.setSeat(roomId, seatNumber, { status: 'folded' });
    } else if (actualAction === 'check') {
      if (currentBet < highestBet) {
        throw new Error('Không thể Check do mức cược của bạn thấp hơn mức cược hiện tại.');
      }
    } else if (actualAction === 'call') {
      actionCost = highestBet - currentBet;
      if (actionCost >= stack) {
        actionCost = stack;
        actualAction = 'allin';
      }
      stack -= actionCost;
      currentBet += actionCost;
    } else if (actualAction === 'raise' || actualAction === 'bet') {
      const targetBet = amount; // Tổng lượng cược sau khi raise
      if (targetBet <= highestBet) {
        throw new Error(`Cược tối thiểu phải lớn hơn mức cược cao nhất: ${highestBet}`);
      }
      if (actualAction === 'raise' && targetBet < highestBet + lastFullRaiseSize) {
        // Cược raise nhỏ hơn min raise chỉ hợp lệ nếu người chơi All-in
        if (targetBet !== currentBet + stack) {
          throw new Error(`Raise tối thiểu phải là: ${highestBet + lastFullRaiseSize}`);
        }
      }
      actionCost = targetBet - currentBet;
      if (actionCost >= stack) {
        actionCost = stack;
        actualAction = 'allin';
        currentBet += actionCost;
        stack = 0;
        if (currentBet > originalHighestBet) {
          const increase = currentBet - originalHighestBet;
          if (increase >= lastFullRaiseSize) {
            isFullRaise = true;
            lastFullRaiseSize = increase;
          }
          highestBet = currentBet;
        }
      } else {
        stack -= actionCost;
        const increase = targetBet - originalHighestBet;
        if (increase >= lastFullRaiseSize) {
          isFullRaise = true;
          lastFullRaiseSize = increase;
        }
        currentBet = targetBet;
        highestBet = targetBet;
      }
    } else if (actualAction === 'allin') {
      actionCost = stack;
      currentBet += actionCost;
      stack = 0;
      if (currentBet > originalHighestBet) {
        const increase = currentBet - originalHighestBet;
        if (increase >= lastFullRaiseSize) {
          isFullRaise = true;
          lastFullRaiseSize = increase;
        }
        highestBet = currentBet;
      }
    }

    // 2. Cập nhật trạng thái Ghế ngồi lên Redis
    let nextStatus = activeSeat.status;
    if (actualAction === 'fold') {
      nextStatus = 'folded';
    } else if (actualAction === 'allin') {
      nextStatus = 'active';
    }

    const prevContributed = parseInt(activeSeat.total_contributed || '0');
    await this.stateService.setSeat(roomId, seatNumber, {
      stack: stack.toString(),
      current_bet: currentBet.toString(),
      status: nextStatus,
      has_acted: '1',
      total_contributed: (prevContributed + actionCost).toString(),
    });

    // Nếu đây là hành động cược/tăng cược hợp lệ (Full Raise)
    if (isFullRaise) {
      const otherActiveSeats = seats.filter(s => s.seat_number !== seatNumber && s.status === 'active');
      for (const os of otherActiveSeats) {
        await this.stateService.setSeat(roomId, os.seat_number, {
          has_acted: '0',
        });
      }
    }
    await this.syncSeatStackToDb(roomId, activeSeat.user_id, stack.toString());

    // 3. Cập nhật Pot & Highest Bet của bàn đấu
    const currentPot = parseInt(tableState.total_pot || '0') + actionCost;
    await this.stateService.setTableState(roomId, {
      total_pot: currentPot.toString(),
      current_highest_bet: highestBet.toString(),
      last_full_raise_size: lastFullRaiseSize.toString(),
    });

    // Ghi nhật ký hành động vào Redis List đệm
    const actionLog = {
      seat_number: seatNumber,
      user_id: activeSeat.user_id,
      action_type: actualAction,
      amount: actionCost,
      stage: tableState.game_stage || 'preflop',
      timestamp: Date.now(),
    };
    await this.stateService.pushActionLog(tableState.current_hand_id || '0', JSON.stringify(actionLog));

    // Broadcast thông báo hành động
    this.server.to(`table_${roomId}`).emit('table:action-recorded', {
      seat_number: seatNumber,
      action_type: actualAction,
      amount: actionCost,
      new_stack: stack,
      total_pot: currentPot,
    });

    // 4. Chuyển lượt đi tiếp theo hoặc kết thúc sớm nếu chỉ còn 1 người chơi active (mọi người khác fold)
    const updatedSeats = await this.stateService.getAllSeats(roomId);
    const activePlayers = updatedSeats.filter(s => s.status === 'active');

    if (activePlayers.length === 1) {
      await this.endHandEarly(roomId, activePlayers[0].seat_number);
    } else if (activePlayers.length === 0) {
      await this.endHandEarly(roomId, seatNumber);
    } else {
      await this.advanceTurn(roomId);
    }
  }

  /**
   * Chuyển lượt sang ghế kế tiếp
   */
  private async advanceTurn(roomId: string) {
    const tableState = await this.stateService.getTableState(roomId);
    if (!tableState) return;

    const seats = await this.stateService.getAllSeats(roomId);
    const currentTurnSeat = parseInt(tableState.current_turn_seat || '0');
    const dbTable = await PokerTable.findOne({ where: { id: roomId } });
    const maxPlayers = dbTable ? dbTable.max_players : 9;

    // 1. Lọc điều kiện chuẩn xác theo luật Poker
    const activePlayers = seats.filter(s => s.status === 'active');
    const highestBet = parseInt(tableState.current_highest_bet || '0');

    // Chỉ check 'has_acted' của những người chơi ĐANG CÒN CHIP (Chưa All-in, Chưa Fold)
    const playersNeedToAct = activePlayers.filter(s => parseInt(s.stack || '0') > 0);
    const anyoneNotActed = playersNeedToAct.some(p => p.has_acted !== '1');

    // Lượng cược của tất cả những người chơi chưa fold phải bằng mức cược cao nhất hoặc họ đã All-in
    const allBetsEqual = activePlayers.every(s => {
      const playerBet = parseInt(s.current_bet || '0');
      const isAllIn = parseInt(s.stack || '0') === 0;
      return playerBet === highestBet || isAllIn;
    });

    // FIX LỖI CHÍ MẠNG: VÒNG CƯỢC CHỈ KẾT THÚC KHI: Tất cả những người còn tiền đã hành động VÀ tất cả đã cân tiền (hoặc All-in)
    const isRoundOver = !anyoneNotActed && allBetsEqual;

    // 2. Xử lý Logic chuyển Street hoặc chuyển Turn
    if (isRoundOver) {
      // Vòng cược hiện tại đã kết thúc hợp lệ -> Tiến hành chuyển Street
      await this.advanceStreet(roomId);
    } else {
      // Vòng cược chưa xong (Vẫn còn người chơi cần Call / Raise đối ứng lượng All-in)
      // Tìm ghế tiếp theo hợp lệ (Phải ACTIVE và PHẢI CÒN CHIP)
      let nextSeatNum = currentTurnSeat;
      let found = false;

      for (let i = 0; i < maxPlayers; i++) {
        nextSeatNum = (nextSeatNum % maxPlayers) + 1;
        const seat = seats.find(s => s.seat_number === nextSeatNum);
        // FIX BUG: Chỉ chuyển lượt cho người chơi còn tiền (stack > 0) và chưa Fold (status === 'active')
        if (seat && seat.status === 'active' && parseInt(seat.stack || '0') > 0) {
          found = true;
          break;
        }
      }

      if (found) {
        await this.stateService.setTableState(roomId, { current_turn_seat: nextSeatNum.toString() });
        this.server.to(`table_${roomId}`).emit('table:turn-change', {
          seat_number: nextSeatNum,
          time_limit: 30,
        });
        this.startActionTimer(roomId, nextSeatNum, 30);
        await this.broadcastTableState(roomId);
        this.checkAndTriggerBotAction(roomId);
      } else {
        // Trường hợp khẩn cấp nếu không có ai hành động tiếp (Mọi người đã All-in hết trừ người vừa đi nhưng chưa hoàn toàn cân hết vòng cược)
        await this.advanceStreet(roomId);
      }
    }
  }

  /**
   * Chuyển giai đoạn bàn đấu (Preflop -> Flop -> Turn -> River -> Showdown)
   */
  private async advanceStreet(roomId: string) {
    const tableState = await this.stateService.getTableState(roomId);
    if (!tableState) return;

    this.clearActionTimer(roomId);

    const currentStage = tableState.game_stage as HandStage;
    const seats = await this.stateService.getAllSeats(roomId);
    const activePlayers = seats.filter((s) => s.status === 'active');
    const activeNonAllIn = activePlayers.filter((s) => parseInt(s.stack || '0') > 0);

    // FIX LỖI TS2304: Di chuyển lấy cấu hình max_players lên đầu hàm để dùng chung
    const dbTable = await PokerTable.findOne({ where: { id: roomId } });
    const maxPlayers = dbTable ? dbTable.max_players : 9;

    // 1. Kiểm tra điều kiện Auto "Run the Board"
    const isAutoRunBoard = activePlayers.length >= 2 && activeNonAllIn.length <= 1;

    // 2. Chuyển sang giai đoạn tiếp theo
    let nextStage: HandStage = 'showdown';
    if (currentStage === 'preflop') nextStage = 'flop';
    else if (currentStage === 'flop') nextStage = 'turn';
    else if (currentStage === 'turn') nextStage = 'river';

    // Gom tiền từ current_bet của các ghế vào total_pot trước khi reset current_bet
    let streetPotGained = 0;
    for (const s of seats) {
      streetPotGained += parseInt(s.current_bet || '0');
    }
    const newTotalPot = parseInt(tableState.total_pot || '0') + streetPotGained;

    // Tiến hành chia bài tương ứng với từng giai đoạn
    let updatedCommunityCards = tableState.community_cards || '';
    let deck = await this.stateService.getDeck(roomId);

    if (nextStage === 'flop' && deck.length >= 3) {
      const flopCards = [deck.shift(), deck.shift(), deck.shift()];
      updatedCommunityCards = flopCards.join(',');
    } else if ((nextStage === 'turn' || nextStage === 'river') && deck.length >= 1) {
      const nextCard = deck.shift();
      updatedCommunityCards = updatedCommunityCards ? `${updatedCommunityCards},${nextCard}` : nextCard;
    }

    await this.stateService.setDeck(roomId, deck);

    // Reset current_bet và has_acted cho vòng mới
    for (const seat of seats) {
      await this.stateService.setSeat(roomId, seat.seat_number, {
        current_bet: '0',
        has_acted: '0',
      });
    }

    await this.stateService.setTableState(roomId, {
      game_stage: nextStage,
      total_pot: newTotalPot.toString(),
      current_highest_bet: '0',
      last_full_raise_size: '0',
      community_cards: updatedCommunityCards,
      current_turn_seat: '0', // Tạm thời khóa lượt hành động
    });

    // Thông báo cho Client cập nhật bài chung
    this.server.to(`table_${roomId}`).emit('table:street-advanced', {
      game_stage: nextStage,
      community_cards: updatedCommunityCards,
      total_pot: newTotalPot,
    });

    // 3. Thực thi Đệ quy Auto Run Board hoặc chuyển tiếp thông thường
    if (nextStage === 'showdown') {
      await this.processShowdown(roomId);
    } else if (isAutoRunBoard) {
      // Nếu thỏa mãn Auto Run, đợi 2 giây hiệu ứng rồi tự động gọi tiếp advanceStreet
      setTimeout(async () => {
        const hasLock = await this.stateService.acquireLock(roomId);
        if (!hasLock) return;
        try {
          await this.advanceStreet(roomId);
        } finally {
          await this.stateService.releaseLock(roomId);
        }
      }, 2000);
    } else {
      // Ván bài tiếp tục bình thường, tìm người đầu tiên hành động ở street mới (vị trí SB/BB còn active)
      let firstActSeat = parseInt(tableState.dealer_seat || '1');
      let foundFirst = false;

      // Biến maxPlayers ở đây giờ đã hoàn toàn hợp lệ và đã được khai báo ở trên đầu hàm
      for (let i = 0; i < maxPlayers; i++) {
        firstActSeat = (firstActSeat % maxPlayers) + 1;
        const s = seats.find((seat) => seat.seat_number === firstActSeat);
        if (s && s.status === 'active' && parseInt(s.stack || '0') > 0) {
          foundFirst = true;
          break;
        }
      }

      if (foundFirst) {
        await this.stateService.setTableState(roomId, { current_turn_seat: firstActSeat.toString() });
        this.server.to(`table_${roomId}`).emit('table:turn-change', {
          seat_number: firstActSeat,
          time_limit: 30,
        });
        this.startActionTimer(roomId, firstActSeat, 30);
        this.checkAndTriggerBotAction(roomId);
      } else {
        await this.advanceStreet(roomId);
      }
    }
    await this.broadcastTableState(roomId);
  }

  /**
   * Xử lý Showdown & Kết thúc ván bài
   */
  private async processShowdown(roomId: string) {
    console.log(`[SHOWDOWN] START roomId=${roomId}`);

    const tableState = await this.stateService.getTableState(roomId);
    console.log(`[SHOWDOWN] tableState:`, tableState);

    const seats = await this.stateService.getAllSeats(roomId);
    console.log(`[SHOWDOWN] total seats=${seats.length}`);

    const community = tableState.community_cards
      ? tableState.community_cards.split(',')
      : [];

    console.log(`[SHOWDOWN] community cards:`, community);

    const dbTable = await PokerTable.findOne({ where: { id: roomId } });
    console.log(`[SHOWDOWN] dbTable:`, {
      id: dbTable?.id,
      max_players: dbTable?.max_players,
      rake_rate: dbTable?.rake_rate,
      rake_cap: dbTable?.rake_cap,
    });

    const maxPlayers = dbTable ? dbTable.max_players : 9;

    const activePlayers = seats.filter(
      s =>
        parseInt(s.total_contributed || '0') > 0 &&
        s.status !== 'folded',
    );

    console.log(
      `[SHOWDOWN] activePlayers=${activePlayers.length}`,
      activePlayers.map(p => ({
        seat: p.seat_number,
        user: p.user_id,
        bet: p.total_contributed,
        stack: p.stack,
        status: p.status,
      })),
    );

    const evaluatedPlayers = await Promise.all(
      activePlayers.map(async (p) => {
        const pocket = await this.stateService.getPlayerCards(
          roomId,
          p.user_id,
        );

        const evalResult =
          PokerGameEngine.evaluate7CardHand([
            ...pocket,
            ...community,
          ]);

        console.log(`[SHOWDOWN] eval player`, {
          seat: p.seat_number,
          user: p.user_id,
          pocket,
          score: evalResult.score,
          hand: evalResult.name,
        });

        return {
          seat: p.seat_number,
          user_id: p.user_id,
          username: p.username,
          pocket,
          score: evalResult.score,
          handName: evalResult.name,
        };
      }),
    );

    const playerBetStates = seats.map(s => ({
      seat: s.seat_number,
      bet: parseInt(s.total_contributed || '0'),
      folded: s.status === 'folded',
      allIn:
        parseInt(s.stack || '0') === 0 &&
        parseInt(s.total_contributed || '0') > 0,
    }));

    console.log(`[SHOWDOWN] playerBetStates:`, playerBetStates);

    const pots = PokerGameEngine.splitPot(playerBetStates);

    console.log(`[SHOWDOWN] split pots:`, JSON.stringify(pots, null, 2));

    const winnerMap = new Map();
    let totalRakedPot = 0;

    for (const [i, pot] of pots.entries()) {
      console.log(`[SHOWDOWN] POT #${i}`, pot);
      if (!pot.isUncalled) {
        totalRakedPot += pot.amount;
      }

      const eligibleEvaluations = evaluatedPlayers.filter(p =>
        pot.eligibleSeats.includes(p.seat),
      );

      console.log(
        `[SHOWDOWN] eligiblePlayers pot #${i}:`,
        eligibleEvaluations.map(p => ({
          seat: p.seat,
          score: p.score,
          hand: p.handName,
        })),
      );

      if (eligibleEvaluations.length === 0) {
        console.warn(`[SHOWDOWN] POT #${i} no eligible players`);
        continue;
      }

      let maxScore = -1;
      let potWinners: typeof eligibleEvaluations = [];

      for (const player of eligibleEvaluations) {
        if (player.score > maxScore) {
          maxScore = player.score;
          potWinners = [player];
        } else if (player.score === maxScore) {
          potWinners.push(player);
        }
      }

      console.log(`[SHOWDOWN] POT #${i} winners:`, {
        maxScore,
        winners: potWinners.map(w => ({
          seat: w.seat,
          user: w.user_id,
          hand: w.handName,
        })),
      });

      const winShare = Math.floor(pot.amount / potWinners.length);
      let remainder = pot.amount % potWinners.length;

      console.log(`[SHOWDOWN] POT #${i} split`, {
        amount: pot.amount,
        winShare,
        remainder,
      });

      const dealerSeatNum = parseInt(
        tableState.dealer_seat || '1',
      );

      potWinners.sort((a, b) => {
        const distA =
          (a.seat - dealerSeatNum - 1 + maxPlayers) %
          maxPlayers;
        const distB =
          (b.seat - dealerSeatNum - 1 + maxPlayers) %
          maxPlayers;
        return distA - distB;
      });

      for (const winner of potWinners) {
        const extraChip = remainder > 0 ? 1 : 0;
        if (remainder > 0) remainder--;

        const finalWinAmount = winShare + extraChip;

        console.log(`[SHOWDOWN] PAY WINNER`, {
          seat: winner.seat,
          user: winner.user_id,
          win: finalWinAmount,
        });

        const existing = winnerMap.get(winner.user_id);

        if (existing) {
          existing.win_amount += finalWinAmount;
        } else {
          winnerMap.set(winner.user_id, {
            seat_number: winner.seat,
            username: winner.username,
            win_amount: finalWinAmount,
            hand_name: winner.handName,
            pocket_cards: winner.pocket,
          });
        }
      }
    }

    const winnersLog = Array.from(winnerMap.values());

    console.log(`[SHOWDOWN] FINAL WINNERS:`, winnersLog);

    await this.finalizeAndBroadcastHand(roomId, winnersLog, totalRakedPot, tableState, seats);
  }

  private async verifyCardIntegrity(roomId: string): Promise<boolean> {
    const deck = await this.stateService.getDeck(roomId);
    const tableState = await this.stateService.getTableState(roomId);
    const community = tableState?.community_cards ? tableState.community_cards.split(',') : [];
    const seats = await this.stateService.getAllSeats(roomId);

    const allCollectedCards: string[] = [...deck, ...community];

    for (const seat of seats) {
      const pocket = await this.stateService.getPlayerCards(roomId, seat.user_id);
      if (pocket && pocket.length > 0) {
        allCollectedCards.push(...pocket);
      }
    }

    const cleanCards = allCollectedCards.filter(c => c && c.trim() !== '');
    const uniqueCards = new Set(cleanCards);

    if (uniqueCards.size !== cleanCards.length) {
      this.logger.error(`CARD INTEGRITY FAILURE on table ${roomId}: Duplicate cards detected! total: ${cleanCards.length}, unique: ${uniqueCards.size}`);
      return false;
    }

    const validSuits = ['C', 'D', 'H', 'S'];
    const validRanks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    for (const card of cleanCards) {
      if (card.length !== 2) return false;
      const rank = card[0];
      const suit = card[1];
      if (!validRanks.includes(rank) || !validSuits.includes(suit)) {
        this.logger.error(`CARD INTEGRITY FAILURE on table ${roomId}: Invalid card format: ${card}`);
        return false;
      }
    }

    return true;
  }

  async checkAndNotifyWaitingState(roomId: string) {
    const tableState = await this.stateService.getTableState(roomId);
    if (!tableState || tableState.game_stage !== 'waiting') return;

    const seats = await this.stateService.getAllSeats(roomId);
    const eligiblePlayers = seats.filter(s => (s.status === 'active' || s.status === 'waiting_for_next_hand') && parseInt(s.stack) > 0);

    if (eligiblePlayers.length >= 2) {
      this.server.to(`table_${roomId}`).emit('table:waiting-for-players', {
        required: 2,
        current: eligiblePlayers.length,
        starting: false,
        can_start: true // Host can click Start
      });
    } else {
      this.server.to(`table_${roomId}`).emit('table:waiting-for-players', {
        required: 2,
        current: eligiblePlayers.length,
        starting: false,
        can_start: false
      });
    }
  }
  async startNewHand(roomId: string, clientSeedOverride?: string) {
    const lockAcquired = await this.stateService.acquireLock(roomId);
    if (!lockAcquired) {
      this.logger.warn(`Could not acquire lock for startNewHand on table ${roomId}. Skipping.`);
      return;
    }

    try {
      // Clear action timer and clean previous hand action logs
      this.clearActionTimer(roomId);

      const tableStateBefore = await this.stateService.getTableState(roomId);
      if (tableStateBefore && tableStateBefore.current_hand_id) {
        await this.stateService.deleteActionLogs(tableStateBefore.current_hand_id);
      }

      // P0: 1 - Skip starting a new hand if the table is already in progress
      const currentStage = tableStateBefore?.game_stage || 'waiting';
      if (currentStage !== 'ended' && currentStage !== 'waiting') {
        this.logger.warn(`Table ${roomId} is already in stage ${currentStage}. Skipping startNewHand.`);
        return;
      }

      const seats = await this.stateService.getAllSeats(roomId);
      let activeSeatsList = [...seats];

      // Clear player cards and community cards before starting a new hand (P0: 2)
      for (const seat of seats) {
        await this.stateService.deletePlayerCards(roomId, seat.user_id);
      }
      await this.stateService.setTableState(roomId, { community_cards: '' });

      // 1. Kiểm tra tích lũy vắng mặt / ngắt kết nối quá 5 ván bài liên tiếp
      const redis = this.stateService.getRedisClient();
      const currentSeats = [...seats];
      for (const seat of currentSeats) {
        const statsKey = `table:${roomId}:player:${seat.user_id}:stats`;
        if (seat.status === 'sitting_out' || seat.status === 'disconnected') {
          const awayCount = await redis.hincrby(statsKey, 'consecutive_away_hands', 1);
          if (awayCount >= 5) {
            this.logger.log(`User ${seat.user_id} has been sitting out or disconnected for 5 hands. Auto-kicking.`);
            try {
              await this.lobbyService.leaveRoom(seat.user_id, roomId);
              this.server.to(`table_${roomId}`).emit('table:player-stood-up', {
                seat_number: seat.seat_number,
                user_id: seat.user_id,
              });
              // Loại bỏ khỏi danh sách local seats mà không mutate trực tiếp seats parameter (P2: 12)
              activeSeatsList = activeSeatsList.filter(s => s.seat_number !== seat.seat_number);
            } catch (err) {
              this.logger.error(`Error auto-kicking inactive player: ${err.message}`);
            }
          }
        } else {
          await redis.hset(statsKey, 'consecutive_away_hands', '0');
        }
      }

      // Reset trạng thái các ghế ngồi để sẵn sàng chia bài
      for (const seat of activeSeatsList) {
        const currentStack = parseInt(seat.stack);
        if (currentStack === 0) {
          this.logger.log(`User ${seat.user_id} has 0 chips. Auto-kicking from seat.`);
          try {
            await this.lobbyService.leaveRoom(seat.user_id, roomId);
            this.server.to(`table_${roomId}`).emit('table:player-stood-up', {
              seat_number: seat.seat_number,
              user_id: seat.user_id,
            });
            activeSeatsList = activeSeatsList.filter(s => s.seat_number !== seat.seat_number);
          } catch (err) {
            this.logger.error(`Error auto-kicking 0-chip player: ${err.message}`);
          }
          continue;
        }
        if (seat.status === 'waiting_for_next_hand') {
          await this.stateService.setSeat(roomId, seat.seat_number, {
            status: 'active',
            current_bet: '0',
            has_acted: '0',
            total_contributed: '0',
          });
          seat.status = 'active';
        } else if (seat.status === 'active' || seat.status === 'folded') {
          await this.stateService.setSeat(roomId, seat.seat_number, {
            status: 'active',
            current_bet: '0',
            has_used_extra_time: '0',
            has_acted: '0',
            total_contributed: '0',
          });
          seat.status = 'active';
        }
      }

      // Bắt buộc phải có từ 2 người chơi active trở lên mới chia bài (stack > 0)
      const activePlayers = activeSeatsList.filter(s => s.status === 'active' && parseInt(s.stack) > 0);

      if (activePlayers.length < 2) {
        await this.stateService.setTableState(roomId, {
          game_stage: 'waiting',
          total_pot: '0',
          current_highest_bet: '0',
          current_turn_seat: '0',
          community_cards: '', // Xóa bài chung
        });
        await this.broadcastTableState(roomId);
        this.server.to(`table_${roomId}`).emit('table:board-reset-state', { message: 'Bàn đã được reset' });
        await this.checkAndNotifyWaitingState(roomId);
        return;
      }

      // Xác định Dealer, Small Blind, Big Blind tiếp theo (P2: 11 Dealer rotation fallback)
      let dealerSeat = parseInt(tableStateBefore?.dealer_seat || '0');
      if (dealerSeat === 0) {
        const lastHand = await GameHand.findOne({
          where: { table_id: roomId },
          order: { started_at: 'DESC' },
        });
        if (lastHand) {
          dealerSeat = lastHand.dealer_seat;
        }
      }

      const dbTable = await PokerTable.findOne({ where: { id: roomId } });
      const maxPlayers = dbTable ? dbTable.max_players : 9;

      // Chuyển nút Dealer theo chiều kim đồng hồ
      let foundDealer = false;
      for (let i = 0; i < maxPlayers; i++) {
        dealerSeat = (dealerSeat % maxPlayers) + 1;
        const seat = activeSeatsList.find(s => s.seat_number === dealerSeat);
        if (seat && seat.status === 'active' && parseInt(seat.stack) > 0) {
          foundDealer = true;
          break;
        }
      }

      if (!foundDealer) dealerSeat = activePlayers[0].seat_number;

      // Small blind & Big blind seats
      let sbSeat = dealerSeat;
      for (let i = 0; i < maxPlayers; i++) {
        sbSeat = (sbSeat % maxPlayers) + 1;
        const seat = activeSeatsList.find(s => s.seat_number === sbSeat);
        if (seat && seat.status === 'active' && parseInt(seat.stack) > 0) {
          break;
        }
      }

      let bbSeat = sbSeat;
      for (let i = 0; i < maxPlayers; i++) {
        bbSeat = (bbSeat % maxPlayers) + 1;
        const seat = activeSeatsList.find(s => s.seat_number === bbSeat);
        if (seat && seat.status === 'active' && parseInt(seat.stack) > 0) {
          break;
        }
      }

      // 2. Khấu trừ Ante (tiền sàn) nếu có setting
      const anteAmount = dbTable ? parseInt(dbTable.ante || '0') : 0;
      let anteCollected = 0;

      if (anteAmount > 0) {
        for (const player of activePlayers) {
          const playerStack = parseInt(player.stack);
          const actualAnte = Math.min(playerStack, anteAmount);
          const newStack = playerStack - actualAnte;
          anteCollected += actualAnte;
          player.stack = newStack.toString(); // cập nhật local copy để khấu trừ blinds phía dưới
          const currentContributed = parseInt(player.total_contributed || '0');
          await this.stateService.setSeat(roomId, player.seat_number, {
            stack: newStack.toString(),
            total_contributed: (currentContributed + actualAnte).toString(),
          });
          await this.syncSeatStackToDb(roomId, player.user_id, newStack.toString());
        }
      }

      // Tạo Server Seed Hash công khai (Provably Fair)
      const serverSeed = randomBytes(32).toString('hex');
      const serverSeedHash = createHash('sha256').update(serverSeed).digest('hex');

      // Lấy/Gán Client Seed (P2: 10 - Check next_client_seed first)
      let clientSeed = clientSeedOverride;
      if (!clientSeed) {
        clientSeed = tableStateBefore?.next_client_seed;
      }
      if (!clientSeed) {
        const representative = activeSeatsList.find(s => s.seat_number === dealerSeat);
        clientSeed = representative && representative.status !== 'disconnected'
          ? `client-${representative.user_id}-${Date.now()}`
          : randomBytes(16).toString('hex');
      }
      // Reset next_client_seed
      await this.stateService.setTableState(roomId, { next_client_seed: '' });

      // Fisher-Yates shuffle bài
      const shuffledDeck = PokerGameEngine.shuffleDeck(serverSeed, clientSeed);

      // Kiểm tra duplicate sau khi shuffle (P0: 3)
      const uniqueCardsInDeck = new Set(shuffledDeck);
      if (shuffledDeck.length !== 52 || uniqueCardsInDeck.size !== 52) {
        throw new Error(`LỖI HỆ THỐNG: Bộ bài sau khi shuffle bị lỗi hoặc trùng lặp bài. Số lượng duy nhất: ${uniqueCardsInDeck.size}`);
      }

      // Sắp xếp người chơi theo thứ tự chia bài vòng tròn bắt đầu từ vị trí bên trái Dealer (Small Blind) (P1: 7)
      const sortedActivePlayers = [...activePlayers].sort((a, b) => {
        const distA = (a.seat_number - dealerSeat - 1 + maxPlayers) % maxPlayers;
        const distB = (b.seat_number - dealerSeat - 1 + maxPlayers) % maxPlayers;
        return distA - distB;
      });

      // Chia bài tẩy theo vòng chuẩn Poker (P1: 7)
      let cardIdx = 0;
      const pocketCardsMap = new Map<string, string[]>();
      for (const player of sortedActivePlayers) {
        pocketCardsMap.set(player.user_id, []);
      }

      // Vòng 1: Mỗi người 1 lá
      for (const player of sortedActivePlayers) {
        pocketCardsMap.get(player.user_id).push(shuffledDeck[cardIdx++]);
      }
      // Vòng 2: Mỗi người thêm 1 lá
      for (const player of sortedActivePlayers) {
        pocketCardsMap.get(player.user_id).push(shuffledDeck[cardIdx++]);
      }

      // Lưu bài tẩy và kiểm tra trùng lặp (P0: 4)
      const allDealtCards: string[] = [];
      for (const player of sortedActivePlayers) {
        const cards = pocketCardsMap.get(player.user_id);
        allDealtCards.push(...cards);
        await this.stateService.setPlayerCards(roomId, player.user_id, cards);
      }

      const remainingDeck = shuffledDeck.slice(cardIdx);
      await this.stateService.setDeck(roomId, remainingDeck);

      // Verify card integrity after dealing pocket cards (P0: 4)
      const integrity = await this.verifyCardIntegrity(roomId);
      if (!integrity) {
        await this.abortHand(roomId, 'Card integrity check failed after dealing pocket cards.');
        return;
      }

      // Khấu trừ Small Blind & Big Blind tự động
      const sbAmount = parseInt(tableStateBefore?.small_blind || '50');
      const bbAmount = sbAmount * 2;

      const sbPlayer = activePlayers.find(s => s.seat_number === sbSeat);
      const bbPlayer = activePlayers.find(s => s.seat_number === bbSeat);

      let sbBet = 0;
      let bbBet = 0;

      if (sbPlayer) {
        const currentStack = parseInt(sbPlayer.stack);
        sbBet = Math.min(currentStack, sbAmount);
        const sbStack = currentStack - sbBet;
        const sbContributed = parseInt(sbPlayer.total_contributed || '0') + sbBet;
        await this.stateService.setSeat(roomId, sbSeat, {
          stack: sbStack.toString(),
          current_bet: sbBet.toString(),
          total_contributed: sbContributed.toString(),
        });
        await this.syncSeatStackToDb(roomId, sbPlayer.user_id, sbStack.toString());
      }

      if (bbPlayer) {
        const currentStack = parseInt(bbPlayer.stack);
        bbBet = Math.min(currentStack, bbAmount);
        const bbStack = currentStack - bbBet;
        const bbContributed = parseInt(bbPlayer.total_contributed || '0') + bbBet;
        await this.stateService.setSeat(roomId, bbSeat, {
          stack: bbStack.toString(),
          current_bet: bbBet.toString(),
          total_contributed: bbContributed.toString(),
        });
        await this.syncSeatStackToDb(roomId, bbPlayer.user_id, bbStack.toString());
      }

      const totalPot = anteCollected + sbBet + bbBet;

      // P1: 6 HandId sử dụng UUID thay vì Date.now()
      const handId = crypto.randomUUID();

      // Tìm người đi đầu tiên vòng Preflop (UTG - bên trái Big Blind)
      let firstTurn = bbSeat;
      for (let i = 0; i < maxPlayers; i++) {
        firstTurn = (firstTurn % maxPlayers) + 1;
        const seat = activeSeatsList.find(s => s.seat_number === firstTurn);
        if (seat && seat.status === 'active' && parseInt(seat.stack) > 0) {
          break;
        }
      }

      // P1: 5 current_highest_bet sai khi BB all-in với stack ít hơn BB
      const highestBetValue = Math.max(sbBet, bbBet);

      await this.stateService.setTableState(roomId, {
        game_stage: 'preflop',
        total_pot: totalPot.toString(),
        current_highest_bet: highestBetValue.toString(),
        last_full_raise_size: bbAmount.toString(),
        dealer_seat: dealerSeat,
        small_blind_seat: sbSeat,
        big_blind_seat: bbSeat,
        community_cards: '',
        current_turn_seat: firstTurn, // UTG bắt đầu cược
        server_seed: serverSeed,
        server_seed_hash: serverSeedHash,
        client_seed: clientSeed,
        hand_started_at: Date.now().toString(),
        current_hand_id: handId,
        is_running_board: '',
      });

      this.server.to(`table_${roomId}`).emit('table:hand-started', {
        hand_id: handId,
        dealer_seat: dealerSeat,
        small_blind_seat: sbSeat,
        big_blind_seat: bbSeat,
        server_seed_hash: serverSeedHash,
      });

      // Gửi riêng bài tẩy bảo mật cho từng Hero
      for (const player of activePlayers) {
        const pocket = await this.stateService.getPlayerCards(roomId, player.user_id);
        this.server.to(`user_${player.user_id}`).emit('table:private-cards', { pocket_cards: pocket });
      }

      // Bắt buộc cược vòng Preflop
      this.startActionTimer(roomId, firstTurn, 30);
      await this.broadcastTableState(roomId);
      this.checkAndTriggerBotAction(roomId);
    } catch (err) {
      this.logger.error(`Error in startNewHand: ${err.message}`, err.stack);
    } finally {
      await this.stateService.releaseLock(roomId);
    }
  }
  private async endHandEarly(roomId: string, winnerSeatNumber: number) {
    const tableState = await this.stateService.getTableState(roomId);
    if (!tableState) return;

    const seats = await this.stateService.getAllSeats(roomId);
    const winnerSeat = seats.find(s => s.seat_number === winnerSeatNumber);
    if (!winnerSeat) return;

    const playerBetStates = seats.map(s => ({
      seat: s.seat_number,
      bet: parseInt(s.total_contributed || '0'),
      folded: s.status === 'folded',
      allIn: parseInt(s.stack || '0') === 0 && parseInt(s.total_contributed || '0') > 0,
    }));

    const pots = PokerGameEngine.splitPot(playerBetStates);
    let totalRakedPot = 0;
    let totalWin = 0;

    for (const pot of pots) {
      if (pot.eligibleSeats.includes(winnerSeatNumber)) {
        totalWin += pot.amount;
        if (!pot.isUncalled) {
          totalRakedPot += pot.amount;
        }
      }
    }

    const winnersLog = [{
      seat_number: winnerSeatNumber,
      username: winnerSeat.username,
      win_amount: totalWin,
      hand_name: 'Opponents Folded',
      pocket_cards: [], // Muck hand
    }];

    await this.finalizeAndBroadcastHand(roomId, winnersLog, totalRakedPot, tableState, seats);
  }

  private async finalizeAndBroadcastHand(
    roomId: string,
    winnersLog: any[],
    totalRakedPotAmount: number,
    tableState: any,
    seats: any[]
  ) {
    // 1. Cập nhật Stack người thắng
    for (const winner of winnersLog) {
      const winnerSeat = seats.find(s => s.seat_number === winner.seat_number);
      if (winnerSeat) {
        const currentStack = parseInt(winnerSeat.stack || '0');
        const newStack = currentStack + winner.win_amount;
        winnerSeat.stack = newStack.toString(); // Update local reference
        await this.stateService.setSeat(roomId, winner.seat_number, {
          stack: newStack.toString(),
        });
        await this.syncSeatStackToDb(roomId, winnerSeat.user_id, newStack.toString());
      }
    }

    // 2. Khấu trừ Rake (mặc định 5%) từ Pot đã match (không tính uncalled bets)
    const dbTable = await PokerTable.findOne({ where: { id: roomId } });
    const rakeRate = dbTable ? dbTable.rake_rate : 5.0;
    const rakeCap = dbTable ? BigInt(dbTable.rake_cap) : BigInt(0);

    let rakeCalculated = BigInt(0);

    // Áp dụng luật "No Flop, No Drop" - Không thu phế nếu ván bài kết thúc ở Preflop
    if (tableState.game_stage && tableState.game_stage !== 'preflop') {
      rakeCalculated = BigInt(Math.floor((totalRakedPotAmount * rakeRate) / 100));
      if (rakeCap > BigInt(0) && rakeCalculated > rakeCap) {
        rakeCalculated = rakeCap;
      }
    }

    const totalPotAmount = parseInt(tableState.total_pot || '0');

    // 3. Lưu lịch sử GameHand vào DB
    const hand = new GameHand();
    hand.table_id = roomId;
    hand.dealer_seat = parseInt(tableState.dealer_seat || '1');
    hand.small_blind_seat = parseInt(tableState.small_blind_seat || '0');
    hand.big_blind_seat = parseInt(tableState.big_blind_seat || '0');
    hand.community_cards = tableState.community_cards;
    hand.total_pot = totalPotAmount.toString();
    hand.rake_amount = rakeCalculated.toString();
    hand.hand_stage = (tableState.game_stage || 'preflop') as HandStage;
    hand.ended_at = new Date();
    await hand.save();

    // 4. Lưu System Revenue
    if (rakeCalculated > BigInt(0)) {
      const revenue = new SystemRevenue();
      revenue.room_id = roomId;
      revenue.hand_id = hand.id;
      revenue.revenue_amount = rakeCalculated.toString();
      revenue.rake_rate_applied = rakeRate;
      revenue.pot_total = totalPotAmount.toString();
      await revenue.save();
    }

    // 5. Lưu HandPlayer
    for (const seat of seats) {
      const seatWinner = winnersLog.find(w => w.seat_number === seat.seat_number);
      const wonAmount = seatWinner ? seatWinner.win_amount : 0;
      const pocketCards = await this.stateService.getPlayerCards(roomId, seat.user_id);

      const totalChipsBetEarly = parseInt(seat.total_contributed || '0');
      const hp = new HandPlayer();
      hp.hand_id = hand.id;
      hp.user_id = seat.user_id;
      hp.hole_cards = pocketCards.join(',');
      hp.chips_before = (parseInt(seat.stack) + totalChipsBetEarly - wonAmount).toString();
      hp.chips_bet = totalChipsBetEarly.toString();
      hp.chips_won = wonAmount.toString();
      hp.net_gain_loss = (wonAmount - totalChipsBetEarly).toString();
      hp.is_winner = wonAmount > 0;
      hp.seat_number = seat.seat_number;
      await hp.save();
    }

    // 6. Lưu HandAction
    const bufferedActions = await this.stateService.getActionLogs(tableState.current_hand_id || '0');
    let actionOrder = 1;
    for (const actStr of bufferedActions) {
      const actObj = JSON.parse(actStr);
      const action = new HandAction();
      action.hand_id = hand.id;
      action.user_id = actObj.user_id;
      action.seat_number = actObj.seat_number;
      action.stage = actObj.stage;
      action.action_type = actObj.action_type;
      action.amount = actObj.amount.toString();
      action.action_order = actionOrder++;
      await action.save();
    }

    // 7. Dọn dẹp Action Timer và action logs
    this.clearActionTimer(roomId);
    if (tableState.current_hand_id) {
      await this.stateService.deleteActionLogs(tableState.current_hand_id);
    }

    // 8. Phát sự kiện hand-ended
    this.server.to(`table_${roomId}`).emit('table:hand-ended', {
      winners: winnersLog,
      total_pot: totalPotAmount,
      rake_amount: rakeCalculated.toString(),
      provably_fair: {
        server_seed_plain: tableState.server_seed,
        client_seed: tableState.client_seed,
      },
    });

    // 9. Reset Table State sang stage ended
    await this.stateService.setTableState(roomId, {
      game_stage: 'ended',
      total_pot: '0',
      current_highest_bet: '0',
      current_turn_seat: '0',
      is_running_board: '',
    });

    await this.broadcastTableState(roomId);

    // 10. Xử lý người chơi hết chip (Bust)
    const zeroStackPlayers = seats.filter(s => parseInt(s.stack) === 0);
    if (zeroStackPlayers.length > 0) {
      for (const player of zeroStackPlayers) {
        // Broadcast PLAYER_BUSTED
        this.server.to(`table_${roomId}`).emit('table:player-busted', {
          seat_number: player.seat_number,
          user_id: player.user_id,
        });

        // Broadcast PLAYER_LEFT_SEAT
        this.server.to(`table_${roomId}`).emit('table:player-left-seat', {
          seat_number: player.seat_number,
          user_id: player.user_id,
        });

        // Xóa khỏi cache (Trở thành Spectator)
        await this.stateService.deleteSeat(roomId, player.seat_number);
        await this.stateService.deletePlayerCards(roomId, player.user_id);

        // Update DB
        const session = await TableSession.findOne({
            where: { table_id: roomId, user_id: player.user_id, member_status: 'active' }
        });
        if (session) {
            session.member_status = 'left';
            session.left_at = new Date();
            await session.save();
        }
      }
      
      // Update broadcast again to remove their avatar from the table visually
      await this.broadcastTableState(roomId);
    }

    const timerId = setTimeout(async () => {
      try {
        console.log(`[SHOWDOWN] TIMER FIRED room=${roomId}`);
        await this.startNewHand(roomId);
      } catch (e) {
        console.error(e);
      }
    }, 3000);

    console.log(`[SHOWDOWN] timer set id=${timerId} room=${roomId}`);
  }
  private async executeAutoAction(roomId: string, seatNumber: number) {
    const lockAcquired = await this.stateService.acquireLock(roomId);
    if (!lockAcquired) {
      setTimeout(async () => {
        await this.executeAutoAction(roomId, seatNumber);
      }, 100);
      return;
    }

    try {
      const tableState = await this.stateService.getTableState(roomId);
      if (!tableState) return;

      const currentTurnSeat = parseInt(tableState.current_turn_seat || '0');
      if (currentTurnSeat !== seatNumber) {
        return; // player already acted
      }

      const seats = await this.stateService.getAllSeats(roomId);
      const seat = seats.find(s => s.seat_number === seatNumber);

      if (!seat || seat.status !== 'active') return;

      const currentBet = parseInt(seat.current_bet || '0');
      const highestBet = parseInt(tableState.current_highest_bet || '0');

      const action = currentBet >= highestBet ? 'check' : 'fold';
      await this.processPlayerAction(roomId, seatNumber, action, 0);

      // Theo dõi timeout liên tiếp để tự động sit-out
      const statsKey = `table:${roomId}:player:${seat.user_id}:stats`;
      const redis = this.stateService.getRedisClient();
      const timeouts = await redis.hincrby(statsKey, 'consecutive_timeouts', 1);

      if (timeouts >= 2) {
        this.logger.log(`User ${seat.user_id} timed out 2 times consecutively. Forcing sit-out.`);
        await this.stateService.setSeat(roomId, seatNumber, {
          status: 'sitting_out',
        });

        const session = await TableSession.findOne({
          where: {
            table_id: roomId,
            user_id: seat.user_id,
            member_status: 'active',
          },
        });
        if (session) {
          session.member_status = 'sitting_out';
          await session.save();
        }

        this.server.to(`table_${roomId}`).emit('table:player-sat-out', {
          seat_number: seatNumber,
          user_id: seat.user_id,
          reason: 'timeout',
        });
      }
    } catch (err) {
      this.logger.error(`Error during auto action for seat ${seatNumber}: ${err.message}`);
    } finally {
      await this.stateService.releaseLock(roomId);
    }
  }
  startActionTimer(roomId: string, seatNumber: number, seconds = 30) {
    // Xóa timer cũ của phòng
    if (this.actionTimers.has(roomId)) {
      clearTimeout(this.actionTimers.get(roomId).timeout);
    }

    const expiresAt = Date.now() + seconds * 1000;
    const timeout = setTimeout(async () => {
      this.logger.warn(`Seat ${seatNumber} action timeout on table ${roomId}`);
      this.actionTimers.delete(roomId);

      // Tự động Check hoặc Fold
      await this.executeAutoAction(roomId, seatNumber);
    }, seconds * 1000);

    this.actionTimers.set(roomId, { timeout, expiresAt, currentSeat: seatNumber });
  }
  clearActionTimer(roomId: string) {
    if (this.actionTimers.has(roomId)) {
      clearTimeout(this.actionTimers.get(roomId).timeout);
      this.actionTimers.delete(roomId);
    }
  }

  private async checkAndTriggerBotAction(roomId: string) {
    try {
      const tableState = await this.stateService.getTableState(roomId);
      if (!tableState || tableState.game_stage === 'ended') return;

      const currentTurnSeat = parseInt(tableState.current_turn_seat || '0');
      if (currentTurnSeat === 0) return;

      const seats = await this.stateService.getAllSeats(roomId);
      const activeSeat = seats.find(s => s.seat_number === currentTurnSeat);
      if (!activeSeat || activeSeat.is_bot !== '1' || activeSeat.status !== 'active') {
        return;
      }

      const delay = 1500 + Math.random() * 1500;
      setTimeout(async () => {
        const lockAcquired = await this.stateService.acquireLock(roomId);
        if (!lockAcquired) {
          this.checkAndTriggerBotAction(roomId);
          return;
        }

        try {
          const currentTableState = await this.stateService.getTableState(roomId);
          if (!currentTableState || currentTableState.game_stage === 'ended') return;
          if (parseInt(currentTableState.current_turn_seat || '0') !== currentTurnSeat) return;

          const currentSeats = await this.stateService.getAllSeats(roomId);
          const currentBotSeat = currentSeats.find(s => s.seat_number === currentTurnSeat);
          if (!currentBotSeat || currentBotSeat.is_bot !== '1' || currentBotSeat.status !== 'active') return;

          const pocket = await this.stateService.getPlayerCards(roomId, currentBotSeat.user_id);
          const community = currentTableState.community_cards ? currentTableState.community_cards.split(',') : [];

          const handStrength = PokerBotAI.getHandStrength(pocket, community);

          const dealerSeat = parseInt(currentTableState.dealer_seat || '1');
          const positionLabel = PokerBotAI.getPositionLabel(currentTurnSeat, dealerSeat, currentSeats);

          const currentBet = parseInt(currentBotSeat.current_bet || '0');
          const highestBet = parseInt(currentTableState.current_highest_bet || '0');
          const botStack = parseInt(currentBotSeat.stack || '0');
          const sbAmount = parseInt(currentTableState.small_blind || '50');

          const timesRaised = highestBet > sbAmount * 2 ? 1 : 0;

          const decision = PokerBotAI.decideAction(
            positionLabel,
            handStrength,
            currentTableState.game_stage || 'preflop',
            currentBet,
            highestBet,
            timesRaised,
            sbAmount * 2,
            botStack,
          );

          this.logger.log(`Bot ${currentBotSeat.username} (Seat ${currentTurnSeat}, Pos ${positionLabel}, Strength ${handStrength.toFixed(2)}) decides: ${decision.action} with amount ${decision.amount}`);

          await this.processPlayerAction(roomId, currentTurnSeat, decision.action, decision.amount);

        } catch (err) {
          this.logger.error(`Error executing bot action: ${err.message}`);
        } finally {
          await this.stateService.releaseLock(roomId);
        }
      }, delay);

    } catch (err) {
      this.logger.error(`Error in checkAndTriggerBotAction: ${err.message}`);
    }
  }

  async broadcastTableState(roomId: string) {
    console.log(`[broadcastTableState] START roomId=${roomId}`);

    let tableState = await this.stateService.getTableState(roomId);
    console.log(
      `[broadcastTableState] tableState from redis:`,
      JSON.stringify(tableState, null, 2),
    );

    const dbTable = await PokerTable.findOne({ where: { id: roomId } });
    console.log(
      `[broadcastTableState] dbTable:`,
      dbTable
        ? {
          id: dbTable.id,
          name: dbTable.name,
          owner_id: dbTable.owner_id,
          small_blind: dbTable.small_blind,
          big_blind: dbTable.big_blind,
        }
        : null,
    );

    if (!tableState) {
      console.warn(
        `[broadcastTableState] tableState not found. Creating initial state...`,
      );

      if (!dbTable) {
        console.error(
          `[broadcastTableState] dbTable not found. Abort broadcast.`,
        );
        return;
      }

      const initialFields = {
        room_name: dbTable.name || 'Bàn Poker',
        game_stage: 'waiting',
        total_pot: '0',
        current_highest_bet: '0',
        dealer_seat: '1',
        small_blind_seat: '0',
        big_blind_seat: '0',
        current_turn_seat: '0',
        community_cards: '',
      };

      await this.stateService.setTableState(roomId, initialFields);

      tableState = await this.stateService.getTableState(roomId);

      console.log(
        `[broadcastTableState] initialized tableState:`,
        JSON.stringify(tableState, null, 2),
      );

      if (!tableState) {
        console.error(
          `[broadcastTableState] Cannot initialize tableState.`,
        );
        return;
      }
    }

    const seats = await this.stateService.getAllSeats(roomId);

    console.log(
      `[broadcastTableState] seats count=${seats.length}`,
    );

    console.table(
      seats.map(s => ({
        seat: s.seat_number,
        user: s.user_id,
        name: s.username,
        stack: s.stack,
        bet: s.current_bet,
        status: s.status,
        bot: s.is_bot,
      })),
    );

    const sanitizedSeats = seats.map(s => ({
      seatIndex: s.seat_number,
      id: s.user_id,
      name: s.username,
      avatar: s.avatar,
      chips: s.stack,
      current_bet: s.current_bet,
      status: s.status,
      has_used_extra_time: s.has_used_extra_time === '1',
      isBot: s.is_bot === '1',
    }));

    const timer = this.actionTimers.get(roomId);

    console.log(
      `[broadcastTableState] timer:`,
      timer
        ? {
          expiresAt: timer.expiresAt,
          now: Date.now(),
          remainingMs: timer.expiresAt - Date.now(),
        }
        : 'NO TIMER',
    );

    const remainingTimer = timer
      ? Math.max(0, Math.floor((timer.expiresAt - Date.now()) / 1000))
      : 0;

    const payload = {
      room_id: roomId,
      room_name: dbTable?.name || tableState.room_name,
      owner_id: dbTable?.owner_id || '',
      min_buyin: dbTable?.min_buyin ? Number(dbTable.min_buyin) : 0,
      max_buyin: dbTable?.max_buyin ? Number(dbTable.max_buyin) : 0,
      small_blind: dbTable?.small_blind ? Number(dbTable.small_blind) : 50,
      big_blind: dbTable?.big_blind ? Number(dbTable.big_blind) : 100,
      game_stage: tableState.game_stage || 'ended',
      community_cards: tableState.community_cards
        ? tableState.community_cards.split(',')
        : [],
      total_pot: parseInt(tableState.total_pot || '0'),
      current_highest_bet: parseInt(tableState.current_highest_bet || '0'),
      dealer_seat: parseInt(tableState.dealer_seat || '1'),
      small_blind_seat: parseInt(tableState.small_blind_seat || '0'),
      big_blind_seat: parseInt(tableState.big_blind_seat || '0'),
      current_turn_seat: parseInt(tableState.current_turn_seat || '0'),
      remaining_time: remainingTimer,
      seats: sanitizedSeats,
    };

    console.log(
      `[broadcastTableState] emit room=table_${roomId}`,
    );

    console.log(
      `[broadcastTableState] payload:`,
      JSON.stringify(payload, null, 2),
    );

    const room = this.server.sockets.adapter.rooms.get(`table_${roomId}`);

    console.log(
      `[broadcastTableState] connected clients: ${room ? room.size : 0
      }`,
    );

    this.server.to(`table_${roomId}`).emit('table:state', payload);

    console.log(
      `[broadcastTableState] END roomId=${roomId}`,
    );
  }

  private async syncSeatStackToDb(tableId: string, userId: string, newStack: string) {
    try {
      const sess = await TableSession.findOne({
        where: { table_id: tableId, user_id: userId, member_status: 'active' }
      });
      if (sess) {
        sess.chips_at_table = newStack;
        await sess.save();
      }
    } catch (e) {
      this.logger.error(`Failed to sync stack to DB for user ${userId}: ${e.message}`);
    }
  }


  private async abortHand(roomId: string, reason: string) {
    this.logger.error(`Aborting hand on table ${roomId}. Reason: ${reason}`);

    await this.stateService.setTableState(roomId, {
      game_stage: 'ended',
      total_pot: '0',
      current_highest_bet: '0',
      current_turn_seat: '0',
      community_cards: '',
    });

    const seats = await this.stateService.getAllSeats(roomId);
    for (const seat of seats) {
      await this.stateService.setSeat(roomId, seat.seat_number, {
        current_bet: '0',
        has_acted: '0',
        status: seat.status === 'active' || seat.status === 'folded' ? 'active' : seat.status,
      });
      await this.stateService.deletePlayerCards(roomId, seat.user_id);
    }

    await this.stateService.setDeck(roomId, []);

    const tableState = await this.stateService.getTableState(roomId);
    if (tableState && tableState.current_hand_id) {
      await this.stateService.deleteActionLogs(tableState.current_hand_id);
    }

    this.server.to(`table_${roomId}`).emit('table:hand-aborted', { reason });
    await this.broadcastTableState(roomId);
  }

}
