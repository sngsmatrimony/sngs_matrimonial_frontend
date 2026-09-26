'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { toastError } from '@/lib/toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Bookmark } from 'lucide-react';
import ProfileCard from './ProfileCard';

export default function LikedProfiles() {
  const [activeTab, setActiveTab] = useState('interests');

  const { data: likedProfilesData, isLoading: isLoadingLiked, error: likedError } = useQuery({
    queryKey: ['likedProfiles'],
    queryFn: async () => {
      const response = await client.get('/api/profiles/liked');
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

  const isLoading = isLoadingLiked || isLoadingShortlisted;
  const error = likedError || shortlistedError;

  useEffect(() => {
    if (error) {
      console.error('Error fetching liked/shortlisted profiles:', error);
      toastError('Failed to load your saved profiles');
    }
  }, [error]);

  const likedProfiles = useMemo(() => likedProfilesData || [], [likedProfilesData]);
  const shortlistedProfiles = useMemo(() => shortlistedProfilesData || [], [shortlistedProfilesData]);

  const likedIdsSet = useMemo(() => new Set(likedProfiles.map((p) => p._id)), [likedProfiles]);
  const shortlistedIdsSet = useMemo(() => new Set(shortlistedProfiles.map((p) => p._id)), [shortlistedProfiles]);

  const displayProfiles = activeTab === 'interests' ? likedProfiles : shortlistedProfiles;

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
          My Saved Profiles
        </h2>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="interests" className="gap-1.5">
              <Heart size={14} />
              Interests Sent ({likedProfiles.length})
            </TabsTrigger>
            <TabsTrigger value="shortlisted" className="gap-1.5">
              <Bookmark size={14} />
              Shortlisted ({shortlistedProfiles.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {displayProfiles.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center max-w-sm">
              <p className="font-sans text-lg text-[#1A1A1A] font-medium mb-2">
                {activeTab === 'interests' ? 'No interests sent yet' : 'Nothing shortlisted yet'}
              </p>
              <p className="font-sans text-sm text-[#2C3E50]/70">
                {activeTab === 'interests'
                  ? 'Start browsing and express interest in profiles to see them here.'
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
