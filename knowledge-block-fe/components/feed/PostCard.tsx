// src/components/feed/PostCard.tsx
"use client";
import { motion } from "framer-motion";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2,
} from "lucide-react";
import Image from "next/image"; // Next.js Image Optimization

export default function PostCard({ post }: { post: any }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="bg-white rounded-[2.5rem] border border-[#BEEFFF] shadow-[0_10px_40px_rgba(0,194,255,0.06)] overflow-hidden mb-6 transition-all"
    >
      {/* Header: Semantic Grouping */}
      <header className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group">
          {/* Avatar Container */}
          <div className="relative p-[2.5px] rounded-[1.4rem] bg-gradient-to-tr from-[#00C2FF] to-[#00FFD1] shadow-sm group-hover:rotate-6 transition-transform">
            <div className="relative w-10 h-10 bg-white rounded-[1.3rem] overflow-hidden border-[2px] border-white">
              <Image
                src={post.author_avatar}
                alt={`Ảnh đại diện của ${post.author_name}`}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
          </div>
          <div>
            <h4 className="font-black text-sm tracking-tight text-[#102A43] group-hover:text-[#00C2FF] transition-colors">
              {post.author_name}
            </h4>
            <time
              className="text-[10px] text-[#00C2FF] uppercase font-black tracking-widest block"
              dateTime="2024-01-01" // Trong thực tế, hãy truyền giá trị post.created_at vào đây
            >
              12 phút trước • <span className="text-[#00FFD1]">Đang nổi</span>
            </time>
          </div>
        </div>
        <button
          aria-label="Tùy chọn bài viết"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 hover:bg-[#F4FDFF] hover:text-[#00C2FF] transition-all"
        >
          <MoreHorizontal size={20} />
        </button>
      </header>

      {/* Content Section */}
      <div className="px-6 pb-4">
        <p className="text-[15px] leading-relaxed text-[#102A43] font-medium">
          {post.content}
        </p>
      </div>

      {/* Main Image Section: Optimized */}
      {post.image && (
        <div className="px-4 pb-2">
          <div className="relative rounded-[2rem] overflow-hidden aspect-video bg-[#F4FDFF] border border-[#BEEFFF]/50 shadow-inner">
            <Image
              src={post.image}
              alt={`Hình ảnh minh họa cho bài viết: ${post.content.substring(0, 50)}...`}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* Interaction Footer: Accessibility Improved */}
      <footer className="p-5 pt-2 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button
            aria-label="Yêu thích bài viết"
            className="group flex items-center gap-2 text-[#102A43]/40 hover:text-[#00C2FF] transition-all"
          >
            <div className="p-2 rounded-xl group-hover:bg-[#00C2FF]/10 transition-all">
              <Heart
                size={22}
                className="group-active:scale-125 transition-transform group-hover:fill-[#00C2FF]/20"
              />
            </div>
            <span className="text-xs font-black">2.4k</span>
          </button>

          <button
            aria-label="Bình luận bài viết"
            className="group flex items-center gap-2 text-[#102A43]/40 hover:text-[#00FFD1] transition-all"
          >
            <div className="p-2 rounded-xl group-hover:bg-[#00FFD1]/10 transition-all">
              <MessageCircle size={22} />
            </div>
            <span className="text-xs font-black">182</span>
          </button>

          <button
            aria-label="Chia sẻ bài viết"
            className="p-2 rounded-xl text-[#102A43]/40 hover:bg-[#F4FDFF] hover:text-[#00C2FF] transition-all"
          >
            <Share2 size={20} />
          </button>
        </div>

        <button
          aria-label="Lưu vào bộ sưu tập"
          className="p-2 rounded-xl text-[#102A43]/40 hover:bg-[#F4FDFF] hover:text-yellow-400 transition-all"
        >
          <Bookmark size={22} className="group-active:fill-yellow-400" />
        </button>
      </footer>
    </motion.article>
  );
}
