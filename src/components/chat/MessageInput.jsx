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
          className="hidden sm:inline-flex shrink-0 mb-1 text-[#2C3E50]/60 hover:text-[#D4A843] hover:bg-[#F5E6C3]/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
}) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingStartRef = useRef(0);

  // Handle message change and typing indicator
  const handleChange = (e) => {
    const value = e.target.value;
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

  // Handle Enter key to send (Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
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

  return (
    <div className="border-t border-[#D4A843]/15 bg-white px-4 py-3 shrink-0 sticky bottom-0 z-20">
      <div className="flex items-end gap-2">
        {/* Emoji Picker (desktop only) */}
        <EmojiPicker onSelect={handleEmojiSelect} disabled={disabled || isLoading} />

        {/* Message Textarea */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            "min-h-[40px] max-h-[120px] resize-none font-sans text-[15px] leading-relaxed rounded-xl",
            "border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          rows={1}
        />

        {/* Send Button */}
        <Button
          type="button"
          onClick={handleSend}
          disabled={!message.trim() || disabled || isLoading}
          className={cn(
            "shrink-0 bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] mb-1 px-3",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Send className="w-5 h-5 sm:mr-1.5" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>

      {/* Helper Text */}
      <p className="text-[11px] font-sans text-[#2C3E50]/50 mt-2 px-1">
        Press Enter to send, Shift + Enter for new line
      </p>
    </div>
  );
}
