'use client';

import { ImageOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const joinList = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

/**
 * Shown in place of the registration form when the account was created but
 * some files didn't upload. A full page on purpose: the old pop-up was easy
 * to miss on a phone, leaving members waiting for an approval that can't
 * happen without photos.
 */
export default function RegistrationUploadIssue({ missing, photosMissing, retrying, onRetry, onChooseOther, onLater }) {
  return (
    <Card className="border border-white/40 shadow-[0_25px_70px_-20px_rgba(0,0,0,0.55)] bg-white/97 ring-1 ring-[#D4A843]/15 w-full max-w-2xl mx-auto rounded-[28px] overflow-hidden py-0 gap-0">
      <CardHeader className="pb-7 pt-9 px-6 sm:px-10 bg-gradient-to-br from-[#2C3E50] via-[#233240] to-[#1A2733] relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D4A843]/0 via-[#D4A843] to-[#D4A843]/0" />
        <div className="flex items-start gap-3.5 relative">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#F5E6C3] to-[#EAD5A0] text-[#C75B39] ring-2 ring-[#D4A843]/40 ring-offset-2 ring-offset-[#2C3E50] shadow-lg shrink-0">
            <ImageOff className="w-5 h-5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="font-sans text-[11px] tracking-[0.18em] uppercase text-[#D4A843] font-semibold mb-1">
              Account created
            </p>
            <h1 className="font-serif text-2xl text-white font-bold leading-tight tracking-tight">
              {photosMissing ? 'Your photos didn’t upload' : 'Some files didn’t upload'}
            </h1>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 sm:px-10 py-8 space-y-6">
        <div className="space-y-3 font-sans text-[15px] leading-relaxed text-[#2C3E50]">
          <p>
            Your account is ready, but we couldn&apos;t upload {joinList(missing)}. This usually
            happens on a weak or interrupted internet connection.
          </p>
          {photosMissing && (
            <p className="font-medium text-[#1A1A1A]">
              Our team can only review and approve your profile once your photos are added.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="h-12 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#C99A3A] hover:from-[#C99A3A] hover:to-[#B8860B] text-[#1A1A1A] font-sans font-semibold shadow-md disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Uploading...' : 'Try Again'}
          </Button>
          {photosMissing && (
            <Button
              type="button"
              variant="outline"
              onClick={onChooseOther}
              disabled={retrying}
              className="h-12 rounded-xl border-2 border-[#D4A843] text-[#8A6A1A] hover:bg-[#F5E6C3]/40 font-sans font-semibold"
            >
              Choose Different Photos
            </Button>
          )}
          <button
            type="button"
            onClick={onLater}
            disabled={retrying}
            className="font-sans text-sm text-[#2C3E50] hover:underline underline-offset-4 py-2 disabled:opacity-50"
          >
            I&apos;ll do this later from my profile
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
