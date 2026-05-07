// src/components/layout/NavBar.tsx
"use client";
import { Bell, Mail, PlusSquare, Search } from "lucide-react";
import Image from "next/image"; // Next.js Image Optimization
import Link from "next/link";
import { ReactNode } from "react";

// Reusable NavIcon component - Optimized for Accessibility
interface NavIconProps {
  icon: ReactNode;
  badge?: number;
  label: string;
}

const NavIcon = ({ icon, badge, label }: NavIconProps) => {
  return (
    <button
      aria-label={`${label}${badge ? ` (${badge} mới)` : ""}`}
      className="relative group outline-none"
    >
      <div className="h-11 w-11 flex items-center justify-center rounded-2xl border-2 border-transparent text-[#102A43] hover:text-[#00C2FF] hover:bg-[#00C2FF]/5 transition-all bg-white group-active:scale-90 group-focus-visible:ring-2 group-focus-visible:ring-[#00C2FF]">
        {icon}
      </div>
      {badge ? (
        <span className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-[#00FFD1] text-[#102A43] text-[9px] w-5 h-5 font-black border-2 border-white shadow-sm pointer-events-none">
          {badge}
        </span>
      ) : null}
    </button>
  );
};

interface NavbarProps {
  onOpenCreate?: () => void;
}

const Navbar = ({ onOpenCreate }: NavbarProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#BEEFFF] bg-white/80 backdrop-blur-md">
      <nav className="container mx-auto flex h-18 items-center justify-between px-4 gap-4 py-3">
        {/* Logo Section */}
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 group outline-none"
          aria-label="Về trang chủ KnowledgeBlock"
        >
          <div className="h-11 w-11 rounded-[1.2rem] bg-[#00C2FF] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-[#00C2FF]/30 transition-all group-hover:scale-105 group-hover:rotate-3">
            K
          </div>
          <span className="hidden font-black sm:inline-block text-xl tracking-tighter text-[#102A43]">
            Knowledge<span className="text-[#00C2FF]">Block</span>
          </span>
        </Link>

        {/* Search Bar - Wrapped in Form for SEO crawling */}
        <form
          action="/search"
          role="search"
          className="hidden md:flex relative flex-1 max-w-md items-center group"
        >
          <label htmlFor="navbar-search" className="sr-only">
            Tìm kiếm kiến thức
          </label>
          <Search className="absolute left-4 h-4 w-4 text-[#102A43]/40 group-focus-within:text-[#00C2FF] transition-colors" />
          <input
            id="navbar-search"
            type="search"
            name="q"
            placeholder="Tìm kiếm kiến thức..."
            className="h-11 w-full rounded-2xl bg-[#00C2FF]/5 pl-11 pr-4 text-sm text-[#102A43] outline-none border-2 border-transparent focus:border-[#BEEFFF] focus:bg-white transition-all placeholder:text-[#102A43]/30 shadow-inner"
          />
        </form>

        {/* Actions Section */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Nút Đăng bài */}
          <button
            onClick={onOpenCreate}
            aria-label="Đăng bài viết mới"
            className="hidden sm:flex items-center gap-2 bg-[#00C2FF] text-white px-6 py-2.5 rounded-2xl text-sm font-black shadow-lg shadow-[#00C2FF]/25 hover:bg-[#00AEEF] hover:-translate-y-0.5 transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-[#00FFD1]"
          >
            <PlusSquare size={18} strokeWidth={2.5} />
            <span>Đăng bài</span>
          </button>

          <div className="flex items-center gap-1">
            <NavIcon icon={<Mail size={22} />} badge={3} label="Tin nhắn" />
            <NavIcon icon={<Bell size={22} />} badge={5} label="Thông báo" />

            {/* Optimized Profile Image */}
            <Link
              href="/profile/me"
              aria-label="Xem hồ sơ cá nhân"
              className="h-11 w-11 ml-2 rounded-2xl border-2 border-[#BEEFFF] p-1 cursor-pointer hover:border-[#00C2FF] transition-all overflow-hidden bg-white shadow-sm active:scale-90 outline-none focus-visible:ring-2 focus-visible:ring-[#00C2FF] relative"
            >
              <Image
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                alt="Ảnh đại diện người dùng"
                fill
                sizes="44px"
                className="rounded-[12px] object-cover p-0.5"
                priority
              />
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
