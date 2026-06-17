export interface StoryReaction {
  id: string;
  user_id: string;
  type: string;
  emoji: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    username?: string;
  };
}

export interface Story {
  id: string;
  user_id: string;
  page_id?: string | null;
  type: "photo" | "video" | "text" | "boomerang";
  media_url?: string;
  thumbnail_url?: string;
  text_content?: string;
  background_color?: string;
  duration_seconds: number;
  audience: "public" | "friends" | "custom";
  view_count: number;
  created_at: string;
  hasViewed?: boolean;
  reactions?: StoryReaction[];
}

export interface StoryFeedItem {
  user: {
    id: string;
    email?: string;
    full_name: string;
    avatar_url: string | null;
    username: string;
  };
  stories: Story[];
  hasUnviewed: boolean;
}

export interface StoryViewer {
  viewed_at: string;
  viewer: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    username: string;
  };
}

export interface ZingMp3Song {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number;
}

export interface ZingMp3LyricLine {
  time: number;
  text: string;
}
