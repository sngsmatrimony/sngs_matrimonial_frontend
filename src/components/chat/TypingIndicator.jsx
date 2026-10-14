"use client";

/**
 * TypingIndicator Component
 *
 * "Name is typing" with three softly fading dots — a gentle opacity pulse,
 * no bouncing (the design system avoids bouncy animation).
 *
 * @param {Object} props - Component props
 * @param {Array<string>} props.typingUsers - Array of user IDs who are currently typing
 * @param {Object} props.typingUserDetails - Map of user IDs to user details (name, etc.)
 */
export default function TypingIndicator({ typingUsers = [], typingUserDetails = {} }) {
  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  const typingUserName = typingUserDetails[typingUsers[0]]?.name?.split(' ')[0] || "Someone";

  return (
    <div className="flex w-full justify-start mt-3" aria-live="polite">
      <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5 bg-white border border-[#D4A843]/20 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-sans text-[#2C3E50]/75">
            {typingUserName} is typing
          </span>
          <span className="flex items-center gap-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#D4A843] chat-typing-dot"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </span>
        </div>
      </div>

      <style jsx>{`
        .chat-typing-dot {
          animation: chatTypingFade 1.2s infinite ease-in-out;
        }
        @keyframes chatTypingFade {
          0%, 80%, 100% { opacity: 0.25; }
          40% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .chat-typing-dot { animation: none; opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
