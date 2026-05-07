// src/app/(main)/layout.tsx
"use client";
import CreatePost from "@/components/feed/CreatePost";
import FriendRequests from "@/components/feed/FriendRequest";
import Notifications from "@/components/feed/Notification";
import PostCard from "@/components/feed/PostCard";
import Stories from "@/components/feed/Stories";
import Account from "@/components/layout/Account";
import LeftSidebar from "@/components/layout/LeftSidebar";
import Navbar from "@/components/layout/NavBar";
import RightSidebar from "@/components/layout/RightSidebar";
import SettingsModal from "@/components/layout/SettingsModal";
import { posts } from "@/lib/mockData";
import React, { useState } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeNav, setActiveNav] = useState("newsfeed");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState("feed"); // "feed", "notifications", "account"
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleBellClick = () => {
    setActiveView(activeView === "notifications" ? "feed" : "notifications");
  };

  const handleNavChange = (id: string) => {
    setActiveNav(id);
    setActiveView("feed");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar
        onMenuToggle={() => setMobileMenuOpen(true)}
        onBellClick={handleBellClick}
        onSettingsClick={() => setIsSettingsOpen(true)}
        isNotificationsActive={activeView === "notifications"}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onViewChange={setActiveView}
      />

      <div className="flex pt-14 max-w-[1400px] mx-auto">
        {/* Left Sidebar */}
        <LeftSidebar
          activeNav={activeNav}
          onNavChange={handleNavChange}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        {/* Main content */}
        <main className="flex-1 flex gap-4 px-3 md:px-4 py-4 min-w-0">
          {/* Feed column */}
          <div className="flex-1 min-w-0 max-w-2xl mx-auto xl:mx-0 space-y-4">
            {activeView === "notifications" ? (
              <Notifications />
            ) : activeView === "account" ? (
              <Account onBack={() => setActiveView("feed")} />
            ) : (
              <>
                {/* Stories */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <Stories />
                </div>

                {/* Create Post */}
                <CreatePost />

                {/* Posts */}
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}

                {/* Load more */}
                <div className="flex justify-center py-4">
                  <button className="text-sm text-slate-400 hover:text-blue-500 font-medium transition-colors flex items-center gap-2 group">
                    <span className="w-4 h-0.5 bg-slate-200 group-hover:bg-blue-200 transition-colors rounded-full" />
                    Load more posts
                    <span className="w-4 h-0.5 bg-slate-200 group-hover:bg-blue-200 transition-colors rounded-full" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Friend Requests (center-right) */}
          {
            activeView !== "feed" && <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-20">
                <FriendRequests />
              </div>
            </aside>
          }
        </main>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>
    </div>
  );
}
