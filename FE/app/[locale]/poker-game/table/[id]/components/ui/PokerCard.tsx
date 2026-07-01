"use client";

import React from "react";
import { Coins } from "lucide-react";

const HeartSuit = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-current`} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const DiamondSuit = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-current`} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3.5 12 12 22l8.5-10L12 2z"/>
  </svg>
);

const SpadeSuit = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-current`} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C11.5 2 6 7.5 6 12c0 3.3 2.7 6 6 6s6-2.7 6-6c0-4.5-5.5-10-6-10zm1.5 14L15 21H9l1.5-5h3z"/>
  </svg>
);

const ClubSuit = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-current`} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 8.5c1.4 0 2.5-1.1 2.5-2.5S13.4 3.5 12 3.5s-2.5 1.1-2.5 2.5 1.1 2.5 2.5 2.5zm-3.5 6c1.4 0 2.5-1.1 2.5-2.5s-1.1-2.5-2.5-2.5-2.5 1.1-2.5 2.5 1.1 2.5 2.5 2.5zm7 0c1.4 0 2.5-1.1 2.5-2.5S16.9 9.5 15.5 9.5s-2.5 1.1-2.5 2.5 1.1 2.5 2.5 2.5zM12.5 13.5L14 20.5H10l1.5-7h1z"/>
  </svg>
);

const SUIT_COLORS = {
  H: "text-rose-600",
  D: "text-rose-600",
  S: "text-slate-900",
  C: "text-slate-900",
};

const SuitIcon = ({ suit, className = "w-4 h-4" }: { suit: "H" | "D" | "S" | "C"; className?: string }) => {
  const colorClass = SUIT_COLORS[suit];
  const fullClassName = `${className} ${colorClass}`;
  
  if (suit === "H") return <HeartSuit className={fullClassName} />;
  if (suit === "D") return <DiamondSuit className={fullClassName} />;
  if (suit === "S") return <SpadeSuit className={fullClassName} />;
  return <ClubSuit className={fullClassName} />;
};

const CardBackPattern = ({ styleType = "classic" }: { styleType?: "classic" | "modern" | "cyberpunk" }) => {
  const strokeColor =
    styleType === "modern"
      ? "text-indigo-500/20"
      : styleType === "cyberpunk"
      ? "text-yellow-500/20"
      : "text-rose-500/20"; // classic

  return (
    <svg viewBox="0 0 100 150" className={`w-full h-full opacity-40 ${strokeColor}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={`card-back-grid-${styleType}`} width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 10 M 0 0 L 10 10" fill="none" stroke="currentColor" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100" height="150" fill={`url(#card-back-grid-${styleType})`} />
      <circle cx="50" cy="75" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="75" r="14" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
    </svg>
  );
};

interface PokerCardProps {
  suit: "H" | "D" | "S" | "C" | "back" | "?" | string;
  rank: string;
  isFaceUp: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  deckStyle?: "classic" | "modern" | "cyberpunk";
}

import { motion } from "framer-motion";

export const PokerCard = ({ suit, rank, isFaceUp, size = "md", className = "", deckStyle = "classic" }: PokerCardProps) => {
  const sizeClasses = {
    sm: "w-[32px] h-[46px] rounded-[6px]",
    md: "w-[44px] h-[64px] rounded-[10px]",
    lg: "w-[56px] h-[80px] sm:w-[64px] sm:h-[90px] md:w-[84px] md:h-[120px] rounded-[14px]",
  };

  const backGradient =
    deckStyle === "modern"
      ? "from-indigo-800 via-indigo-900 to-slate-950 border-indigo-500/40"
      : deckStyle === "cyberpunk"
      ? "from-slate-900 via-yellow-950 to-black border-yellow-500/40"
      : "from-red-700 via-red-800 to-red-950 border-red-500/40";

  const tokenColor =
    deckStyle === "modern"
      ? "text-indigo-400/90 border-indigo-400/30"
      : deckStyle === "cyberpunk"
      ? "text-yellow-400/95 border-yellow-400/30"
      : "text-amber-400/90 border-amber-400/30";

  const textColors = SUIT_COLORS[suit as keyof typeof SUIT_COLORS] || "text-slate-900";

  return (
    <div className={`${sizeClasses[size]} relative ${className}`} style={{ perspective: 1000 }}>
      <motion.div
        className="w-full h-full relative"
        initial={false}
        animate={{ rotateY: isFaceUp ? 0 : 180 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* FRONT FACE */}
        <div 
          className={`absolute inset-0 bg-white border border-slate-300 shadow-[0_4px_10px_rgba(0,0,0,0.3)] flex flex-col justify-between select-none overflow-hidden rounded-[inherit]`}
          style={{ backfaceVisibility: "hidden", padding: size === "sm" ? "2px" : size === "md" ? "4px" : "6px" }}
        >
          {/* Light sheen overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/25 pointer-events-none" />

          {/* Top Left Corner */}
          <div className="flex flex-col items-center leading-none text-left self-start relative z-10">
            <span className={`font-black tracking-tighter ${size === "sm" ? "text-[9px]" : size === "md" ? "text-[11px]" : "text-xs md:text-sm"} ${textColors} font-sans`}>
              {rank}
            </span>
            {suit && suit !== "back" && suit !== "?" && (
              <SuitIcon suit={suit as any} className={size === "sm" ? "w-2.5 h-2.5" : size === "md" ? "w-3 h-3" : "w-3.5 h-3.5"} />
            )}
          </div>

          {/* Center Suit Icon */}
          {size !== "sm" && suit && suit !== "back" && suit !== "?" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.95] z-0">
              <SuitIcon suit={suit as any} className={size === "md" ? "w-4 h-4" : "w-7 h-7 md:w-9 h-9"} />
            </div>
          )}

          {/* Bottom Right Corner (rotated) */}
          <div className="flex flex-col items-center leading-none text-left self-end rotate-180 z-10 relative">
            <span className={`font-black tracking-tighter ${size === "sm" ? "text-[9px]" : size === "md" ? "text-[11px]" : "text-xs md:text-sm"} ${textColors} font-sans`}>
              {rank}
            </span>
            {suit && suit !== "back" && suit !== "?" && (
              <SuitIcon suit={suit as any} className={size === "sm" ? "w-2.5 h-2.5" : size === "md" ? "w-3 h-3" : "w-3.5 h-3.5"} />
            )}
          </div>
        </div>

        {/* BACK FACE */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${backGradient} border shadow-[0_4px_8px_rgba(0,0,0,0.45)] flex items-center justify-center overflow-hidden rounded-[inherit]`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="absolute inset-[1px] border border-white/10 rounded-[inherit] pointer-events-none" />
          <div className="absolute inset-[1px]">
            <CardBackPattern styleType={deckStyle} />
          </div>
          <div className={`absolute w-[45%] h-[45%] rounded-full border ${tokenColor} flex items-center justify-center bg-black/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]`}>
            <Coins className="w-[60%] h-[60%]" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
