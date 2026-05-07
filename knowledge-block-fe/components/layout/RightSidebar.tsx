"use client";
import { contacts, groups, pages } from "@/lib/mockData";
import { cn } from "../../lib/utils";

function Avatar({
  src,
  alt,
  fallback,
  color = "bg-slate-400",
  size = "md",
}: {
  src?: string;
  alt?: string;
  fallback?: string;
  color?: string;
  size?: "sm" | "md";
}) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-9 h-9 text-xs";
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("rounded-full object-cover flex-shrink-0", sz)}
      />
    );
  }
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-bold flex-shrink-0",
        sz,
        color,
      )}
    >
      {fallback}
    </div>
  );
}

function StatusDot({ online, away }: { online?: boolean; away?: boolean }) {
  if (!online && !away) return null;
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white",
        away ? "bg-yellow-400" : "bg-green-400",
      )}
    />
  );
}

export default function RightSidebar() {
  return (
    <aside className="hidden xl:flex flex-col w-64 flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] pt-4 pb-6 overflow-y-auto">
      {/* Contacts */}
      <div className="px-4 mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Contacts
        </p>
        <div className="space-y-0.5">
          {contacts.map((c) => (
            <button
              key={c.id}
              className="w-full flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Avatar src={c.avatar} alt={c.name} />
                  <StatusDot online={c.online} away={c.away} />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  {c.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {c.unread ? (
                  <span className="bg-blue-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {c.unread}
                  </span>
                ) : c.time ? (
                  <span className="text-xs text-slate-400">{c.time}</span>
                ) : c.online ? (
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-4 border-t border-slate-100 my-2" />

      {/* Groups */}
      <div className="px-4 mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Groups
        </p>
        <div className="space-y-0.5">
          {groups.map((g) => (
            <button
              key={g.id}
              className="w-full flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0",
                      g.color,
                    )}
                  >
                    {g.avatar}
                  </div>
                  <StatusDot online={g.online} away={g.away} />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  {g.name}
                </span>
              </div>
              <div>
                {g.time ? (
                  <span className="text-xs text-slate-400">{g.time}</span>
                ) : g.online ? (
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      g.away ? "bg-yellow-400" : "bg-green-400",
                    )}
                  />
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-4 border-t border-slate-100 my-2" />

      {/* Pages */}
      <div className="px-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Pages
        </p>
        <div className="space-y-0.5">
          {pages.map((p) => (
            <button
              key={p.id}
              className="w-full flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0",
                      p.color,
                    )}
                  >
                    {p.avatar}
                  </div>
                  <StatusDot online={p.online} />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  {p.name}
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-400" />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
