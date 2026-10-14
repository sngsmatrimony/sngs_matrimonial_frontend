"use client";

import { cn } from "@/lib/utils";

/**
 * OnlineStatusBadge Component
 *
 * A calm, static green dot for "online" (no pulsing — the design system
 * avoids flashy animation). Renders nothing when not online.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOnline - Whether the user is currently online
 * @param {("sm"|"md"|"lg")} props.size - Size of the badge (default: "md")
 * @param {string} props.className - Additional CSS classes
 */
export default function OnlineStatusBadge({
  isOnline = false,
  size = "md",
  className
}) {
  if (!isOnline) {
    return null;
  }

  const sizeClasses = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
  };

  return (
    <span
      className={cn(
        "inline-block rounded-full bg-[#2E7D32] ring-2 ring-white",
        sizeClasses[size],
        className
      )}
      aria-label="Online"
      title="Online"
    />
  );
}
