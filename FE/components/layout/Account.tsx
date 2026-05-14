"use client";
import React from "react";
import { ArrowLeft, CloudLightning, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountProps {
  onBack: () => void;
}

export default function Account({ onBack }: AccountProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6 mx-6 md:mx-8 lg:mx-16 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Blue Header */}
      <div className="bg-blue-600 p-4 flex items-center gap-4 text-white">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Account Details</h1>
      </div>

      <div className="p-8">
        {/* Profile Summary */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="relative mb-4">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=surfiya&backgroundColor=c0aede"
              alt="Avatar"
              className="w-28 h-28 rounded-2xl object-cover shadow-md border-4 border-white"
            />
            <button className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-md text-blue-600 hover:text-blue-700">
              <CloudLightning size={16} fill="currentColor" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide">Surfiya Zakir</h2>
          <p className="text-sm font-semibold text-slate-400">Brooklyn</p>
        </div>

        {/* Form Grid */}
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">First Name</label>
              <input type="text" className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50/50 outline-none focus:border-blue-500 transition-all text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">Last Name</label>
              <input type="text" className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50/50 outline-none focus:border-blue-500 transition-all text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">Email</label>
              <input type="email" className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50/50 outline-none focus:border-blue-500 transition-all text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">Phone</label>
              <input type="text" className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50/50 outline-none focus:border-blue-500 transition-all text-sm" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">Country</label>
            <input type="text" className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50/50 outline-none focus:border-blue-500 transition-all text-sm" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">Address</label>
            <input type="text" className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50/50 outline-none focus:border-blue-500 transition-all text-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">Town / City</label>
              <input type="text" className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50/50 outline-none focus:border-blue-500 transition-all text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">Postcode</label>
              <input type="text" className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50/50 outline-none focus:border-blue-500 transition-all text-sm" />
            </div>
          </div>

          {/* Upload Zone */}
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group">
            <div className="p-4 bg-slate-50 rounded-full group-hover:bg-blue-100 transition-colors">
                <UploadCloud size={32} className="text-slate-400 group-hover:text-blue-500" />
            </div>
            <p className="text-sm font-bold text-slate-500 group-hover:text-blue-600">Drag and drop or click to replace</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">Description</label>
            <textarea rows={4} placeholder="Write your message..." className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50/50 outline-none focus:border-blue-500 transition-all text-sm resize-none"></textarea>
          </div>

          <button className="w-48 py-4 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
