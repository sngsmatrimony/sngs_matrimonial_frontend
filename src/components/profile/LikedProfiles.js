'use client';

import { useEffect, useCallback } from 'react';
import { useLandingStore } from '@/store/landingStore';
import { client } from '@/lib/api/client';
import { toastError } from '@/lib/toast';
import ProfileCard from './ProfileCard';

export default function LikedProfiles() {
  const {
    likedProfiles,
    setLikedProfiles,
    isLoading,
    setIsLoading,
  } = useLandingStore();

  const fetchLikedProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await client.get('/api/profiles/liked');
      setLikedProfiles(response.data.data || []);
    } catch (error) {
      console.error('Error fetching liked profiles:', error);
      toastError('Failed to load liked profiles');
    } finally {
      setIsLoading(false);
    }
  }, [setLikedProfiles, setIsLoading]);

  useEffect(() => {
    fetchLikedProfiles();
  }, [fetchLikedProfiles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-secondary mx-auto mb-4" />
          <p className="font-maven text-secondary">Loading liked profiles...</p>
        </div>
      </div>
    );
  }

  if (!likedProfiles || likedProfiles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-maven text-lg text-secondary mb-2">
            No liked profiles yet
          </p>
          <p className="font-telex text-sm text-gray-500">
            Start liking profiles to save them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-viga text-3xl mb-2 text-secondary">
          Liked Profiles
        </h2>
        <p className="font-telex text-sm text-gray-500 mb-8">
          {likedProfiles.length} profile{likedProfiles.length !== 1 ? 's' : ''}
        </p>

        {/* Grid of liked profile cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {likedProfiles.map((profile) => (
            <ProfileCard
              key={profile._id}
              profile={profile}
              isLiked={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
