export interface UserProfile {
  full_name?: string;
  username?: string;
  avatar_url?: string;
  cover_url?: string;
  bio?: string;
}

export interface UserPresence {
  status: "online" | "away" | "busy" | "offline";
  custom_status?: string;
  last_seen_at?: string;
  is_invisible?: boolean;
}

export interface UserSummary {
  id: string;
  email: string;
  phone?: string;
  status: string;
  profile?: UserProfile;
  presence?: UserPresence;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  message?: string;
  created_at: string;
  responded_at?: string;
  sender?: UserSummary;
  receiver?: UserSummary;
}

export interface FriendRelation {
  user_id: string;
  friend_id: string;
  list_type: "close_friends" | "acquaintances" | "restricted" | "none";
  created_at: string;
  friend_user?: UserSummary;
}
