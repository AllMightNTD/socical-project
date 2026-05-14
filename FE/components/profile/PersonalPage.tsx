import { posts } from "@/lib/mockData";
import { Eye, Lock, Mail, MoreHorizontal } from "lucide-react";
import CreatePost from "../feed/CreatePost";
import PostCard from "../feed/PostCard";

export default function PersonalPage({ user }: { user?: { name?: string, avatar?: string } }) {
  const displayUser = user || {
    name: "Mohannad Zitoun",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mohannad&backgroundColor=ffdfbf"
  };

  const profileTabs = [
    "About",
    "Membership",
    "Discussion",
    "Video",
    "Group",
    "Events",
    "Media",
  ];

  return (
    <div className="w-full max-w-[1000px] mx-auto space-y-4 pb-12">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Cover Photo */}
        <div className="h-48 md:h-64 bg-pink-100 relative">
          <img
            src="https://images.unsplash.com/photo-1508766917616-d22f3f1eea14?auto=format&fit=crop&q=80&w=1200&h=400"
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Profile Info Section */}
        <div className="px-6 pb-2 pt-14 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          {/* Avatar (positioned over cover) */}
          <div className="absolute -top-12 left-6 rounded-full border-4 border-white overflow-hidden w-24 h-24 bg-white">
            <img
              src={displayUser.avatar}
              alt={displayUser.name}
              className="w-full h-full object-cover bg-slate-100"
            />
          </div>

          <div className="mt-2 sm:mt-0 sm:ml-28">
            <h1 className="text-xl font-bold text-slate-800">{displayUser.name}</h1>
            <p className="text-sm text-slate-500">
              {displayUser.name?.toLowerCase().replace(/\s+/g, '')}@gmail.com
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="bg-[#1dd073] hover:bg-[#1bc16a] text-white px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition-colors">
              ADD FRIEND
            </button>
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
        {/* Left Column */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3">About</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi
                nulla dolor, ornare at commodo non, feugiat non nisi. Phasellus
                faucibus mollis pharetra. Proin blandit ac massa sed rhoncus
              </p>
            </div>

            <div className="space-y-5 pt-5 border-t border-slate-100">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-slate-400 mt-0.5" strokeWidth={2.5} />
                <div>
                  <p className="text-sm font-bold text-slate-800">Private</p>
                  <p className="text-xs text-slate-400 font-medium">What's up, how are you?</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-slate-400 mt-0.5" strokeWidth={2.5} />
                <div>
                  <p className="text-sm font-bold text-slate-800">Visible</p>
                  <p className="text-xs text-slate-400 font-medium">Anyone can find you</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full flex-1 min-w-0 space-y-4">
          <CreatePost />

          <div className="space-y-4">
            {posts.slice(0, 2).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
