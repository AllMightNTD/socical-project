import { StoriesService } from "@/features/stories/services/stories.service";
export * from "@/features/stories/types/stories.types";

export const getStoryFeed = StoriesService.getStoryFeed;
export const createStory = StoriesService.createStory;
export const getStoryArchive = StoriesService.getStoryArchive;
export const uploadStoryFile = StoriesService.uploadStoryFile;
export const viewStory = StoriesService.viewStory;
export const getStoryViewers = StoriesService.getStoryViewers;
export const deleteStory = StoriesService.deleteStory;
export const reactStory = StoriesService.reactStory;
export const searchZingMp3 = StoriesService.searchZingMp3;
export const getZingMp3SongStream = StoriesService.getZingMp3SongStream;
export const getZingMp3SongLyrics = StoriesService.getZingMp3SongLyrics;
