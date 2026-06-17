import { useState, useEffect, useCallback } from "react";
import { FriendsService } from "../services/friends.service";
import { FriendRequest } from "../types/friends.types";

export function useFriendRequests() {
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isLoadingIncoming, setIsLoadingIncoming] = useState(false);
  const [isLoadingOutgoing, setIsLoadingOutgoing] = useState(false);

  const fetchPendingCount = useCallback(async () => {
    try {
      const count = await FriendsService.countPendingRequests();
      setPendingCount(count);
    } catch (error) {
      console.error("Lỗi khi đếm lời mời kết bạn:", error);
    }
  }, []);

  const fetchIncoming = useCallback(async (page = 1, limit = 20) => {
    setIsLoadingIncoming(true);
    try {
      const result = await FriendsService.getPendingRequests(page, limit);
      setIncomingRequests(result.data || []);
      // Sync pending count
      setPendingCount(result.meta.total);
    } catch (error) {
      console.error("Lỗi khi tải lời mời kết bạn:", error);
    } finally {
      setIsLoadingIncoming(false);
    }
  }, []);

  const fetchOutgoing = useCallback(async (page = 1, limit = 20) => {
    setIsLoadingOutgoing(true);
    try {
      const result = await FriendsService.getSentRequests(page, limit);
      setOutgoingRequests(result.data || []);
    } catch (error) {
      console.error("Lỗi khi tải lời mời đã gửi:", error);
    } finally {
      setIsLoadingOutgoing(false);
    }
  }, []);

  const acceptRequest = async (requestId: string) => {
    try {
      await FriendsService.acceptFriendRequest(requestId);
      // Update local state
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
      setPendingCount((prev) => Math.max(0, prev - 1));
      return { success: true };
    } catch (error) {
      console.error("Lỗi khi chấp nhận kết bạn:", error);
      return { success: false, error };
    }
  };

  const declineRequest = async (requestId: string) => {
    try {
      await FriendsService.declineFriendRequest(requestId);
      // Update local state
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
      setPendingCount((prev) => Math.max(0, prev - 1));
      return { success: true };
    } catch (error) {
      console.error("Lỗi khi từ chối kết bạn:", error);
      return { success: false, error };
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      await FriendsService.cancelFriendRequest(requestId);
      // Update local state
      setOutgoingRequests((prev) => prev.filter((r) => r.id !== requestId));
      return { success: true };
    } catch (error) {
      console.error("Lỗi khi hủy lời mời kết bạn:", error);
      return { success: false, error };
    }
  };

  // Fetch count on mount
  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  return {
    incomingRequests,
    outgoingRequests,
    pendingCount,
    isLoadingIncoming,
    isLoadingOutgoing,
    fetchIncoming,
    fetchOutgoing,
    fetchPendingCount,
    acceptRequest,
    declineRequest,
    cancelRequest,
  };
}
