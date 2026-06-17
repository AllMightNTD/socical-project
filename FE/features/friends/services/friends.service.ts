import httpClient from "@/core/api/http-client";
import { FriendRelation, FriendRequest } from "../types/friends.types";

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const FriendsService = {
  async getFriends(page = 1, limit = 20): Promise<PaginatedResult<FriendRelation>> {
    const response = await httpClient.get("/api/v1/friend/list", {
      params: { page, limit },
    });
    return response.data;
  },

  async getPendingRequests(page = 1, limit = 20): Promise<PaginatedResult<FriendRequest>> {
    const response = await httpClient.get("/api/v1/friend/requests/incoming", {
      params: { page, limit },
    });
    return response.data;
  },

  async getSentRequests(page = 1, limit = 20): Promise<PaginatedResult<FriendRequest>> {
    const response = await httpClient.get("/api/v1/friend/requests/outgoing", {
      params: { page, limit },
    });
    return response.data;
  },

  async countPendingRequests(): Promise<number> {
    const response = await httpClient.get("/api/v1/friend/requests/count");
    return response.data?.count || 0;
  },

  async sendFriendRequest(receiverId: string): Promise<{ message: string; data: FriendRequest }> {
    const response = await httpClient.post("/api/v1/friend/request", {
      receiver_id: receiverId,
    });
    return response.data;
  },

  async acceptFriendRequest(requestId: string): Promise<{ message: string }> {
    const response = await httpClient.put(`/api/v1/friend/request/${requestId}/accept`);
    return response.data;
  },

  async declineFriendRequest(requestId: string): Promise<{ message: string }> {
    const response = await httpClient.put(`/api/v1/friend/request/${requestId}/decline`);
    return response.data;
  },

  async cancelFriendRequest(requestId: string): Promise<{ message: string }> {
    const response = await httpClient.delete(`/api/v1/friend/request/${requestId}/cancel`);
    return response.data;
  },

  async unfriend(friendId: string): Promise<{ message: string }> {
    const response = await httpClient.delete(`/api/v1/friend/${friendId}`);
    return response.data;
  },

  async getFriendSuggestions(page = 1, limit = 10): Promise<PaginatedResult<any>> {
    const response = await httpClient.get("/api/v1/friend/suggestions", {
      params: { page, limit },
    });
    return response.data;
  },
};
