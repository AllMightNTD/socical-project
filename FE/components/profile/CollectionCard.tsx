// src/components/profile/CollectionCard.tsx
"use client";
import { FolderHeart, Layers } from "lucide-react";
import Link from "next/link";

interface CollectionCardProps {
  name: string;
  count: number;
  slug?: string; // Thêm slug để tối ưu đường dẫn SEO
}

export const CollectionCard = ({
  name,
  count,
  slug = "tat-ca",
}: CollectionCardProps) => {
  return (
    <Link
      href={`/profile/collections/${slug}`}
      className="group block outline-none"
      aria-label={`Xem bộ sưu tập ${name} với ${count} bài viết`}
    >
      <article className="relative">
        {/* Decorative Stack Layers - Tạo hiệu ứng xếp chồng đặc trưng của Collection */}
        <div className="absolute inset-0 bg-[#00FFD1]/20 rounded-[2.5rem] translate-y-2 scale-[0.9] -z-10 group-hover:translate-y-3 transition-transform duration-500" />

        {/* Main Container */}
        <div className="aspect-[4/3] bg-gradient-to-br from-[#F4FDFF] to-white rounded-[2.5rem] border-2 border-dashed border-[#BEEFFF] flex flex-col items-center justify-center gap-3 group-hover:border-[#00C2FF] group-hover:bg-white transition-all duration-300 shadow-sm group-hover:shadow-[0_20px_40px_rgba(0,194,255,0.1)] relative overflow-hidden">
          {/* Subtle Pattern Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity">
            <Layers
              size={100}
              className="absolute -right-5 -bottom-5 rotate-12"
            />
          </div>

          {/* Icon Box: Ocean Primary #00C2FF */}
          <div className="p-4 bg-white rounded-[1.5rem] shadow-[0_8px_25px_rgba(0,194,255,0.12)] text-[#00C2FF] group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-[#F4FDFF]">
            <FolderHeart size={32} strokeWidth={2.5} />
          </div>
        </div>

        {/* Collection Info - Semantic Footer */}
        <footer className="mt-6 text-center">
          <h4 className="font-black text-[15px] text-[#102A43] group-hover:text-[#00C2FF] transition-colors tracking-tight">
            {name}
          </h4>
          <div className="flex justify-center mt-2">
            <span className="text-[9px] font-black text-[#00C2FF] border border-[#00C2FF]/20 uppercase tracking-[0.2em] py-1.5 px-3 rounded-xl bg-white shadow-sm group-hover:bg-[#00FFD1] group-hover:text-[#102A43] group-hover:border-[#00FFD1] transition-all">
              {count} bài viết
            </span>
          </div>
        </footer>
      </article>
    </Link>
  );
};
