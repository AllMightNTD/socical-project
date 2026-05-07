"use client";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";
import { cn, formatCount } from "../../lib/utils";

interface PostProps {
  post: {
    id: string;
    user: { name: string; avatar: string };
    time: string;
    content: string;
    images: string[];
    likes: number;
    comments: number;
    shares: number;
  };
}

export default function PostCard({ post }: PostProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showComment, setShowComment] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  const imageGrid = () => {
    if (post.images.length === 0) return null;
    if (post.images.length === 1) {
      return (
        <div className="mt-3 rounded-2xl overflow-hidden">
          <img
            src={post.images[0]}
            alt=""
            className="w-full h-64 object-cover hover:scale-[1.01] transition-transform duration-300"
          />
        </div>
      );
    }
    if (post.images.length === 2) {
      return (
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl overflow-hidden">
          {post.images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              className="w-full h-48 object-cover hover:scale-[1.01] transition-transform duration-300"
            />
          ))}
        </div>
      );
    }
    return (
      <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
        {post.images.slice(0, 2).map((img, i) => (
          <img
            key={i}
            src={img}
            alt=""
            className="w-full h-36 object-cover hover:scale-[1.01] transition-transform duration-300"
          />
        ))}
        <div className="relative">
          <img
            src={post.images[2]}
            alt=""
            className="w-full h-36 object-cover"
          />
          {post.images.length > 3 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                +{post.images.length - 3}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={post.user.avatar}
                alt={post.user.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-50"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 hover:text-blue-600 cursor-pointer transition-colors">
                {post.user.name}
              </p>
              <p className="text-xs text-slate-400">{post.time}</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition-all">
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Content */}
        <p className="text-sm text-slate-600 leading-relaxed">
          {post.content.length > 150 ? (
            <>
              {post.content.slice(0, 150)}{" "}
              <button className="text-blue-500 font-medium hover:underline">
                See more
              </button>
            </>
          ) : (
            post.content
          )}
        </p>

        {/* Images */}
        {imageGrid()}

        {/* Stats */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                <ThumbsUp size={10} className="text-white fill-white" />
              </span>
              <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                <Heart size={10} className="text-white fill-white" />
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {formatCount(likeCount)} Like
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
              onClick={() => setShowComment(!showComment)}
            >
              <MessageCircle size={13} />
              {post.comments} Comment
            </button>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Share2 size={13} />
              {post.shares} Share
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center border-t border-slate-50">
        <button
          onClick={handleLike}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all hover:bg-slate-50",
            liked ? "text-blue-500" : "text-slate-500",
          )}
        >
          <ThumbsUp size={15} className={cn(liked && "fill-blue-500")} />
          <span className="text-xs">Like</span>
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-blue-500 transition-all"
          onClick={() => setShowComment(!showComment)}
        >
          <MessageCircle size={15} />
          <span className="text-xs">Comment</span>
        </button>
        <button
          onClick={() => setSaved(!saved)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all hover:bg-slate-50",
            saved ? "text-blue-500" : "text-slate-500",
          )}
        >
          <Bookmark size={15} className={cn(saved && "fill-blue-500")} />
          <span className="text-xs">Save</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-blue-500 transition-all">
          <Share2 size={15} />
          <span className="text-xs">Share</span>
        </button>
      </div>

      {/* Comment box */}
      {showComment && (
        <div className="px-4 pb-4 border-t border-slate-50">
          <div className="flex items-center gap-2 mt-3">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=me&backgroundColor=b6e3f4"
              alt=""
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 bg-slate-50 rounded-full px-4 py-2">
              <input
                type="text"
                placeholder="Write a comment..."
                className="w-full bg-transparent text-sm text-slate-600 placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
