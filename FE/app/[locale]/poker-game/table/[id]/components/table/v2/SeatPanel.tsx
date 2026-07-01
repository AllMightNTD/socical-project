import React from 'react';

interface SeatPanelProps {
  children: React.ReactNode;
  isActive: boolean;
  isHero: boolean;
  isFolded: boolean;
}

const SeatPanel: React.FC<SeatPanelProps> = React.memo(({ children, isActive, isHero, isFolded }) => {
  return (
    <div 
      className={`
        relative flex items-center gap-1 md:gap-2 p-1 md:p-1.5 rounded-[40px] w-full
        backdrop-blur-xl transition-all duration-300
        ${isFolded ? 'bg-[#141923]/40 border-white/5 opacity-60' : 'bg-[#141923]/80 border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)]'}
        ${isActive ? 'ring-1 ring-amber-500/50 shadow-[0_10px_40px_rgba(245,158,11,0.2)]' : ''}
        ${isHero && !isFolded ? 'border-amber-500/30 bg-[#1a150f]/80' : ''}
      `}
    >
      {children}
    </div>
  );
});
SeatPanel.displayName = 'SeatPanel';
export default SeatPanel;
