'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BadgeCheck, MapPin } from 'lucide-react';
import ImageLightbox from '@/components/ui/image-lightbox';
import PhotoWatermark, { buildWatermarkText } from '@/components/ui/photo-watermark';
import { useAuthStore } from '@/store/authStore';

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
  const { user: viewerUser } = useAuthStore();
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const bannerStyle = { backgroundColor: profile?.profileBanner?.bannerColor || '#F5E6C3' };
  const profileImageUrl = profile?.profilePicture?.url;
  const watermarkText = mode === 'other' ? buildWatermarkText(viewerUser) : null;
  const isVerified = profile?.approvalStatus === 'approved';
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
              />
            ) : (
              <span className="text-center text-[#2C3E50]/40 font-sans text-xs px-2">No Photo</span>
            )}
            <PhotoWatermark text={watermarkText} />
          </div>

          {profileImageUrl && (
            <ImageLightbox
              images={[{ url: profileImageUrl, alt: profile?.fullName || 'Profile photo' }]}
              index={lightboxIndex}
              onOpenChange={setLightboxIndex}
              watermarkText={watermarkText}
            />
          )}

          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
                {profile?.fullName}
              </h1>
              {isVerified && (
                <span className="inline-flex items-center gap-1 bg-[#2E7D32]/10 text-[#2E7D32] text-xs font-sans font-semibold px-2.5 py-1 rounded-full">
                  <BadgeCheck size={14} strokeWidth={2} />
                  Verified
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

        {profile?.profileAbout && (
          <p className="font-sans text-[#2C3E50] text-sm leading-relaxed mt-4 max-w-2xl">
            {profile.profileAbout}
          </p>
        )}
      </div>
    </div>
  );
}
