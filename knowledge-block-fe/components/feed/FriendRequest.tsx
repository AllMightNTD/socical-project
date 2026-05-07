"use client";
import { confirmFriends, friendRequests } from "@/lib/mockData";
import { ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

function FriendRequestCard({
  person,
  onConfirm,
  onDelete,
}: {
  person: { id: string; name: string; mutual: number; avatar: string };
  onConfirm: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <img
        src={person.avatar}
        alt={person.name}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">
          {person.name}
        </p>
        <p className="text-xs text-slate-400">{person.mutual} mutual friends</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onConfirm(person.id)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={() => onDelete(person.id)}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold py-1.5 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FriendRequests() {
  const [requests, setRequests] = useState(friendRequests);
  const [confirms, setConfirms] = useState(confirmFriends);

  const handleConfirm = (id: string) =>
    setRequests((r) => r.filter((x) => x.id !== id));
  const handleDelete = (id: string) =>
    setRequests((r) => r.filter((x) => x.id !== id));
  const handleAdd = (id: string) =>
    setConfirms((c) => c.filter((x) => x.id !== id));

  return (
    <div className="flex flex-col gap-4">
      {/* Friend Requests */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800">Friend Request</h3>
          <button className="text-xs text-blue-500 font-semibold hover:underline">
            See all
          </button>
        </div>
        {requests.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            No pending requests
          </p>
        ) : (
          <div className="divide-y divide-slate-50">
            {requests.map((person) => (
              <FriendRequestCard
                key={person.id}
                person={person}
                onConfirm={handleConfirm}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirm Friends */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800">Confirm Friend</h3>
          <button className="text-xs text-blue-500 font-semibold hover:underline">
            See all
          </button>
        </div>
        {confirms.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            No suggestions
          </p>
        ) : (
          <div className="divide-y divide-slate-50">
            {confirms.map((person) => (
              <div key={person.id} className="flex items-center gap-3 py-2.5">
                <img
                  src={person.avatar}
                  alt={person.name}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {person.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {person.mutual} mutual friends
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleAdd(person.id)}
                    className="w-7 h-7 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors"
                  >
                    <Plus size={14} className="text-white" />
                  </button>
                  <button className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                    <ChevronRight size={14} className="text-slate-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
