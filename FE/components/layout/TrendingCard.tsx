// src/components/layout/TrendingCard.tsx
"use client";
import { Flame } from "lucide-react";
import Link from "next/link";

export const TrendingCard = () => {
  // Cập nhật các tag mẫu cho hợp thời đại 2026
  const trends = [
    { name: "#OceanUI", slug: "ocean-ui" },
    { name: "#AI_Block", slug: "ai-block" },
    { name: "#NextJS16", slug: "nextjs-16" },
    { name: "#Web3Tech", slug: "web3-tech" },
    { name: "#KnowledgeFlow", slug: "knowledge-flow" },
  ];

  return (
    <section
      aria-labelledby="trending-title"
      className="bg-white rounded-[2.5rem] p-6 shadow-[0_10px_30px_rgba(0,194,255,0.05)] border border-[#BEEFFF]"
    >
      {/* Header - Semantic Title */}
      <h3
        id="trending-title"
        className="font-black text-lg text-[#102A43] mb-5 flex items-center gap-2"
      >
        Xu hướng{" "}
        <Flame
          size={20}
          className="text-[#00C2FF] animate-pulse"
          aria-hidden="true"
        />
      </h3>

      {/* Tags List - Using nav for SEO navigation signals */}
      <nav aria-label="Các chủ đề đang hot" className="flex flex-wrap gap-2">
        {trends.map((tag) => (
          <Link
            key={tag.slug}
            href={`/explore?tag=${tag.slug}`}
            className="px-4 py-2 bg-[#F4FDFF] text-[#00C2FF] rounded-full text-[11px] font-black border border-[#BEEFFF] cursor-pointer hover:bg-[#00C2FF] hover:text-white hover:border-[#00C2FF] hover:scale-105 active:scale-95 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#00FFD1]"
          >
            {tag.name}
          </Link>
        ))}
      </nav>

      {/* Action Link - Semantic Footer */}
      <footer className="mt-5 border-t border-[#F4FDFF]">
        <Link
          href="/explore"
          className="block w-full pt-4 text-center text-[11px] font-black text-[#00C2FF] uppercase tracking-[0.2em] hover:text-[#00AEEF] transition-colors outline-none focus-visible:underline"
        >
          Xem tất cả chủ đề
        </Link>
      </footer>
    </section>
  );
};
