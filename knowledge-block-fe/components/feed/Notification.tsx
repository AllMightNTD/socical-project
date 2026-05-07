"use client";
import React from "react";
import { notifications } from "@/lib/mockData";
import { MoreHorizontal, Search, Settings, MailOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Notifications() {
  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Notification</h1>
          <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg">23</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
            <Search size={18} />
          </button>
          <button className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
            <MailOpen size={18} />
          </button>
          <button className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Notification Groups */}
      {notifications.map((group) => (
        <div key={group.day} className="space-y-4">
          <p className="text-sm font-bold text-slate-400 px-1">{group.day}</p>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
            {group.items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer group",
                  item.unread ? "bg-green-50/30" : ""
                )}
              >
                {/* Avatar with Overlay Icon */}
                <div className="relative flex-shrink-0">
                  <img
                    src={item.user.avatar}
                    alt={item.user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <span className={cn(
                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white",
                    item.color
                  )}>
                    {item.type === 'post' ? '💬' : '🔔'}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm text-slate-600 leading-snug">
                    <span className="font-bold text-slate-900 mr-1.5">{item.user.name}</span>
                    {item.action}
                    <span className="font-bold text-slate-900 mx-1.5">{item.target}</span>:
                    <span className="text-slate-400 ml-1.5 line-clamp-1 italic">"{item.content}"</span>
                  </p>
                  <p className="text-xs font-semibold text-slate-400 mt-1.5">{item.time}</p>
                </div>

                {/* More Action */}
                <button className="text-slate-300 hover:text-slate-600 pt-1">
                  <MoreHorizontal size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
