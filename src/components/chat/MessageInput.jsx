"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Send, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

// Curated, non-cartoonish set appropriate for a matrimony chat context —
// everyday reactions and affection, not a full emoji keyboard.
const EMOJI_OPTIONS = [
  "😊", "😄", "🙂", "😍", "🥰", "😘", "😂", "🙏",
  "❤️", "💛", "💐", "🌸", "✨", "🎉", "🎊", "👍",
  "👏", "🤝", "😎", "😇", "☺️", "💍", "💑", "🙌",
];

function EmojiPicker({ onSelect, disabled }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="hidden sm:inline-flex shrink-0 h-10 w-10 rounded-full text-[#2C3E50]/60 hover:text-[#B8860B] hover:bg-[#F5E6C3]/60 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Insert emoji"
        >
          <Smile className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start" side="top">
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSelect(emoji)}
              className="text-xl leading-none rounded-md p-1.5 hover:bg-[#F5E6C3]/60 transition-colors"
              aria-label={`Insert ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const TYPING_REFRESH_MS = 2000;
// Matches the server's per-message limit (chat.socket.js / chat.controller.js).
const MAX_LENGTH = 4000;

/**
 * MessageInput Component
 *
 * Text input area for composing messages with send button and emoji support.
 *
 * @param {Object} props - Component props
 * @param {Function} props.onSendMessage - Callback when message is sent (receives message text)
 * @param {Function} props.onTyping - Callback when user is typing
 * @param {boolean} props.isLoading - Whether a message is currently being sent
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {string} props.placeholder - Placeholder text
 */
export default function MessageInput({
  onSendMessage,
  onTyping,
  isLoading = false,
  disabled = false,
  placeholder = "Type a message...",
  draft = null, // { text, nonce } — fills the box (e.g. a suggested opener) without sending
}) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingStartRef = useRef(0);

  // A suggestion chip was picked: put it in the box for the member to edit
  // and send (React's "adjust state when a prop changes" pattern).
  const [appliedDraftNonce, setAppliedDraftNonce] = useState(null);
  if (draft?.text && draft.nonce !== appliedDraftNonce) {
    setAppliedDraftNonce(draft.nonce);
    setMessage(draft.text.slice(0, MAX_LENGTH));
  }
  useEffect(() => {
    if (!appliedDraftNonce) return;
    const t = textareaRef.current;
    if (t) {
      t.focus();
      t.setSelectionRange(t.value.length, t.value.length);
    }
  }, [appliedDraftNonce]);

  // Handle message change and typing indicator
  const handleChange = (e) => {
    const value = e.target.value.slice(0, MAX_LENGTH);
    setMessage(value);

    // Trigger typing indicator. The server drops a typing state after 5s without
    // a refresh, so re-announce during long bursts instead of only on the first key.
    if (onTyping && value.trim()) {
      const now = Date.now();
      if (!isTyping || now - lastTypingStartRef.current > TYPING_REFRESH_MS) {
        setIsTyping(true);
        lastTypingStartRef.current = now;
        onTyping(true);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTyping(false);
      }, 1000);
    } else if (isTyping && !value.trim()) {
      setIsTyping(false);
      if (onTyping) onTyping(false);
    }
  };

  // Handle send message
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && onSendMessage && !isLoading) {
      onSendMessage(trimmedMessage);
      setMessage("");
      setIsTyping(false);
      if (onTyping) onTyping(false);

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  // Enter sends on desktop (Shift+Enter = new line). On touch screens Enter
  // adds a new line and the member taps Send — avoids accidental sends.
  const handleKeyDown = (e) => {
    const isTouch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
    if (e.key === "Enter" && !e.shiftKey && !isTouch) {
      e.preventDefault();
      handleSend();
    }
  };

  // Insert an emoji at the current cursor position rather than always
  // appending to the end, so it works naturally mid-sentence too.
  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? message.length;
    const end = textarea?.selectionEnd ?? message.length;
    const nextMessage = message.slice(0, start) + emoji + message.slice(end);
    setMessage(nextMessage);

    requestAnimationFrame(() => {
      if (textarea) {
        const cursorPos = start + emoji.length;
        textarea.focus();
        textarea.setSelectionRange(cursorPos, cursorPos);
      }
    });
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const remaining = MAX_LENGTH - message.length;

  return (
    <div className="border-t border-[#D4A843]/15 bg-white px-3 sm:px-4 py-3 shrink-0">
      <div className="flex items-end gap-2">
        <div className="flex-1 flex items-end gap-1 rounded-3xl border border-[#D4A843]/30 bg-[#FDF8F0] pl-2 pr-1 focus-within:border-[#D4A843] focus-within:ring-2 focus-within:ring-[#D4A843]/25 transition-colors">
          {/* Emoji Picker (desktop only) */}
          <EmojiPicker onSelect={handleEmojiSelect} disabled={disabled || isLoading} />

          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            aria-label="Type a message"
            maxLength={MAX_LENGTH}
            className={cn(
              "min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent shadow-none px-2 py-2.5",
              "font-sans text-[15px] leading-relaxed focus-visible:ring-0 focus-visible:border-0",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            rows={1}
          />
        </div>

        <Button
          type="button"
          onClick={handleSend}
          disabled={!message.trim() || disabled || isLoading}
          className="shrink-0 h-11 rounded-full px-4 bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4 mr-1.5" aria-hidden="true" />
          Send
        </Button>
      </div>

      <div className="flex justify-between gap-2 mt-1.5 px-2 min-h-[16px]">
        <p className="hidden md:block text-[11px] font-sans text-[#2C3E50]/50">
          Enter to send · Shift + Enter for a new line
        </p>
        {remaining <= 500 && (
          <p className={cn("text-[11px] font-sans ml-auto tabular-nums", remaining <= 100 ? "text-[#C75B39]" : "text-[#2C3E50]/60")}>
            {remaining} characters left
          </p>
        )}
      </div>
    </div>
  );
}
