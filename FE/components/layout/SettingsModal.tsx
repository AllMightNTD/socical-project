"use client";
import { cn } from "@/lib/utils";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Hash,
  HelpCircle,
  Lock,
  LogOut,
  MapPin,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewChange?: (view: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  onViewChange,
}: SettingsModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const sections = [
    {
      title: "General",
      items: [
        { label: "Account Information", icon: User, color: "bg-blue-500" },
        { label: "Saved Address", icon: MapPin, color: "bg-orange-400" },
        { label: "Social Account", icon: Hash, color: "bg-orange-600" },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "My Cards", icon: CreditCard, color: "bg-pink-500" },
        { label: "Password", icon: Lock, color: "bg-blue-800" },
      ],
    },
    {
      title: "Other",
      items: [
        { label: "Notification", icon: Bell, color: "bg-orange-300" },
        { label: "Help", icon: HelpCircle, color: "bg-blue-600" },
        { label: "Logout", icon: LogOut, color: "bg-orange-600" },
      ],
    },
  ];

  return (
    <>
      {/* Invisible backdrop for click-away */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Fixed Dropdown Content */}
      <div className="fixed top-20 right-6 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="p-4">
          <h2 className="text-xl font-bold text-slate-800 mb-4 px-2">
            Settings
          </h2>

          <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 px-2">
                  {section.title}
                </h3>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (item.label === "Logout") {
                          onClose();
                          router.push("/login");
                        } else if (item.label === "Account Information" && onViewChange) {
                          onClose();
                          onViewChange("account");
                        }
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm",
                            item.color,
                          )}
                        >
                          <item.icon size={16} />
                        </div>
                        <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900">
                          {item.label}
                        </span>
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-slate-300 group-hover:text-slate-500 transition-colors"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
