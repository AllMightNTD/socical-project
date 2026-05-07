// src/app/(main)/page.tsx
"use client";

import { CreatePostMini } from "@/components/feed/CreatePostMini";
import PostCard from "@/components/feed/PostCard";
import { Stories } from "@/components/feed/Stories";

// Dữ liệu giả lập (Mock data) dựa trên Schema ARTICLES & ARTICLE_VERSIONS
const MOCK_POSTS = [
  {
    id: "1",
    author_name: "Hoàng Long",
    author_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    content:
      "Chào mừng các bạn đến với Knowledge Block! Hệ thống đang được xây dựng dựa trên Next.js 15 và cấu trúc Database 33 bảng cực kỳ chặt chẽ. Mọi người thấy giao diện mới này thế nào? 🚀",
    image:
      "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=1000&auto=format&fit=crop",
    reactionCount: "2.4k",
    commentCount: "182",
    published_at: "12 phút trước",
  },
  {
    id: "2",
    author_name: "Thanh Tùng",
    author_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tung",
    content:
      "Vừa tối ưu xong logic Fanout Feed cho dự án. Cảm giác scroll 60fps trên mobile cực kỳ đã tay. Anh em nhớ check phần responsive nhé!",
    image:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop",
    reactionCount: "1.1k",
    commentCount: "45",
    published_at: "1 giờ trước",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-2">
      {/* 1. Thanh Stories (Instagram Style) */}
      <Stories />

      {/* 2. Ô nhập bài viết nhanh (Facebook Style) */}
      <CreatePostMini />

      {/* 3. Danh sách bài viết (Infinite Feed) */}
      <div className="flex flex-col">
        {MOCK_POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Loading indicator khi scroll (Lazy Loading) */}
      <div className="py-10 text-center text-sm text-gray-400 font-medium">
        Đang tải thêm nội dung...
      </div>
    </div>
  );
}
