"use client";

import { useState, useEffect, useRef } from "react";
import ChatList from "./ChatList";
import ChatConversation from "./ChatConversation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import OnlineStatusBadge from "./OnlineStatusBadge";
import { ArrowLeft, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import useChatStore from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useLandingStore } from "@/store/landingStore";
import Link from "next/link";
import { toastInfo } from "@/lib/toast";
import { broadcastTypingStart, broadcastTypingStop } from "@/lib/socket";
import { getInitials } from "./chatTime";
import { useEnforcementStatus } from "@/hooks/useEnforcementStatus";

/**
 * ChatLayout Component
 *
 * Full-page chat layout container with ChatList sidebar and ChatConversation panel.
 * Responsive for mobile (stacked layout on mobile).
 * Connects to Zustand stores for data management.
 *
 * @param {Object} props - Component props
 * @param {string} props.initialUserId - Optional ID of user to open conversation with on mount
 */
export default function ChatLayout({ initialUserId = null }) {
  const { user, membership } = useAuthStore();
  // Only gate profile links when paid access is actually enforced — in free
  // (promotional) mode everyone can open profiles, same as from Search.
  const enforcementActive = useEnforcementStatus();
  const hasNoMembership = enforcementActive && (!membership?.isActive || membership?.isExpired || membership?.credits <= 0);
  const { clearSelectedChatUserId } = useLandingStore();
  const {
    conversations,
    activeConversationId,
    messages,
    onlineUsers,
    typingUsers,
    setActiveConversationId,
    loadConversations,
    getOrCreateConversation,
    sendMessage,
    markMessageAsRead,
    markConversationAsRead,
    loadMessages,
    createConversationWithMessage,
    deleteConversation,
    isLoading: isLoadingConversations,
    isLoadingMessages,
    isSending,
    error,
  } = useChatStore();

  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationOnMobile, setShowConversationOnMobile] = useState(false);

  // Get active conversation details
  const activeConversation = conversations.find(
    (conv) => conv._id === activeConversationId
  );

  const otherParticipantId = activeConversation?.otherParticipant?._id;
  const typingUserId = activeConversationId ? typingUsers.get(activeConversationId) : null;
  const typingUserIds = typingUserId ? [typingUserId] : [];
  const typingUserDetails = otherParticipantId
    ? { [otherParticipantId]: { name: activeConversation.otherParticipant.fullName } }
    : {};

  const handleTyping = (isTyping) => {
    if (!activeConversationId || !otherParticipantId) return;
    const payload = { conversationId: activeConversationId, recipientId: otherParticipantId };
    if (isTyping) {
      broadcastTypingStart(payload);
    } else {
      broadcastTypingStop(payload);
    }
  };

  // Load conversations on mount - empty dependency array to run once
  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle initialUserId - create conversation immediately when chat button is clicked
  useEffect(() => {
    if (initialUserId && user) {
      // Create or get conversation immediately
      getOrCreateConversation(initialUserId);
      // Clear from landing store to prevent persistence
      clearSelectedChatUserId();
    }
    // Only re-run when initialUserId or user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUserId, user?._id]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (activeConversationId) {
      // markConversationAsRead reads the *current* messages in the store to
      // decide what to mark read — it must run after loadMessages resolves,
      // not in parallel with it, or it operates on stale/empty state left
      // over from whatever conversation (if any) was open before and finds
      // nothing to mark, silently no-op'ing the read receipt.
      (async () => {
        await loadMessages(activeConversationId, 50, 0);
        await markConversationAsRead(activeConversationId, user?._id);
      })();
    }
    // Only re-run when activeConversationId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  // Once the Messages page is gone, nothing is "open" to the user anymore.
  // Left set, receiveMessage treats the last-opened conversation as being
  // read and zeroes its unread badge on every other screen.
  useEffect(() => {
    return () => setActiveConversationId(null);
  }, [setActiveConversationId]);

  // Messages that arrived while this tab was hidden were not seen; catch up
  // as soon as the user comes back to the open conversation.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && activeConversationId && user?._id) {
        markConversationAsRead(activeConversationId, user._id);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [activeConversationId, markConversationAsRead, user?._id]);

  // Clean up empty conversations when navigating away from Messages tab
  // Store reference to current empty conversations to delete on unmount
  const emptyConversationIdsRef = useRef([]);

  useEffect(() => {
    // Update the list of empty conversation IDs whenever conversations change
    emptyConversationIdsRef.current = conversations
      .filter((conv) => !conv.lastMessage)
      .map((conv) => conv._id);
  }, [conversations]);

  useEffect(() => {
    // Only run cleanup on component unmount
    return () => {
      // Delete all empty conversations when leaving Messages tab
      if (emptyConversationIdsRef.current.length > 0) {
        emptyConversationIdsRef.current.forEach((convId) => {
          deleteConversation(convId).catch(() => {});
        });
      }
    };
  }, [deleteConversation]);

  // The chat fills the screen exactly, so the page itself should never
  // scroll (the site-wide bottom padding for the phone menu would otherwise
  // let it shift by 64px). Scrolling happens inside the lists. Restored on leave.
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => {
      html.style.overflow = previous;
    };
  }, []);

  // Detect mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);

    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  // Handle conversation selection
  const handleSelectConversation = (conversationId) => {
    setActiveConversationId(conversationId);
    if (isMobileView) {
      setShowConversationOnMobile(true);
    }
  };

  // Handle back button on mobile
  const handleBackToList = () => {
    setShowConversationOnMobile(false);
    setActiveConversationId(null);
  };

  // Handle sending a message
  const handleSendMessage = async (messageContent) => {
    if (!activeConversationId || !messageContent.trim()) return;
    await sendMessage(activeConversationId, messageContent);
  };

  // Handle marking message as read
  const handleMarkAsRead = (messageId) => {
    if (activeConversationId) {
      markMessageAsRead(messageId, activeConversationId);
    }
  };

  const other = activeConversation?.otherParticipant;
  const otherIsOnline = !!other?._id && typeof onlineUsers?.has === "function" && onlineUsers.has(other._id.toString());
  const profileHref = other?._id ? `/profiles/${other._id}` : "#";
  const guardProfileLink = (e) => {
    if (hasNoMembership) {
      e.preventDefault();
      toastInfo('Get a membership plan to view full profiles');
    }
  };

  return (
    // Fills exactly the space between the fixed top bar (65px) and, on
    // phones, the fixed bottom menu (64px + safe area); 121px on desktop
    // (top bar + tab bar).
    <div className="flex h-[calc(100dvh-129px-env(safe-area-inset-bottom))] md:h-[calc(100dvh-121px)] bg-[#FDF8F0] overflow-hidden">
      {/* Chat List Sidebar - Hidden on mobile when conversation is shown */}
      <div
        className={cn(
          "w-full md:w-80 lg:w-96 border-r border-[#D4A843]/15 bg-white flex flex-col min-h-0 shrink-0",
          isMobileView && showConversationOnMobile && "hidden"
        )}
      >
        <ChatList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          currentUserId={user?._id}
          onlineUsers={onlineUsers}
          isLoading={isLoadingConversations}
          error={error}
        />
      </div>

      {/* Conversation Panel - Hidden on mobile when no conversation is selected */}
      <div
        className={cn(
          "flex-1 flex flex-col min-h-0 min-w-0",
          isMobileView && !showConversationOnMobile && "hidden"
        )}
      >
        {/* Conversation Header */}
        {activeConversation && (
          <div className="bg-white border-b border-[#D4A843]/15 px-2 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3 shrink-0">
            {isMobileView && (
              <Button
                variant="ghost"
                onClick={handleBackToList}
                className="shrink-0 h-10 px-2 text-[#2C3E50] hover:text-[#1A1A1A] hover:bg-[#F5E6C3]/40 font-sans"
              >
                <ArrowLeft className="w-5 h-5 mr-1" aria-hidden="true" />
                Back
              </Button>
            )}

            <Link href={profileHref} onClick={guardProfileLink} className="relative shrink-0" tabIndex={-1} aria-hidden="true">
              <Avatar className="w-11 h-11 ring-1 ring-[#D4A843]/30">
                <AvatarImage
                  src={other?.profilePicture?.url || other?.profilePicture}
                  alt=""
                  className="object-cover"
                />
                <AvatarFallback className="bg-[#2C3E50] text-white font-sans text-sm">
                  {getInitials(other?.fullName || 'User')}
                </AvatarFallback>
              </Avatar>
              <OnlineStatusBadge isOnline={otherIsOnline} size="sm" className="absolute bottom-0 right-0" />
            </Link>

            <div className="flex-1 min-w-0">
              <h3 className="font-serif font-semibold text-[17px] leading-tight text-[#1A1A1A] truncate">
                {other?.fullName || 'Unknown'}
              </h3>
              {otherIsOnline && (
                <p className="font-sans text-xs text-[#2E7D32] font-medium">Online</p>
              )}
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="shrink-0 h-10 rounded-lg border-[#D4A843]/40 text-[#1A1A1A] hover:bg-[#F5E6C3]/40 font-sans"
            >
              <Link href={profileHref} onClick={guardProfileLink}>
                <UserRound className="w-4 h-4 sm:mr-1.5" aria-hidden="true" />
                <span className="hidden sm:inline">View profile</span>
                <span className="sm:hidden">Profile</span>
              </Link>
            </Button>
          </div>
        )}

        {/* Conversation Messages — keyed so each conversation starts fresh */}
        <ChatConversation
          key={activeConversationId || 'none'}
          conversationId={activeConversationId}
          messages={messages}
          currentUserId={user?._id}
          otherParticipantName={other?.fullName || ''}
          onSendMessage={handleSendMessage}
          onMarkAsRead={handleMarkAsRead}
          isLoadingMore={isLoadingMessages}
          isSending={isSending}
          error={error}
          typingUsers={typingUserIds}
          typingUserDetails={typingUserDetails}
          onTyping={handleTyping}
        />
      </div>
    </div>
  );
}
