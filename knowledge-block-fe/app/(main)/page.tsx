// src/app/(main)/page.tsx
"use client";

import { useEffect, useState } from "react";

const NAMES = [
  "Hoàng Long",
  "Thanh Tùng",
  "Minh Quân",
  "Quốc Bảo",
  "Hải Nam",
  "Gia Huy",
  "Phương Linh",
  "Ngọc Anh",
  "Khánh Vy",
  "Tuấn Anh",
];

const CONTENTS = [
  "Vừa hoàn thành tối ưu infinite scroll cho social feed 🚀",
  "Hệ thống websocket realtime hoạt động cực kỳ ổn định.",
  "Next.js 15 + Tailwind CSS thực sự rất mạnh.",
  "Docker multi-stage build giúp image nhẹ hơn nhiều.",
  "Đang nghiên cứu kiến trúc Fanout Feed.",
  "UI mới đã hỗ trợ dark mode hoàn chỉnh 🌙",
  "Redis cache giúp tốc độ load feed tăng mạnh.",
  "Đang thử nghiệm upload ảnh bằng S3.",
];

const IMAGES = [
  "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1000&auto=format&fit=crop",
];

const TIMES = [
  "1 phút trước",
  "5 phút trước",
  "12 phút trước",
  "1 giờ trước",
  "Hôm qua",
];

const randomItem = <T,>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

const randomCount = (min: number, max: number) => {
  return (Math.random() * (max - min) + min).toFixed(1) + "k";
};

const generateMockPosts = () => {
  return Array.from({ length: 100 }, (_, index) => {
    const randomName = randomItem(NAMES);

    return {
      id: String(index + 1),

      author_name: randomName,

      author_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomName}${index}`,

      content: randomItem(CONTENTS),

      image: randomItem(IMAGES),

      reactionCount: randomCount(0.1, 9.9),

      commentCount: Math.floor(Math.random() * 500).toString(),

      published_at: randomItem(TIMES),
    };
  });
};

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // chặn hydration mismatch
  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-2">
      123123
      {/* <Stories />
12312
      <CreatePostMini />

      <div className="flex flex-col">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <div className="py-10 text-center text-sm font-medium text-gray-400">
        Đang tải thêm nội dung...
      </div> */}
    </div>
  );
}
