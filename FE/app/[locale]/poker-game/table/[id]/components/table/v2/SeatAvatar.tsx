import React from 'react';

interface SeatAvatarProps {
  avatarUrl: string;
  isFolded: boolean;
  isActive: boolean;
  isHero: boolean;
  sizeClass: string;
}

const SeatAvatar: React.FC<SeatAvatarProps> = React.memo(({ avatarUrl, isFolded, isActive, isHero, sizeClass }) => {
  return (
    <div className={`relative rounded-full p-[2px] z-20 transition-all duration-300 ${isActive ? 'bg-gradient-to-b from-amber-300 to-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105' : isHero ? 'bg-gradient-to-b from-amber-500/50 to-slate-700' : 'bg-slate-700 border border-white/5'}`}>
      <div className={`${sizeClass} rounded-full overflow-hidden bg-slate-900 flex items-center justify-center`}>
        <img 
          src={avatarUrl} 
          alt="Avatar" 
          className={`w-full h-full object-cover transition-all duration-300 ${isFolded ? 'grayscale opacity-40' : ''}`}
        />
      </div>
    </div>
  );
});
SeatAvatar.displayName = 'SeatAvatar';
export default SeatAvatar;
