// src/app/layout.tsx
import { Quicksand } from "next/font/google"; // Chọn font Quicksand
import "./globals.css";

// Cấu hình font chữ nhí nhảnh, năng động
const quicksand = Quicksand({
  subsets: ["vietnamese"],
  display: "swap", // SEO cực tốt vì giúp text hiển thị ngay lập tức
});

import { SocketProvider } from "@/components/providers/SocketProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={quicksand.className}>
      <body>
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
