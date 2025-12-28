'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLandingStore } from '@/store/landingStore';
import { useAuthStore } from '@/store/authStore';
import { client } from '@/lib/api/client';
import { toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import ProfileCard from './ProfileCard';

export default function BrowseProfiles() {
  const router = useRouter();
  const { membership } = useAuthStore();
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
      if (error.response?.data?.requiresMembership) {
        toastError(error.response.data.message);
        router.push('/membership/purchase');
      } else if (error.response?.data?.requiresCredits) {
        toastError(error.response.data.message);
        router.push('/membership/purchase');
      } else {
        toastError('Failed to load profiles');
      }
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setProfiles, setLikedProfilesIds, router]);

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
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-viga text-3xl text-secondary">
            Browse Profiles
          </h2>
          {membership?.isActive && !membership?.isExpired && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <CreditCard className="w-5 h-5 text-primary" />
              <span className="font-viga text-xl text-primary">
                {membership?.credits}
              </span>
              <span className="font-telex text-sm text-primary">
                {membership?.credits === 1 ? 'credit' : 'credits'}
              </span>
            </div>
          )}
        </div>

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
