// src/app/(main)/layout.tsx
"use client";
import Navbar from "@/components/layout/NavBar";
import { TrendingCard } from "@/components/layout/TrendingCard";
import { WhoToFollow } from "@/components/layout/WhoToFollow";
import MenuLink from "@/components/MenuLink";
import { ChatBubble } from "@/components/messaging/ChatBubble";
import { CreateArticleModal } from "@/components/modals/CreateArticleModal";
import { Bookmark, Home, Search, User } from "lucide-react";
import Image from "next/image"; // Next.js Image Component
import Link from "next/link";
import React, { useState } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    // Sử dụng CSS Variable font nếu đã định nghĩa ở RootLayout
    <div className="min-h-screen bg-[#F4FDFF] transition-colors duration-300">
      {/* 1. SEMANTIC HEADER */}
      <header role="banner" className="sticky top-0 z-40">
        <Navbar onOpenCreate={() => setIsModalOpen(true)} />
      </header>

      <div className="container mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pt-6 px-4">
        {/* 2. SEMANTIC ASIDE (Left) */}
        <aside
          className="hidden md:block md:col-span-3 sticky top-24 h-fit space-y-4"
          aria-label="Điều hướng chính"
        >
          <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_10px_30px_rgba(0,194,255,0.08)] border border-[#BEEFFF]">
            {/* Profile Link - Optimized for SEO */}
            <Link
              href="/profile/me"
              className="flex flex-col items-center group focus-visible:ring-2 focus-visible:ring-[#00C2FF] rounded-2xl outline-none"
              title="Xem trang cá nhân của bạn"
            >
              <div className="relative w-20 h-20 rounded-[2rem] p-1 bg-[#00C2FF] shadow-md shadow-[#00C2FF]/20 group-hover:scale-105 transition-transform overflow-hidden">
                <Image
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                  fill
                  sizes="80px"
                  className="rounded-[1.8rem] bg-white object-cover p-1"
                  alt="Avatar người dùng Hoàng Long"
                  priority // Ưu tiên load ảnh này vì nằm ở khu vực trên cùng (Above the fold)
                />
              </div>
              <h3 className="mt-3 font-black text-[#102A43] text-lg">
                Hoàng Long ✨
              </h3>
              <p className="text-[10px] font-black text-[#00C2FF] uppercase tracking-[0.2em]">
                Học viên năng nổ
              </p>
            </Link>

            {/* Menu điều hướng - Semantic Nav */}
            <nav className="mt-8 space-y-2" aria-label="Menu cá nhân">
              <MenuLink icon={<Home size={20} />} label="Trang chủ" href="/" />
              <MenuLink
                href="/explore"
                icon={<Search size={20} />}
                label="Khám phá"
              />
              <MenuLink
                href="/bookmarks"
                icon={<Bookmark size={20} />}
                label="Bộ sưu tập"
              />
              <MenuLink
                href="/profile/me"
                icon={<User size={20} />}
                label="Cá nhân"
              />
            </nav>
          </div>
        </aside>

        {/* 3. SEMANTIC MAIN CONTENT */}
        <main
          id="main-content"
          className="col-span-1 md:col-span-6 pb-24 outline-none"
          role="main"
        >
          {children}
        </main>

        {/* 4. SEMANTIC ASIDE (Right) */}
        <aside
          className="hidden lg:block lg:col-span-3 sticky top-24 h-fit space-y-6"
          role="complementary"
          aria-label="Thông tin bổ trợ"
        >
          <section aria-label="Xu hướng">
            <TrendingCard />
          </section>

          <section aria-label="Gợi ý kết nối">
            <WhoToFollow />
          </section>

          <footer className="px-6 text-[10px] font-black text-[#102A43]/30 uppercase tracking-[0.15em] leading-loose">
            <p>© 2026 Knowledge Block</p>
            <nav className="flex gap-2 flex-wrap mt-1">
              <Link href="/privacy" className="hover:text-[#00C2FF]">
                Quyền riêng tư
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-[#00C2FF]">
                Điều khoản
              </Link>
            </nav>
          </footer>
        </aside>
      </div>

      {/* Overlays */}
      <ChatBubble />
      {isModalOpen && (
        <CreateArticleModal onClose={() => setIsModalOpen(false)} />
      )}

      {/* 5. MOBILE BOTTOM NAV - SEMANTIC NAV */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-[#BEEFFF] px-8 py-3 flex justify-between items-center z-50"
        aria-label="Điều hướng di động"
      >
        <Link href="/" aria-label="Trang chủ">
          <Home className="text-[#00C2FF]" size={24} />
        </Link>
        <Link href="/explore" aria-label="Khám phá">
          <Search className="text-[#102A43]/40" size={24} />
        </Link>

        {/* Floating Action Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          aria-label="Tạo bài viết mới"
          className="w-14 h-14 bg-gradient-to-tr from-[#00C2FF] to-[#00FFD1] rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-[#00C2FF]/30 -mt-10 border-4 border-[#F4FDFF] transition-all active:scale-90"
        >
          <PlusSquare size={28} />
        </button>

        <Link href="/bookmarks" aria-label="Bộ sưu tập">
          <Bookmark className="text-[#102A43]/40" size={24} />
        </Link>
        <Link href="/profile/me" aria-label="Trang cá nhân">
          <User className="text-[#102A43]/40" size={24} />
        </Link>
      </nav>
    </div>
  );
}

// Icon SVG Component - Standardized
const PlusSquare = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);
