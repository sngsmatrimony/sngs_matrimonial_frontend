'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { toastError } from '@/lib/toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Bookmark, Inbox } from 'lucide-react';
import ProfileCard from './ProfileCard';

// flex-auto: each tab as wide as its label (not three equal columns), so the
// longer "Shortlisted" label still fits on a 360px phone.
const LIKED_TAB = 'flex-auto h-auto min-h-9 py-1.5 px-2 sm:px-3 gap-1.5 whitespace-normal sm:whitespace-nowrap leading-tight text-center';

export default function LikedProfiles() {
  const [activeTab, setActiveTab] = useState('interests');

  const { data: likedProfilesData, isLoading: isLoadingLiked, error: likedError } = useQuery({
    queryKey: ['likedProfiles'],
    queryFn: async () => {
      const response = await client.get('/api/profiles/liked');
      return response.data.data || [];
    },
  });

  // Members who expressed interest in this member (newest first).
  const { data: receivedProfilesData, isLoading: isLoadingReceived, error: receivedError } = useQuery({
    queryKey: ['receivedInterests'],
    queryFn: async () => {
      const response = await client.get('/api/profiles/liked/received');
      return response.data.data || [];
    },
  });

  const { data: shortlistedProfilesData, isLoading: isLoadingShortlisted, error: shortlistedError } = useQuery({
    queryKey: ['shortlistedProfiles'],
    queryFn: async () => {
      const response = await client.get('/api/profiles/shortlisted');
      return response.data.data || [];
    },
  });

  const isLoading = isLoadingLiked || isLoadingShortlisted || isLoadingReceived;
  const error = likedError || shortlistedError || receivedError;

  useEffect(() => {
    if (error) {
      console.error('Error fetching liked/shortlisted profiles:', error);
      toastError('Failed to load your saved profiles');
    }
  }, [error]);

  const likedProfiles = useMemo(() => likedProfilesData || [], [likedProfilesData]);
  const shortlistedProfiles = useMemo(() => shortlistedProfilesData || [], [shortlistedProfilesData]);
  const receivedProfiles = useMemo(() => receivedProfilesData || [], [receivedProfilesData]);

  const likedIdsSet = useMemo(() => new Set(likedProfiles.map((p) => p._id)), [likedProfiles]);
  const shortlistedIdsSet = useMemo(() => new Set(shortlistedProfiles.map((p) => p._id)), [shortlistedProfiles]);

  const displayProfiles = activeTab === 'interests' ? likedProfiles : activeTab === 'received' ? receivedProfiles : shortlistedProfiles;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDF8F0] py-6 sm:py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-56 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#D4A843]/15 shadow-sm overflow-hidden">
                <Skeleton className="aspect-[4/5] rounded-none" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF8F0]">
        <div className="text-center max-w-sm">
          <p className="font-sans text-lg text-[#1A1A1A] font-medium mb-2">
            We couldn&apos;t load your saved profiles
          </p>
          <p className="font-sans text-sm text-[#2C3E50]/70">
            Please check your connection and try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F0] py-6 sm:py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-4">
          Interests &amp; Shortlist
        </h2>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          {/* Phones: full width, no icons, and a label may wrap onto two
              lines with big counts, so all three tabs always fit. */}
          <TabsList className="w-full sm:w-fit h-auto">
            <TabsTrigger value="interests" className={LIKED_TAB}>
              <Heart size={14} className="hidden sm:block" aria-hidden="true" />
              Sent ({likedProfiles.length})
            </TabsTrigger>
            <TabsTrigger value="received" className={LIKED_TAB}>
              <Inbox size={14} className="hidden sm:block" aria-hidden="true" />
              Received ({receivedProfiles.length})
            </TabsTrigger>
            <TabsTrigger value="shortlisted" className={LIKED_TAB}>
              <Bookmark size={14} className="hidden sm:block" aria-hidden="true" />
              Shortlisted ({shortlistedProfiles.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'received' && receivedProfiles.length > 0 && (
          <p className="font-sans text-sm text-[#2C3E50]/80 mb-5 max-w-2xl">
            These members expressed interest in you. Express interest back to let them know — it becomes a mutual match.
          </p>
        )}

        {displayProfiles.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center max-w-sm">
              <p className="font-sans text-lg text-[#1A1A1A] font-medium mb-2">
                {activeTab === 'interests' ? 'No interests sent yet' : activeTab === 'received' ? 'No interests received yet' : 'Nothing shortlisted yet'}
              </p>
              <p className="font-sans text-sm text-[#2C3E50]/70">
                {activeTab === 'interests'
                  ? 'Start browsing and express interest in profiles to see them here.'
                  : activeTab === 'received'
                    ? 'When someone expresses interest in you, they’ll appear here.'
                    : 'Bookmark profiles while browsing to privately save them for later — the other person is never notified.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {displayProfiles.map((profile) => (
              <ProfileCard
                key={profile._id}
                profile={profile}
                isLiked={likedIdsSet.has(profile._id)}
                isShortlisted={shortlistedIdsSet.has(profile._id)}
                badge={activeTab === 'received' ? (profile.mutual || likedIdsSet.has(profile._id) ? 'Mutual interest' : 'Interested in you') : null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
