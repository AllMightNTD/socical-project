"use client";
import { stories } from "@/lib/mockData";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

export default function Stories() {
  const [activeStory, setActiveStory] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const openStory = (id: string) => {
    setActiveStory(id);
    setProgress(0);
    // Simulate progress
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 2;
      });
    }, 60);
    setTimeout(() => {
      clearInterval(interval);
      setActiveStory(null);
    }, 3000);
  };

  const activeStoryData = stories.find((s) => s.id === activeStory);

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {/* Add Story */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group">
          <div className="relative w-[90px] h-[140px] rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-end pb-4 group-hover:border-blue-300 transition-colors">
            <img
              src="https://picsum.photos/seed/bg-add/200/300"
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Plus size={18} className="text-white" />
              </div>
              <span className="text-xs font-semibold text-slate-700">
                Add Story
              </span>
            </div>
          </div>
        </div>

        {/* Story items */}
        {stories.map((story) => (
          <div
            key={story.id}
            className="flex-shrink-0 cursor-pointer group"
            onClick={() => openStory(story.id)}
          >
            <div className="relative w-[90px] h-[140px] rounded-2xl overflow-hidden">
              <img
                src={story.image}
                alt={story.user}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

              {/* Avatar */}
              <div
                className={cn(
                  "absolute top-2.5 left-2.5 w-8 h-8 rounded-full p-0.5",
                  story.hasNew
                    ? "bg-gradient-to-br from-blue-400 to-blue-600"
                    : "bg-slate-300",
                )}
              >
                <img
                  src={story.avatar}
                  alt={story.user}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>

              {/* Name */}
              <p className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold leading-tight">
                {story.user}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Story Viewer Modal */}
      {activeStory && activeStoryData && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={() => setActiveStory(null)}
        >
          <div
            className="relative w-72 h-[480px] rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeStoryData.image}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

            {/* Progress bar */}
            <div className="absolute top-3 left-3 right-3 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* User info */}
            <div className="absolute top-6 left-3 flex items-center gap-2">
              <img
                src={activeStoryData.avatar}
                alt=""
                className="w-8 h-8 rounded-full border-2 border-white"
              />
              <span className="text-white text-sm font-semibold">
                {activeStoryData.user}
              </span>
            </div>

            <button
              className="absolute top-3 right-3 text-white hover:text-gray-300"
              onClick={() => setActiveStory(null)}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
