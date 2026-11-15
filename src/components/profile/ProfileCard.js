'use client';

import { useCallback, useState, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Lock, MapPin, GraduationCap, Briefcase, BadgeCheck, ShieldAlert, User as UserIcon, Bookmark, Sparkles } from 'lucide-react';
import { getVerificationState } from '@/lib/verification';
import { useLandingStore } from '@/store/landingStore';
import { useAuthStore } from '@/store/authStore';
import { useLikeMutation } from '@/hooks/useLikeMutation';
import { useShortlistMutation } from '@/hooks/useShortlistMutation';
import { useEnforcementStatus } from '@/hooks/useEnforcementStatus';
import { formatRelativeActivity } from '@/lib/time';
import { isPlanLapsed } from '@/lib/membershipStatus';
import SpendCreditsDialog from '@/components/shared/SpendCreditsDialog';
import LimitedViewDialog from '@/components/profile/LimitedViewDialog';

function formatLocation(profile) {
  const addr = profile?.presentResidentialAddress;
  // Locked cards come without the city (state and country only).
  const parts = addr?.city ? [addr.city, addr.state || addr.country] : [addr?.state, addr?.country];
  return parts.filter(Boolean).join(', ');
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Locked cards get a blurred preview served by the API (a relative path).
function photoSrc(profile) {
  const url = profile?.profilePicture?.url;
  if (!url) return null;
  return profile.profilePicture.preview ? `${API_BASE_URL}${url}` : url;
}

// `badge`: e.g. "Interested in you" on the Liked page's Received tab.
function ProfileCard({ profile, isLiked = false, isShortlisted = false, badge = null }) {
  // All hooks must be called before any early returns
  const router = useRouter();
  const { membership } = useAuthStore();
  const { setSelectedChatUserId } = useLandingStore();
  const { toggleLike, isLoading } = useLikeMutation();
  const { toggleShortlist, isLoading: isShortlistLoading } = useShortlistMutation();
  const [showSpendDialog, setShowSpendDialog] = useState(false);
  const [showLimitedDialog, setShowLimitedDialog] = useState(false);
  // A missing/deleted photo file would otherwise show a broken-image icon + alt text.
  const [imageFailed, setImageFailed] = useState(false);

  // Check if user has no membership or expired/no credits (only matters when enforcement is on)
  const enforcementActive = useEnforcementStatus();
  const hasNoMembership = enforcementActive && (!membership?.isActive || membership?.isExpired || membership?.credits <= 0);

  // Viewing a never-unlocked profile (server already told us via
  // `nameMasked`) spends the plan's profileView cost — confirm before
  // navigating rather than letting the charge happen silently on load. Only
  // relevant when the member actually has an active, non-unlimited,
  // nonzero-cost plan; otherwise there's nothing meaningful to confirm and
  // the existing no-membership/insufficient-credits screen on the profile
  // detail page already handles those cases.
  const profileViewCost = membership?.planId?.costs?.profileView;
  const validPlan = !!membership?.isActive && !membership?.isExpired;
  const lockedHere = enforcementActive && !!profile?.nameMasked;
  const needsSpendConfirm =
    lockedHere &&
    validPlan &&
    profileViewCost &&
    !profileViewCost.unlimited &&
    profileViewCost.cost > 0;
  // No valid plan: the free limited view, or a plan (LimitedViewDialog).
  const needsLimitedChoice = lockedHere && !validPlan;

  const handleLike = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profile?._id || isLoading) return;
    toggleLike(profile._id, profile, isLiked);
  }, [isLoading, profile, isLiked, toggleLike]);

  const handleShortlist = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profile?._id || isShortlistLoading) return;
    toggleShortlist(profile._id, profile, isShortlisted);
  }, [isShortlistLoading, profile, isShortlisted, toggleShortlist]);

  const handleChat = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profile?._id) return;
    setSelectedChatUserId(profile._id);
    router.push('/messages');
  }, [profile, setSelectedChatUserId, router]);

  const handleCardClick = useCallback((e) => {
    // A locked profile asks first. On a valid plan: spend the credits (the
    // dialog says "Not enough credits" at 0) or see the free limited view.
    // Without one: the limited view or a plan. One the member already
    // unlocked keeps opening in full, even at 0 credits.
    if (needsSpendConfirm) {
      e.preventDefault();
      setShowSpendDialog(true);
      return;
    }
    if (needsLimitedChoice) {
      e.preventDefault();
      setShowLimitedDialog(true);
    }
  }, [needsSpendConfirm, needsLimitedChoice]);

  const handleConfirmSpend = useCallback(() => {
    setShowSpendDialog(false);
    if (profile?._id) router.push(`/profiles/${profile._id}`);
  }, [router, profile]);

  const openLimitedView = useCallback(() => {
    setShowSpendDialog(false);
    setShowLimitedDialog(false);
    if (profile?._id) router.push(`/profiles/${profile._id}?view=limited`);
  }, [router, profile]);

  // Validate profile data (after hooks)
  if (!profile || !profile._id || profile._id === 'undefined' || profile._id === 'null') {
    return null;
  }

  const profileImageUrl = photoSrc(profile);
  const isPhotoPreview = !!profile?.profilePicture?.preview;
  const location = formatLocation(profile);
  const verification = getVerificationState(profile);
  const activityLabel = formatRelativeActivity(profile?.lastActiveAt);

  return (
    <>
    <Link
      href={`/profiles/${profile._id}`}
      onClick={handleCardClick}
      className="block bg-white rounded-xl border border-[#D4A843]/15 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
    >
      {/* Photo */}
      <div className="relative aspect-[4/5] bg-[#F5E6C3]/40 overflow-hidden">
        {profileImageUrl && !imageFailed ? (
          <Image
            src={profileImageUrl}
            alt={isPhotoPreview ? 'Blurred photo — unlock the profile to see it' : profile?.fullName || 'Profile photo'}
            fill
            className="object-cover select-none"
            sizes="(max-width: 768px) 50vw, 280px"
            unoptimized
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onError={() => setImageFailed(true)}
          />
        ) : (
          // When locked, the lock overlay below takes the centre (and says
          // there's no photo), so the placeholder would only sit behind it.
          !hasNoMembership && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <UserIcon className="w-14 h-14 text-[#D4A843]/40" strokeWidth={1.5} />
              <span className="font-sans text-xs text-[#2C3E50]/50">Photo not available</span>
            </div>
          )
        )}

        {verification === 'verified' && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/95 text-[#2E7D32] text-xs font-sans font-semibold px-2.5 py-1 rounded-full shadow-sm">
            <BadgeCheck size={13} strokeWidth={2} />
            Verified
          </span>
        )}
        {verification === 'notVerified' && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/95 text-[#2C3E50]/75 text-xs font-sans font-medium px-2.5 py-1 rounded-full shadow-sm">
            <ShieldAlert size={13} strokeWidth={2} />
            ID not verified
          </span>
        )}

        {typeof profile?.matchScore === 'number' && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-[#D4A843] text-[#1A1A1A] text-xs font-sans font-semibold px-2.5 py-1 rounded-full shadow-sm">
            <Sparkles size={12} strokeWidth={2} />
            {profile.matchScore}% Match
          </span>
        )}

        {/* Light tint only: the photo underneath is already a soft preview,
            and members should still see roughly who's there. */}
        {hasNoMembership && (
          <div className="absolute inset-0 bg-[#1A1A1A]/15 flex flex-col items-center justify-center gap-1.5">
            <div className="bg-white/95 rounded-full p-3 shadow-lg">
              <Lock className="w-5 h-5 text-[#D4A843]" />
            </div>
            <span className="font-sans text-xs font-semibold text-white bg-[#1A1A1A]/60 px-2.5 py-1 rounded-full">
              Tap to Unlock
            </span>
            {(!profileImageUrl || imageFailed) && (
              <span className="font-sans text-xs font-medium text-[#2C3E50]">No photo added yet</span>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <h3 className="font-serif text-lg font-semibold text-[#1A1A1A] truncate">
            {profile?.fullName || 'Member'}
          </h3>
          {profile?.age && (
            <span className="font-sans text-sm text-[#2C3E50]/70 shrink-0">{profile.age} yrs</span>
          )}
        </div>
        {badge && (
          <p className="inline-flex items-center gap-1 mb-2 font-sans text-xs font-semibold text-[#C75B39] bg-[#C75B39]/10 px-2.5 py-0.5 rounded-full">
            <Heart size={11} className="fill-[#C75B39]" aria-hidden="true" />
            {badge}
          </p>
        )}

        <div className="space-y-1 mb-3">
          {profile?.education && (
            <p className="flex items-center gap-1.5 font-sans text-xs text-[#2C3E50]/80 truncate">
              <GraduationCap size={13} className="text-[#D4A843] shrink-0" />
              {profile.education}
            </p>
          )}
          {profile?.occupation ? (
            <p className="flex items-center gap-1.5 font-sans text-xs text-[#2C3E50]/80 truncate">
              <Briefcase size={13} className="text-[#D4A843] shrink-0" />
              {profile.occupation}
            </p>
          ) : profile?.nameMasked && (
            <p className="flex items-center gap-1.5 font-sans text-xs text-[#2C3E50]/55 truncate">
              <Lock size={12} className="text-[#D4A843]/70 shrink-0" />
              Job details after unlock
            </p>
          )}
          {location && (
            <p className="flex items-center gap-1.5 font-sans text-xs text-[#2C3E50]/80 truncate">
              <MapPin size={13} className="text-[#D4A843] shrink-0" />
              {location}
            </p>
          )}
          {activityLabel && (
            <p className="flex items-center gap-1.5 font-sans text-xs text-[#2E7D32]/80 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] shrink-0" />
              {activityLabel}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleLike}
            disabled={isLoading}
            className={`col-span-2 h-10 inline-flex items-center justify-center gap-1.5 font-sans text-sm font-semibold px-3 rounded-lg border whitespace-nowrap transition-colors disabled:opacity-50 ${
              isLiked
                ? 'bg-[#C75B39]/10 border-[#C75B39]/40 text-[#C75B39]'
                : 'bg-[#D4A843] border-[#D4A843] text-[#1A1A1A] hover:bg-[#B8860B]'
            }`}
          >
            <Heart size={14} className={isLiked ? 'fill-[#C75B39]' : ''} />
            {isLiked ? 'Liked' : 'Express Interest'}
          </button>
          <button
            onClick={handleShortlist}
            disabled={isShortlistLoading}
            aria-label={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
            title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
            className={`h-10 inline-flex items-center justify-center gap-1.5 font-sans text-sm font-semibold px-3 rounded-lg border whitespace-nowrap transition-colors disabled:opacity-50 ${
              isShortlisted
                ? 'bg-[#2C3E50]/10 border-[#2C3E50]/40 text-[#2C3E50]'
                : 'border-[#D4A843]/40 text-[#1A1A1A] hover:bg-[#F5E6C3]/40'
            }`}
          >
            <Bookmark size={14} className={isShortlisted ? 'fill-[#2C3E50]' : ''} />
            {isShortlisted ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={handleChat}
            aria-label="Send message"
            className="h-10 inline-flex items-center justify-center gap-1.5 font-sans text-sm font-semibold px-3 rounded-lg border border-[#D4A843]/40 text-[#1A1A1A] hover:bg-[#F5E6C3]/40 whitespace-nowrap transition-colors"
          >
            <MessageCircle size={14} />
            Chat
          </button>
        </div>
      </div>
    </Link>
    {/* Outside the card's link on purpose: clicks inside the dialog (even
        though it renders in a portal) bubble through React to its parent,
        so inside the link "Cancel" re-triggered the card click and reopened
        the dialog, and "Continue" ran the card click a second time. */}
    {needsSpendConfirm && (
      <SpendCreditsDialog
        open={showSpendDialog}
        cost={profileViewCost.cost}
        activityLabel="Viewing this profile"
        onConfirm={handleConfirmSpend}
        onCancel={() => setShowSpendDialog(false)}
        secondaryAction={{ label: 'See limited details for free', onClick: openLimitedView }}
      />
    )}
    {needsLimitedChoice && (
      <LimitedViewDialog
        open={showLimitedDialog}
        onContinue={openLimitedView}
        onUpgrade={() => { setShowLimitedDialog(false); router.push('/membership/purchase'); }}
        onCancel={() => setShowLimitedDialog(false)}
        upgradeLabel={isPlanLapsed(membership) ? 'Renew Plan' : 'Upgrade Plan'}
      />
    )}
    </>
  );
}

// Memoize to prevent unnecessary re-renders when parent state changes
export default memo(ProfileCard);
