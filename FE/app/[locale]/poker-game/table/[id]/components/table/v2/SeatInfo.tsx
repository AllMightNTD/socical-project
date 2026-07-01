import React from 'react';

interface SeatInfoProps {
  name: string;
  chips: number;
  isHero: boolean;
  isMobile: boolean;
  status: string;
  isBot: boolean;
}

const SeatInfo: React.FC<SeatInfoProps> = React.memo(({ name, chips, isHero, isMobile, status, isBot }) => {
  const formatChipsVal = (val: string | number) => {
    const num = typeof val === "string" ? parseInt(val, 10) : val;
    if (isNaN(num)) return "0";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return num.toString();
  };

  return (
    <div className="flex-1 flex flex-col justify-center min-w-0 pr-1 pl-2">
      <div className="flex items-center gap-1 justify-between">
        <span className={`font-bold truncate leading-tight flex items-center gap-1
          ${isHero ? "text-amber-400" : "text-white"}
          ${isMobile ? "text-[9px]" : "text-xs md:text-sm"}`}
        >
          {name}
          {isBot && <span className="px-1 py-0.5 rounded text-[8px] bg-slate-700 text-slate-300">BOT</span>}
        </span>
      </div>
      <span className={`font-black text-amber-500 truncate leading-tight
        ${isMobile ? "text-[8px]" : "text-[10px] md:text-xs"}`}
      >
        {status === 'sitting_out' ? 'Sit Out' : status === 'disconnected' ? 'Mất mạng' : formatChipsVal(chips)}
      </span>
    </div>
  );
});
SeatInfo.displayName = 'SeatInfo';
export default SeatInfo;
