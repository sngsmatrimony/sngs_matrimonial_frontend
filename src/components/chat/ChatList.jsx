"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import OnlineStatusBadge from "./OnlineStatusBadge";
import { cn } from "@/lib/utils";
import { Loader2, Search, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { formatListTime, getInitials, senderIdOf } from "./chatTime";

/**
 * ChatList Component
 *
 * Sidebar of conversations: photo (with an online dot when known), name,
 * last message preview ("You: …" for your own), short time, unread count.
 *
 * @param {Object} props - Component props
 * @param {Array<Object>} props.conversations - Conversations (otherParticipant, lastMessage, unreadCount)
 * @param {string} props.activeConversationId - ID of the currently active conversation
 * @param {Function} props.onSelectConversation - Callback when a conversation is selected
 * @param {string} [props.currentUserId] - Used to label your own last message "You:"
 * @param {Set<string>} [props.onlineUsers] - IDs known to be online right now
 * @param {boolean} props.isLoading - Whether conversations are loading
 * @param {Object} props.error - Error object if any
 */
export default function ChatList({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  currentUserId,
  onlineUsers,
  isLoading = false,
  error = null,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((conversation) => {
    const otherParticipant = conversation.otherParticipant || {};
    const userName = otherParticipant.fullName || otherParticipant.name || '';
    return userName.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const isOnline = (id) => !!id && typeof onlineUsers?.has === 'function' && onlineUsers.has(id.toString());

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#D4A843]/15 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-serif font-semibold text-[#1A1A1A]">Messages</h2>
          {totalUnread > 0 && (
            <span className="font-sans text-xs font-semibold text-[#1A1A1A] bg-[#F5E6C3] border border-[#D4A843]/40 rounded-full px-2.5 py-1">
              {totalUnread} unread
            </span>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2C3E50]/40" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by name"
            aria-label="Search conversations by name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-9 rounded-xl border border-[#D4A843]/25 bg-[#FDF8F0] font-sans text-[15px] text-[#1A1A1A] placeholder:text-[#2C3E50]/45 focus:outline-none focus:ring-2 focus:ring-[#D4A843]/35 focus:border-[#D4A843]/60"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2C3E50]/50 hover:text-[#2C3E50]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
        {isLoading && conversations.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-[#2C3E50] animate-spin" />
          </div>
        )}

        {error && !isLoading && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-sans text-[#C75B39] mb-2">
              {typeof error === 'string' ? error : error.message || "Failed to load conversations"}
            </p>
            <p className="text-xs font-sans text-[#2C3E50]/60">
              Please check your connection and try again
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && conversations.length === 0 && (
          <div className="px-6 py-12 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#F5E6C3] ring-1 ring-[#D4A843]/40 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-[#B8860B]" strokeWidth={1.75} />
            </div>
            <p className="font-serif text-lg text-[#1A1A1A]">No conversations yet</p>
            <p className="text-sm font-sans text-[#2C3E50]/70 mt-1 leading-relaxed">
              When you find someone you like, open their profile and tap <span className="font-semibold">Chat</span> to start a conversation.
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center justify-center mt-4 h-11 px-5 rounded-lg bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans text-sm font-semibold transition-colors"
            >
              Search Matches
            </Link>
          </div>
        )}

        {/* No Search Results */}
        {!isLoading && !error && filteredConversations.length === 0 && conversations.length > 0 && searchQuery && (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-sans text-[#2C3E50]/70">
              No conversations found for &quot;{searchQuery}&quot;
            </p>
          </div>
        )}

        {/* Conversation Items */}
        {!error && (
          <ul>
            {filteredConversations.map((conversation) => {
              const otherUser = conversation.otherParticipant || {};
              const userName = otherUser.fullName || otherUser.name || 'Unknown';
              const profilePictureUrl = otherUser.profilePicture?.url || otherUser.profilePicture || undefined;
              const unread = conversation.unreadCount || 0;
              const isActive = activeConversationId === conversation._id;
              const last = conversation.lastMessage;
              const lastIsMine = !!last && !!currentUserId && senderIdOf(last) === currentUserId.toString();
              const preview = last?.preview || last?.content || '';

              return (
                <li key={conversation._id}>
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conversation._id)}
                    aria-current={isActive ? 'true' : undefined}
                    aria-label={`${userName}${unread ? `, ${unread} unread` : ''}`}
                    className={cn(
                      "relative w-full px-4 py-3 flex items-center gap-3 text-left transition-colors border-b border-[#D4A843]/10",
                      isActive ? "bg-[#F5E6C3]/45" : "hover:bg-[#FDF8F0]"
                    )}
                  >
                    {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#D4A843]" aria-hidden="true" />}

                    <span className="relative shrink-0">
                      <Avatar className="w-12 h-12 ring-1 ring-[#D4A843]/25">
                        <AvatarImage src={profilePictureUrl} alt="" className="object-cover" />
                        <AvatarFallback className="bg-[#2C3E50] text-white font-sans text-sm">
                          {getInitials(userName)}
                        </AvatarFallback>
                      </Avatar>
                      <OnlineStatusBadge isOnline={isOnline(otherUser._id)} size="md" className="absolute bottom-0 right-0" />
                    </span>

                    <span className="flex-1 min-w-0">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn("font-sans text-[15px] text-[#1A1A1A] truncate", unread ? "font-bold" : "font-semibold")}>
                          {userName}
                        </span>
                        <span className={cn("text-xs font-sans shrink-0 tabular-nums", unread ? "text-[#B8860B] font-semibold" : "text-[#2C3E50]/55")}>
                          {formatListTime(last?.timestamp || conversation.updatedAt)}
                        </span>
                      </span>

                      <span className="flex items-center justify-between gap-2 mt-0.5">
                        <span className={cn("text-sm font-sans truncate", unread ? "text-[#1A1A1A] font-medium" : "text-[#2C3E50]/65")}>
                          {preview
                            ? <>{lastIsMine && <span className="text-[#2C3E50]/55">You: </span>}{preview}</>
                            : <span className="italic">Say hello</span>}
                        </span>
                        {unread > 0 && (
                          <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-[#D4A843] text-[#1A1A1A] font-sans text-[11px] font-bold flex items-center justify-center">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
