"use client";
import {
  Bookmark,
  MessageCircle,
  MoreHorizontal,
  Share2,
  ThumbsUp,
  Edit3,
  Trash2,
  AlertCircle
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCount } from "../../lib/utils";
import api from "@/lib/axios";
import EditPostModal from "./EditPostModal";
import CommentSection from "./CommentSection";
import PostDetailModal from "./PostDetailModal";

interface PostProps {
  post: {
    id: string;
    user_id?: string;
    audience?: string;
    user: { name: string; avatar: string };
    time: string;
    content: string;
    images: string[];
    rawMedia?: any[];
    likes: number;
    comments: number;
    shares: number;
    feeling?: string;
    post_background?: string;
    reactionStats?: Record<string, number>;
    userReaction?: string | null;
  };
  currentUser?: any;
  onProfileClick?: () => void;
}

const REACTIONS = [
  { id: "like", emoji: "👍", label: "Thích", color: "text-blue-500 font-bold", fillIcon: "👍" },
  { id: "love", emoji: "❤️", label: "Yêu thích", color: "text-red-500 font-bold", fillIcon: "❤️" },
  { id: "sad", emoji: "😢", label: "Khóc", color: "text-yellow-500 font-bold", fillIcon: "😢" },
  { id: "angry", emoji: "😡", label: "Phẫn nộ", color: "text-orange-500 font-bold", fillIcon: "😡" },
];

const getMediaUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
  return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function PostCard({ post, currentUser, onProfileClick }: PostProps) {
  // Reaction states
  const [currentReaction, setCurrentReaction] = useState<string | null>(post.userReaction || null);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [stats, setStats] = useState<Record<string, number>>(post.reactionStats || {});
  const [commentCount, setCommentCount] = useState(post.comments || 0);
  
  const [saved, setSaved] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Menu 3 chấm và Modal chỉnh sửa
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset states when props change
    setCurrentReaction(post.userReaction || null);
    setLikeCount(post.likes);
    setStats(post.reactionStats || {});
    setCommentCount(post.comments || 0);
  }, [post]);

  // Click outside picker or menu to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (pickerRef.current && !pickerRef.current.contains(target)) {
        setIsPickerOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleReaction = async (type: string) => {
    setIsPickerOpen(false);
    
    // Optimistic UI Update
    const prevReaction = currentReaction;
    const isRemoval = prevReaction === type;
    
    let newReaction = isRemoval ? null : type;
    setCurrentReaction(newReaction);

    // Tính toán số lượng like
    let newLikeCount = likeCount;
    if (prevReaction && isRemoval) {
      newLikeCount = Math.max(0, newLikeCount - 1);
    } else if (!prevReaction && !isRemoval) {
      newLikeCount = newLikeCount + 1;
    }
    setLikeCount(newLikeCount);

    // Tính toán stats cục bộ
    const newStats = { ...stats };
    if (prevReaction) {
      newStats[prevReaction] = Math.max(0, (newStats[prevReaction] || 1) - 1);
      if (newStats[prevReaction] === 0) delete newStats[prevReaction];
    }
    if (!isRemoval) {
      newStats[type] = (newStats[type] || 0) + 1;
    }
    setStats(newStats);

    try {
      const res = await api.post(`/api/v1/post/${post.id}/reaction`, { type });
      // Cập nhật lại chuẩn xác từ server
      setCurrentReaction(res.data.userReaction);
      setLikeCount(res.data.reactionCount);
      setStats(res.data.stats || {});
    } catch (err) {
      console.error("Failed to react:", err);
      // Rollback nếu có lỗi
      setCurrentReaction(prevReaction);
      setLikeCount(post.likes);
      setStats(post.reactionStats || {});
    }
  };

  const handleQuickLike = () => {
    if (currentReaction) {
      // Đã react rồi -> Click nhanh sẽ bỏ react
      handleToggleReaction(currentReaction);
    } else {
      // Chưa react -> Click nhanh sẽ là Like 👍
      handleToggleReaction("like");
    }
  };

  const handleMouseEnter = () => {
    if (pickerTimeoutRef.current) clearTimeout(pickerTimeoutRef.current);
    setIsPickerOpen(true);
  };

  const handleMouseLeave = () => {
    pickerTimeoutRef.current = setTimeout(() => {
      setIsPickerOpen(false);
    }, 800); // 800ms delay to close
  };

  const imageGrid = () => {
    const images = post.images?.filter(Boolean) || [];
    if (images.length === 0) return null;

    const isVideo = (url: string) => {
      if (!url) return false;
      const lower = url.toLowerCase();
      return (
        lower.endsWith(".mp4") ||
        lower.endsWith(".webm") ||
        lower.endsWith(".ogg") ||
        lower.endsWith(".mov") ||
        lower.endsWith(".quicktime") ||
        lower.includes("video/") ||
        lower.includes("video")
      );
    };

    if (images.length === 1) {
      return (
        <div className="mt-3 rounded-2xl overflow-hidden border border-slate-100/50 bg-slate-50 max-h-[420px] flex items-center justify-center">
          {isVideo(images[0]) ? (
            <video src={getMediaUrl(images[0])} controls className="w-full object-cover max-h-[420px]" />
          ) : (
            <img
              src={getMediaUrl(images[0])}
              alt=""
              className="w-full object-cover hover:scale-[1.01] transition-transform duration-300 max-h-[420px]"
            />
          )}
        </div>
      );
    }
    if (images.length === 2) {
      return (
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl overflow-hidden border border-slate-100/50 bg-slate-50">
          {images.map((img, i) => (
            <div key={i} className="aspect-[4/3] overflow-hidden">
              {isVideo(img) ? (
                <video src={getMediaUrl(img)} controls className="w-full h-full object-cover" />
              ) : (
                <img
                  src={getMediaUrl(img)}
                  alt=""
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                />
              )}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl overflow-hidden border border-slate-100/50 bg-slate-50">
        {images.slice(0, 2).map((img, i) => (
          <div key={i} className="aspect-square overflow-hidden">
            {isVideo(img) ? (
              <video src={getMediaUrl(img)} controls className="w-full h-full object-cover" />
            ) : (
              <img
                src={getMediaUrl(img)}
                alt=""
                className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
              />
            )}
          </div>
        ))}
        <div className="relative aspect-square overflow-hidden">
          {isVideo(images[2]) ? (
            <video src={getMediaUrl(images[2])} className="w-full h-full object-cover" />
          ) : (
            <img
              src={getMediaUrl(images[2])}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          {images.length > 3 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-xs">
              <span className="text-white text-lg font-bold">
                +{images.length - 3}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Lấy emoji đại diện cho reaction hiện tại
  const getReactionUI = () => {
    const found = REACTIONS.find((r) => r.id === currentReaction);
    if (found) {
      return (
        <span className={cn("text-xs flex items-center gap-1.5", found.color)}>
          <span className="text-sm">{found.emoji}</span>
          <span>{found.label}</span>
        </span>
      );
    }
    return (
      <span className="text-xs flex items-center gap-1.5 text-slate-500">
        <ThumbsUp size={15} />
        <span>Thích</span>
      </span>
    );
  };

  // Lấy các icon cảm xúc đang có nhiều lượt thả nhất
  const renderReactionIcons = () => {
    const activeReactionIds = Object.keys(stats).filter((key) => stats[key] > 0);
    if (activeReactionIds.length === 0) return null;

    return (
      <div className="flex -space-x-1 shadow-xs bg-slate-50 px-1 py-0.5 rounded-full border border-slate-100">
        {activeReactionIds.slice(0, 3).map((id) => {
          const feel = REACTIONS.find((r) => r.id === id);
          if (!feel) return null;
          return (
            <span 
              key={id} 
              className="w-4 h-4 rounded-full flex items-center justify-center text-xs animate-in zoom-in duration-200"
              title={`${feel.label}: ${stats[id]}`}
            >
              {feel.emoji}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={post.user.avatar}
                alt={post.user.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-50"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1">
                <span 
                  className="text-sm font-semibold text-slate-800 hover:text-blue-600 cursor-pointer transition-colors"
                  onClick={onProfileClick}
                >
                  {post.user.name}
                </span>
                {post.feeling && (
                  <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100/50">
                    đang cảm thấy {post.feeling}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{post.time}</p>
            </div>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition-all"
            >
              <MoreHorizontal size={16} />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  className="absolute right-0 mt-1 w-44 bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-20 overflow-hidden"
                >
                  {post.user_id === currentUser?.id ? (
                    <>
                      <button
                        onClick={() => {
                          setIsEditModalOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors text-left"
                      >
                        <Edit3 size={14} className="text-blue-500" />
                        Chỉnh sửa bài viết
                      </button>
                      <button
                        onClick={() => {
                          // Hỗ trợ xóa bài viết
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 hover:bg-slate-50 text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-2 transition-colors text-left"
                      >
                        <Trash2 size={14} />
                        Xóa bài viết
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setSaved(!saved);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors text-left"
                      >
                        <Bookmark size={14} className="text-slate-400" />
                        {saved ? "Hủy lưu bài viết" : "Lưu bài viết"}
                      </button>
                      <button
                        onClick={() => setIsMenuOpen(false)}
                        className="w-full px-4 py-2 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors text-left"
                      >
                        <AlertCircle size={14} className="text-amber-500" />
                        Báo cáo bài đăng
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content with Gradient Background capability */}
        {post.post_background ? (
          <div className={cn("rounded-2xl p-6 min-h-[160px] flex items-center justify-center text-center shadow-inner my-3", post.post_background)}>
            <p className="text-white text-lg font-bold leading-relaxed">{post.content}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-600 leading-relaxed my-3 whitespace-pre-wrap">
            {post.content.length > 300 ? (
              <>
                {post.content.slice(0, 300)}...{" "}
                <button className="text-blue-500 font-semibold hover:underline">
                  Xem thêm
                </button>
              </>
            ) : (
              post.content
            )}
          </p>
        )}

        {/* Images / Videos grid */}
        {!post.post_background && imageGrid()}

        {/* Stats row */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            {renderReactionIcons()}
            <span className="text-xs text-slate-500 font-medium">
              {formatCount(likeCount)} Lượt tương tác
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
              onClick={() => setIsDetailOpen(true)}
            >
              <MessageCircle size={13} />
              {commentCount} Bình luận
            </button>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Share2 size={13} />
              {post.shares} Chia sẻ
            </span>
          </div>
        </div>
      </div>

      {/* Actions (Like Hover Reaction Picker + Comments + Share) */}
      <div className="flex items-center border-t border-slate-100 relative">
        
        {/* Like Button Wrapper for Hover Event */}
        <div 
          className="flex-1 relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          ref={pickerRef}
        >
          <button
            onClick={handleQuickLike}
            className="w-full flex items-center justify-center gap-2 py-2.5 hover:bg-slate-50 transition-colors duration-200"
          >
            {getReactionUI()}
          </button>

          {/* Facebook-style Hover Reaction Picker with Framer Motion */}
          <AnimatePresence>
            {isPickerOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute bottom-full left-4 mb-2 bg-white rounded-full border border-slate-100 shadow-2xl px-2.5 py-1.5 z-40 flex items-center gap-2 backdrop-blur-sm bg-white/95"
              >
                {REACTIONS.map((feel, index) => (
                  <motion.button
                    key={feel.id}
                    type="button"
                    onClick={() => handleToggleReaction(feel.id)}
                    whileHover={{ scale: 1.3, y: -4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="relative group p-1 shrink-0 active:scale-95"
                  >
                    <span className="text-2xl filter drop-shadow-md cursor-pointer">{feel.emoji}</span>
                    
                    {/* Tooltip */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md">
                      {feel.label}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-blue-500 transition-colors"
          onClick={() => setIsDetailOpen(true)}
        >
          <MessageCircle size={15} />
          <span className="text-xs">Bình luận</span>
        </button>
        <button
          onClick={() => setSaved(!saved)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all hover:bg-slate-50",
            saved ? "text-blue-500" : "text-slate-500",
          )}
        >
          <Bookmark size={15} className={cn(saved && "fill-blue-500")} />
          <span className="text-xs">Lưu lại</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-blue-500 transition-colors">
          <Share2 size={15} />
          <span className="text-xs">Chia sẻ</span>
        </button>
      </div>

      <PostDetailModal
        post={post}
        currentUser={currentUser}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        commentCount={commentCount}
        onCommentCountChange={(newCount) => setCommentCount(newCount)}
        likeCount={likeCount}
        currentReaction={currentReaction}
        stats={stats}
        onReactionSelect={handleToggleReaction}
      />

      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        post={post}
        currentUser={currentUser}
      />
    </div>
  );
}
