'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BadgeCheck, MapPin, ShieldAlert } from 'lucide-react';
import ImageLightbox from '@/components/ui/image-lightbox';
import { getVerificationState } from '@/lib/verification';

function formatLocation(profile) {
  const addr = profile?.presentResidentialAddress;
  const parts = [addr?.city, addr?.state, addr?.country].filter(Boolean);
  return parts.join(', ');
}

/**
 * Shared header for both the self and other profile views: photo, name, age,
 * location, verification badge. `mode` controls the back button (other only)
 * and the primary action (Edit Profile for self, passed in by the caller).
 */
export default function ProfileHeader({ profile, mode = 'self', primaryAction }) {
  const router = useRouter();
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const bannerStyle = { backgroundColor: profile?.profileBanner?.bannerColor || '#F5E6C3' };
  // A missing/deleted photo file falls back to the "No Photo" placeholder.
  const profileImageUrl = imageFailed ? null : profile?.profilePicture?.url;
  const verification = getVerificationState(profile);
  const location = formatLocation(profile);
  const genderLabel = profile?.gender ? profile.gender[0].toUpperCase() + profile.gender.slice(1) : null;

  return (
    <div className="relative">
      {/* Banner */}
      <div className="w-full h-32 sm:h-40 rounded-t-2xl relative" style={bannerStyle}>
        {mode === 'other' && (
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Overlapped info row */}
      <div className="px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14">
          <div
            className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-white overflow-hidden shadow-lg bg-[#F5E6C3]/40 flex items-center justify-center shrink-0 ${profileImageUrl ? 'cursor-pointer' : ''}`}
            onClick={() => profileImageUrl && setLightboxIndex(0)}
            role={profileImageUrl ? 'button' : undefined}
            aria-label={profileImageUrl ? 'View profile photo' : undefined}
          >
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt={profile?.fullName || 'Profile'}
                fill
                className="object-cover select-none"
                sizes="128px"
                unoptimized
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span className="text-center text-[#2C3E50]/40 font-sans text-xs px-2">No Photo</span>
            )}
          </div>

          {profileImageUrl && (
            <ImageLightbox
              images={[{ url: profileImageUrl, alt: profile?.fullName || 'Profile photo' }]}
              index={lightboxIndex}
              onOpenChange={setLightboxIndex}
            />
          )}

          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
                {profile?.fullName}
              </h1>
              {verification === 'verified' && (
                <span className="inline-flex items-center gap-1 bg-[#2E7D32]/10 text-[#2E7D32] text-xs font-sans font-semibold px-2.5 py-1 rounded-full">
                  <BadgeCheck size={14} strokeWidth={2} />
                  Verified
                </span>
              )}
              {verification === 'notVerified' && (
                <span className="inline-flex items-center gap-1 bg-[#2C3E50]/8 text-[#2C3E50]/80 text-xs font-sans font-medium px-2.5 py-1 rounded-full border border-[#2C3E50]/15">
                  <ShieldAlert size={14} strokeWidth={2} />
                  Not ID verified
                </span>
              )}
            </div>
            <p className="font-sans text-[#2C3E50] text-sm mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              {profile?.age && <span>{profile.age} yrs</span>}
              {genderLabel && <span>{genderLabel}</span>}
              {location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} className="text-[#D4A843]" />
                  {location}
                </span>
              )}
            </p>
          </div>

          {primaryAction && <div className="pb-1 shrink-0">{primaryAction}</div>}
        </div>

        {/* Below the overlapping photo row (not inside it) so extra text can't
            push the name up under the banner. */}
        {verification === 'notVerified' && mode === 'other' && (
          <p className="flex items-start gap-2 font-sans text-sm text-[#2C3E50]/80 mt-4 max-w-2xl px-3 py-2.5 rounded-lg bg-[#F5E6C3]/40 border border-[#D4A843]/25">
            <ShieldAlert size={16} className="text-[#B8860B] shrink-0 mt-0.5" strokeWidth={2} />
            <span>
              {profile?.idProofSubmitted
                ? 'This member’s ID proof is awaiting verification. Our team approved this profile based on the details provided.'
                : 'This member hasn’t submitted an ID proof. Our team approved this profile based on the details provided.'}
            </span>
          </p>
        )}

        {profile?.profileAbout && (
          <p className="font-sans text-[#2C3E50] text-sm leading-relaxed mt-4 max-w-2xl">
            {profile.profileAbout}
          </p>
        )}
      </div>
    </div>
  );
}
