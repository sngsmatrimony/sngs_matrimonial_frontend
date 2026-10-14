"use client";

import { ShieldCheck } from "lucide-react";

/**
 * Persistent (non-dismissible) safety notice shown above every open
 * conversation. Deliberately always visible, not a one-time dismissible
 * tip — this is a standing safety/compliance notice, not onboarding UI.
 * Kept short so it doesn't crowd the conversation on phones.
 */
export default function ChatSafetyBanner() {
  return (
    <div className="flex items-start gap-2 px-4 py-2 bg-[#F5E6C3]/45 border-b border-[#D4A843]/20 shrink-0">
      <ShieldCheck size={15} className="text-[#B8860B] shrink-0 mt-0.5" aria-hidden="true" />
      <p className="font-sans text-xs text-[#2C3E50] leading-relaxed">
        <span className="font-semibold">Stay safe:</span> never share bank details or OTPs, or send money.
        Verify identity before sharing personal details.
      </p>
    </div>
  );
}
