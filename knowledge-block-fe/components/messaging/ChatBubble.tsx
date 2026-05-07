// src/components/messaging/ChatBubble.tsx
"use client";
import { MessageCircle, Sparkles } from "lucide-react";
import Image from "next/image"; // Tối ưu hóa ảnh Next.js
import Link from "next/link";

export const ChatBubble = () => {
  return (
    <aside
      className="fixed bottom-24 right-8 z-40 flex flex-col items-end gap-4 md:bottom-8"
      aria-label="Hộp thư nhanh"
    >
      {/* Cửa sổ chat nhỏ - Semantic Section */}
      <section
        className="w-76 bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,194,255,0.2)] border border-[#BEEFFF] overflow-hidden hidden md:block animate-in slide-in-from-bottom-5 duration-500"
        role="complementary"
      >
        {/* Header - Ocean Primary */}
        <header className="bg-[#00C2FF] p-5 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 bg-[#00FFD1] rounded-full animate-pulse shadow-[0_0_8px_#00FFD1]"
              aria-hidden="true"
            />
            <h3 className="font-black text-sm tracking-tight">Trò chuyện</h3>
          </div>
          <Sparkles size={16} className="text-[#00FFD1]" aria-hidden="true" />
        </header>

        {/* Danh sách chat - Semantic List */}
        <div
          className="p-3 space-y-1 bg-white max-h-[300px] overflow-y-auto no-scrollbar"
          role="list"
        >
          <ChatItem
            name="Thanh Tùng"
            lastMsg="Dự án chạy tốt chứ?"
            time="2m"
            online
          />
          <ChatItem
            name="Nhóm học tập"
            lastMsg="Mọi người ơi, đã check..."
            time="1h"
          />
        </div>

        {/* Footer link - Sử dụng Link để SEO tốt hơn nút bấm */}
        <Link
          href="/messages"
          className="block w-full py-4 bg-[#F4FDFF] text-center text-[10px] font-black text-[#00C2FF] uppercase tracking-[0.2em] hover:bg-[#00C2FF]/10 transition-colors border-t border-[#BEEFFF]/30"
        >
          Mở toàn bộ hộp thư
        </Link>
      </section>

      {/* Nút FAB chính - Call to Action */}
      <button
        aria-label="Mở cửa sổ trò chuyện"
        className="w-16 h-16 bg-gradient-to-tr from-[#00C2FF] to-[#00FFD1] rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-[#00C2FF]/30 hover:scale-110 hover:rotate-3 active:scale-95 transition-all duration-300 group outline-none focus-visible:ring-4 focus-visible:ring-[#00FFD1]"
      >
        <MessageCircle
          size={30}
          fill="white"
          className="group-hover:animate-bounce transition-transform"
        />
      </button>
    </aside>
  );
};

const ChatItem = ({ name, lastMsg, time, online }: any) => (
  <div
    role="listitem"
    className="flex items-center gap-3 p-3 hover:bg-[#F4FDFF] rounded-[1.8rem] cursor-pointer transition-all group"
  >
    <div className="relative shrink-0">
      <div className="w-12 h-12 relative rounded-2xl overflow-hidden bg-gray-50 border border-[#BEEFFF] group-hover:border-[#00C2FF]/30 transition-all">
        <Image
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
          alt={`Avatar của ${name}`}
          fill
          sizes="48px"
          className="object-cover"
        />
      </div>
      {online && (
        <div
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#00FFD1] border-2 border-white rounded-full shadow-sm"
          title="Đang hoạt động"
        />
      )}
    </div>
    <div className="flex-1 overflow-hidden">
      <h4 className="text-[13px] font-black text-[#102A43] truncate">{name}</h4>
      <p className="text-[11px] font-medium text-[#102A43]/50 truncate group-hover:text-[#102A43] transition-colors">
        {lastMsg}
      </p>
    </div>
    <div className="flex flex-col items-end gap-1 shrink-0">
      <span className="text-[9px] font-black text-[#00C2FF] bg-[#F4FDFF] px-1.5 py-0.5 rounded-md">
        {time}
      </span>
      {online && (
        <div className="w-1.5 h-1.5 bg-[#00FFD1] rounded-full animate-pulse" />
      )}
    </div>
  </div>
);
