'use client';

import { useEffect, useCallback } from 'react';
import { useLandingStore } from '@/store/landingStore';
import { client } from '@/lib/api/client';
import { toastError } from '@/lib/toast';
import ProfileCard from './ProfileCard';

export default function BrowseProfiles() {
  const {
    profiles,
    setProfiles,
    likedProfilesIds,
    setLikedProfilesIds,
    isLoading,
    setIsLoading,
  } = useLandingStore();

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profilesRes, likedRes] = await Promise.all([
        client.get('/api/profiles/discover'),
        client.get('/api/profiles/liked'),
      ]);

      setProfiles(profilesRes.data.data || []);

      // Extract liked profile IDs
      const likedIds =
        likedRes.data.data?.map((p) => p._id) || [];
      setLikedProfilesIds(likedIds);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toastError('Failed to load profiles');
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setProfiles, setLikedProfilesIds]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-secondary mx-auto mb-4" />
          <p className="font-maven text-secondary">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-maven text-lg text-secondary mb-4">
            No profiles found matching your preferences
          </p>
          <p className="font-telex text-sm text-gray-500">
            Try adjusting your search preferences
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-viga text-3xl mb-8 text-secondary">
          Browse Profiles
        </h2>

        {/* Grid of profile cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile._id}
              profile={profile}
              isLiked={likedProfilesIds.includes(profile._id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
