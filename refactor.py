import os
import re

gateway_path = "BE/src/v1/poker-lobby/poker-lobby.gateway.ts"
service_path = "BE/src/v1/poker-lobby/poker-game.service.ts"
module_path = "BE/src/v1/poker-lobby/poker-lobby.module.ts"

with open(gateway_path, 'r') as f:
    lines = f.readlines()

def get_lines(start_line, end_line):
    return "".join(lines[start_line-1:end_line])

imports_for_service = """import { Injectable, Logger } from '@nestjs/common';
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
import { createHash, randomBytes } from 'crypto';

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
  ) {}

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

"""

service_methods = (
    get_lines(182, 229).replace("private async handlePlayerConnectionLost", "async handlePlayerConnectionLost") + "\n" +
    get_lines(576, 2049)
)

service_content = imports_for_service + service_methods + "\n}\n"

service_content = service_content.replace("private async processPlayerAction", "async processPlayerAction")
service_content = service_content.replace("private startActionTimer", "startActionTimer")
service_content = service_content.replace("private clearActionTimer", "clearActionTimer")
service_content = service_content.replace("private async startNewHand", "async startNewHand")


with open(service_path, 'w') as f:
    f.write(service_content)

# Now, modify gateway
gateway_content = "".join(lines[:181]) + "".join(lines[229:575]) + "}\n"

# Remove maps from gateway
gateway_content = re.sub(r'  // Quản lý Timers hành động.*?\n  private actionTimers = new Map<.*?\n', '', gateway_content, flags=re.DOTALL)
gateway_content = re.sub(r'  // Quản lý Disconnect Protection.*?\n  private disconnectTimeouts = new Map<.*?\n', '', gateway_content, flags=re.DOTALL)

# Add PokerGameService to imports
gateway_content = gateway_content.replace("import { PokerStateService } from './poker-state.service';", "import { PokerStateService } from './poker-state.service';\nimport { PokerGameService } from './poker-game.service';")

# Add to constructor
gateway_content = gateway_content.replace("private readonly jwtService: JwtService,\n  ) { }", "private readonly jwtService: JwtService,\n    private readonly gameService: PokerGameService,\n  ) { }")

# Add setServer in afterInit
gateway_content = gateway_content.replace("this.logger.log('PokerLobbyGateway Initialized');", "this.logger.log('PokerLobbyGateway Initialized');\n    this.gameService.setServer(server);")

# Replace calls
gateway_content = gateway_content.replace("this.handlePlayerConnectionLost", "this.gameService.handlePlayerConnectionLost")
gateway_content = gateway_content.replace("this.broadcastTableState", "this.gameService.broadcastTableState")
gateway_content = gateway_content.replace("this.processPlayerAction", "this.gameService.processPlayerAction")
gateway_content = gateway_content.replace("this.startActionTimer", "this.gameService.startActionTimer")
gateway_content = gateway_content.replace("this.broadcastSitRequests", "this.gameService.broadcastSitRequests")
gateway_content = gateway_content.replace("this.startNewHand", "this.gameService.startNewHand")

# Replace the block of cancelDisconnectTimeout
cancel_timeout_block = """      // Hủy Disconnect Protection Timeout nếu có
      const dcKey = `${roomId}:${userId}`;
      if (this.disconnectTimeouts.has(dcKey)) {
        clearTimeout(this.disconnectTimeouts.get(dcKey));
        this.disconnectTimeouts.delete(dcKey);
        this.logger.log(`Canceled disconnect timeout for user ${userId} on table ${roomId}`);
      }"""
gateway_content = gateway_content.replace(cancel_timeout_block, "      this.gameService.cancelDisconnectTimeout(roomId, userId);")

# Clean up unused imports in gateway (optional but good practice)
gateway_content = gateway_content.replace("import { GameHand, HandStage } from '../entities/game_hand.entity';\n", "")
gateway_content = gateway_content.replace("import { HandAction } from '../entities/hand_action.entity';\n", "")
gateway_content = gateway_content.replace("import { HandPlayer } from '../entities/hand_player.entity';\n", "")
gateway_content = gateway_content.replace("import { SystemRevenue } from '../entities/system_revenue.entity';\n", "")
gateway_content = gateway_content.replace("import { PokerBotAI } from './poker-bot.ai';\n", "")
gateway_content = gateway_content.replace("import { PokerGameEngine } from './poker-game.engine';\n", "")
gateway_content = gateway_content.replace("import { createHash, randomBytes } from 'crypto';\n", "")

with open(gateway_path, 'w') as f:
    f.write(gateway_content)

# Modify module
with open(module_path, 'r') as f:
    module_content = f.read()

module_content = module_content.replace("import { PokerStateService } from './poker-state.service';", "import { PokerStateService } from './poker-state.service';\nimport { PokerGameService } from './poker-game.service';")
module_content = module_content.replace("providers: [PokerLobbyService, PokerLobbyGateway, PokerStateService],", "providers: [PokerLobbyService, PokerLobbyGateway, PokerStateService, PokerGameService],")
module_content = module_content.replace("exports: [PokerLobbyService, PokerLobbyGateway, PokerStateService],", "exports: [PokerLobbyService, PokerLobbyGateway, PokerStateService, PokerGameService],")

with open(module_path, 'w') as f:
    f.write(module_content)

print("Refactoring complete.")
