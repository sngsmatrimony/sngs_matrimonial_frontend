"use client";

import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";
import { formatMessageTime, senderIdOf } from "./chatTime";

/**
 * MessageBubble Component
 *
 * One message. Own messages are navy with white text on the right; the other
 * person's are white cards on the left. Consecutive messages from the same
 * person are grouped: tighter spacing, and only the last one in a run gets
 * the "tail" corner.
 *
 * @param {Object} props - Component props
 * @param {Object} props.message - Message object (content, senderId, timestamp, isRead, isDelivered)
 * @param {string} props.currentUserId - ID of the current user
 * @param {Function} props.onMarkAsRead - Callback when a received message is viewed
 * @param {boolean} [props.isFirstInGroup=true] - First of a run from the same sender
 * @param {boolean} [props.isLastInGroup=true] - Last of a run from the same sender
 */
export default function MessageBubble({
  message,
  currentUserId,
  onMarkAsRead,
  isFirstInGroup = true,
  isLastInGroup = true,
}) {
  const currentUserIdString = (typeof currentUserId === 'object' ? currentUserId?._id : currentUserId)?.toString();
  const isMine = senderIdOf(message) === currentUserIdString;

  // Mark as read when a received message is viewed
  const handleView = () => {
    if (!isMine && !message.isRead && onMarkAsRead) {
      onMarkAsRead(message._id || message.id);
    }
  };

  const status = message.isRead ? 'Read' : message.isDelivered ? 'Delivered' : 'Sent';

  return (
    <div
      className={cn(
        "flex w-full",
        isMine ? "justify-end" : "justify-start",
        isFirstInGroup ? "mt-3" : "mt-1"
      )}
      onMouseEnter={handleView}
    >
      <div
        className={cn(
          "max-w-[82%] sm:max-w-[68%] px-3.5 pt-2 pb-1.5 shadow-sm",
          "rounded-2xl",
          isMine
            ? cn("bg-[#2C3E50] text-white", isLastInGroup && "rounded-br-md")
            : cn("bg-white text-[#1A1A1A] border border-[#D4A843]/20", isLastInGroup && "rounded-bl-md")
        )}
      >
        <p className="text-[15px] leading-relaxed font-sans whitespace-pre-wrap break-words">
          {message.content}
        </p>

        <div className={cn("flex items-center gap-1 mt-0.5", isMine ? "justify-end" : "justify-start")}>
          <span className={cn("text-[11px] font-sans tabular-nums", isMine ? "text-white/70" : "text-[#2C3E50]/55")}>
            {formatMessageTime(message.timestamp || message.createdAt)}
          </span>

          {isMine && (
            <span className="flex items-center" title={status}>
              {message.isRead ? (
                <CheckCheck className="w-4 h-4 text-[#D4A843]" strokeWidth={2.5} aria-hidden="true" />
              ) : message.isDelivered ? (
                <CheckCheck className="w-4 h-4 text-white/70" strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <Check className="w-4 h-4 text-white/70" strokeWidth={2.5} aria-hidden="true" />
              )}
              <span className="sr-only">{status}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
