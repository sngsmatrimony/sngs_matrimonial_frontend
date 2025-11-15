"use client";

import { useState, useEffect } from "react";
import ChatList from "./ChatList";
import ChatConversation from "./ChatConversation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import OnlineStatusBadge from "./OnlineStatusBadge";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import useChatStore from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useLandingStore } from "@/store/landingStore";

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
  const { user } = useAuthStore();
  const { clearSelectedChatUserId } = useLandingStore();
  const {
    conversations,
    activeConversationId,
    messages,
    setActiveConversationId,
    loadConversations,
    getOrCreateConversation,
    sendMessage,
    markMessageAsRead,
    markConversationAsRead,
    loadMessages,
    isLoadingConversations,
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

  // Load conversations on mount (but don't fail if we have an initialUserId)
  useEffect(() => {
    const load = async () => {
      try {
        console.log('ChatLayout: Loading conversations...');
        await loadConversations();
        console.log('ChatLayout: Conversations loaded successfully');
      } catch (err) {
        console.error('ChatLayout: Failed to load conversations:', err);
        // If we're opening a conversation with initialUserId, this error is not fatal
        // The conversation will be created by getOrCreateConversation
      }
    };
    if (!initialUserId) {
      // Only load conversations if we're not opening a specific one
      load();
    } else {
      // Clear any previous errors since we're opening a specific conversation
      // (error clearing happens in the other effect)
    }
  }, [initialUserId, loadConversations]);

  // Handle initialUserId - open conversation with that user
  useEffect(() => {
    if (initialUserId && user) {
      const openInitialConversation = async () => {
        try {
          // Get or create conversation with the initial user
          const conversation = await getOrCreateConversation(initialUserId);
          if (conversation) {
            console.log('ChatLayout: Setting active conversation to:', conversation._id);
            setActiveConversationId(conversation._id);
          }
        } catch (error) {
          console.error("Failed to open initial conversation:", error);
        } finally {
          // Clear the selectedChatUserId from store after opening
          clearSelectedChatUserId();
        }
      };
      openInitialConversation();
    }
  }, [initialUserId, user, getOrCreateConversation, setActiveConversationId, clearSelectedChatUserId]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (activeConversationId) {
      console.log('ChatLayout: Loading messages for conversation:', activeConversationId);
      loadMessages(activeConversationId, 50, 0);
      // Mark all messages in conversation as read
      markConversationAsRead(activeConversationId);
    }
  }, [activeConversationId, loadMessages, markConversationAsRead]);

  // Detect mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);

    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  // Show conversation panel on mobile when a conversation is selected
  useEffect(() => {
    if (isMobileView && activeConversationId) {
      setShowConversationOnMobile(true);
    }
  }, [activeConversationId, isMobileView]);

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

  // Get initials for avatar fallback
  const getInitials = (name) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Handle sending a message
  const handleSendMessage = async (messageContent) => {
    if (!activeConversationId || !messageContent.trim()) return;

    try {
      await sendMessage(activeConversationId, messageContent);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle marking message as read
  const handleMarkAsRead = (messageId) => {
    if (activeConversationId) {
      markMessageAsRead(messageId, activeConversationId);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat List Sidebar - Hidden on mobile when conversation is shown */}
      <div
        className={cn(
          "w-full md:w-80 lg:w-96 border-r bg-white flex flex-col min-h-0",
          isMobileView && showConversationOnMobile && "hidden"
        )}
      >
        <ChatList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          isLoading={isLoadingConversations}
          error={error}
        />
      </div>

      {/* Conversation Panel - Hidden on mobile when no conversation is selected */}
      <div
        className={cn(
          "flex-1 flex flex-col min-h-0",
          isMobileView && !showConversationOnMobile && "hidden"
        )}
      >
        {/* Conversation Header */}
        {activeConversation && (
          <div className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {/* Back Button (Mobile Only) */}
              {isMobileView && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                  className="shrink-0 text-secondary hover:text-primary hover:bg-primary/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}

              {/* User Avatar and Info */}
              <div className="relative shrink-0">
                <Avatar className="w-10 h-10">
                  <AvatarImage
                    src={activeConversation.otherParticipant?.profilePicture?.url || activeConversation.otherParticipant?.profilePicture}
                    alt={activeConversation.otherParticipant?.fullName}
                  />
                  <AvatarFallback className="bg-secondary text-white font-telex">
                    {getInitials(activeConversation.otherParticipant?.fullName || 'User')}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div>
                <h3 className="font-maven font-semibold text-[15px] text-gray-900">
                  {activeConversation.otherParticipant?.fullName || 'Unknown'}
                </h3>
                <p className="text-xs font-telex text-gray-500">
                  Online
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Conversation Messages */}
        <ChatConversation
          conversationId={activeConversationId}
          messages={messages}
          currentUserId={user?._id}
          onSendMessage={handleSendMessage}
          onMarkAsRead={handleMarkAsRead}
          isLoadingMore={isLoadingMessages}
          isSending={isSending}
          error={error}
        />
      </div>
    </div>
  );
}
