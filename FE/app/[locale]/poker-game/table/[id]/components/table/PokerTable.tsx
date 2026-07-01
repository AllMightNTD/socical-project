"use client";

import React, { memo } from "react";
import { usePokerGame } from "../hooks/usePokerGame";
import SeatV2 from "./v2/SeatV2";
import { PotDisplay } from "./PotDisplay";
import { CommunityCards } from "./CommunityCards";
import DealerDeck from "./v2/DealerDeck";
import { BoardStage } from "./BoardStage";

export const PokerTable = memo(function PokerTable() {
  const {
    tableRef,
    tableScale,
    tableBackground,
    getFeltStyles,
    players,
    waitingMessage,
    maxPlayers,
  } = usePokerGame();

  const felt = getFeltStyles(tableBackground);

  return (
    /* Centering wrapper — fills parent main, centers table with flexbox */
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">

      {/* ── The Responsive table canvas ── */}
      <div
        ref={tableRef}
        className="relative w-full max-w-[1024px] mx-2 md:mx-6 aspect-[1.6/1] sm:aspect-[1.8/1] md:aspect-[2.2/1] shrink-0 rounded-[100px] sm:rounded-[140px] md:rounded-[180px] border-[12px] sm:border-[18px] md:border-[24px] border-[#2a1708] shadow-[0_30px_80px_-10px_rgba(0,0,0,0.95),_inset_0_10px_30px_rgba(0,0,0,0.8)] flex items-center justify-center bg-[#3a200d]"
        style={{
          boxShadow: '0 30px 60px -15px rgba(0,0,0,1), inset 0 10px 20px rgba(0,0,0,0.8), inset 0 0 15px rgba(255,255,255,0.05)',
          backgroundImage: 'linear-gradient(to bottom, #4a2810, #1e0f06)'
        }}
      >
        {/* Inner felt surface */}
        <div
          className={`absolute inset-0 sm:inset-1 md:inset-1.5 rounded-[85px] sm:rounded-[120px] md:rounded-[160px] ${felt.gradient} overflow-hidden shadow-[inset_0_10px_40px_rgba(0,0,0,0.9),_inset_0_0_20px_rgba(0,0,0,0.8)]`}
        >
          {/* Subtle radial light at center for realistic felt texture */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.15)_0%,_transparent_70%)] pointer-events-none" />
          
          {/* Inner border ring (Betting Line) */}
          <div className={`absolute inset-6 sm:inset-10 md:inset-14 rounded-[70px] sm:rounded-[100px] md:rounded-[140px] border-2 ${felt.line} pointer-events-none opacity-80`} />
          
          {/* Second ring for style */}
          <div className={`absolute inset-10 sm:inset-16 md:inset-20 rounded-[55px] sm:rounded-[80px] md:rounded-[115px] border ${felt.line} opacity-30 pointer-events-none`} />
        </div>

        {/* 3D Dealer Deck at center-top */}
        <DealerDeck />

        {/* Center HUD: Pot + Community Cards + Stage */}
        <div className="absolute flex flex-col items-center justify-center text-center space-y-2 z-20">
          {waitingMessage && (
            <div className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider backdrop-blur-sm shadow-xl transition-all duration-300 ${waitingMessage.starting ? 'bg-amber-500/90 text-amber-950 animate-pulse' : 'bg-black/60 text-white/80'}`}>
              {waitingMessage.text}
            </div>
          )}
          <PotDisplay />
          <CommunityCards />
          <BoardStage />
        </div>

        {/* Player seats */}
        {Array.from({ length: maxPlayers || 6 }, (_, i) => {
          const seatNumber = i + 1;
          const player = players.find((p) => p.seatIndex === seatNumber);
          return <SeatV2 key={`seat-${seatNumber}`} seatNumber={seatNumber} player={player} />;
        })}
      </div>
    </div>
  );
});
