"use client";
import { currentUser } from "@/lib/mockData";
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
import { useState } from "react";
import { cn } from "../../lib/utils";

interface NavbarProps {
  onMenuToggle: () => void;
  onBellClick: () => void;
  onSettingsClick: () => void;
  isNotificationsActive: boolean;
}

export default function Navbar({
  onMenuToggle,
  onBellClick,
  onSettingsClick,
  isNotificationsActive,
}: NavbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  const tabs = [
    { id: "home", icon: Home },
    { id: "zap", icon: Zap },
    { id: "video", icon: Video },
    { id: "profile", icon: User },
    { id: "mail", icon: Mail },
  ];

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
        <div className="flex items-center gap-1.5">
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
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
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
            "relative w-9 h-9 rounded-xl flex items-center justify-center transition-all",
            isNotificationsActive
              ? "bg-blue-50 text-blue-500"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          )}
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all">
          <MessageCircle size={18} />
        </button>
        <button
          onClick={onSettingsClick}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
        >
          <Settings size={18} />
        </button>
        <img
          src={currentUser.avatar}
          alt="Me"
          className="w-8 h-8 rounded-full object-cover cursor-pointer ring-2 ring-blue-100 hover:ring-blue-300 transition-all"
        />
      </div>
    </header>
  );
}
