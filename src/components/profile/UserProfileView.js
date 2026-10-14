'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useLandingStore } from '@/store/landingStore';
import { useAuthStore } from '@/store/authStore';
import { client } from '@/lib/api/client';
import { toastError, toastInfo } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import EditProfileForm from './EditProfileForm';
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';
import { Pencil, AlertTriangle, Eye, Heart, X, Lock, ShieldCheck, ImageOff } from 'lucide-react';

// Friendly display names for the raw schema field names in `missingFields`
const FIELD_LABELS = {
  languagesKnown: 'Languages Known',
  placeOfBirth: 'Place of Birth',
  complexion: 'Complexion',
  diet: 'Diet',
  professionalAdditionalInfo: 'About Your Profession',
  'annualIncome.min': 'Annual Income',
  profileAbout: 'About Me',
  partnerPreferenceDescription: 'Partner Preference',
  'profilePicture.url': 'Profile Picture',
  'gallery.photos': 'Gallery Photos',
  'presentResidentialAddress.state': 'State',
  caste: 'Caste',
  shuddhaJathakam: 'Shuddha Jathakam',
  nakshatra: 'Nakshatra',
  raasi: 'Raasi',
};

function fieldLabel(field) {
  return FIELD_LABELS[field] || field.split('.').pop().replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

// Download handler for horoscope with authentication
const handleDownloadHoroscope = async (userId) => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toastError('Authentication required. Please log in.');
      return;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/profiles/${userId}/horoscope/download`,
      { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      const error = await response.json();
      toastError(error.message || 'Failed to download horoscope');
      return;
    }

    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    let filename;
    if (filenameMatch) {
      filename = filenameMatch[1];
    } else {
      const url = response.url;
      const urlExtension = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
      filename = `horoscope.${urlExtension || 'pdf'}`;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    toastError('Failed to download horoscope document');
  }
};

const RejectionActionCard = ({ reason, onEditProfile }) => (
  <div className="max-w-3xl mx-auto mb-6 px-4 pt-6">
    <div className="bg-[#FBEAE5] border border-[#E8B4A0] border-l-4 border-l-[#C75B39] rounded-xl p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#C75B39]/15 rounded-full flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-[#C75B39]" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <h3 className="font-serif text-lg font-semibold text-[#8A3B22] mb-1.5">
            Profile Update Required
          </h3>
          <p className="font-sans text-sm text-[#8A3B22] mb-3">
            Your profile was not approved. Please review the feedback below and update your profile.
          </p>
          {reason && (
            <div className="bg-white rounded-lg p-3 border border-[#E8B4A0] mb-3">
              <p className="font-sans text-[#8A3B22] text-xs font-semibold mb-1">Admin Feedback:</p>
              <p className="font-sans text-[#2C3E50] text-sm">{reason}</p>
            </div>
          )}
          <Button
            onClick={onEditProfile}
            className="bg-[#C75B39] hover:bg-[#B34E2F] text-white font-sans font-semibold text-sm gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit Profile Now
          </Button>
        </div>
      </div>
    </div>
  </div>
);

function ProfileInsightsCard({ completeness, profileViewCount, interestedCount, insightsLocked, onDismiss }) {
  const router = useRouter();
  if (!completeness) return null;
  const { percent, missingFields = [] } = completeness;
  const topMissing = missingFields.slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto mb-6 px-4 sm:px-0 pt-6">
      <div className="relative bg-gradient-to-br from-[#FDF8F0] to-[#F5E6C3]/50 border border-[#D4A843]/25 rounded-xl p-5 shadow-sm">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full text-[#2C3E50]/50 hover:text-[#2C3E50] hover:bg-[#2C3E50]/5 transition-colors"
        >
          <X className="w-4 h-4" />
          <span className="font-sans text-xs">Dismiss</span>
        </button>

        <div className="flex items-center gap-4 mb-3">
          <div className="relative w-14 h-14 shrink-0">
            <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
              <path
                className="stroke-[#D4A843]/15"
                fill="none"
                strokeWidth="3.5"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="stroke-[#D4A843]"
                fill="none"
                strokeWidth="3.5"
                strokeDasharray={`${percent}, 100`}
                strokeLinecap="round"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-sans text-sm font-bold text-[#1A1A1A]">
              {percent}%
            </span>
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">
              {percent >= 100 ? 'Your profile is complete!' : 'Complete your profile'}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5">
              {insightsLocked ? (
                <button
                  type="button"
                  onClick={() => router.push('/membership/purchase')}
                  className="flex items-center gap-1.5 font-sans text-sm text-[#B8860B] hover:text-[#8A6A1A] underline underline-offset-2"
                >
                  <Lock className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Get a membership to see who viewed &amp; liked your profile
                </button>
              ) : (
                <>
                  {typeof profileViewCount === 'number' && (
                    <p className="flex items-center gap-1.5 font-sans text-sm text-[#2C3E50]/70">
                      <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
                      {profileViewCount} {profileViewCount === 1 ? 'person has' : 'people have'} viewed your profile
                    </p>
                  )}
                  {typeof interestedCount === 'number' && interestedCount > 0 && (
                    <p className="flex items-center gap-1.5 font-sans text-sm text-[#C75B39]">
                      <Heart className="w-3.5 h-3.5 fill-[#C75B39]" strokeWidth={1.75} />
                      {interestedCount} {interestedCount === 1 ? 'person has' : 'people have'} expressed interest in you
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {topMissing.length > 0 && (
          <p className="font-sans text-sm text-[#2C3E50]">
            Add {topMissing.map(fieldLabel).join(', ')}
            {missingFields.length > topMissing.length ? ', and more' : ''} to improve your visibility to matches.
          </p>
        )}
      </div>
    </div>
  );
}

export default function UserProfileView() {
  const { userProfile, setUserProfile } = useLandingStore();
  const { user, isRejected, getLatestRejectionReason } = useAuthStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editStartStep, setEditStartStep] = useState(1);
  const [insightsDismissed, setInsightsDismissed] = useState(false);

  const userIsRejected = isRejected();
  const rejectionReason = getLatestRejectionReason();

  const { data: profileData, isLoading, error, refetch } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await client.get('/api/profiles/me/view');
      const data = response.data.data;
      setUserProfile(data);
      return data;
    },
  });

  useEffect(() => {
    if (error) {
      toastError('Failed to load your profile');
    }
  }, [error]);

  // displayProfile stays fresh even before react-query's cache updates (see
  // submitUpdate in EditProfileForm, which sets landingStore immediately).
  const displayProfile = userProfile || profileData;
  const profile = displayProfile ? { ...user, ...displayProfile } : user;

  // No verified ID proof = no Verified tick (others see "Not ID verified");
  // the profile itself stays visible either way.
  const needsIdProof = !isLoading && !userIsRejected && !!profile?.fullName && !profile?.idProof?.url;

  // Photos are mandatory; a failed upload (or an older profile) can still be
  // missing them. Pending profiles can't be approved until they're added.
  const missingPhotoParts = isLoading || !profile?.fullName ? [] : [
    !profile?.profilePicture?.url && 'a profile photo',
    !(profile?.gallery?.photos?.length > 0) && 'at least one gallery photo',
  ].filter(Boolean);
  const idProofUnderReview = !isLoading && profile?.approvalStatus === 'approved' && !!profile?.idProof?.url && !profile?.idProofVerified;

  useEffect(() => {
    if (!needsIdProof) return;
    try {
      if (sessionStorage.getItem('idProofNudgeShown')) return;
      sessionStorage.setItem('idProofNudgeShown', '1');
    } catch {
      // Storage unavailable — fall through and show it for this visit.
    }
    toastInfo('Upload your ID proof to get the Verified tick on your profile.');
  }, [needsIdProof]);

  const openEdit = (step = 1) => {
    setEditStartStep(step);
    setIsEditMode(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDF8F0] pb-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mt-6 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !profile.fullName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF8F0]">
        <p className="font-sans text-lg text-[#2C3E50]">Unable to load profile</p>
      </div>
    );
  }

  if (isEditMode) {
    return (
      <div className="min-h-screen bg-[#FDF8F0] p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <EditProfileForm
            userProfile={userProfile}
            user={user}
            initialStep={editStartStep}
            onCancel={() => setIsEditMode(false)}
            onSuccess={() => {
              setIsEditMode(false);
              refetch();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F0] pb-12">
      {userIsRejected && (
        <RejectionActionCard reason={rejectionReason} onEditProfile={() => openEdit(1)} />
      )}

      {!userIsRejected && !insightsDismissed && displayProfile?.completeness && (
        <ProfileInsightsCard
          completeness={displayProfile.completeness}
          profileViewCount={displayProfile.profileViewCount}
          interestedCount={displayProfile.interestedCount}
          insightsLocked={displayProfile.insightsLocked}
          onDismiss={() => setInsightsDismissed(true)}
        />
      )}

      <div className="max-w-3xl mx-auto">
        {missingPhotoParts.length > 0 && (
          <div className="mt-6 mx-4 sm:mx-0 flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-[#C75B39]/35 bg-[#C75B39]/5">
            <ImageOff className="w-6 h-6 text-[#C75B39] shrink-0" strokeWidth={1.75} />
            <div className="flex-1">
              <p className="font-serif font-semibold text-[#1A1A1A]">Add your photos</p>
              <p className="font-sans text-sm text-[#2C3E50] mt-0.5 leading-relaxed">
                Your profile is missing {missingPhotoParts.join(' and ')}.{' '}
                {profile?.approvalStatus === 'approved'
                  ? 'Profiles with photos receive far more interest from families.'
                  : 'Our team can only approve your profile once your photos are added.'}
                {' '}JPEG or PNG, up to 10 MB each.
              </p>
            </div>
            <Button
              onClick={() => openEdit(5)}
              className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold h-11 shrink-0"
            >
              Add Photos
            </Button>
          </div>
        )}

        {needsIdProof && (
          <div className="mt-6 mx-4 sm:mx-0 flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-[#D4A843]/35 bg-[#F5E6C3]/40">
            <ShieldCheck className="w-6 h-6 text-[#B8860B] shrink-0" strokeWidth={1.75} />
            <div className="flex-1">
              <p className="font-serif font-semibold text-[#1A1A1A]">Get the Verified tick on your profile</p>
              <p className="font-sans text-sm text-[#2C3E50] mt-0.5 leading-relaxed">
                Upload a government ID proof. Until it&apos;s verified, other members see your profile as &ldquo;Not ID verified&rdquo;
                &mdash; your profile stays visible the whole time. The tick appears once our team checks your ID.
              </p>
            </div>
            <Button
              onClick={() => openEdit(5)}
              className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold h-11 shrink-0"
            >
              Upload ID Proof
            </Button>
          </div>
        )}

        {idProofUnderReview && (
          <div className="mt-6 mx-4 sm:mx-0 flex items-start gap-3 p-4 rounded-xl border border-[#2C3E50]/15 bg-white">
            <ShieldCheck className="w-6 h-6 text-[#2C3E50]/60 shrink-0" strokeWidth={1.75} />
            <div>
              <p className="font-serif font-semibold text-[#1A1A1A]">Your ID proof is being verified</p>
              <p className="font-sans text-sm text-[#2C3E50] mt-0.5 leading-relaxed">
                Your profile stays visible to other members meanwhile. The Verified tick appears as soon as our team checks your ID.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mt-6">
          <ProfileHeader
            profile={profile}
            mode="self"
            primaryAction={
              <Button
                onClick={() => openEdit(1)}
                className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold text-sm gap-2"
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </Button>
            }
          />

          <div className="px-4 sm:px-6 pb-6 pt-2">
            <ProfileTabs
              profile={profile}
              mode="self"
              contactMasked={false}
              onDownloadHoroscope={() => handleDownloadHoroscope(profile?.id || profile?._id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
