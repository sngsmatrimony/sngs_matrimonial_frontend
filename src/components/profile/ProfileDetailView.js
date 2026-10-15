'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Download, Loader2, Bookmark, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLandingStore } from '@/store/landingStore';
import { useAuthStore } from '@/store/authStore';
import { useLikeMutation } from '@/hooks/useLikeMutation';
import { useShortlistMutation } from '@/hooks/useShortlistMutation';
import { useEnforcementStatus } from '@/hooks/useEnforcementStatus';
import { client } from '@/lib/api/client';
import { toastError } from '@/lib/toast';
import { useProfilePdf } from '@/hooks/useProfilePdf';
import ProfilePrintView from '@/components/profile/ProfilePrintView';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileTabs from '@/components/profile/ProfileTabs';
import SpendCreditsDialog from '@/components/shared/SpendCreditsDialog';

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

// profile is fetched once by the parent page (profiles/[id]/page.js), which
// also owns the loading/error/credit-deduction states — this component is
// the only consumer of that data, so it renders from the prop instead of
// re-fetching the same profile a second time. A duplicate fetch here used to
// race the parent's: both requests could see the profile as not-yet-viewed
// and each deduct a credit, double-charging the member for one view.
// `onProfileRefresh` lets this component ask the parent to re-fetch after a
// successful contact unlock, so the real phone number replaces the mask.
export default function ProfileDetailView({ profileId, profile, onProfileRefresh }) {
  const router = useRouter();
  const { membership } = useAuthStore();
  const { setSelectedChatUserId } = useLandingStore();
  const { toggleLike, isLoading: isLikeLoading } = useLikeMutation();
  const { toggleShortlist, isLoading: isShortlistLoading } = useShortlistMutation();
  const { printRef, isGenerating, downloadPDF } = useProfilePdf();
  const [liked, setLiked] = useState(profile?.isLiked || false);
  const [shortlisted, setShortlisted] = useState(profile?.isShortlisted || false);
  const [pendingDownload, setPendingDownload] = useState(null); // null | 'pdf' | 'horoscope'
  const [isUnlockingDownload, setIsUnlockingDownload] = useState(false);
  const [downloadUnlocked, setDownloadUnlocked] = useState(!!profile?.downloadUnlocked);
  // The server holds back the horoscope link until the download is unlocked;
  // the unlock call returns it.
  const [unlockedHoroscope, setUnlockedHoroscope] = useState(null);
  const horoscopeDocument = unlockedHoroscope || profile?.horoscopeDocument;
  const enforcementActive = useEnforcementStatus();

  const downloadCost = membership?.planId?.costs?.profileDownload;
  const unlimitedDownload = !!downloadCost?.unlimited;
  const downloadCreditCost = downloadCost?.cost ?? 0;

  const runDownload = (action, horoscope = horoscopeDocument) => {
    if (action === 'pdf') downloadPDF(profile?.fullName, horoscope?.url ? horoscope : null, profileId);
    else handleDownloadHoroscope(profileId);
  };

  const unlockAndDownload = async (action) => {
    setIsUnlockingDownload(true);
    try {
      const res = await client.post(`/api/profiles/${profileId}/unlock-download`);
      const horoscope = res.data?.horoscopeDocument || horoscopeDocument;
      if (res.data?.horoscopeDocument) setUnlockedHoroscope(res.data.horoscopeDocument);
      setDownloadUnlocked(true);
      setPendingDownload(null);
      runDownload(action, horoscope);
    } catch (error) {
      const data = error.response?.data;
      if (data?.requiresCredits) {
        toastError(`You need ${data.requiredCredits} credits; you have ${data.currentCredits}.`);
      } else if (data?.requiresMembership) {
        toastError(data.message || 'An active membership is required.');
      } else {
        toastError(data?.message || 'Failed to unlock download.');
      }
    } finally {
      setIsUnlockingDownload(false);
    }
  };

  const requestDownload = (action) => {
    // No prompt when nothing will actually be charged: enforcement is off,
    // or this profile's download is already unlocked.
    if (!enforcementActive || downloadUnlocked || unlimitedDownload || downloadCreditCost === 0) {
      unlockAndDownload(action);
    } else {
      setPendingDownload(action);
    }
  };

  const handleLike = () => {
    toggleLike(profileId, profile, liked);
    setLiked(!liked);
  };

  const handleShortlist = () => {
    toggleShortlist(profileId, profile, shortlisted);
    setShortlisted(!shortlisted);
  };

  const handleChat = () => {
    setSelectedChatUserId(profileId);
    router.push('/messages');
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-sans text-lg text-[#2C3E50] mb-4">Unable to load profile</p>
          <button onClick={() => router.push('/browse')} className="text-[#D4A843] hover:text-[#B8860B] font-sans font-medium underline">
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F0] pb-24">
      <div className="max-w-3xl mx-auto mt-4">
        <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden">
          {typeof profile.matchScore === 'number' && (
            <span className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 bg-[#D4A843] text-[#1A1A1A] text-sm font-sans font-semibold px-3 py-1.5 rounded-full shadow-sm">
              <Sparkles size={14} strokeWidth={2} />
              {profile.matchScore}% Match
            </span>
          )}
          <ProfileHeader profile={profile} mode="other" />

          <div className="px-4 sm:px-6 pb-6 pt-2">
            <ProfileTabs
              profile={unlockedHoroscope ? { ...profile, horoscopeDocument: unlockedHoroscope } : profile}
              mode="other"
              contactMasked={!!profile.contactMasked}
              onDownloadHoroscope={() => requestDownload('horoscope')}
              onContactUnlocked={onProfileRefresh}
            />
          </div>
        </div>
      </div>

      {/* Sticky action bar — labeled buttons, no icon-only actions */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#D4A843]/20 shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.15)] md:pb-0" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleLike}
            disabled={isLikeLoading}
            className={`flex-1 min-w-0 h-12 inline-flex items-center justify-center gap-1.5 sm:gap-2 font-sans text-sm font-semibold px-2 sm:px-3 rounded-lg border whitespace-nowrap transition-colors disabled:opacity-50 ${
              liked
                ? 'bg-[#C75B39]/10 border-[#C75B39]/40 text-[#C75B39]'
                : 'bg-[#D4A843] border-[#D4A843] text-[#1A1A1A] hover:bg-[#B8860B]'
            }`}
          >
            <Heart size={16} className={liked ? 'fill-[#C75B39]' : ''} />
            {liked ? 'Liked' : 'Express Interest'}
          </button>

          <button
            onClick={handleShortlist}
            disabled={isShortlistLoading}
            aria-label={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
            className={`w-[60px] sm:w-auto sm:flex-1 shrink-0 h-12 inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 font-sans text-[11px] sm:text-sm font-semibold px-1 sm:px-3 rounded-lg border transition-colors disabled:opacity-50 ${
              shortlisted
                ? 'bg-[#2C3E50]/10 border-[#2C3E50]/40 text-[#2C3E50]'
                : 'bg-white border-[#D4A843]/40 text-[#1A1A1A] hover:bg-[#F5E6C3]/40'
            }`}
          >
            <Bookmark size={16} className={shortlisted ? 'fill-[#2C3E50]' : ''} />
            {shortlisted ? 'Saved' : 'Save'}
          </button>

          <button
            onClick={handleChat}
            className="w-[60px] sm:w-auto sm:flex-1 shrink-0 h-12 inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 font-sans text-[11px] sm:text-sm font-semibold px-1 sm:px-3 rounded-lg bg-white border border-[#D4A843]/40 text-[#1A1A1A] hover:bg-[#F5E6C3]/40 transition-colors"
          >
            <MessageCircle size={16} />
            Chat
          </button>

          <button
            onClick={() => requestDownload('pdf')}
            disabled={isGenerating || isUnlockingDownload}
            className="w-[60px] sm:w-auto sm:flex-1 shrink-0 h-12 inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 font-sans text-[11px] sm:text-sm font-semibold px-1 sm:px-3 rounded-lg bg-white border border-[#D4A843]/40 text-[#1A1A1A] hover:bg-[#F5E6C3]/40 transition-colors disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span className="hidden sm:inline">Share Profile</span>
            <span className="sm:hidden">Share</span>
          </button>
        </div>
      </div>

      {/* Hidden PDF Print Container - positioned off-screen */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '794px' }} aria-hidden="true">
        <ProfilePrintView ref={printRef} profile={profile} />
      </div>

      <SpendCreditsDialog
        open={pendingDownload !== null}
        cost={downloadCreditCost}
        activityLabel="Downloading this profile"
        isLoading={isUnlockingDownload}
        onConfirm={() => unlockAndDownload(pendingDownload)}
        onCancel={() => setPendingDownload(null)}
      />
    </div>
  );
}
