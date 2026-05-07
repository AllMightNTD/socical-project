// src/components/layout/NotificationCenter.tsx
"use client";
import { cn } from "@/lib/utils";
import { Heart, MessageCircle, Sparkles, UserPlus } from "lucide-react";
import Image from "next/image"; // Next.js Image Optimization
import Link from "next/link";

export const NotificationCenter = () => {
  const notifications = [
    {
      id: 1,
      type: "reaction",
      actor: "Minh Anh",
      content: "đã thích bài viết của bạn",
      time: "2 phút trước",
      dateTime: "2026-05-07T10:43:00", // ISO string cho SEO
      icon: <Heart size={14} className="text-white" fill="white" />,
      color: "bg-[#00C2FF]",
    },
    {
      id: 2,
      type: "follow",
      actor: "Thanh Tùng",
      content: "đã bắt đầu theo dõi bạn",
      time: "1 giờ trước",
      dateTime: "2026-05-07T09:45:00",
      icon: <UserPlus size={14} className="text-white" />,
      color: "bg-[#00FFD1]",
    },
    {
      id: 3,
      type: "comment",
      actor: "Lan Phương",
      content: 'đã bình luận: "Kiến thức hay quá!"',
      time: "3 giờ trước",
      dateTime: "2026-05-07T07:45:00",
      icon: <MessageCircle size={14} className="text-white" />,
      color: "bg-blue-400",
    },
  ];

  return (
    <aside
      aria-label="Trung tâm thông báo"
      className="absolute right-0 mt-2 w-85 bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,194,255,0.18)] border border-[#BEEFFF] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      {/* Header - Semantic Header */}
      <header className="p-5 border-b border-[#F4FDFF] bg-gradient-to-r from-white to-[#F4FDFF] flex justify-between items-center">
        <h3 className="font-black text-[#102A43] text-lg flex items-center gap-2">
          Thông báo{" "}
          <Sparkles size={18} className="text-[#00C2FF]" aria-hidden="true" />
        </h3>
        <span
          role="status"
          className="text-[10px] bg-[#00C2FF] text-white px-3 py-1 rounded-full font-black shadow-lg shadow-[#00C2FF]/20 tracking-widest"
        >
          3 MỚI
        </span>
      </header>

      {/* List Area */}
      <div
        className="max-h-[450px] overflow-y-auto no-scrollbar"
        role="log"
        aria-live="polite"
      >
        {notifications.map((n) => (
          <div
            key={n.id}
            className="p-5 hover:bg-[#F4FDFF] transition-all cursor-pointer flex gap-4 items-start border-b border-[#F4FDFF] last:border-0 group relative"
          >
            {/* Avatar with Next.js Image */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-[#00C2FF]/20 transition-all relative shadow-sm">
                <Image
                  src={`https://i.pravatar.cc/150?u=${n.id}`}
                  alt={`Ảnh của ${n.actor}`}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              {/* Type Icon Badge */}
              <div
                className={cn(
                  "absolute -bottom-1 -right-1 p-1.5 rounded-[10px] border-2 border-white shadow-md transition-transform group-hover:scale-110",
                  n.color,
                )}
                aria-hidden="true"
              >
                {n.icon}
              </div>
            </div>

            {/* Notification Content */}
            <div className="flex flex-col space-y-1">
              <p className="text-[14px] text-[#102A43] leading-[1.4]">
                <span className="font-black hover:text-[#00C2FF] transition-colors">
                  {n.actor}
                </span>{" "}
                <span className="text-[#102A43]/70 font-medium">
                  {n.content}
                </span>
              </p>
              <time
                dateTime={n.dateTime}
                className="text-[10px] font-black text-[#00C2FF] uppercase tracking-[0.1em]"
              >
                {n.time}
              </time>
            </div>

            {/* Unread Dot (Visual only) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#00C2FF] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      {/* Footer Button - Optimized as Link or Semantic Button */}
      <Link
        href="/notifications"
        className="block w-full p-5 text-center text-[12px] font-black text-[#102A43]/40 hover:text-[#00C2FF] hover:bg-[#F4FDFF] transition-all bg-white border-t border-[#F4FDFF] uppercase tracking-[0.2em]"
      >
        Xem toàn bộ thông báo
      </Link>
    </aside>
  );
};
