"use client";

import { useCurrentUser } from "@/core/providers/user-provider";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Minus, Plus } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { usePokerGame } from "../hooks/usePokerGame";
import { useResponsive } from "../hooks/useResponsive";
import { LinearTimer } from "../ui/Timer";

/** Format chip number to K / M shorthand */
function fmt(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${Math.round(val / 1_000)}K`;
  return val.toLocaleString("vi-VN");
}

export const ActionBar: React.FC = () => {
  const { isMobile } = useResponsive();
  const { currentUser } = useCurrentUser();
  const {
    players,
    pot,
    minRaise,
    maxRaise,
    raiseAmount,
    setRaiseAmount,
    handleUserAction,
    timerVal,
    maxTimerVal,
    currentHighestBet,
    ownerId,
    startGame,
    gameStage,
  } = usePokerGame();

  const [isRaiseMode, setIsRaiseMode] = useState(false);

  const hero = players.find((p) => p.isHero);
  const isHeroActive = hero?.isActive ?? false;
  const isHeroFolded = hero?.isFolded ?? false;

  const heroCurrentBet = parseInt(hero?.current_bet || "0");
  const callAmount = Math.max(0, currentHighestBet - heroCurrentBet);

  const [inputRaw, setInputRaw] = useState(minRaise.toLocaleString("vi-VN"));

  const potNum = parseInt(pot) || 0;

  /**
   * RAISE STEP — dùng đúng đơn vị luật poker, không phải "1% của range".
   *
   * Theo luật No-Limit Hold'em, mức raise tối thiểu tiếp theo phải LỚN HƠN
   * HOẶC BẰNG mức raise gần nhất (min-raise rule). `minRaise` mà hook trả
   * về chính là con số đó — và nó luôn là một đơn vị chip "sạch" (dựa trên
   * big blind / raise trước đó), khác hẳn việc chia đều khoảng cách
   * min→max thành 100 phần rồi lấy 1 phần làm bước nhảy.
   *
   * => Mỗi lần bấm +/- ta di chuyển đúng 1 "nấc raise hợp lệ", giống cách
   * một bàn poker thật tính tiền, thay vì một số lẻ vô nghĩa.
   */
  const step = Math.max(1, minRaise);

  const isAtMin = raiseAmount <= minRaise;
  const isAtMax = raiseAmount >= maxRaise;

  // Keep input display in sync when raiseAmount changes via slider / quick-bet
  useEffect(() => {
    setInputRaw(raiseAmount.toLocaleString("vi-VN"));
  }, [raiseAmount]);

  /* ---- helpers ---- */
  const clamp = (v: number) => Math.min(maxRaise, Math.max(minRaise, v));

  const setPreset = useCallback(
    (val: number) => {
      const v = clamp(Math.round(val));
      setRaiseAmount(v);
      setIsRaiseMode(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [minRaise, maxRaise]
  );

  const handleInputChange = (raw: string) => {
    // Allow only digits
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      setInputRaw("");
      return;
    }
    const num = parseInt(digits, 10);
    setInputRaw(num.toLocaleString("vi-VN"));
    setRaiseAmount(clamp(num));
  };

  const handleSlider = (val: number) => setRaiseAmount(val);

  const doAction = (action: string) => {
    handleUserAction(action, action === "raise" ? raiseAmount : 0);
    setIsRaiseMode(false);
  };

  const isAllIn = raiseAmount >= maxRaise;

  const raiseLabel = isAllIn ? `RAISE ${fmt(raiseAmount)} (ALL-IN)` : `RAISE ${fmt(raiseAmount)}`;

  // % of pot this raise represents — quick sanity read for the player
  const potPercent = potNum > 0 ? Math.round((raiseAmount / potNum) * 100) : null;

  /* Quick-bet presets */
  const quickBets = [
    { label: "MIN", val: minRaise },
    { label: "½ POT", val: potNum / 2 },
    { label: "POT", val: potNum },
    { label: "ALL-IN", val: maxRaise },
  ];

  const isHost = currentUser?.id === ownerId;
  const showStartButton = isHost && gameStage === "waiting";

  if (showStartButton) {
    const canStart = players.length >= 2;
    return (
      <footer className="bg-[#0B3D2E]/98 border-t border-[#F4B942]/15 shrink-0 z-20">
        <div className="flex items-center justify-center p-4">
          <button
            onClick={startGame}
            disabled={!canStart}
            className={`w-full max-w-md py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 border shadow-lg
              ${
                canStart
                  ? "bg-gradient-to-r from-[#F4B942] to-[#E0942A] hover:brightness-110 border-[#F4B942] text-[#142019] shadow-[#F4B942]/20"
                  : "bg-[#0F4438] border-[#F4B942]/10 text-[#F7EFDD]/30 cursor-not-allowed opacity-60 shadow-none"
              }`}
          >
            Bắt đầu ván đấu
          </button>
        </div>
      </footer>
    );
  }

  /* ---- SPECTATOR state ---- */
  if (!hero) {
    return null;
  }

  /* ---- FOLDED state ---- */
  if (isHeroFolded) {
    return (
      <footer className="bg-[#0B3D2E]/98 border-t border-[#F4B942]/10 shrink-0 z-20">
        <div className="flex items-center justify-center py-4 text-[#F7EFDD]/40">
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Đã bỏ bài — Đang chờ ván tiếp theo...
          </span>
        </div>
      </footer>
    );
  }

  /* ---- NOT ACTIVE state (Someone else's turn or waiting) ---- */
  if (!isHeroActive) {
    const activePlayer = players.find((p) => p.isActive);
    return (
      <footer className="bg-[#0B3D2E]/98 border-t border-[#F4B942]/10 shrink-0 z-20">
        <div className="flex items-center justify-center py-4 text-[#F7EFDD]/50 gap-2">
          {activePlayer ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#F4B942] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Đang chờ lượt chơi của {activePlayer.name}...
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Đang chờ ván đấu bắt đầu...
              </span>
            </>
          )}
        </div>
      </footer>
    );
  }

  /* ---- MAIN RENDER ---- */
  return (
    <footer className="bg-[#0B3D2E]/98 border-t border-[#F4B942]/15 shrink-0 z-20">
      {/* Turn timer bar */}
      {isHeroActive && <LinearTimer value={timerVal} max={maxTimerVal} />}

      <div className={`flex flex-col gap-2 ${isMobile ? "p-2.5" : "p-3 md:p-4"}`}>
        {/* ── Row 1: FOLD | CHECK | CALL ── */}
        <div className="flex items-stretch gap-2 md:gap-3">
          <button
            onClick={() => doAction("fold")}
            className="flex-1 py-3.5 md:py-4 rounded-xl border border-[#E23744]/40 hover:border-[#E23744]
              bg-[#E23744]/10 hover:bg-[#E23744]/20 text-[#E23744] font-black text-[11px] md:text-sm
              uppercase tracking-widest transition-all active:scale-95"
          >
            FOLD
          </button>

          <button
            onClick={() => doAction("check")}
            disabled={callAmount > 0}
            className={`flex-1 py-3.5 md:py-4 rounded-xl border font-black text-[11px] md:text-sm
              uppercase tracking-widest transition-all active:scale-95
              ${
                callAmount > 0
                  ? "border-[#F4B942]/10 bg-[#0F4438]/60 text-[#F7EFDD]/25 cursor-not-allowed opacity-50"
                  : "border-[#F7EFDD]/20 hover:border-[#F7EFDD]/40 bg-[#0F4438]/60 hover:bg-[#0F4438] text-[#F7EFDD]/80"
              }`}
          >
            CHECK
          </button>

          <button
            onClick={() => doAction("call")}
            disabled={callAmount === 0}
            className={`flex-1 py-3.5 md:py-4 rounded-xl font-black text-[11px] md:text-sm uppercase tracking-widest transition-all
              active:scale-95 shadow-lg border
              ${
                callAmount === 0
                  ? "border-[#F4B942]/10 bg-[#0F4438]/60 text-[#F7EFDD]/25 cursor-not-allowed opacity-50 shadow-none"
                  : "bg-gradient-to-r from-[#F4B942] to-[#E0942A] hover:brightness-110 text-[#142019] shadow-[#F4B942]/20 border-[#F4B942]"
              }`}
          >
            CALL {callAmount > 0 ? fmt(callAmount) : ""}
          </button>
        </div>

        {/* ── Raise expander: input + slider (only in RAISE mode) ── */}
        <AnimatePresence>
          {isRaiseMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 pb-1">
                {/* Custom amount input row */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreset(raiseAmount - step)}
                    disabled={isAtMin}
                    title={`Giảm ${fmt(step)} (1 nấc raise tối thiểu)`}
                    className="w-9 h-9 rounded-xl bg-[#0F4438] border border-[#F4B942]/20
                      text-[#F7EFDD]/70 hover:text-[#F7EFDD] hover:border-[#F4B942]/50
                      flex items-center justify-center transition-colors shrink-0 active:scale-95
                      disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#F4B942]/20"
                  >
                    <Minus size={14} />
                  </button>

                  <div className="flex-1 flex flex-col items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={inputRaw}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder={minRaise.toLocaleString("vi-VN")}
                      className="w-full text-center bg-[#0F4438] border border-[#F4B942]/20
                        focus:border-[#F4B942] focus:ring-1 focus:ring-[#F4B942]/40
                        rounded-xl py-2 px-3 text-[#F4B942] font-black text-sm
                        focus:outline-none transition-colors"
                    />
                    {potPercent !== null && (
                      <span className="text-[9px] font-bold text-[#F7EFDD]/35 uppercase tracking-wide mt-0.5">
                        ≈ {potPercent}% pot
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setPreset(raiseAmount + step)}
                    disabled={isAtMax}
                    title={`Tăng ${fmt(step)} (1 nấc raise tối thiểu)`}
                    className="w-9 h-9 rounded-xl bg-[#0F4438] border border-[#F4B942]/20
                      text-[#F7EFDD]/70 hover:text-[#F7EFDD] hover:border-[#F4B942]/50
                      flex items-center justify-center transition-colors shrink-0 active:scale-95
                      disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#F4B942]/20"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Range slider */}
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[9px] font-bold text-[#F7EFDD]/35 uppercase shrink-0">
                    Min {fmt(minRaise)}
                  </span>
                  <input
                    type="range"
                    min={minRaise}
                    max={maxRaise}
                    step={step}
                    value={raiseAmount}
                    onChange={(e) => handleSlider(parseInt(e.target.value))}
                    className="flex-1 h-1.5 rounded-full cursor-pointer accent-[#F4B942]"
                  />
                  <span className="text-[9px] font-bold text-[#F7EFDD]/35 uppercase shrink-0">
                    All-In {fmt(maxRaise)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Row 2: Quick bets + RAISE confirm ── */}
        <div className="flex items-center gap-1.5 md:gap-3">
          {quickBets.map((opt) => {
            const v = Math.round(opt.val);
            const isSelected = isRaiseMode && raiseAmount === clamp(v);
            return (
              <button
                key={opt.label}
                onClick={() => setPreset(opt.val)}
                className={`
                  flex-1 py-2.5 md:py-3.5 rounded-xl text-[10px] md:text-sm font-black uppercase tracking-wider
                  transition-all border active:scale-95
                  ${
                    isSelected
                      ? "bg-[#F4B942]/20 border-[#F4B942]/60 text-[#F4B942]"
                      : "bg-[#0F4438]/60 border-[#F4B942]/10 text-[#F7EFDD]/50 hover:border-[#F4B942]/30 hover:text-[#F7EFDD]"
                  }
                `}
              >
                {opt.label}
              </button>
            );
          })}

          {/* RAISE button — enter mode OR confirm */}
          <button
            onClick={() => {
              if (!isRaiseMode) {
                setPreset(raiseAmount); // enter mode with current amount
              } else {
                doAction("raise"); // confirm raise
              }
            }}
            className={`
              flex-[2] py-2.5 md:py-3.5 rounded-xl font-black text-[10px] md:text-sm uppercase tracking-wider
              transition-all active:scale-95 flex items-center justify-center gap-1 border
              ${
                isRaiseMode
                  ? isAllIn
                    ? "bg-gradient-to-r from-[#E23744] to-[#F4B942] border-[#F4B942] text-white shadow-lg"
                    : "bg-gradient-to-r from-[#F4B942] to-[#E0942A] hover:brightness-110 border-[#F4B942] text-[#142019] shadow-lg shadow-[#F4B942]/20"
                  : "bg-[#F4B942]/15 hover:bg-[#F4B942]/25 border-[#F4B942]/30 text-[#F4B942]"
              }
            `}
          >
            {isRaiseMode ? (
              <span className="truncate px-1">{raiseLabel}</span>
            ) : (
              <>
                <ChevronRight size={12} className="md:w-4 md:h-4" /> RAISE
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
};
