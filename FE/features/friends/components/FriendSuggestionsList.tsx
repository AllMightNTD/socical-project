"use client";

import React, { useEffect, useState } from "react";
import { useFriendSuggestions } from "../hooks/use-friend-suggestions";
import { UserPlus, UserMinus, Sparkles, Loader2, RefreshCw, MapPin } from "lucide-react";

export function FriendSuggestionsList() {
  const {
    suggestions,
    isLoading,
    fetchSuggestions,
    sendRequest,
    removeSuggestion,
  } = useFriendSuggestions();

  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAddFriend = async (id: string) => {
    setProcessingId(id);
    await sendRequest(id);
    setProcessingId(null);
  };

  const getSuggestionReason = (s: any) => {
    if (s.mutualFriendsCount && parseInt(s.mutualFriendsCount, 10) > 0) {
      return `${s.mutualFriendsCount} bạn chung`;
    }
    if (s.educationScore && parseFloat(s.educationScore) > 0) {
      return "Học cùng trường";
    }
    if (s.workScore && parseFloat(s.workScore) > 0) {
      return "Cùng nơi làm việc";
    }
    if (s.commonGroupsScore && parseFloat(s.commonGroupsScore) > 0) {
      return "Cùng nhóm cộng đồng";
    }
    if (s.cityScore && parseFloat(s.cityScore) > 0) {
      return `Sống tại ${s.locationCity || "cùng thành phố"}`;
    }
    if (s.indirectInteractionsScore && parseFloat(s.indirectInteractionsScore) > 0) {
      return "Thường tương tác cùng bài viết";
    }
    if (s.networkScore && parseFloat(s.networkScore) > 0) {
      return "Cùng mạng kết nối";
    }
    return "Gợi ý kết bạn";
  };

  useEffect(() => {
    fetchSuggestions(1, 8);
  }, [fetchSuggestions]);

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 mt-6">
      {/* Header section */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-50 dark:border-zinc-800 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl dark:bg-purple-950/30 dark:text-purple-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
              Những người bạn có thể biết
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Gợi ý dựa trên bạn chung, học tập, công việc và tương tác xã hội của bạn
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchSuggestions(1, 8)}
          disabled={isLoading}
          className="p-2 hover:bg-gray-50 text-gray-500 hover:text-gray-900 rounded-lg transition-colors border border-gray-155 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-400"
          title="Tải lại gợi ý"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Grid displays */}
      {isLoading && suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Đang tính toán điểm số kết nối...
          </p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-250 rounded-xl dark:border-zinc-800">
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-2">
            Không có gợi ý kết bạn mới nào vào lúc này.
          </p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            Hãy cập nhật thêm thông tin cá nhân của bạn để nhận thêm gợi ý kết nối!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {suggestions.map((user) => {
            const avatarUrl = user.avatarUrl || "/assets/images/default-avatar.png";
            const fullName = user.fullName || "Người dùng";
            const reason = getSuggestionReason(user);

            return (
              <div
                key={user.id}
                className="flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 dark:bg-zinc-900 dark:border-zinc-800 group relative"
              >
                {/* Dismiss button */}
                <button
                  onClick={() => removeSuggestion(user.id)}
                  className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors z-10"
                  title="Gỡ gợi ý"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                </button>

                {/* Avatar */}
                <div className="relative w-full aspect-square bg-gray-50 dark:bg-zinc-850 flex items-center justify-center overflow-hidden">
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/assets/images/default-avatar.png";
                    }}
                  />
                </div>

                {/* Info details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-zinc-100 line-clamp-1 group-hover:text-blue-600 transition-colors cursor-pointer mb-1">
                      {fullName}
                    </h3>
                    
                    {/* Connection Reason Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 mb-3 border border-purple-100/50 dark:border-purple-900/30">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                      <span>{reason}</span>
                    </div>

                    {user.locationCity && (
                      <div className="flex items-center gap-1 text-[11px] text-gray-450 dark:text-zinc-500 mb-4">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Sống tại {user.locationCity}</span>
                      </div>
                    )}
                  </div>

                  {/* Add friend button */}
                  <button
                    onClick={() => handleAddFriend(user.id)}
                    disabled={processingId === user.id}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-70 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    {processingId === user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    Thêm bạn bè
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
