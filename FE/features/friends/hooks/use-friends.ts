import { useState, useEffect, useCallback } from "react";
import { FriendsService, PaginatedResult } from "../services/friends.service";
import { FriendRelation } from "../types/friends.types";

export function useFriends() {
  const [friends, setFriends] = useState<FriendRelation[]>([]);
  const [meta, setMeta] = useState<PaginatedResult<FriendRelation>["meta"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFriends = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true);
    try {
      const result = await FriendsService.getFriends(page, limit);
      setFriends(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error("Lỗi khi tải danh sách bạn bè:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unfriend = async (friendId: string) => {
    try {
      await FriendsService.unfriend(friendId);
      // Update local state
      setFriends((prev) => prev.filter((f) => f.friend_id !== friendId));
      if (meta) {
        setMeta({
          ...meta,
          total: Math.max(0, meta.total - 1),
        });
      }
      return { success: true };
    } catch (error) {
      console.error("Lỗi khi hủy kết bạn:", error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  return {
    friends,
    meta,
    isLoading,
    fetchFriends,
    unfriend,
  };
}
