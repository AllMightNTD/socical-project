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
import PersonalPage from "@/components/profile/PersonalPage";
import api from "@/lib/axios";
import { posts } from "@/lib/mockData";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [activeNav, setActiveNav] = useState("newsfeed");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState("feed"); // "feed", "notifications", "account", "profile"
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        // Gọi getMe endpoint
        const res = await api.get('/api/v1/user/me');
        setCurrentUser(res.data?.metadata || res.data);
      } catch (error) {
        Cookies.remove('accessToken');
        router.push('/login');
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchMe();
  }, [router]);

  const handleBellClick = () => {
    setActiveView(activeView === "notifications" ? "feed" : "notifications");
  };

  const handleNavChange = (id: string) => {
    setActiveNav(id);
    if (id === "profile") {
      setProfileUser(null); // default to current user if clicked from sidebar
      setActiveView("profile");
    } else {
      setActiveView("feed");
    }
  };

  const handleProfileClick = (user: any) => {
    setProfileUser(user);
    setActiveView("profile");
  };

  console.log("activeView", activeView);

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-500 font-medium">Đang tải dữ liệu người dùng...</p>
        </div>
      </div>
    );
  }

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
          {activeView === "profile" ? (
            <div className="flex-1 min-w-0 mx-auto xl:mx-0 space-y-4">
              <PersonalPage user={profileUser} />
            </div>
          ) : (
            <>
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
                      <PostCard key={post.id} post={post} onProfileClick={() => handleProfileClick(post.user)} />
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
              {activeView == "feed" && (
                <aside className="hidden lg:block w-72 flex-shrink-0">
                  <div className="sticky top-20">
                    <FriendRequests />
                  </div>
                </aside>
              )}
            </>
          )}
        </main>

        {/* Right Sidebar */}
        <RightSidebar currentUser={currentUser} />
      </div>
    </div>
  );
}
