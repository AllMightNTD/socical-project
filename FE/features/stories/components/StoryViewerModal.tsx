"use client";

import { useState, useEffect, useRef } from "react";
import { X, Play, Pause, ChevronLeft, ChevronRight, Eye, Trash2, Heart, MessageSquare, Music, Disc, Volume2 } from "lucide-react";
import { viewStory, deleteStory, getStoryViewers, StoryFeedItem, StoryViewer as StoryViewerType, reactStory, StoryReaction, getZingMp3SongStream, getZingMp3SongLyrics } from "@/lib/story-api";
import { useSocket } from "@/components/providers/SocketProvider";
import { cn } from "@/lib/utils";
import { MUSIC_LIBRARY } from "@/lib/music-data";

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedItems: StoryFeedItem[];
  initialUserIndex: number;
  currentUser: any;
  onRefresh: () => void;
  onReuseMusic?: (song: any) => void;
}

interface FlyingEmoji {
  id: string;
  emoji: string;
  left: number;
  scale: number;
}

const REACTION_EMOJIS = ["👍", "❤️", "😮", "😢", "😡", "🔥", "🎉"];

function parseStoryMetadata(textContent?: string) {
  if (!textContent) return null;
  const trimmed = textContent.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export default function StoryViewerModal({
  isOpen,
  onClose,
  feedItems,
  initialUserIndex,
  currentUser,
  onRefresh,
  onReuseMusic,
}: StoryViewerModalProps) {
  const { socket } = useSocket();
  
  // Quản lý vị trí user đang xem và index story của user đó
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [viewers, setViewers] = useState<StoryViewerType[]>([]);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [flyingEmojis, setFlyingEmojis] = useState<FlyingEmoji[]>([]);

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const isHoldingRef = useRef<boolean>(false);

  const [isSongPlaying, setIsSongPlaying] = useState(false);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [followedArtists, setFollowedArtists] = useState<string[]>([]);
  const [currentLyrics, setCurrentLyrics] = useState<any[]>([]);
  const viewerAudioRef = useRef<HTMLAudioElement | null>(null);

  const [storyReactions, setStoryReactions] = useState<StoryReaction[]>([]);

  const activeUserFeed = feedItems[currentUserIndex];
  const activeStory = activeUserFeed?.stories[currentStoryIndex];
  const isOwner = currentUser?.id === activeUserFeed?.user?.id;

  useEffect(() => {
    if (activeStory) {
      setStoryReactions(activeStory.reactions || []);
    } else {
      setStoryReactions([]);
    }
  }, [activeStory?.id]);

  // 1. Join Room & Listen Realtime Socket Reactions
  useEffect(() => {
    if (!isOpen || !activeUserFeed || !socket) return;

    const roomId = activeUserFeed.user.id;
    socket.emit("joinStoryRoom", { storyOwnerId: roomId });
    console.log(`Joined story room for user ${roomId}`);

    const handleNewReaction = (data: { storyId: string; emoji: string; userId?: string; userName?: string; avatarUrl?: string }) => {
      // Chỉ kích hoạt hiệu ứng bay nếu đang xem đúng story đó
      if (data.storyId === activeStory?.id) {
        triggerFlyingEmoji(data.emoji);

        // Cập nhật danh sách reaction realtime
        setStoryReactions((prev) => {
          const existingIdx = prev.findIndex((r) => r.user_id === data.userId);
          const newReaction: StoryReaction = {
            id: Math.random().toString(),
            user_id: data.userId || "temp",
            emoji: data.emoji,
            type: "story",
            user: {
              id: data.userId || "temp",
              full_name: data.userName || "Người dùng",
              avatar_url: data.avatarUrl || null,
            },
          };

          if (existingIdx > -1) {
            const updated = [...prev];
            updated[existingIdx] = newReaction;
            return updated;
          } else {
            return [...prev, newReaction];
          }
        });
      }
    };

    socket.on("newStoryReaction", handleNewReaction);

    return () => {
      socket.emit("leaveStoryRoom", { storyOwnerId: roomId });
      socket.off("newStoryReaction", handleNewReaction);
      console.log(`Left story room for user ${roomId}`);
    };
  }, [isOpen, currentUserIndex, activeStory?.id, socket]);

  // 2. Tự động đánh dấu đã xem Story & Lấy danh sách người xem nếu là chủ nhân
  useEffect(() => {
    if (!isOpen || !activeStory) return;

    // Gọi API view
    if (!activeStory.hasViewed && !isOwner) {
      viewStory(activeStory.id)
        .then(() => onRefresh())
        .catch(console.error);
    }

    // Nếu là chủ sở hữu, fetch danh sách người xem tin
    if (isOwner) {
      getStoryViewers(activeStory.id)
        .then(setViewers)
        .catch(console.error);
    } else {
      setViewers([]);
    }

    setProgress(0);
  }, [isOpen, currentUserIndex, currentStoryIndex, activeStory?.id]);

  // 3. Quản lý Progress Bar tự động chạy
  useEffect(() => {
    if (!isOpen || !activeStory || isPaused || showViewersModal) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const duration = (activeStory.duration_seconds || 5) * 1000;
    const intervalTime = 100;
    const step = (intervalTime / duration) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(progressIntervalRef.current!);
          handleNextStory();
          return 100;
        }
        return p + step;
      });
    }, intervalTime);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isOpen, currentUserIndex, currentStoryIndex, isPaused, showViewersModal]);

  // Music Player logic
  useEffect(() => {
    if (viewerAudioRef.current) {
      viewerAudioRef.current.pause();
      viewerAudioRef.current = null;
    }
    setIsSongPlaying(false);
    setActiveLyricIndex(-1);
    setCurrentLyrics([]);

    if (!isOpen || !activeStory) return;

    let isCancelled = false;
    let audio: HTMLAudioElement | null = null;
    let currentCleanup = () => {};

    const loadAndPlayMusic = async () => {
      try {
        const metadata = parseStoryMetadata(activeStory.text_content);
        const music = metadata?.music;
        if (!music) return;

        // 1. Fetch fresh stream URL from proxy backend
        const streamData = await getZingMp3SongStream(music.songId);
        if (isCancelled) return;

        const freshAudioUrl = streamData?.streamUrl || music.audioUrl;
        if (!freshAudioUrl) return;

        // 2. Fetch lyrics dynamically from proxy backend
        const lyricsData = await getZingMp3SongLyrics(music.songId);
        if (isCancelled) return;

        setCurrentLyrics(lyricsData || []);

        // 3. Create audio element and play
        audio = new Audio(freshAudioUrl);
        audio.loop = true;
        audio.currentTime = music.startOffset || 0;
        viewerAudioRef.current = audio;

        audio.play()
          .then(() => {
            if (!isCancelled) setIsSongPlaying(true);
          })
          .catch((err) => {
            console.warn("Autoplay blocked by browser. User interaction required:", err);
            if (!isCancelled) setIsSongPlaying(false);
          });

        const handleTimeUpdate = () => {
          if (!audio) return;
          const elapsed = audio.currentTime - (music.startOffset || 0);

          if (elapsed >= (music.duration || 15)) {
            audio.currentTime = music.startOffset || 0;
          }

          if (lyricsData && lyricsData.length > 0) {
            const matchIndex = lyricsData.findIndex((lyric, idx) => {
              const nextLyric = lyricsData[idx + 1];
              return elapsed >= lyric.time && (!nextLyric || elapsed < nextLyric.time);
            });
            if (!isCancelled) setActiveLyricIndex(matchIndex);
          }
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);

        currentCleanup = () => {
          if (audio) {
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.pause();
          }
        };
      } catch (err) {
        console.error("Lỗi phát nhạc ZingMp3 trong StoryViewerModal:", err);
      }
    };

    loadAndPlayMusic();

    return () => {
      isCancelled = true;
      currentCleanup();
      if (viewerAudioRef.current) {
        viewerAudioRef.current.pause();
        viewerAudioRef.current = null;
      }
    };
  }, [isOpen, activeStory?.id]);

  useEffect(() => {
    if (!viewerAudioRef.current) return;
    if (isPaused) {
      viewerAudioRef.current.pause();
      setIsSongPlaying(false);
    } else {
      viewerAudioRef.current.play()
        .then(() => {
          setIsSongPlaying(true);
        })
        .catch((err) => {
          console.warn("Failed to resume playback on unpause:", err);
        });
    }
  }, [isPaused]);

  if (!isOpen || !activeUserFeed || !activeStory) return null;

  // Giải mã dữ liệu đè động của Giai đoạn 3 và Giai đoạn 2 (Tiện lợi dùng ở các phần tiếp theo)
  let parsedMetadata: {
    overlays: any[];
    filter: string;
    stickers: any[];
    drawings?: string;
    music?: any;
  } | null = null;
  let parsedOverlaysArray: any[] = [];
  let isJsonArray = false;
  let isJsonObject = false;

  const textContent = activeStory.text_content || "";
  if (textContent.trim().startsWith("{") && textContent.trim().endsWith("}")) {
    try {
      parsedMetadata = JSON.parse(textContent);
      isJsonObject = true;
    } catch (e) {
      console.error("Lỗi parse metadata JSON Giai đoạn 3:", e);
    }
  } else if (textContent.trim().startsWith("[") && textContent.trim().endsWith("]")) {
    try {
      parsedOverlaysArray = JSON.parse(textContent);
      isJsonArray = true;
    } catch (e) {
      console.error("Lỗi parse overlays JSON Giai đoạn 2:", e);
    }
  }

  const music = parsedMetadata?.music;
  const selectedSong = music ? {
    id: music.songId,
    title: music.title,
    artist: music.artist,
    coverUrl: music.coverUrl,
    audioUrl: music.audioUrl,
    lyrics: currentLyrics,
  } : null;

  // Thống kê cảm xúc
  const reactionCounts = storyReactions.reduce((acc, curr) => {
    acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Hiệu ứng tạo emoji bay ngẫu nhiên lên màn hình
  const triggerFlyingEmoji = (emoji: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newEmoji: FlyingEmoji = {
      id,
      emoji,
      left: Math.random() * 80 + 10, // Giới hạn từ 10% đến 90% chiều rộng khung
      scale: Math.random() * 0.6 + 0.8, // Phóng to ngẫu nhiên
    };
    setFlyingEmojis((prev) => [...prev, newEmoji]);
    
    // Tự động dọn dẹp sau khi bay xong
    setTimeout(() => {
      setFlyingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 2000);
  };

  const handleNextStory = () => {
    if (currentStoryIndex < activeUserFeed.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
    } else if (currentUserIndex < feedItems.length - 1) {
      setCurrentUserIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose(); // Hết feed thì đóng modal
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex((prev) => prev - 1);
      // Chuyển sang tin cuối cùng của user trước đó
      setCurrentStoryIndex(feedItems[currentUserIndex - 1].stories.length - 1);
    }
  };

  // Socket: Gửi emoji reaction thời gian thực
  const handleSendReaction = async (emoji: string) => {
    if (!socket) return;
    
    // Emit socket lên server phát sóng
    socket.emit("sendStoryReaction", {
      storyOwnerId: activeUserFeed.user.id,
      storyId: activeStory.id,
      emoji,
    });
    
    // Tự kích hoạt tại local máy mình trước
    triggerFlyingEmoji(emoji);

    try {
      const updatedReactions = await reactStory(activeStory.id, emoji);
      setStoryReactions(updatedReactions);
      onRefresh();
    } catch (err) {
      console.error("Lỗi khi lưu reaction vào DB:", err);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa tin này không?")) return;
    try {
      await deleteStory(activeStory.id);
      onRefresh();
      // Nếu là tin duy nhất của user đó, chuyển user hoặc đóng
      if (activeUserFeed.stories.length === 1) {
        onClose();
      } else {
        handleNextStory();
      }
    } catch (e) {
      alert("Xóa tin thất bại!");
    }
  };

  // Click đè để Pause (Hold to pause)
  const handleStartPress = () => {
    touchStartTimeRef.current = Date.now();
    isHoldingRef.current = true;
    setIsPaused(true);
  };

  const handleEndPress = () => {
    isHoldingRef.current = false;
    setIsPaused(false);
  };

  // Đổi url tĩnh nếu cần
  const getFullMediaUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
    return `${apiBase}${url}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-0 md:p-4 select-none">
      
      {/* Nút thoát ở góc ngoài */}
      <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all">
        <X className="w-6 h-6" />
      </button>

      {/* Điều hướng Trái/Phải của thiết bị lớn */}
      <div className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-10">
        <button
          onClick={handlePrevStory}
          disabled={currentUserIndex === 0 && currentStoryIndex === 0}
          className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      </div>

      <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-10">
        <button
          onClick={handleNextStory}
          className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white transition-all"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>

      {/* Vùng hiển thị Story trung tâm dạng điện thoại */}
      <div 
        className="w-full max-w-[400px] h-full md:h-[720px] bg-slate-950 md:rounded-3xl overflow-hidden shadow-2xl relative flex flex-col justify-between"
        onMouseDown={handleStartPress}
        onMouseUp={handleEndPress}
        onTouchStart={handleStartPress}
        onTouchEnd={handleEndPress}
      >
        {/* Lớp hiển thị emoji bay lên màn hình */}
        <div className="absolute inset-x-0 bottom-32 top-0 pointer-events-none z-30 overflow-hidden">
          {flyingEmojis.map((item) => (
            <div
              key={item.id}
              className="absolute text-5xl animate-flying-reaction"
              style={{
                left: `${item.left}%`,
                transform: `scale(${item.scale})`,
                bottom: 0,
              }}
            >
              {item.emoji}
            </div>
          ))}
        </div>

        {/* 1. Header: Vạch Tiến Trình + Avatar & Thông tin */}
        <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-40">
          {/* Hàng vạch tiến trình */}
          <div className="flex gap-1.5 mb-4">
            {activeUserFeed.stories.map((story, idx) => (
              <div key={story.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                  style={{
                    width: 
                      idx < currentStoryIndex 
                        ? "100%" 
                        : idx === currentStoryIndex 
                          ? `${progress}%` 
                          : "0%"
                  }}
                />
              </div>
            ))}
          </div>

          {/* Avatar, Tên & Thời gian đăng */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={activeUserFeed.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeUserFeed.user.full_name}`}
                alt={activeUserFeed.user.full_name}
                className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover"
              />
              <div>
                <h3 className="text-white text-sm font-bold">{activeUserFeed.user.full_name}</h3>
                <span className="text-white/60 text-xs">
                  {new Date(activeStory.created_at).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Các nút hành động: Pause/Play, Delete */}
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }} 
                className="p-1.5 rounded-full hover:bg-white/10 text-white"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>

              {isOwner && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }} 
                  className="p-1.5 rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-300"
                  title="Xóa tin này"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. Body: Nội dung Story */}
        <div className="flex-1 w-full h-full relative flex items-center justify-center bg-slate-900">
          {activeStory.type === "text" ? (
            // Tin dạng chữ nền gradient
            <div 
              className={cn(
                "w-full h-full flex items-center justify-center p-8 text-center",
                activeStory.background_color === "midnight" ? "bg-gradient-to-tr from-purple-800 via-violet-900 to-indigo-950" :
                activeStory.background_color === "ocean" ? "bg-gradient-to-tr from-teal-400 via-emerald-500 to-cyan-600" :
                activeStory.background_color === "nebula" ? "bg-gradient-to-tr from-indigo-900 via-purple-900 to-pink-500" :
                activeStory.background_color === "sweet" ? "bg-gradient-to-tr from-rose-400 via-fuchsia-500 to-indigo-500" :
                activeStory.background_color === "emerald" ? "bg-gradient-to-tr from-green-400 via-teal-500 to-blue-600" :
                "bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500" // sunset
              )}
            >
              <p className="text-white text-lg font-bold leading-relaxed break-words max-h-[80%] overflow-y-auto">
                {activeStory.text_content}
              </p>
            </div>
          ) : (
            // Tin dạng Ảnh hoặc Video
            <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
              {activeStory.type === "video" ? (
                <video
                  src={getFullMediaUrl(activeStory.media_url)}
                  controls={false}
                  autoPlay
                  playsInline
                  loop
                  muted
                  className="w-full h-full object-cover transition-all duration-300"
                  style={{ filter: parsedMetadata?.filter || "none" }}
                />
              ) : (
                <img
                  src={getFullMediaUrl(activeStory.media_url)}
                  alt="Story content"
                  className="w-full h-full object-cover transition-all duration-300"
                  style={{ filter: parsedMetadata?.filter || "none" }}
                />
              )}

              {/* Drawings Canvas đè lên ảnh/video (Giai đoạn 3) */}
              {parsedMetadata?.drawings && (
                <img
                  src={parsedMetadata.drawings}
                  alt="Story drawings layer"
                  className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none"
                />
              )}

              {/* Emoji Stickers đè lên ảnh/video (Giai đoạn 3) */}
              {parsedMetadata?.stickers && parsedMetadata.stickers.map((sticker: any) => (
                <div
                  key={sticker.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none z-10 text-3xl font-bold"
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    transform: `translate(-50%, -50%) scale(${sticker.scale || 1.0})`,
                  }}
                >
                  {sticker.emoji}
                </div>
              ))}

              {/* Text đè lên ảnh/video hỗ trợ Custom Text Overlays (Giai đoạn 2 & 3) */}
              {(() => {
                let overlaysToRender: any[] = [];
                if (isJsonObject && parsedMetadata?.overlays) {
                  overlaysToRender = parsedMetadata.overlays;
                } else if (isJsonArray) {
                  overlaysToRender = parsedOverlaysArray;
                } else if (textContent && !isJsonObject && !isJsonArray) {
                  // Fallback cho text thường tĩnh
                  return (
                    <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/10 pointer-events-none">
                      <span className="bg-black/60 text-white font-bold text-sm px-4 py-2 rounded-xl text-center leading-relaxed backdrop-blur-md break-words max-w-[90%] shadow-2xl">
                        {textContent}
                      </span>
                    </div>
                  );
                }

                return overlaysToRender.map((overlay: any) => {
                  const fontStyleClass = 
                    overlay.fontStyle === "serif" ? "font-serif" :
                    overlay.fontStyle === "mono" ? "font-mono tracking-wider" :
                    overlay.fontStyle === "handwritten" ? "font-serif italic tracking-wide" :
                    overlay.fontStyle === "bold" ? "font-sans font-black uppercase tracking-tight" :
                    "font-sans";

                  const highlightStyle = 
                    overlay.backgroundColor === "black" ? "bg-black/75 px-3 py-1.5 rounded-xl shadow-md" :
                    overlay.backgroundColor === "white" ? "bg-white text-slate-900 px-3 py-1.5 rounded-xl shadow-md" :
                    "px-3 py-1.5";

                  return (
                    <div
                      key={overlay.id}
                      className={cn(
                        "absolute transform -translate-x-1/2 -translate-y-1/2 select-none text-center pointer-events-none z-10 font-bold whitespace-nowrap", 
                        fontStyleClass, 
                        highlightStyle
                      )}
                      style={{
                        left: `${overlay.x}%`,
                        top: `${overlay.y}%`,
                        fontSize: `${overlay.fontSize}px`,
                        color: overlay.color || "#ffffff",
                      }}
                    >
                      {overlay.text}
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* Music Overlays */}
          {selectedSong && music && (
            <>
              {/* 1. Sticker Overlay */}
              {music.overlayType === "sticker" && (
                <div className="absolute inset-x-3 bottom-24 flex flex-col items-center justify-center pointer-events-auto z-30 select-none">
                  <div className="bg-black/60 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 border border-white/10 shadow-lg max-w-[280px] animate-bounce [animation-duration:3s]">
                    <div className="relative shrink-0">
                      <img
                        src={selectedSong.coverUrl}
                        alt={selectedSong.title}
                        className={cn(
                          "w-12 h-12 rounded-xl object-cover shadow-md border border-white/20",
                          isSongPlaying && "animate-spin [animation-duration:10s]"
                        )}
                      />
                      <Disc className="w-5 h-5 text-white absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-0.5 shrink-0" />
                    </div>
                    <div className="min-w-0 text-left flex-1">
                      <h4 className="text-[12px] font-extrabold text-white truncate">{selectedSong.title}</h4>
                      <p className="text-[10px] font-medium text-slate-300 truncate">{selectedSong.artist}</p>
                      <div className="flex gap-1.5 mt-1.5 pointer-events-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (followedArtists.includes(selectedSong.artist)) {
                              setFollowedArtists((prev) => prev.filter((a) => a !== selectedSong.artist));
                            } else {
                              setFollowedArtists((prev) => [...prev, selectedSong.artist]);
                            }
                          }}
                          className={cn(
                            "text-[9px] font-extrabold px-2 py-0.5 rounded-full transition-all",
                            followedArtists.includes(selectedSong.artist)
                              ? "bg-slate-700 text-slate-300"
                              : "bg-blue-600 hover:bg-blue-500 text-white"
                          )}
                        >
                          {followedArtists.includes(selectedSong.artist) ? "Đã theo dõi" : "Theo dõi"}
                        </button>
                        {onReuseMusic && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onReuseMusic(selectedSong);
                            }}
                            className="text-[9px] font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded-full transition-all"
                          >
                            Dùng nhạc
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Lyrics Overlay */}
              {music.overlayType === "lyrics" && (
                <div className="absolute inset-x-4 top-24 bottom-32 flex flex-col items-center justify-center pointer-events-none z-30 select-none text-center">
                  <div className="w-full max-h-[160px] overflow-hidden flex flex-col items-center justify-center px-4 py-3 bg-black/40 rounded-2xl backdrop-blur-sm border border-white/5 shadow-inner">
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1 mb-2">
                      <Volume2 className="w-3 h-3 animate-pulse" /> Lời bài hát
                    </span>
                    <div className="flex flex-col gap-1 transition-all duration-300">
                      {activeLyricIndex > 0 && (
                        <p className="text-[10px] font-medium text-white/40 leading-snug truncate max-w-[260px]">
                          {selectedSong.lyrics[activeLyricIndex - 1].text}
                        </p>
                      )}
                      <p className="text-sm font-extrabold text-blue-300 leading-snug px-3 py-1 bg-blue-600/10 rounded-xl max-w-[280px] animate-pulse">
                        "{selectedSong.lyrics[activeLyricIndex]?.text || "🎵 ... 🎵"}"
                      </p>
                      {activeLyricIndex < selectedSong.lyrics.length - 1 && (
                        <p className="text-[10px] font-medium text-white/40 leading-snug truncate max-w-[260px]">
                          {selectedSong.lyrics[activeLyricIndex + 1].text}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pointer-events-auto bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                    <span className="text-[10px] font-bold text-white max-w-[120px] truncate">
                      {selectedSong.title}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (followedArtists.includes(selectedSong.artist)) {
                          setFollowedArtists((prev) => prev.filter((a) => a !== selectedSong.artist));
                        } else {
                          setFollowedArtists((prev) => [...prev, selectedSong.artist]);
                        }
                      }}
                      className={cn(
                        "text-[9px] font-extrabold px-2 py-0.5 rounded-full transition-all",
                        followedArtists.includes(selectedSong.artist)
                          ? "bg-slate-700 text-slate-300"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      )}
                    >
                      {followedArtists.includes(selectedSong.artist) ? "Đã theo" : "Theo dõi"}
                    </button>
                    {onReuseMusic && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReuseMusic(selectedSong);
                        }}
                        className="text-[9px] font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded-full transition-all"
                      >
                        Dùng nhạc
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Floating Badge (None type) */}
              {music.overlayType === "none" && (
                <div className="absolute top-20 left-4 pointer-events-auto z-30 select-none">
                  <div className="bg-black/60 dark:bg-slate-900/80 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 border border-white/10 shadow-lg">
                    <Disc className={cn("w-4 h-4 text-blue-400 shrink-0", isSongPlaying && "animate-spin [animation-duration:6s]")} />
                    <div className="max-w-[100px] text-left">
                      <p className="text-[9px] font-extrabold text-white truncate leading-none">{selectedSong.title}</p>
                      <p className="text-[8px] font-medium text-slate-400 truncate leading-none mt-0.5">{selectedSong.artist}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (followedArtists.includes(selectedSong.artist)) {
                          setFollowedArtists((prev) => prev.filter((a) => a !== selectedSong.artist));
                        } else {
                          setFollowedArtists((prev) => [...prev, selectedSong.artist]);
                        }
                      }}
                      className={cn(
                        "text-[8px] font-extrabold px-1.5 py-0.5 rounded-full transition-all",
                        followedArtists.includes(selectedSong.artist)
                          ? "bg-slate-700 text-slate-300"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      )}
                    >
                      {followedArtists.includes(selectedSong.artist) ? "Đã theo" : "Theo dõi"}
                    </button>
                    {onReuseMusic && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReuseMusic(selectedSong);
                        }}
                        className="text-[8px] font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white px-1.5 py-0.5 rounded-full transition-all"
                      >
                        Dùng
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 3. Footer: Nút Reaction bay & Xem Viewers */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-40 flex flex-col gap-3">
          
          {/* Reaction statistics badge row */}
          {storyReactions.length > 0 && (
            <div className="flex gap-2 flex-wrap px-2 pointer-events-auto select-none mb-1">
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <div
                  key={emoji}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/10 text-xs font-bold text-white shadow-md transition-colors animate-pulse"
                >
                  <span>{emoji}</span>
                  <span className="text-[10px] font-extrabold text-blue-300">{count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reaction Bar */}
          {!isOwner && (
            <div className="flex justify-between items-center bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
              <input
                type="text"
                placeholder="Gửi tin nhắn hoặc thả cảm xúc..."
                readOnly
                className="bg-transparent border-none text-white text-xs placeholder-white/60 focus:outline-none flex-1 px-2 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); handleSendReaction("❤️"); }}
              />
              <div className="flex gap-1">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendReaction(emoji);
                    }}
                    className="w-8 h-8 rounded-full hover:bg-white/20 active:scale-125 transition-all text-lg flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dành cho chủ sở hữu: Xem danh sách người đã đọc tin */}
          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(true);
                setShowViewersModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/10 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>{viewers.length} người đã xem tin</span>
            </button>
          )}
        </div>

      </div>

      {/* MODAL DANH SÁCH NGƯỜI ĐÃ XEM STORY */}
      {showViewersModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-t-3xl md:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Lượt xem tin ({viewers.length})</h3>
              <button
                onClick={() => {
                  setShowViewersModal(false);
                  setIsPaused(false);
                }}
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
              {viewers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">Chưa có ai xem tin này</div>
              ) : (
                viewers.map((viewerItem, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={viewerItem.viewer.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewerItem.viewer.full_name}`}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{viewerItem.viewer.full_name}</p>
                        <p className="text-[10px] text-slate-400">@{viewerItem.viewer.username}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(viewerItem.viewed_at).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global CSS cho Animation Flying Reaction */}
      <style jsx global>{`
        @keyframes flyingReaction {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-400px) scale(1.4);
            opacity: 0;
          }
        }
        .animate-flying-reaction {
          animation: flyingReaction 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
}
