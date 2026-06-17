import httpClient from "@/core/api/http-client";
import { Story, StoryFeedItem, StoryReaction, StoryViewer, ZingMp3Song, ZingMp3LyricLine } from "../types/stories.types";

export const StoriesService = {
  async getStoryFeed(): Promise<StoryFeedItem[]> {
    const response = await httpClient.get("/api/v1/stories/feed");
    return response.data || [];
  },

  async createStory(data: {
    type: "photo" | "video" | "text" | "boomerang";
    media_url?: string;
    text_content?: string;
    background_color?: string;
    duration_seconds?: number;
    audience?: "public" | "friends" | "custom";
  }): Promise<Story> {
    const response = await httpClient.post("/api/v1/stories", data);
    return response.data;
  },

  async getStoryArchive(): Promise<Story[]> {
    const response = await httpClient.get("/api/v1/stories/archive");
    return response.data || [];
  },

  async uploadStoryFile(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ file_url: string; type: "image" | "video" }> {
    const formData = new FormData();
    formData.append("files", file);
    const response = await httpClient.post("/api/v1/stories/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  },

  async viewStory(storyId: string): Promise<{ success: boolean }> {
    const response = await httpClient.post(`/api/v1/stories/${storyId}/view`);
    return response.data;
  },

  async getStoryViewers(storyId: string): Promise<StoryViewer[]> {
    const response = await httpClient.get(`/api/v1/stories/${storyId}/viewers`);
    return response.data || [];
  },

  async deleteStory(storyId: string): Promise<{ success: boolean }> {
    const response = await httpClient.delete(`/api/v1/stories/${storyId}`);
    return response.data;
  },

  async reactStory(storyId: string, emoji: string): Promise<StoryReaction[]> {
    const response = await httpClient.post(`/api/v1/stories/${storyId}/react`, { emoji });
    return response.data || [];
  },

  async searchZingMp3(query: string): Promise<ZingMp3Song[]> {
    const response = await httpClient.get("/api/v1/stories/zingmp3/search", {
      params: { q: query },
    });
    return response.data || [];
  },

  async getZingMp3SongStream(songId: string): Promise<{ streamUrl: string | null }> {
    const response = await httpClient.get(`/api/v1/stories/zingmp3/song/${songId}`);
    return response.data;
  },

  async getZingMp3SongLyrics(songId: string): Promise<ZingMp3LyricLine[]> {
    const response = await httpClient.get(`/api/v1/stories/zingmp3/lyrics/${songId}`);
    return response.data || [];
  },
};
