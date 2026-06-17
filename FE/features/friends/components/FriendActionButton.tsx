"use client";

import React, { useState } from "react";
import { UserPlus, UserMinus, UserCheck, X, Check, Loader2 } from "lucide-react";
import { useRelationship } from "../hooks/use-relationship";
import { cn } from "@/lib/utils";

interface FriendActionButtonProps {
  targetUserId: string;
  currentUserId?: string;
  className?: string;
  onStatusChange?: (status: string) => void;
}

export function FriendActionButton({
  targetUserId,
  currentUserId,
  className,
  onStatusChange,
}: FriendActionButtonProps) {
  const {
    status,
    isLoading,
    addFriend,
    accept,
    decline,
    cancel,
    removeFriend,
  } = useRelationship(targetUserId, currentUserId);

  const [isHovered, setIsHovered] = useState(false);

  const handleAction = async (actionFn: () => Promise<{ success: boolean }>) => {
    const res = await actionFn();
    if (res.success && onStatusChange) {
      onStatusChange(status);
    }
  };

  if (status === "IS_ME") {
    return null; // Don't show friend actions to yourself
  }

  if (isLoading) {
    return (
      <button
        disabled
        className={cn(
          "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-500",
          className
        )}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Đang tải...
      </button>
    );
  }

  switch (status) {
    case "FRIENDS":
      return (
        <button
          onClick={() => {
            if (confirm("Bạn có chắc chắn muốn hủy kết bạn với người dùng này?")) {
              handleAction(removeFriend);
            }
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border",
            isHovered
              ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
              : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-zinc-850 dark:text-zinc-200 dark:border-zinc-700",
            className
          )}
        >
          {isHovered ? (
            <>
              <UserMinus className="w-4 h-4" />
              Hủy kết bạn
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4" />
              Bạn bè
            </>
          )}
        </button>
      );

    case "REQUEST_SENT":
      return (
        <button
          onClick={() => handleAction(cancel)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border",
            isHovered
              ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
              : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
            className
          )}
        >
          {isHovered ? (
            <>
              <X className="w-4 h-4" />
              Hủy yêu cầu
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4 animate-pulse" />
              Đã gửi yêu cầu
            </>
          )}
        </button>
      );

    case "REQUEST_RECEIVED":
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAction(accept)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600",
              className
            )}
          >
            <Check className="w-4 h-4" />
            Chấp nhận
          </button>
          <button
            onClick={() => handleAction(decline)}
            className="inline-flex items-center justify-center p-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );

    case "NOT_FRIEND":
    default:
      return (
        <button
          onClick={() => handleAction(addFriend)}
          className={cn(
            "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600 shadow-sm",
            className
          )}
        >
          <UserPlus className="w-4 h-4" />
          Thêm bạn bè
        </button>
      );
  }
}
