"use client";
import { cn } from "@/lib/utils";
import { useLogout } from "@/hooks/useLogout";
import { AnimatePresence, motion } from "framer-motion";
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
import { useState } from "react";

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout, isLoggingOut } = useLogout();

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
        { label: "Logout", icon: LogOut, color: "bg-red-500" },
      ],
    },
  ];

  const handleItemClick = (label: string) => {
    if (label === "Logout") {
      setShowLogoutConfirm(true);
      return;
    }
    if (label === "Account Information" && onViewChange) {
      onClose();
      onViewChange("account");
    }
  };

  return (
    <>
      {/* Invisible backdrop for click-away (only when confirm dialog is NOT open) */}
      {!showLogoutConfirm && (
        <div className="fixed inset-0 z-40" onClick={onClose} />
      )}

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
                      onClick={() => handleItemClick(item.label)}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all group",
                        item.label === "Logout" && "hover:bg-red-50"
                      )}
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
                        <span
                          className={cn(
                            "text-sm font-semibold transition-colors",
                            item.label === "Logout"
                              ? "text-red-500 group-hover:text-red-600"
                              : "text-slate-600 group-hover:text-slate-900"
                          )}
                        >
                          {item.label}
                        </span>
                      </div>
                      <ChevronRight
                        size={14}
                        className={cn(
                          "transition-colors",
                          item.label === "Logout"
                            ? "text-red-200 group-hover:text-red-400"
                            : "text-slate-300 group-hover:text-slate-500"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logout Confirm Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              key="logout-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm"
              onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
            />

            {/* Dialog */}
            <motion.div
              key="logout-dialog"
              initial={{ opacity: 0, scale: 0.88, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 8 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="fixed inset-0 z-[61] flex items-center justify-center pointer-events-none"
            >
              <div className="bg-white rounded-2xl p-6 w-72 shadow-2xl pointer-events-auto">
                {/* Icon */}
                <div className="flex flex-col items-center gap-3 text-center mb-5">
                  <div className="w-14 h-14 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center">
                    <LogOut className="text-red-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Đăng xuất?</h3>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                      Bạn sẽ cần đăng nhập lại<br />để tiếp tục sử dụng.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    disabled={isLoggingOut}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Huỷ
                  </button>
                  <button
                    onClick={logout}
                    disabled={isLoggingOut}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-bold text-white transition-colors disabled:opacity-70 flex items-center justify-center gap-1.5"
                  >
                    {isLoggingOut ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <LogOut size={14} />
                        Đăng xuất
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
