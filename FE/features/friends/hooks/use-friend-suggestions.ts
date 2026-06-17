import { useState, useEffect, useCallback } from "react";
import { FriendsService, PaginatedResult } from "../services/friends.service";

export function useFriendSuggestions() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [meta, setMeta] = useState<PaginatedResult<any>["meta"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = useCallback(async (page = 1, limit = 10) => {
    setIsLoading(true);
    try {
      const result = await FriendsService.getFriendSuggestions(page, limit);
      setSuggestions(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error("Lỗi khi tải gợi ý kết bạn:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendRequest = async (receiverId: string) => {
    try {
      await FriendsService.sendFriendRequest(receiverId);
      // Remove from suggestions locally with a smooth transition
      setSuggestions((prev) => prev.filter((s) => s.id !== receiverId));
      if (meta) {
        setMeta({
          ...meta,
          total: Math.max(0, meta.total - 1),
        });
      }
      return { success: true };
    } catch (error) {
      console.error("Lỗi khi gửi lời mời kết bạn:", error);
      return { success: false, error };
    }
  };

  const removeSuggestion = (userId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== userId));
  };

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return {
    suggestions,
    meta,
    isLoading,
    fetchSuggestions,
    sendRequest,
    removeSuggestion,
  };
}
