"use client";
import { useEffect, useState, useCallback } from "react";
import { Eye, Lock, Mail, MoreHorizontal, Loader2, Sparkles } from "lucide-react";
import { useSocket } from "@/components/providers/SocketProvider";
import CreatePost from "../feed/CreatePost";
import PostCard from "../feed/PostCard";
import { FriendActionButton } from "@/features/friends/components/FriendActionButton";
import api from "@/lib/axios";

interface PersonalPageProps {
  user?: any;
  currentUser?: any;
}

const formatTimeAgo = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Vừa xong";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  } catch (e) {
    return "Vừa xong";
  }
};

const getMediaUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
  return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
};

const mapBackendPostToFrontend = (bPost: any) => {
  const userProfile = bPost.user?.profile;
  const displayName = userProfile?.full_name || bPost.user?.email || "Người dùng ẩn danh";
  const avatarUrl = userProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;
  
  return {
    id: bPost.id,
    user_id: bPost.user_id,
    audience: bPost.audience,
    user: {
      name: displayName,
      avatar: avatarUrl,
      id: bPost.user?.id || bPost.user_id,
    },
    time: formatTimeAgo(bPost.created_at),
    content: bPost.content || "",
    images: bPost.media?.map((m: any) => getMediaUrl(m.file_url)) || [],
    rawMedia: bPost.media || [],
    likes: bPost.reaction_count || 0,
    comments: bPost.comment_count || 0,
    shares: bPost.share_count || 0,
    feeling: bPost.feeling,
    post_background: bPost.post_background,
    reactionStats: bPost.reactionStats || {},
    userReaction: bPost.userReaction || null,
  };
};

export default function PersonalPage({ user, currentUser }: PersonalPageProps) {
  const [postsList, setPostsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayUser = user || currentUser || {
    name: "Mohannad Zitoun",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mohannad&backgroundColor=ffdfbf"
  };

  const displayName = displayUser.name || displayUser.profile?.full_name || displayUser.email || "Thành viên";
  const avatarUrl = displayUser.avatar || displayUser.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;
  const { socket } = useSocket();
  const userId = displayUser.id || displayUser.user_id || currentUser?.id;

  // Lắng nghe bài viết mới và reaction mới qua socket phát sóng
  useEffect(() => {
    if (!socket || !userId) return;

    const handleNewPost = (newPost: any) => {
      // Chỉ chèn bài viết nếu tác giả của bài viết trùng với chủ sở hữu trang cá nhân này
      if (newPost.user_id !== userId) return;

      console.log("[PersonalPage] Realtime post received for profile:", newPost);
      const formatted = mapBackendPostToFrontend(newPost);
      setPostsList((prev) => {
        // Chống trùng lặp (double render)
        if (prev.some((p) => p.id === formatted.id)) return prev;
        return [formatted, ...prev];
      });
    };

    const handlePostReaction = (payload: any) => {
      console.log("[PersonalPage] Realtime reaction received for profile:", payload);
      setPostsList((prev) =>
        prev.map((post) => {
          if (post.id === payload.postId) {
            return {
              ...post,
              likes: payload.reactionCount,
              reactionStats: payload.stats,
            };
          }
          return post;
        })
      );
    };

    const handlePostUpdated = (updatedPost: any) => {
      console.log("[PersonalPage] Realtime post updated received for profile:", updatedPost);
      const formatted = mapBackendPostToFrontend(updatedPost);
      setPostsList((prev) =>
        prev.map((post) => {
          if (post.id === formatted.id) {
            return {
              ...formatted,
              userReaction: post.userReaction, // giữ nguyên user reaction hiện tại của mình
            };
          }
          return post;
        })
      );
    };

    const handleCommentCreated = (comment: any) => {
      console.log("[PersonalPage] Realtime comment created received:", comment);
      if (comment.postId) {
        setPostsList((prev) =>
          prev.map((post) => {
            if (post.id === comment.postId) {
              return {
                ...post,
                comments: (post.comments || 0) + 1,
              };
            }
            return post;
          })
        );
      }
    };

    const handleCommentDeleted = (payload: any) => {
      console.log("[PersonalPage] Realtime comment deleted received:", payload);
      if (payload.postId) {
        setPostsList((prev) =>
          prev.map((post) => {
            if (post.id === payload.postId) {
              return {
                ...post,
                comments: Math.max(0, (post.comments || 0) - 1),
              };
            }
            return post;
          })
        );
      }
    };

    socket.on("newPost", handleNewPost);
    socket.on("postReaction", handlePostReaction);
    socket.on("postUpdated", handlePostUpdated);
    socket.on("commentCreated", handleCommentCreated);
    socket.on("commentDeleted", handleCommentDeleted);

    return () => {
      socket.off("newPost", handleNewPost);
      socket.off("postReaction", handlePostReaction);
      socket.off("postUpdated", handlePostUpdated);
      socket.off("commentCreated", handleCommentCreated);
      socket.off("commentDeleted", handleCommentDeleted);
    };
  }, [socket, userId]);

  const profileTabs = [
    "Bài viết",
    "Giới thiệu",
    "Bạn bè",
    "Hình ảnh",
    "Video",
    "Nhóm",
    "Sự kiện",
  ];

  const fetchProfilePosts = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/v1/post/profile/${userId}`);
      const backendPosts = res.data?.metadata || res.data || [];
      const formatted = backendPosts.map(mapBackendPostToFrontend);
      setPostsList(formatted);
    } catch (err: any) {
      console.error("Failed to fetch profile posts:", err);
      setError("Không thể tải bài đăng của trang cá nhân này.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfilePosts();
  }, [fetchProfilePosts]);

  const isOwnProfile = userId === currentUser?.id;

  return (
    <div className="w-full max-w-[1000px] mx-auto space-y-4 pb-12">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
        {/* Cover Photo */}
        <div className="h-48 md:h-64 bg-slate-100 relative">
          <img
            src="https://images.unsplash.com/photo-1508766917616-d22f3f1eea14?auto=format&fit=crop&q=80&w=1200&h=400"
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Profile Info Section */}
        <div className="px-6 pb-2 pt-14 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          {/* Avatar (positioned over cover) */}
          <div className="absolute -top-12 left-6 rounded-full border-4 border-white overflow-hidden w-24 h-24 bg-white shadow-md">
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover bg-slate-100"
            />
          </div>

          <div className="mt-2 sm:mt-0 sm:ml-28">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-1.5">
              {displayName}
              {isOwnProfile && <Sparkles size={16} className="text-yellow-500 fill-yellow-400" />}
            </h1>
            <p className="text-sm text-slate-500">
              {displayUser.email || `${displayName.toLowerCase().replace(/\s+/g, "")}@gmail.com`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isOwnProfile && (
              <FriendActionButton targetUserId={userId} currentUserId={currentUser?.id} />
            )}
            <button className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors">
              <Mail size={18} />
            </button>
            <button className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 mt-4 flex items-center gap-6 border-t border-slate-100 overflow-x-auto scrollbar-hide">
          {profileTabs.map((tab, idx) => (
            <button
              key={tab}
              className={`py-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${idx === 0
                ? "border-slate-800 text-slate-800"
                : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content grid */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Column - Information */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3">Giới thiệu</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Chào mừng đến với trang cá nhân của tôi trên Know Block! Nơi chia sẻ kiến thức, kinh nghiệm và kết nối những bộ óc sáng tạo.
              </p>
            </div>

            <div className="space-y-5 pt-5 border-t border-slate-100">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-slate-400 mt-0.5" strokeWidth={2.5} />
                <div>
                  <p className="text-sm font-bold text-slate-800">Quyền riêng tư</p>
                  <p className="text-xs text-slate-400 font-medium">Trang cá nhân được bảo vệ an toàn</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-slate-400 mt-0.5" strokeWidth={2.5} />
                <div>
                  <p className="text-sm font-bold text-slate-800">Trạng thái hiển thị</p>
                  <p className="text-xs text-slate-400 font-medium">Bất kỳ ai cũng có thể tìm kiếm bạn</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Posts Feed */}
        <div className="w-full flex-1 min-w-0 space-y-4">
          {isOwnProfile && (
            <CreatePost currentUser={currentUser} onPostCreated={fetchProfilePosts} />
          )}

          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center justify-center min-h-[200px]">
              <Loader2 size={24} className="animate-spin text-blue-500 mb-2" />
              <p className="text-slate-400 text-xs font-semibold">Đang tải bài viết...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <p className="text-red-500 text-sm font-semibold">{error}</p>
            </div>
          ) : postsList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center space-y-3">
              <span className="text-4xl">📝</span>
              <h3 className="text-sm font-bold text-slate-700">Chưa có bài viết nào</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Trang cá nhân này chưa chia sẻ kiến thức nào. Hãy quay lại sau nhé!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {postsList.map((post) => (
                <PostCard key={post.id} post={post} currentUser={currentUser} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
