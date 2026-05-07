// src/components/layout/MenuLink.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface MenuLinkProps {
  icon: ReactNode;
  label: string;
  href: string;
}

const MenuLink = ({ icon, label, href }: MenuLinkProps) => {
  const pathname = usePathname();
  // Kiểm tra active chính xác cho Next.js
  const active = pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      prefetch={active ? undefined : false} // Chỉ prefetch các trang quan trọng
      className={`
        flex items-center gap-4 p-3.5 rounded-2xl
        transition-all duration-300 group
        ${
          active
            ? "bg-[#F4FDFF] text-[#00C2FF] shadow-sm shadow-[#00C2FF]/5"
            : "text-[#102A43]/50 hover:bg-[#F4FDFF]/50 hover:text-[#00C2FF]"
        }
      `}
    >
      <div
        className={`
          transition-all duration-300
          ${active ? "scale-110 rotate-3" : "group-hover:scale-110"}
        `}
      >
        {/* Render icon với stroke dày hơn một chút để trông nhí nhảnh */}
        {icon}
      </div>

      <span
        className={`
        text-sm tracking-tight transition-colors
        ${active ? "font-black" : "font-bold"}
      `}
      >
        {label}
      </span>

      {/* Chỉ báo Active nhỏ ở phía bên phải (tùy chọn) */}
      {active && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00FFD1] shadow-[0_0_8px_#00FFD1]" />
      )}
    </Link>
  );
};

export default MenuLink;
