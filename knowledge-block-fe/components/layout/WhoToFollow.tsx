// src/components/layout/WhoToFollow.tsx
"use client";
import { UserPlus } from "lucide-react";
import Image from "next/image"; // Next.js Image Optimization
import Link from "next/link";

export const WhoToFollow = () => {
  const users = [
    {
      id: "tech-master",
      name: "Tech Master",
      bio: "Fullstack Dev",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tech",
    },
    {
      id: "creative-ui",
      name: "Creative UI",
      bio: "Product Designer",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Design",
    },
    {
      id: "code-warrior",
      name: "Code Warrior",
      bio: "Backend Expert",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Code",
    },
  ];

  return (
    <section
      aria-labelledby="who-to-follow-title"
      className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-[#BEEFFF] shadow-[0_10px_40px_rgba(0,194,255,0.05)]"
    >
      <h3
        id="who-to-follow-title"
        className="font-black text-lg text-[#102A43] mb-5 flex items-center justify-between"
      >
        Gợi ý theo dõi
        <UserPlus size={18} className="text-[#00C2FF]" aria-hidden="true" />
      </h3>

      <div className="space-y-5">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between group"
          >
            <Link
              href={`/profile/${user.id}`}
              className="flex items-center gap-3 outline-none group"
              aria-label={`Xem hồ sơ của ${user.name}`}
            >
              <div className="relative shrink-0">
                <div className="w-11 h-11 relative rounded-[1.2rem] overflow-hidden bg-[#F4FDFF] border border-[#BEEFFF] group-hover:scale-105 transition-transform duration-300">
                  <Image
                    src={user.avatar}
                    alt={`Avatar của ${user.name}`}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
                {/* Online Status Indicator */}
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#00FFD1] border-2 border-white rounded-full shadow-sm"
                  title="Đang trực tuyến"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-[#102A43] leading-none group-hover:text-[#00C2FF] transition-colors">
                  {user.name}
                </span>
                <span className="text-[10px] font-bold text-[#102A43]/40 mt-1 uppercase tracking-tight">
                  {user.bio}
                </span>
              </div>
            </Link>

            <button
              aria-label={`Theo dõi ${user.name}`}
              className="bg-[#00C2FF] hover:bg-[#00AEEF] text-white px-4 py-2 rounded-xl text-[11px] font-black shadow-lg shadow-[#00C2FF]/10 transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-[#00FFD1]"
            >
              Theo dõi
            </button>
          </div>
        ))}
      </div>

      <Link
        href="/explore/people"
        className="block w-full mt-6 py-3 text-center text-[11px] font-black text-[#00C2FF]/70 hover:text-[#00C2FF] transition-all bg-[#F4FDFF]/50 rounded-2xl hover:bg-[#F4FDFF] border border-transparent hover:border-[#BEEFFF] uppercase tracking-[0.1em]"
      >
        Xem thêm người quen
      </Link>
    </section>
  );
};
