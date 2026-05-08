"use client";

import { useSocket } from "@/components/providers/SocketProvider";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { ArrowRight, Smile, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  type: string;
  conversation_id: string;
}

interface ChatBoxProps {
  contact: {
    id: string;
    name: string;
    avatar: string;
  };
  currentUser?: any;
  onClose: () => void;
}

export default function ChatBox({ contact, currentUser, onClose }: ChatBoxProps) {
  const { socket, isConnected } = useSocket();
  const boxRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Lấy conversationId từ friendId và fetch tin nhắn cũ
  useEffect(() => {
    let isMounted = true;
    const fetchConversationAndMessages = async () => {
      setLoading(true);
      try {
        // 1. Lấy hoặc tạo conversation
        const convRes = await api.get(`/api/v1/chat/conversation/${contact.id}`);
        const convId = convRes.data.conversation_id;

        if (isMounted && convId) {
          setConversationId(convId);

          // 2. Lấy tin nhắn cũ
          const msgRes = await api.get(`/api/v1/chat/messages/${convId}`);
          if (isMounted) {
            setMessages(msgRes.data.data || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch conversation or messages:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchConversationAndMessages();
    return () => { isMounted = false; };
  }, [contact.id]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    // Join room khi mở box
    socket.emit("joinConversation", { conversation_id: conversationId });

    // Lắng nghe tin nhắn mới
    socket.on("newMessage", (message: ChatMessage) => {
      console.log(message);

      setMessages((prev) => {
        // Tránh bị trùng tin nhắn nếu messageSent đã add rồi
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    // Lắng nghe khi gửi tin nhắn thành công (để confirm)
    socket.on("messageSent", (message: ChatMessage) => {
      setMessages((prev) => {
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    return () => {
      socket.off("newMessage");
      socket.off("messageSent");
    };
  }, [socket, conversationId]);

  // Tự động cuộn xuống khi có tin mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    const timeout = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleSendMessage = () => {
    if (!text.trim() || !socket || !conversationId) return;

    const payload = {
      conversation_id: conversationId,
      content: text,
      type: "text",
    };

    socket.emit("sendMessage", payload);
    setText("");
  };

  return (
    <div
      ref={boxRef}
      className={cn(
        "fixed z-50 flex flex-col bg-white border border-slate-200 shadow-[0_0_40px_rgba(0,0,0,0.08)]",
        "bottom-0 right-0 w-full h-[60vh] rounded-t-2xl transition-all duration-300",
        "sm:w-[320px] sm:h-[450px] sm:right-4 sm:rounded-2xl",
        "xl:right-[17rem]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-white rounded-t-2xl shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img src={contact.avatar || "https://ui-avatars.com/api/?name=" + contact.name} alt={contact.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-50" />
            <span className={cn("absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white", isConnected ? "bg-green-500" : "bg-slate-300")} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-slate-800 leading-none">{contact.name}</span>
            <span className="text-[10px] text-slate-400 mt-0.5">{isConnected ? "Online" : "Connecting..."}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fcfdfe] scroll-smooth">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <Smile size={32} strokeWidth={1.5} />
            <p className="text-xs font-medium">Say hello to {contact.name}!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser?.id;
            return (
              <div key={msg.id} className={cn("flex flex-col gap-1.5", isMe ? "items-end" : "items-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed font-medium shadow-sm",
                  isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                )}>
                  {msg.content}
                </div>
                <span className="text-[9px] text-slate-400 px-1 uppercase font-bold tracking-tighter">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 h-9 bg-slate-50 rounded-xl px-3 text-[13px] outline-none border border-transparent focus:border-blue-100 focus:bg-white transition-all placeholder:text-slate-400 text-slate-700 font-medium"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && text.trim()) {
              handleSendMessage();
            }
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!text.trim() || !isConnected}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 shadow-lg",
            text.trim() && isConnected ? "bg-blue-600 text-white shadow-blue-200" : "bg-slate-100 text-slate-300 shadow-none"
          )}
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
