'use client';

import { AlertCircle, X } from 'lucide-react';

// Elegant, on-brand alert banner used to surface validation/submission
// errors to the user (replaces default red Tailwind alert styling).
export function FormAlert({ message, onDismiss }) {
  if (!message) return null;
  const lines = message.split('\n').filter(Boolean);

  return (
    <div className="relative flex items-start gap-3 bg-[#FBEAE5] border border-[#E8B4A0] border-l-4 border-l-[#C75B39] text-[#8A3B22] px-4 py-3.5 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C75B39]/15 shrink-0 mt-0.5">
        <AlertCircle className="w-3.5 h-3.5 text-[#C75B39]" strokeWidth={2} />
      </span>
      <div className="flex-1 font-sans text-sm font-medium leading-relaxed pt-0.5">
        {lines.length > 1 ? (
          <ul className="space-y-1 list-disc list-inside marker:text-[#C75B39]/70">
            {lines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        ) : (
          <span>{lines[0]}</span>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="flex items-center gap-1 text-[#C75B39]/50 hover:text-[#C75B39] transition-colors shrink-0 mt-0.5"
        >
          <X className="w-4 h-4" strokeWidth={2} />
          <span className="hidden sm:inline font-sans text-xs">Dismiss</span>
        </button>
      )}
    </div>
  );
}
