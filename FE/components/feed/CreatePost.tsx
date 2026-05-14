"use client";
import { currentUser } from "@/lib/mockData";
import { Image, MoreHorizontal, Smile, Video } from "lucide-react";
import { useState } from "react";

export default function CreatePost() {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      {/* Top row */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={currentUser.avatar}
          alt="me"
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        />
        <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-100 inline-flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          </span>
          Create Post
        </span>
      </div>

      {/* Textarea */}
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="What's on your mind?"
        className="w-full resize-none text-sm text-slate-700 placeholder:text-slate-400 outline-none bg-transparent leading-relaxed"
      />

      <div className="border-t border-slate-100 mt-3 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-50 text-slate-500 text-sm font-medium transition-colors group">
            <span className="w-5 h-5 rounded-md bg-red-100 flex items-center justify-center">
              <Video size={11} className="text-red-500" />
            </span>
            <span className="hidden sm:inline text-xs">Live Video</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-50 text-slate-500 text-sm font-medium transition-colors">
            <span className="w-5 h-5 rounded-md bg-green-100 flex items-center justify-center">
              <Image size={11} className="text-green-500" />
            </span>
            <span className="hidden sm:inline text-xs">Photo/Video</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-50 text-slate-500 text-sm font-medium transition-colors">
            <span className="w-5 h-5 rounded-md bg-yellow-100 flex items-center justify-center">
              <Smile size={11} className="text-yellow-500" />
            </span>
            <span className="hidden sm:inline text-xs">Feeling</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {text.trim() && (
            <button className="bg-blue-500 text-white text-xs font-semibold px-4 py-1.5 rounded-xl hover:bg-blue-600 transition-colors">
              Post
            </button>
          )}
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
