"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import MessageInput from "./MessageInput";
import ChatSafetyBanner from "./ChatSafetyBanner";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, MessageCircle, ArrowDown } from "lucide-react";
import { formatDayLabel, isSameDay, senderIdOf } from "./chatTime";

// Messages from the same person within this gap read as one run.
const GROUP_GAP_MS = 5 * 60 * 1000;

const OPENERS = [
  "Namaskaram! I came across your profile and would love to know you better.",
  "Hello! I liked your profile. Would you be open to a conversation?",
  "Hi! Our families seem to share similar values. May I tell you a little about myself?",
];

/**
 * ChatConversation Component
 *
 * Message thread with day separators, grouped bubbles, typing indicator,
 * a "jump to latest" button when scrolled up, and suggested openers for a
 * brand-new conversation. Rendered with key={conversationId} by ChatLayout,
 * so all local state (scroll position, suggested draft) starts fresh per
 * conversation.
 *
 * @param {Object} props - Component props
 * @param {string} props.conversationId - ID of the current conversation
 * @param {Array<Object>} props.messages - Array of message objects
 * @param {string} props.currentUserId - ID of the current user
 * @param {string} [props.otherParticipantName] - Name of the person being chatted with
 * @param {Array<string>} props.typingUsers - Array of user IDs currently typing
 * @param {Object} props.typingUserDetails - Map of user IDs to user details
 * @param {Function} props.onLoadMore - Callback to load more (older) messages
 * @param {Function} props.onSendMessage - Callback when sending a new message
 * @param {Function} props.onTyping - Callback when user starts/stops typing
 * @param {Function} props.onMarkAsRead - Callback to mark message as read
 * @param {boolean} props.hasMoreMessages - Whether there are more messages to load
 * @param {boolean} props.isLoadingMore - Whether older messages are being loaded
 * @param {boolean} props.isSending - Whether a message is currently being sent
 * @param {Object} props.error - Error object if any
 */
export default function ChatConversation({
  conversationId,
  messages = [],
  currentUserId,
  otherParticipantName = "",
  typingUsers = [],
  typingUserDetails = {},
  onLoadMore,
  onSendMessage,
  onTyping,
  onMarkAsRead,
  hasMoreMessages = false,
  isLoadingMore = false,
  isSending = false,
  error = null,
}) {
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [draft, setDraft] = useState(null);
  const previousScrollHeight = useRef(0);

  // Scroll the message list (only the list — scrollIntoView would also
  // scroll the whole page on phones, pushing the header out of view).
  const scrollToBottom = (smooth = true) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };

  // Handle scroll to detect when to load more messages
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;

    // Check if scrolled to top
    if (onLoadMore && scrollTop === 0 && hasMoreMessages && !isLoadingMore) {
      previousScrollHeight.current = scrollHeight;
      onLoadMore();
    }

    // Determine if user is at the bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldScrollToBottom(isAtBottom);
  };

  // Scroll to bottom on initial load and when new messages arrive
  useEffect(() => {
    if (shouldScrollToBottom) {
      scrollToBottom(messages.length > 0);
    }
  }, [messages, shouldScrollToBottom]);

  // Maintain scroll position when loading older messages
  useEffect(() => {
    if (isLoadingMore && messagesContainerRef.current) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      messagesContainerRef.current.scrollTop = scrollDiff;
    }
  }, [isLoadingMore, messages]);

  // Scroll to bottom when typing indicator appears
  useEffect(() => {
    if (typingUsers.length > 0 && shouldScrollToBottom) {
      scrollToBottom();
    }
  }, [typingUsers, shouldScrollToBottom]);

  // Day separators + same-sender grouping, computed once per messages change.
  const rows = useMemo(() => messages.map((message, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const time = (m) => new Date(m?.timestamp || m?.createdAt).getTime();
    const sameRun = (a, b) => a && b && senderIdOf(a) === senderIdOf(b)
      && isSameDay(a.timestamp || a.createdAt, b.timestamp || b.createdAt)
      && Math.abs(time(b) - time(a)) < GROUP_GAP_MS;
    return {
      message,
      showDay: !prev || !isSameDay(prev.timestamp || prev.createdAt, message.timestamp || message.createdAt),
      isFirstInGroup: !sameRun(prev, message),
      isLastInGroup: !sameRun(message, next),
    };
  }), [messages]);

  const firstName = otherParticipantName?.split(" ")[0] || "them";

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FDF8F0] px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F5E6C3] ring-1 ring-[#D4A843]/40 flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-[#B8860B]" strokeWidth={1.75} />
          </div>
          <p className="text-xl font-serif text-[#1A1A1A] mb-1.5">
            Your conversations
          </p>
          <p className="text-[15px] font-sans text-[#2C3E50]/75 leading-relaxed">
            Choose a conversation on the left to continue chatting.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FDF8F0]">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-12 h-12 text-[#C75B39] mx-auto mb-4" />
          <p className="text-lg font-serif text-[#1A1A1A] mb-2">
            Error loading conversation
          </p>
          <p className="text-sm font-sans text-[#2C3E50]/70 mb-4">
            {error.message || "Something went wrong. Please try again."}
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-[#D4A843]/40 text-[#1A1A1A] hover:bg-[#F5E6C3]/40"
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FDF8F0] min-h-0 relative">
      <ChatSafetyBanner />

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-6 py-3 min-h-0 flex flex-col"
        role="log"
        aria-label={`Conversation with ${otherParticipantName || "member"}`}
      >
        {/* Load More Button */}
        {hasMoreMessages && (
          <div className="flex justify-center mb-2">
            <Button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              variant="outline"
              size="sm"
              className="rounded-full border-[#D4A843]/40 text-[#2C3E50] hover:bg-[#F5E6C3]/40 font-sans"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load older messages"
              )}
            </Button>
          </div>
        )}

        {/* Loading Indicator at Top */}
        {isLoadingMore && messages.length === 0 && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 text-[#2C3E50] animate-spin" />
          </div>
        )}

        {/* New conversation: warm start + suggested openers */}
        {messages.length === 0 && !isLoadingMore && (
          <div className="flex-1 flex items-center justify-center py-6">
            <div className="text-center max-w-md">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#F5E6C3] ring-1 ring-[#D4A843]/40 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-[#B8860B]" strokeWidth={1.75} />
              </div>
              <p className="font-serif text-lg text-[#1A1A1A] mb-1">
                Start your conversation with {firstName}
              </p>
              <p className="font-sans text-sm text-[#2C3E50]/70 mb-4">
                A warm, respectful first message goes a long way. Tap one to use it, or write your own.
              </p>
              <div className="flex flex-col gap-2">
                {OPENERS.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => setDraft({ text, nonce: Date.now() })}
                    className="text-left font-sans text-sm text-[#1A1A1A] bg-white border border-[#D4A843]/30 hover:border-[#D4A843] hover:bg-[#F5E6C3]/30 rounded-xl px-4 py-3 transition-colors"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages with day separators */}
        {rows.map(({ message, showDay, isFirstInGroup, isLastInGroup }) => (
          <Fragment key={message._id || message.id}>
            {showDay && (
              <div className="flex justify-center my-3" role="separator">
                <span className="font-sans text-xs font-medium text-[#2C3E50]/70 bg-white border border-[#D4A843]/20 rounded-full px-3 py-1 shadow-sm">
                  {formatDayLabel(message.timestamp || message.createdAt)}
                </span>
              </div>
            )}
            <MessageBubble
              message={message}
              currentUserId={currentUserId}
              onMarkAsRead={onMarkAsRead}
              isFirstInGroup={isFirstInGroup || showDay}
              isLastInGroup={isLastInGroup}
            />
          </Fragment>
        ))}

        {/* Typing Indicator */}
        <TypingIndicator
          typingUsers={typingUsers}
          typingUserDetails={typingUserDetails}
        />

        {/* Scroll Anchor */}
        <div ref={messagesEndRef} className="h-1 shrink-0" />
      </div>

      {/* Scrolled up: a labelled way back to the newest message */}
      {!shouldScrollToBottom && messages.length > 0 && (
        <button
          type="button"
          onClick={() => { setShouldScrollToBottom(true); scrollToBottom(); }}
          className="absolute left-1/2 -translate-x-1/2 bottom-24 z-10 inline-flex items-center gap-1.5 rounded-full bg-white border border-[#D4A843]/40 shadow-md px-4 py-2 font-sans text-sm font-medium text-[#1A1A1A] hover:bg-[#F5E6C3]/50"
        >
          <ArrowDown className="w-4 h-4" aria-hidden="true" />
          Latest messages
        </button>
      )}

      {/* Message Input - Only show when there's an active conversation */}
      {conversationId && (
        <MessageInput
          onSendMessage={onSendMessage}
          onTyping={onTyping}
          isLoading={isSending}
          disabled={!conversationId}
          draft={draft}
          placeholder={otherParticipantName ? `Message ${firstName}...` : "Type a message..."}
        />
      )}
    </div>
  );
}
