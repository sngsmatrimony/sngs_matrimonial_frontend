'use client';

import { useEffect, useState, useCallback } from 'react';
import { Heart, MessageCircle, Download, Loader2, Bookmark, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLandingStore } from '@/store/landingStore';
import { useLikeMutation } from '@/hooks/useLikeMutation';
import { useShortlistMutation } from '@/hooks/useShortlistMutation';
import { client } from '@/lib/api/client';
import { toastError } from '@/lib/toast';
import { useProfilePdf } from '@/hooks/useProfilePdf';
import { Skeleton } from '@/components/ui/skeleton';
import ProfilePrintView from '@/components/profile/ProfilePrintView';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileTabs from '@/components/profile/ProfileTabs';

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

export default function ProfileDetailView({ profileId }) {
  const router = useRouter();
  const { setSelectedChatUserId } = useLandingStore();
  const { toggleLike, isLoading: isLikeLoading } = useLikeMutation();
  const { toggleShortlist, isLoading: isShortlistLoading } = useShortlistMutation();
  const { printRef, isGenerating, downloadPDF } = useProfilePdf();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!profileId || profileId === 'undefined' || profileId === 'null') {
      toastError('Invalid profile ID');
      router.push('/browse');
      return;
    }

    setIsLoading(true);
    try {
      const response = await client.get(`/api/profiles/${profileId}`);
      setProfile(response.data.data);
      setLiked(response.data.data?.isLiked || false);
      setShortlisted(response.data.data?.isShortlisted || false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toastError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [profileId, router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDF8F0] pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mt-4 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-sans text-lg text-[#2C3E50] mb-4">Unable to load profile</p>
          <button onClick={() => router.push('/browse')} className="text-[#D4A843] hover:text-[#B8860B] font-sans font-medium underline">
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F0] pb-24">
      <div className="max-w-3xl mx-auto mt-4">
        {typeof profile.matchScore === 'number' && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="inline-flex items-center gap-1.5 bg-[#D4A843] text-[#1A1A1A] text-sm font-sans font-semibold px-3 py-1.5 rounded-full shadow-sm">
              <Sparkles size={14} strokeWidth={2} />
              {profile.matchScore}% Match
            </span>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <ProfileHeader profile={profile} mode="other" />

          <div className="px-4 sm:px-6 pb-6 pt-2">
            <ProfileTabs
              profile={profile}
              mode="other"
              contactMasked={!!profile.contactMasked}
              onDownloadHoroscope={() => handleDownloadHoroscope(profileId)}
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
            className={`flex-1 inline-flex items-center justify-center gap-2 font-sans text-sm font-semibold px-3 py-2.5 rounded-lg border transition-colors disabled:opacity-50 ${
              liked
                ? 'bg-[#C75B39]/10 border-[#C75B39]/40 text-[#C75B39]'
                : 'bg-white border-[#D4A843]/40 text-[#1A1A1A] hover:bg-[#F5E6C3]/40'
            }`}
          >
            <Heart size={16} className={liked ? 'fill-[#C75B39]' : ''} />
            {liked ? 'Liked' : 'Express Interest'}
          </button>

          <button
            onClick={handleShortlist}
            disabled={isShortlistLoading}
            aria-label={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
            className={`shrink-0 inline-flex items-center justify-center gap-2 font-sans text-sm font-semibold px-3 py-2.5 rounded-lg border transition-colors disabled:opacity-50 ${
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
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans text-sm font-semibold px-3 py-2.5 rounded-lg transition-colors"
          >
            <MessageCircle size={16} />
            Chat
          </button>

          <button
            onClick={() => downloadPDF(profile?.fullName, profile?.horoscopeDocument, profileId)}
            disabled={isGenerating}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-white border border-[#D4A843]/40 text-[#1A1A1A] hover:bg-[#F5E6C3]/40 font-sans text-sm font-semibold px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50"
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
    </div>
  );
}
