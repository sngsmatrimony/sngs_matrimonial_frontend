"use client";

import { ShieldAlert } from "lucide-react";

/**
 * Persistent (non-dismissible) safety notice shown above every open
 * conversation. Deliberately always visible, not a one-time dismissible
 * tip — this is a standing safety/compliance notice, not onboarding UI.
 */
export default function ChatSafetyBanner() {
  return (
    <div className="flex items-start gap-2.5 px-4 py-2.5 bg-[#F5E6C3]/50 border-b border-[#D4A843]/20">
      <ShieldAlert size={16} className="text-[#B8860B] shrink-0 mt-0.5" />
      <p className="font-sans text-xs text-[#2C3E50] leading-relaxed">
        For your safety: never share bank details, OTPs, or send money to anyone you meet here.
        Verify identity before sharing personal information, and report anything suspicious.
      </p>
    </div>
  );
}
