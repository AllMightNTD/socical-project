"use client";

import { useMiniChat } from "@/components/chat/MiniChatContext";
import MessagesPopup from "@/components/chat/MessagesPopup";
import { useSocket } from "@/components/providers/SocketProvider";
import api from "@/lib/axios";
import Link from "next/link";
import {
  Bell,
  Home,
  Mail,
  Menu,
  MessageCircle,
  Search,
  Settings,
  User,
  Video,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface NavbarProps {
  onMenuToggle: () => void;
  onBellClick: () => void;
  onSettingsClick: () => void;
  isNotificationsActive: boolean;
  currentUser?: any;
}

export default function Navbar({
  onMenuToggle,
  onBellClick,
  onSettingsClick,
  isNotificationsActive,
  currentUser: currentUserProp,
}: NavbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  const [localUser, setLocalUser] = useState<any>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const { socket } = useSocket();

  // Fetch local user if not provided in props
  useEffect(() => {
    if (!currentUserProp) {
      api.get("/api/v1/user/me")
        .then((res) => {
          setLocalUser(res.data?.metadata || res.data);
        })
        .catch((err) => console.error("Navbar failed to fetch user:", err));
    }
  }, [currentUserProp]);

  const resolvedUser = currentUserProp || localUser;

  // Fetch initial unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get("/api/v1/chat/conversations", {
          params: { page: 1, limit: 100 }
        });
        const list = res.data?.data || [];
        const unread = list.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);
        setTotalUnread(unread);
      } catch (err) {
        console.error("Failed to fetch initial unread count:", err);
      }
    };
    fetchUnreadCount();
  }, []);

  // Socket listener for new messages & seen events to update unread badge in Navbar
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      if (msg.sender_id !== resolvedUser?.id) {
        setTotalUnread((prev) => prev + 1);
      }
    };

    const handleMessageSeen = () => {
      // Fetch latest unread count when message is seen
      api.get("/api/v1/chat/conversations", {
        params: { page: 1, limit: 100 }
      }).then((res) => {
        const list = res.data?.data || [];
        const unread = list.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);
        setTotalUnread(unread);
      }).catch((err) => console.error(err));
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageSeen", handleMessageSeen);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageSeen", handleMessageSeen);
    };
  }, [socket, resolvedUser?.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (messagesRef.current && !messagesRef.current.contains(event.target as Node)) {
        setIsMessagesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tabs = [
    { id: "home", icon: Home },
    { id: "zap", icon: Zap },
    { id: "video", icon: Video },
    { id: "profile", icon: User },
    { id: "mail", icon: Mail },
  ];

  const handleHomePage = () => {
    window.location.href = "/";
  };

  const displayAvatar = resolvedUser?.profile?.avatar_url || resolvedUser?.avatar || "/avatar-default.png";
  const displayFullName = resolvedUser?.profile?.full_name || resolvedUser?.email || "User";

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-100 z-30 flex items-center px-4 gap-3 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          className="lg:hidden text-slate-500 mr-1"
          onClick={onMenuToggle}
        >
          <Menu size={20} />
        </button>
        <div onClick={handleHomePage} className="flex items-center gap-1.5 cursor-pointer">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white fill-white" />
          </div>
          <span className="font-extrabold text-slate-800 text-lg hidden sm:block">
            Sociala.
          </span>
        </div>
      </div>

      {/* Search */}
      <div
        className={cn(
          "flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2 transition-all duration-200 flex-1 max-w-xs",
          searchFocused ? "bg-white border border-blue-200 shadow-sm" : "",
        )}
      >
        <Search size={15} className="text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Start typing to search..."
          className="bg-transparent text-sm text-slate-600 placeholder:text-slate-400 outline-none w-full"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>

      {/* Center Tabs */}
      <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
        {tabs.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer",
              activeTab === id
                ? "bg-blue-50 text-blue-500"
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600",
            )}
          >
            <Icon size={20} />
          </button>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
        <button
          onClick={onBellClick}
          className={cn(
            "relative w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
            isNotificationsActive
              ? "bg-blue-50 text-blue-500"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          )}
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        
        {/* Messages Dropdown Popup Trigger */}
        <div className="relative" ref={messagesRef}>
          <button
            onClick={() => setIsMessagesOpen(!isMessagesOpen)}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all relative cursor-pointer",
              isMessagesOpen ? "bg-blue-50 text-blue-500" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            )}
          >
            <MessageCircle size={18} />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </button>

          {isMessagesOpen && (
            <MessagesPopup
              onClose={() => setIsMessagesOpen(false)}
              currentUser={resolvedUser}
            />
          )}
        </div>

        <button
          onClick={onSettingsClick}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer"
        >
          <Settings size={18} />
        </button>
        <img
          src={displayAvatar}
          alt={displayFullName}
          className="w-8 h-8 rounded-full object-cover cursor-pointer ring-2 ring-blue-100 hover:ring-blue-300 transition-all"
        />
      </div>
    </header>
  );
}
