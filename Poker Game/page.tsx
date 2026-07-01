"use client";

import React, { useState, useEffect } from "react";
import { UserProvider, useCurrentUser } from "@/core/providers/user-provider";
import { useSocket } from "@/core/providers/SocketProvider";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "@/i18n/routing";
import {
  Coins,
  Search,
  Plus,
  Users,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Settings,
  X,
  Volume2,
  VolumeX,
  Trophy,
  Activity,
  CheckCircle2,
  Sparkles,
  Flame,
} from "lucide-react";

/**
 * DESIGN NOTE
 * -----------
 * Palette (felt table at golden hour):
 *   --felt-deep    #0B3D2E   base background, dealer-shoe green
 *   --felt-bright  #16594A   panels / cards
 *   --gold-chip    #F4B942   primary accent — chips, CTAs
 *   --ruby         #E23744   secondary accent — hearts/diamonds, alerts
 *   --cream        #F7EFDD   warm off-white text on dark
 *   --ink          #142019   near-black for contrast text on gold
 *
 * Type: a warm serif ("Fraunces") for headline personality + a rounded
 * grotesk ("Manrope") for UI body copy. If these aren't already loaded in
 * the app's <head>/layout, add:
 *   <link rel="preconnect" href="https://fonts.googleapis.com" />
 *   <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;700;900&family=Manrope:wght@500;700;800&display=swap" rel="stylesheet" />
 *
 * Signature element: suit-dot "seat map" on every table card (a friendly,
 * at-a-glance read of how full a table is) plus a soft scattering of
 * card-suit glyphs in the hero, evoking felt + cards rather than a
 * generic dark dashboard.
 */

const SUITS = ["♠", "♥", "♦", "♣"] as const;

const FILTERS = [
  { id: "all", label: "Tất cả", suit: "🂠", color: "text-cream/70" },
  { id: "micro", label: "Micro (≤2K)", suit: "♠", color: "text-slate-300" },
  { id: "low", label: "Thấp (2K–10K)", suit: "♣", color: "text-emerald-300" },
  { id: "medium", label: "Vừa (10K–50K)", suit: "♦", color: "text-amber-300" },
  { id: "high", label: "Cao (>50K)", suit: "♥", color: "text-rose-300" },
];

// Mock initial tables to populate the lobby instantly if API is not fully set up
const MOCK_TABLES = [
  {
    id: "1",
    name: "Texas Hold'em - Beginner #1",
    game_type: "Texas Hold'em",
    small_blind: "1000",
    big_blind: "2000",
    max_players: 9,
    current_players: 5,
    min_buyin: "40000",
    max_buyin: "200000",
    is_active: true,
  },
  {
    id: "2",
    name: "Las Vegas High Stakes",
    game_type: "Texas Hold'em",
    small_blind: "50000",
    big_blind: "100000",
    max_players: 9,
    current_players: 8,
    min_buyin: "2000000",
    max_buyin: "10000000",
    is_active: true,
  },
  {
    id: "3",
    name: "VIP Diamond Room",
    game_type: "Texas Hold'em",
    small_blind: "10000",
    big_blind: "20000",
    max_players: 6,
    current_players: 3,
    min_buyin: "400000",
    max_buyin: "2000000",
    is_active: true,
  },
  {
    id: "4",
    name: "Macau Cash Game #4",
    game_type: "Texas Hold'em",
    small_blind: "5000",
    big_blind: "10000",
    max_players: 9,
    current_players: 6,
    min_buyin: "200000",
    max_buyin: "1000000",
    is_active: true,
  },
  {
    id: "5",
    name: "Heads Up Showdown",
    game_type: "Texas Hold'em",
    small_blind: "25000",
    big_blind: "50000",
    max_players: 2,
    current_players: 1,
    min_buyin: "1000000",
    max_buyin: "5000000",
    is_active: true,
  },
  {
    id: "6",
    name: "Quick Play - Fast Fold",
    game_type: "Texas Hold'em",
    small_blind: "2000",
    big_blind: "4000",
    max_players: 9,
    current_players: 4,
    min_buyin: "80000",
    max_buyin: "400000",
    is_active: true,
  },
];

function PokerGameLobby() {
  const router = useRouter();
  const { currentUser, isLoadingUser } = useCurrentUser();
  const { socket, isConnected } = useSocket();

  const [lobbyStats, setLobbyStats] = useState({
    online_players: 1428,
    active_tables: 38,
    total_jackpot_pot: 1200000000,
  });

  const [tables, setTables] = useState<any[]>(MOCK_TABLES);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all"); // all, micro, low, medium, high
  const [selectedGameType, setSelectedGameType] = useState("all"); // all, Texas Hold'em, Omaha

  // Wallet state
  const [chipsBalance, setChipsBalance] = useState<string>("50000000"); // Default 50M chips

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Form fields for new table
  const [newTableName, setNewTableName] = useState("");
  const [newGameType, setNewGameType] = useState("Texas Hold'em");
  const [newSmallBlind, setNewSmallBlind] = useState("1000");
  const [newBigBlind, setNewBigBlind] = useState("2000");
  const [newMaxPlayers, setNewMaxPlayers] = useState(9);
  const [newMinBuyin, setNewMinBuyin] = useState("40000");
  const [newMaxBuyin, setNewMaxBuyin] = useState("200000");
  const [isCustomSmallBlind, setIsCustomSmallBlind] = useState(false);

  // Sound controls
  const [muteAll, setMuteAll] = useState(false);
  const [bgVolume, setBgVolume] = useState(50);
  const [soundEffectsVol, setSoundEffectsVol] = useState(70);

  // Toast notifications
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch real tables from backend
  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/rooms", {
        params: {
          search_name: searchQuery,
          blind_category: selectedFilter,
          page: 1,
          limit: 50,
        },
      });
      if (res.data && res.data.rooms) {
        const mapped = res.data.rooms.map((t: any) => ({
          id: t.room_id.toString(),
          name: t.room_name,
          game_type: "Texas Hold'em",
          small_blind: t.small_blind.toString(),
          big_blind: t.big_blind.toString(),
          max_players: t.max_players,
          current_players: t.current_players_count,
          min_buyin: t.min_buy_in.toString(),
          max_buyin: t.max_buy_in.toString(),
          is_active: true,
        }));
        setTables(mapped);
      } else {
        setTables([]);
      }
    } catch (e) {
      console.warn("Failed to fetch poker tables from backend.", e);
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user chips wallet from backend
  const fetchWallet = async () => {
    if (!currentUser) return;
    try {
      const res = await api.get(`/api/v1/user/chips`);
      if (res.data && res.data.chips_balance) {
        setChipsBalance(res.data.chips_balance);
      }
    } catch (e) {
      console.warn("Failed to fetch wallet balance.", e);
    }
  };

  // WebSocket Lobby subscription & events
  useEffect(() => {
    if (!socket) return;

    socket.emit("lobby:subscribe");

    socket.on("lobby:stats-update", (data: any) => {
      if (data) {
        setLobbyStats({
          online_players: data.online_players,
          active_tables: data.active_tables,
          total_jackpot_pot: data.total_jackpot_pot,
        });
      }
    });

    socket.on("lobby:room-status-changed", (data: { room_id: number; current_players_count: number }) => {
      if (data) {
        setTables((prev) =>
          prev.map((t) => {
            if (t.id === data.room_id.toString()) {
              return { ...t, current_players: data.current_players_count };
            }
            return t;
          })
        );
      }
    });

    return () => {
      socket.off("lobby:stats-update");
      socket.off("lobby:room-status-changed");
    };
  }, [socket, isConnected]);

  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, searchQuery, selectedFilter]);

  useEffect(() => {
    fetchWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B3D2E]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-[#F4B942]/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#F4B942] animate-spin" />
            <Coins size={20} className="absolute inset-0 m-auto text-[#F4B942]" />
          </div>
          <p className="text-[#F7EFDD]/70 font-semibold tracking-wide text-sm">Đang dọn bàn, mời quý khách chờ chút…</p>
        </div>
      </div>
    );
  }

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Handle claiming free chips with idempotency key header
  const claimFreeChips = async () => {
    try {
      const idempotencyKey = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15);
      const res = await api.post(
        "/api/v1/wallet/free-chips",
        {},
        {
          headers: {
            "x-idempotency-key": idempotencyKey,
          },
        }
      );
      if (res.data && res.data.chips_balance) {
        setChipsBalance(res.data.chips_balance);
        showToast("success", "Chúc mừng! Bạn vừa nhận 5,000,000 chips miễn phí 🎉");
      }
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || "Lỗi nhận chips miễn phí.";
      showToast("error", errorMsg);
    }
  };

  // Handle Table Creation
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) {
      showToast("error", "Vui lòng nhập tên bàn chơi.");
      return;
    }

    const sbVal = parseInt(newSmallBlind);
    if (isNaN(sbVal) || sbVal <= 0) {
      showToast("error", "Vui lòng nhập Small Blind hợp lệ lớn hơn 0.");
      return;
    }

    const payload = {
      name: newTableName,
      game_type: newGameType,
      small_blind: sbVal,
      big_blind: sbVal * 2,
      max_players: newMaxPlayers,
      min_buyin: sbVal * 40,
      max_buyin: sbVal * 200,
    };

    try {
      const res = await api.post("/api/v1/rooms", payload);

      if (res.data && res.data.success) {
        const newTableObj = {
          id: res.data.room_id.toString(),
          name: res.data.room_name,
          game_type: newGameType,
          small_blind: res.data.small_blind.toString(),
          big_blind: res.data.big_blind.toString(),
          max_players: res.data.max_players,
          current_players: res.data.current_players_count,
          min_buyin: res.data.min_buy_in.toString(),
          max_buyin: res.data.max_buy_in.toString(),
          is_active: true,
        };

        setTables((prev) => [newTableObj, ...prev]);
        setIsCreateModalOpen(false);
        setNewTableName("");
        setIsCustomSmallBlind(false);
        showToast("success", `Bàn "${newTableName}" đã sẵn sàng — chúc bạn may mắn!`);

        setTimeout(() => {
          router.push(`/poker-game/table/${newTableObj.id}`);
        }, 800);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể tạo bàn chơi lúc này.";
      showToast("error", errorMsg);
    }
  };

  // Handle join table request
  const handleJoinTable = async (table: any) => {
    try {
      const res = await api.post("/api/v1/rooms/join-request", {
        room_id: table.id,
      });

      if (res.data && res.data.success) {
        showToast("success", `Đang mời bạn vào bàn "${table.name}"…`);
        setTimeout(() => {
          router.push(`/poker-game/table/${table.id}`);
        }, 800);
      }
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || "Không thể vào bàn chơi lúc này.";
      showToast("error", errorMsg);
    }
  };

  // Handle spectating table request
  const handleSpectateTable = async (table: any) => {
    try {
      const res = await api.post("/api/v1/rooms/spectate", {
        room_id: table.id,
      });

      if (res.data && res.data.success) {
        showToast("success", `Ghế khán giả tại "${table.name}" đã có bạn!`);
        setTimeout(() => {
          router.push(`/poker-game/table/${table.id}?spectate=true`);
        }, 800);
      }
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || "Không thể xem bàn chơi lúc này.";
      showToast("error", errorMsg);
    }
  };

  // Format currency
  const formatChips = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "0";
    if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toLocaleString();
  };

  // Filter tables
  const filteredTables = tables.filter((t) => {
    const nameMatch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const typeMatch = selectedGameType === "all" || t.game_type === selectedGameType;

    const bb = parseInt(t.big_blind);
    let blindMatch = true;
    if (selectedFilter === "micro") blindMatch = bb <= 2000;
    else if (selectedFilter === "low") blindMatch = bb > 2000 && bb <= 10000;
    else if (selectedFilter === "medium") blindMatch = bb > 10000 && bb <= 50000;
    else if (selectedFilter === "high") blindMatch = bb > 50000;

    return nameMatch && typeMatch && blindMatch;
  });

  return (
    <div
      className="min-h-screen text-[#F7EFDD] py-8 px-4 md:px-8 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 120% 80% at 50% -10%, #1B6B4F 0%, #0B3D2E 45%, #082A20 100%)",
      }}
    >
      {/* Ambient scattered suit glyphs — the felt-table signature */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.06] select-none overflow-hidden">
        {["♠", "♥", "♦", "♣", "♠", "♦"].map((s, i) => (
          <span
            key={i}
            className="absolute text-[9rem] md:text-[13rem] font-black leading-none"
            style={{
              top: `${(i * 37) % 100}%`,
              left: `${(i * 53) % 100}%`,
              transform: `rotate(${(i * 23) % 40 - 20}deg)`,
              color: s === "♥" || s === "♦" ? "#E23744" : "#F7EFDD",
            }}
          >
            {s}
          </span>
        ))}
      </div>

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* 🔔 Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-semibold backdrop-blur-md text-white ${
                toast.type === "success"
                  ? "bg-[#1B6B4F]/95 border-[#F4B942]/40"
                  : "bg-[#E23744]/95 border-[#E23744]"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={18} className="shrink-0 text-[#F4B942]" />
              ) : (
                <X size={18} className="shrink-0 text-rose-100" />
              )}
              <span>{toast.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🏆 Hero/Lobby Banner */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#16594A] via-[#0F4438] to-[#0B3D2E] border-2 border-[#F4B942]/20 p-6 md:p-9 shadow-2xl">
          {/* subtle felt weave texture */}
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #F7EFDD 0, #F7EFDD 1px, transparent 1px, transparent 12px)",
            }}
          />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4B942]/15 border border-[#F4B942]/30 text-[#F4B942] text-xs font-bold uppercase tracking-wider">
                <Sparkles size={12} className="animate-pulse" />
                Sảnh Game Poker
              </div>
              <h1
                className="text-4xl md:text-5xl font-black tracking-tight text-[#F7EFDD]"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                Texas Hold'em Club
              </h1>
              <p className="text-[#F7EFDD]/70 text-sm md:text-base max-w-md leading-relaxed">
                Ngồi vào bàn, rút bài, và để may mắn dẫn lối. Âm thanh sống động, đối thủ thứ thiệt, chiến thắng chờ bạn.
              </p>
            </div>

            {/* User Chips Wallet Status Widget */}
            <div className="bg-[#0B3D2E]/70 border border-[#F4B942]/25 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F4B942] to-[#C9861C] rounded-full flex items-center justify-center text-[#142019] shrink-0 shadow-lg shadow-[#F4B942]/20 ring-2 ring-[#F4B942]/30">
                  <Coins size={22} />
                </div>
                <div>
                  <span className="text-[10px] text-[#F7EFDD]/50 font-bold block uppercase tracking-wider">Số dư của bạn</span>
                  <span className="text-xl font-black text-[#F4B942] tracking-tight" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                    {parseInt(chipsBalance).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={claimFreeChips}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F4B942] to-[#E0942A] hover:brightness-110 text-[#142019] font-black text-xs transition-all shadow-md shadow-[#F4B942]/20 active:scale-95 whitespace-nowrap flex items-center gap-1.5"
                >
                  <Flame size={13} />
                  Nhận Chips Free
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-3 py-2.5 rounded-xl bg-[#0B3D2E] hover:bg-[#0B3D2E]/70 text-[#F7EFDD] border border-[#F4B942]/25 font-bold text-xs transition-all flex items-center justify-center"
                  title="Tạo bàn chơi"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mt-7 pt-6 border-t border-[#F4B942]/15 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#F4B942]/10 flex items-center justify-center text-[#F4B942]">
                <Users size={15} />
              </div>
              <div>
                <span className="text-[10px] text-[#F7EFDD]/50 block uppercase font-bold tracking-wider">Trực tuyến</span>
                <span className="text-xs md:text-sm font-bold text-[#F7EFDD]">
                  {lobbyStats.online_players.toLocaleString()} cao thủ
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#F4B942]/10 flex items-center justify-center text-[#F4B942]">
                <Activity size={15} />
              </div>
              <div>
                <span className="text-[10px] text-[#F7EFDD]/50 block uppercase font-bold tracking-wider">Bàn đang mở</span>
                <span className="text-xs md:text-sm font-bold text-[#F7EFDD]">
                  {lobbyStats.active_tables} bàn
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#F4B942]/10 flex items-center justify-center text-[#F4B942]">
                <Trophy size={15} />
              </div>
              <div>
                <span className="text-[10px] text-[#F7EFDD]/50 block uppercase font-bold tracking-wider">Hũ pot hôm nay</span>
                <span className="text-xs md:text-sm font-bold text-[#F7EFDD]">
                  {formatChips(lobbyStats.total_jackpot_pot.toString())} Chips
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 🔍 Search & Filters Bar */}
        <div className="bg-[#0F4438]/80 border border-[#F4B942]/15 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg backdrop-blur-sm">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F7EFDD]/40" size={18} />
            <input
              type="text"
              placeholder="Tìm tên bàn chơi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B3D2E] border border-[#F4B942]/15 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#F7EFDD] placeholder-[#F7EFDD]/30 focus:outline-none focus:border-[#F4B942]/60 focus:ring-1 focus:ring-[#F4B942]/60 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto py-1 no-scrollbar">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedFilter === filter.id
                    ? "bg-[#F4B942] text-[#142019] shadow-md shadow-[#F4B942]/20"
                    : "bg-[#0B3D2E] text-[#F7EFDD]/60 hover:text-[#F7EFDD] hover:bg-[#0B3D2E]/70"
                }`}
              >
                <span className={selectedFilter === filter.id ? "" : filter.color}>{filter.suit}</span>
                {filter.label}
              </button>
            ))}

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-xl bg-[#0B3D2E] hover:bg-[#0B3D2E]/70 border border-[#F4B942]/15 text-[#F7EFDD]/60 hover:text-[#F7EFDD] transition-all shrink-0 ml-1"
              title="Cài đặt game"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* 🗂️ Tables Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-[#F4B942]/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#F4B942] animate-spin" />
            </div>
            <span className="text-[#F7EFDD]/60 font-medium text-sm">Đang xếp bàn cho bạn...</span>
          </div>
        ) : filteredTables.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTables.map((table, idx) => {
              const isFull = table.current_players >= table.max_players;
              const isHot = table.current_players / table.max_players >= 0.7 && !isFull;
              const suit = SUITS[idx % SUITS.length];
              const suitColor = suit === "♥" || suit === "♦" ? "text-[#E23744]" : "text-[#F7EFDD]";

              return (
                <motion.div
                  key={table.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative bg-[#0F4438]/80 border border-[#F4B942]/15 hover:border-[#F4B942]/50 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-300 hover:shadow-xl hover:shadow-[#F4B942]/5 group overflow-hidden"
                >
                  {/* corner suit watermark */}
                  <span className={`absolute -right-2 -top-3 text-7xl font-black opacity-[0.05] pointer-events-none ${suitColor}`}>
                    {suit}
                  </span>

                  <div className="flex justify-between items-start relative">
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4B942]/10 text-[#F4B942] text-[10px] font-bold uppercase tracking-wider border border-[#F4B942]/15">
                        <span className={suitColor}>{suit}</span>
                        {table.game_type}
                      </span>
                      <h3 className="font-black text-[#F7EFDD] group-hover:text-[#F4B942] transition-colors text-base tracking-tight">
                        {table.name}
                      </h3>
                      {isHot && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#E23744]">
                          <Flame size={11} /> Bàn đang hot
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 bg-[#0B3D2E]/80 px-2.5 py-1.5 rounded-xl border border-[#F4B942]/10">
                      <Users size={13} className="text-[#F7EFDD]/50" />
                      <span className="text-xs font-bold text-[#F7EFDD]">
                        {table.current_players}/{table.max_players}
                      </span>
                    </div>
                  </div>

                  {/* Seat dots — friendly at-a-glance occupancy */}
                  <div className="flex items-center gap-1.5 relative">
                    {Array.from({ length: table.max_players }).map((_, seatIdx) => (
                      <span
                        key={seatIdx}
                        className={`w-2.5 h-2.5 rounded-full ${
                          seatIdx < table.current_players
                            ? "bg-[#F4B942] shadow-sm shadow-[#F4B942]/40"
                            : "bg-[#F7EFDD]/10"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-[#0B3D2E]/60 rounded-xl p-3.5 border border-[#F4B942]/10 relative">
                    <div>
                      <span className="text-[10px] text-[#F7EFDD]/40 block uppercase font-bold tracking-wider">Blinds</span>
                      <span className="text-sm font-black text-[#F4B942]">
                        {formatChips(table.small_blind)} / {formatChips(table.big_blind)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#F7EFDD]/40 block uppercase font-bold tracking-wider">Buy-in</span>
                      <span className="text-xs font-bold text-[#F7EFDD]/80">
                        {formatChips(table.min_buyin)} - {formatChips(table.max_buyin)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 relative">
                    <button
                      onClick={() => handleJoinTable(table)}
                      disabled={isFull}
                      className={`flex-1 py-3 px-4 rounded-xl font-black text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                        isFull
                          ? "bg-[#0B3D2E]/60 text-[#F7EFDD]/30 border border-[#F4B942]/10 cursor-not-allowed"
                          : "bg-gradient-to-r from-[#F4B942] to-[#E0942A] hover:brightness-110 text-[#142019] shadow-md shadow-[#F4B942]/20 active:scale-95"
                      }`}
                    >
                      <span>{isFull ? "Bàn đã đầy" : "Vào Bàn Chơi"}</span>
                      {!isFull && <ChevronRight size={14} />}
                    </button>

                    <button
                      onClick={() => handleSpectateTable(table)}
                      className="p-3 rounded-xl bg-[#0B3D2E]/80 hover:bg-[#0B3D2E] border border-[#F4B942]/15 text-[#F7EFDD]/60 hover:text-[#F7EFDD] transition-all flex items-center justify-center cursor-pointer"
                      title="Theo dõi bàn đấu"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#0F4438]/80 border border-[#F4B942]/15 rounded-3xl p-12 text-center flex flex-col items-center justify-center shadow-lg">
            <div className="flex gap-1 mb-4 text-4xl">
              <span className="text-[#F7EFDD]/20">♠</span>
              <span className="text-[#E23744]/20">♥</span>
              <span className="text-[#E23744]/20">♦</span>
              <span className="text-[#F7EFDD]/20">♣</span>
            </div>
            <h3 className="text-lg font-black text-[#F7EFDD]">Chưa có bàn nào khớp bộ lọc</h3>
            <p className="text-[#F7EFDD]/50 text-sm max-w-sm mt-1">
              Thử đổi từ khóa tìm kiếm hoặc mức cược, hoặc tự mở một bàn mới — bạn làm chủ ván bài.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black text-[#142019] rounded-xl bg-gradient-to-r from-[#F4B942] to-[#E0942A] hover:brightness-110 transition-all shadow-md active:scale-95"
            >
              <Plus size={14} />
              Tạo Bàn Chơi Mới
            </button>
          </div>
        )}

        {/* 🛠️ Create Table Modal */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-[#0F4438] border border-[#F4B942]/25 rounded-3xl overflow-hidden shadow-2xl relative"
              >
                <div className="flex items-center justify-between p-5 border-b border-[#F4B942]/15">
                  <h3 className="font-black text-[#F7EFDD] text-lg flex items-center gap-2">
                    <Plus size={20} className="text-[#F4B942]" />
                    Tạo Bàn Chơi Mới
                  </h3>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-[#0B3D2E] text-[#F7EFDD]/50 hover:text-[#F7EFDD] transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateTable} className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#F7EFDD]/50 uppercase tracking-wider block">Tên bàn chơi</label>
                    <input
                      type="text"
                      required
                      value={newTableName}
                      onChange={(e) => setNewTableName(e.target.value)}
                      placeholder="Ví dụ: Vegas Room, Beginner Stakes..."
                      className="w-full bg-[#0B3D2E] border border-[#F4B942]/15 rounded-xl py-2.5 px-4 text-sm text-[#F7EFDD] placeholder-[#F7EFDD]/30 focus:outline-none focus:border-[#F4B942]/60 focus:ring-1 focus:ring-[#F4B942]/60 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#F7EFDD]/50 uppercase tracking-wider block">Small Blind</label>
                      {isCustomSmallBlind ? (
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            required
                            min={1}
                            placeholder="Nhập..."
                            value={newSmallBlind}
                            onChange={(e) => {
                              const sb = e.target.value;
                              setNewSmallBlind(sb);
                              const val = parseInt(sb) || 0;
                              setNewBigBlind((val * 2).toString());
                              setNewMinBuyin((val * 40).toString());
                              setNewMaxBuyin((val * 200).toString());
                            }}
                            className="w-full bg-[#0B3D2E] border border-[#F4B942]/15 rounded-xl py-2.5 px-3 text-sm text-[#F7EFDD] focus:outline-none focus:border-[#F4B942]/60 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomSmallBlind(false);
                              setNewSmallBlind("1000");
                              setNewBigBlind("2000");
                              setNewMinBuyin("40000");
                              setNewMaxBuyin("200000");
                            }}
                            className="px-2.5 rounded-xl bg-[#0B3D2E] hover:bg-[#0B3D2E]/70 text-[#F7EFDD]/70 text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
                          >
                            Mẫu
                          </button>
                        </div>
                      ) : (
                        <select
                          value={newSmallBlind}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "custom") {
                              setIsCustomSmallBlind(true);
                              setNewSmallBlind("");
                              setNewBigBlind("0");
                              setNewMinBuyin("0");
                              setNewMaxBuyin("0");
                            } else {
                              setNewSmallBlind(val);
                              const sbVal = parseInt(val) || 0;
                              setNewBigBlind((sbVal * 2).toString());
                              setNewMinBuyin((sbVal * 40).toString());
                              setNewMaxBuyin((sbVal * 200).toString());
                            }
                          }}
                          className="w-full bg-[#0B3D2E] border border-[#F4B942]/15 rounded-xl py-2.5 px-3 text-sm text-[#F7EFDD] focus:outline-none focus:border-[#F4B942]/60 transition-colors cursor-pointer"
                        >
                          <option value="50">50</option>
                          <option value="100">100</option>
                          <option value="200">200</option>
                          <option value="400">400</option>
                          <option value="600">600</option>
                          <option value="800">800</option>
                          <option value="1000">1,000</option>
                          <option value="custom">Tự nhập (Custom)...</option>
                        </select>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#F7EFDD]/50 uppercase tracking-wider block">Big Blind</label>
                      <input
                        type="text"
                        disabled
                        value={parseInt(newBigBlind || "0").toLocaleString()}
                        className="w-full bg-[#0B3D2E]/50 border border-[#F4B942]/10 rounded-xl py-2.5 px-4 text-sm text-[#F7EFDD]/40 focus:outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-[#0B3D2E]/60 rounded-xl p-3 border border-[#F4B942]/10">
                    <div>
                      <span className="text-[10px] text-[#F7EFDD]/40 block uppercase font-bold tracking-wider">Buy-In Tối Thiểu</span>
                      <span className="text-xs font-bold text-[#F7EFDD]">{parseInt(newMinBuyin || "0").toLocaleString()} Chips</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#F7EFDD]/40 block uppercase font-bold tracking-wider">Buy-In Tối Đa</span>
                      <span className="text-xs font-bold text-[#F7EFDD]">{parseInt(newMaxBuyin || "0").toLocaleString()} Chips</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#F7EFDD]/50 uppercase tracking-wider block">Số người tối đa</label>
                      <select
                        value={newMaxPlayers}
                        onChange={(e) => setNewMaxPlayers(parseInt(e.target.value))}
                        className="w-full bg-[#0B3D2E] border border-[#F4B942]/15 rounded-xl py-2.5 px-3 text-sm text-[#F7EFDD] focus:outline-none focus:border-[#F4B942]/60 transition-colors"
                      >
                        <option value={9}>9 Players (Full Table)</option>
                        <option value={6}>6 Players (Short Handed)</option>
                        <option value={2}>2 Players (Heads Up)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#F7EFDD]/50 uppercase tracking-wider block">Loại game</label>
                      <select
                        value={newGameType}
                        onChange={(e) => setNewGameType(e.target.value)}
                        className="w-full bg-[#0B3D2E] border border-[#F4B942]/15 rounded-xl py-2.5 px-3 text-sm text-[#F7EFDD] focus:outline-none focus:border-[#F4B942]/60 transition-colors"
                      >
                        <option value="Texas Hold'em">Texas Hold'em</option>
                        <option value="Omaha">Omaha</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="flex-1 py-3 px-4 rounded-xl bg-[#0B3D2E] hover:bg-[#0B3D2E]/70 text-[#F7EFDD]/60 hover:text-[#F7EFDD] border border-[#F4B942]/15 font-bold text-xs uppercase tracking-wider transition-colors"
                    >
                      Hủy Bỏ
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#F4B942] to-[#E0942A] hover:brightness-110 text-[#142019] font-black text-xs uppercase tracking-wider transition-colors shadow-lg active:scale-95"
                    >
                      Tạo & Vào Bàn
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ⚙️ Game Settings Modal */}
        <AnimatePresence>
          {isSettingsModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-[#0F4438] border border-[#F4B942]/25 rounded-3xl overflow-hidden shadow-2xl relative"
              >
                <div className="flex items-center justify-between p-5 border-b border-[#F4B942]/15">
                  <h3 className="font-black text-[#F7EFDD] text-lg flex items-center gap-2">
                    <Settings size={20} className="text-[#F7EFDD]/60" />
                    Cấu Hình Game Poker
                  </h3>
                  <button
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-[#0B3D2E] text-[#F7EFDD]/50 hover:text-[#F7EFDD] transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-5 space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-[#F7EFDD]">Âm thanh & Hiệu ứng</h4>
                      <button
                        onClick={() => setMuteAll(!muteAll)}
                        className={`p-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold uppercase transition-colors ${
                          muteAll ? "bg-[#E23744]/15 text-[#E23744] border border-[#E23744]/25" : "bg-[#0B3D2E] text-[#F7EFDD]/50"
                        }`}
                      >
                        {muteAll ? <VolumeX size={12} /> : <Volume2 size={12} />}
                        {muteAll ? "Đã tắt tất cả" : "Mute all"}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-[#F7EFDD]/60 font-medium">
                        <span>Âm lượng Dealer lồng tiếng</span>
                        <span>{muteAll ? 0 : bgVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        disabled={muteAll}
                        value={muteAll ? 0 : bgVolume}
                        onChange={(e) => setBgVolume(parseInt(e.target.value))}
                        className="w-full accent-[#F4B942] bg-[#0B3D2E] h-1.5 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-[#F7EFDD]/60 font-medium">
                        <span>Hiệu ứng chia bài & gõ chip</span>
                        <span>{muteAll ? 0 : soundEffectsVol}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        disabled={muteAll}
                        value={muteAll ? 0 : soundEffectsVol}
                        onChange={(e) => setSoundEffectsVol(parseInt(e.target.value))}
                        className="w-full accent-[#F4B942] bg-[#0B3D2E] h-1.5 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-[#F4B942]/15">
                    <h4 className="text-sm font-bold text-[#F7EFDD]">Giao diện bàn chơi</h4>

                    <div className="space-y-2">
                      <span className="text-xs text-[#F7EFDD]/60 font-medium block">Màu sắc bàn đấu (Felt)</span>
                      <div className="grid grid-cols-4 gap-2">
                        {["Classic Green", "Royal Blue", "Crimson Red", "Midnight Black"].map((color) => (
                          <button
                            key={color}
                            onClick={() => showToast("success", `Đã lưu màu bàn đấu: ${color}`)}
                            className="py-2 rounded-lg bg-[#0B3D2E] hover:bg-[#0B3D2E]/60 border border-[#F4B942]/10 hover:border-[#F4B942]/40 text-[10px] font-bold text-[#F7EFDD]/60 transition-colors"
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs text-[#F7EFDD]/60 font-medium block">Kiểu dáng lá bài (Deck back)</span>
                      <div className="grid grid-cols-3 gap-2">
                        {["Standard 2-Color", "4-Color Deck", "Neon Cyberpunk"].map((deck) => (
                          <button
                            key={deck}
                            onClick={() => showToast("success", `Đã chọn bộ bài: ${deck}`)}
                            className="py-2 rounded-lg bg-[#0B3D2E] hover:bg-[#0B3D2E]/60 border border-[#F4B942]/10 hover:border-[#F4B942]/40 text-[10px] font-bold text-[#F7EFDD]/60 transition-colors"
                          >
                            {deck}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#F4B942] to-[#E0942A] hover:brightness-110 text-[#142019] font-black text-xs uppercase tracking-wider transition-colors shadow-lg"
                  >
                    Xác nhận cấu hình
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function PokerGamePage() {
  return (
    <UserProvider>
      <PokerGameLobby />
    </UserProvider>
  );
}
