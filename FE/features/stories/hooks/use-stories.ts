import { useState, useEffect, useCallback } from "react";
import { StoriesService } from "../services/stories.service";
import { StoryFeedItem } from "../types/stories.types";

export function useStories() {
  const [feedItems, setFeedItems] = useState<StoryFeedItem[]>([]);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [activeUserIndex, setActiveUserIndex] = useState<number | null>(null);
  const [preselectedMusicSong, setPreselectedMusicSong] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await StoriesService.getStoryFeed();
      setFeedItems(data);
    } catch (error) {
      console.error("Lỗi khi tải feed story:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return {
    feedItems,
    isCreatorOpen,
    setIsCreatorOpen,
    activeUserIndex,
    setActiveUserIndex,
    preselectedMusicSong,
    setPreselectedMusicSong,
    fetchFeed,
    isLoading,
  };
}
