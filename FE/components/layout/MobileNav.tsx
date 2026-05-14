// src/components/layout/MobileNav.tsx
"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Bell, Home, PlusCircle, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MobileNav = () => {
  const pathname = usePathname();

  const tabs = [
    { name: "Trang chủ", icon: Home, path: "/" },
    { name: "Khám phá", icon: Search, path: "/explore" },
    { name: "Tạo bài", icon: PlusCircle, path: "/create", primary: true },
    { name: "Thông báo", icon: Bell, path: "/notifications", badge: 12 },
    { name: "Cá nhân", icon: User, path: "/profile/me" },
  ];

  return (
    <nav
      aria-label="Điều hướng di động"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
    >
      {/* Hiệu ứng bóng mờ phía trên để tách biệt với Feed */}
      <div className="h-8 bg-gradient-to-t from-[#F4FDFF] to-transparent pointer-events-none" />

      {/* Thanh điều hướng chính: Glassmorphism Ocean Style */}
      <div className="bg-white/90 backdrop-blur-xl border-t border-[#BEEFFF] flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] h-20 shadow-[0_-10px_30px_rgba(0,194,255,0.05)]">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.path}
              href={tab.path}
              aria-current={isActive ? "page" : undefined}
              aria-label={tab.name}
              className="relative flex flex-col items-center justify-center w-full h-full group outline-none"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "flex flex-col items-center gap-1.5 transition-all duration-300",
                  isActive ? "text-[#00C2FF]" : "text-[#102A43]/40",
                  tab.primary &&
                    "text-white bg-gradient-to-tr from-[#00C2FF] to-[#00FFD1] p-4 rounded-[1.5rem] -mt-12 shadow-xl shadow-[#00C2FF]/30 border-4 border-[#F4FDFF]",
                )}
              >
                <div className="relative">
                  <Icon
                    size={tab.primary ? 30 : 24}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={cn(isActive && !tab.primary && "animate-pulse")}
                  />

                  {/* Badge thông báo */}
                  {!tab.primary && tab.badge && (
                    <span
                      className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#00FFD1] text-[9px] font-black text-[#102A43] border-2 border-white"
                      aria-label={`${tab.badge} thông báo mới`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>

                {/* Nhãn văn bản - Chỉ hiện cho các tab không phải primary */}
                {!tab.primary && (
                  <span
                    className={cn(
                      "text-[10px] uppercase tracking-tighter font-black transition-all",
                      isActive ? "opacity-100" : "opacity-60",
                    )}
                  >
                    {tab.name}
                  </span>
                )}
              </motion.div>

              {/* Indicator mượt mà dưới chân icon đang active */}
              {isActive && !tab.primary && (
                <motion.div
                  layoutId="activeTabMobile"
                  className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-[#00C2FF] shadow-[0_0_8px_#00C2FF]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
