// src/components/feed/Stories.tsx
"use client";
import { Plus } from "lucide-react";
import Image from "next/image"; // Import component Image tối ưu

export const Stories = () => {
  const stories = [
    {
      id: 1,
      name: "Bạn",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
      isMe: true,
    },
    {
      id: 2,
      name: "Minh Anh",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna",
    },
    {
      id: 3,
      name: "Lan Phương",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
    },
    {
      id: 4,
      name: "Thanh Tùng",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo",
    },
    {
      id: 5,
      name: "Hoàng Yến",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
    },
  ];

  return (
    <section
      aria-label="Tin mới từ cộng đồng"
      className="flex gap-6 overflow-x-auto pb-4 no-scrollbar bg-transparent px-2 py-4"
    >
      {stories.map((story) => (
        <article
          key={story.id}
          className="flex flex-col items-center gap-3 min-w-[80px] group cursor-pointer"
        >
          {/* Ring Container */}
          <div
            className={`relative p-[3px] rounded-[26px] transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 ${
              story.isMe
                ? "bg-[#BEEFFF] border border-dashed border-[#00C2FF]/30"
                : "bg-gradient-to-tr from-[#00C2FF] to-[#00FFD1] shadow-lg shadow-[#00C2FF]/20"
            }`}
          >
            {/* White Border Gap & Optimized Image */}
            <div className="bg-white p-[2px] rounded-[23px] relative overflow-hidden">
              <div className="w-16 h-16 relative rounded-[21px] overflow-hidden bg-[#F4FDFF]">
                <Image
                  src={story.avatar}
                  alt={`Story của ${story.name}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Plus Button for "Me" Story */}
            {story.isMe && (
              <button
                aria-label="Thêm tin mới của bạn"
                className="absolute -bottom-1 -right-1 bg-[#00FFD1] text-[#102A43] rounded-full p-1.5 border-4 border-white shadow-md shadow-[#00FFD1]/40 group-hover:scale-110 transition-transform"
              >
                <Plus size={14} strokeWidth={4} />
              </button>
            )}
          </div>

          {/* Story Name - Use black font for SEO emphasis */}
          <span
            className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
              story.isMe
                ? "text-[#00C2FF]"
                : "text-[#102A43]/50 group-hover:text-[#00C2FF]"
            }`}
          >
            {story.name}
          </span>
        </article>
      ))}
    </section>
  );
};
