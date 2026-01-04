'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Lock, FileText } from 'lucide-react';
import { useLandingStore } from '@/store/landingStore';
import { useAuthStore } from '@/store/authStore';
import { client } from '@/lib/api/client';
import { toastSuccess, toastError, toastInfo } from '@/lib/toast';

export default function ProfileCard({ profile, isLiked = false }) {
  // All hooks must be called before any early returns
  const queryClient = useQueryClient();
  const { membership } = useAuthStore();
  const {
    setActiveTab,
    setSelectedChatUserId,
    likedProfilesIds,
    setLikedProfilesIds,
    likedProfiles,
    setLikedProfiles
  } = useLandingStore();
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [isLoading, setIsLoading] = useState(false);

  // Sync internal state when parent passes new prop (e.g. after invalidateQueries update)
  useEffect(() => {
    setLiked(isLiked);
  }, [isLiked]);

  // Validate profile data (after hooks)
  if (!profile || !profile._id || profile._id === 'undefined' || profile._id === 'null') {
    console.error('Invalid profile data:', profile);
    return null;
  }

  // Check if user has no membership or expired/no credits
  const hasNoMembership = !membership?.isActive || membership?.isExpired || membership?.credits <= 0;

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    try {
      if (liked) {
        // Unlike
        await client.post(`/api/profiles/${profile._id}/unlike`);
        setLiked(false);
        // Update global store - both arrays for instant UI sync
        setLikedProfilesIds(likedProfilesIds.filter(id => id !== profile._id));
        setLikedProfiles(likedProfiles.filter(p => p._id !== profile._id));
        
        // Invalidate queries to ensure fresh data on tab switch
        queryClient.invalidateQueries({ queryKey: ['likedProfiles'] });
        queryClient.invalidateQueries({ queryKey: ['browseProfiles'] });
        
        toastSuccess('Profile removed from likes');
      } else {
        // Like
        await client.post(`/api/profiles/${profile._id}/like`);
        setLiked(true);
        // Update global store
        setLikedProfilesIds([...likedProfilesIds, profile._id]);
        
        // Invalidate queries to ensure fresh data on tab switch
        queryClient.invalidateQueries({ queryKey: ['likedProfiles'] });
        queryClient.invalidateQueries({ queryKey: ['browseProfiles'] });
        
        toastSuccess('Profile liked!');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert local state
      setLiked(isLiked);

      // Revert store state if API call failed
      if (isLiked && !liked) {
        // Was unliking but failed - restore to both arrays
        if (!likedProfilesIds.includes(profile._id)) {
          setLikedProfilesIds([...likedProfilesIds, profile._id]);
        }
        if (!likedProfiles.find(p => p._id === profile._id)) {
          setLikedProfiles([...likedProfiles, profile]);
        }
      } else if (!isLiked && liked) {
        // Was liking but failed - remove from both arrays
        setLikedProfilesIds(likedProfilesIds.filter(id => id !== profile._id));
        setLikedProfiles(likedProfiles.filter(p => p._id !== profile._id));
      }

      toastError(error.response?.data?.message || 'Error updating like');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveTab('messages');
    setSelectedChatUserId(profile._id);
  };

  const handleCardClick = (e) => {
    if (hasNoMembership) {
      e.preventDefault();
      e.stopPropagation();
      toastInfo('Get membership to view full profiles');
    }
    // If has membership, let Link handle navigation naturally
  };

  // Get profile picture URL
  const profileImageUrl =
    profile?.profilePicture?.url || '/images/default-profile.png';

  // Get profile picture as background
  const profilePictureBackground = {
    backgroundImage: `url(${profileImageUrl})`,
    backgroundColor: '#e5e7eb' // fallback gray
  };

  return (
    <Link
      href={`/profiles/${profile._id}`}
      onClick={handleCardClick}
      aria-disabled={hasNoMembership}
      className={hasNoMembership ? 'cursor-not-allowed' : ''}
    >
      <div
        className={`relative h-96 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${
          hasNoMembership
            ? 'cursor-not-allowed opacity-90 hover:opacity-100 hover:shadow-lg'
            : 'cursor-pointer hover:shadow-2xl'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Profile Picture Background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 hover:scale-105"
        style={profilePictureBackground}
      />

      {/* Dark overlay on hover */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isHovered ? 'opacity-60' : 'opacity-0'
        }`}
      />

      {/* Gradient overlay at bottom for text readability */}
      {!isHovered && (
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-black via-black/60 to-transparent z-10" />
      )}

      {/* Status Badges */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        {hasNoMembership && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary text-primary-foreground text-xs font-telex shadow-xl whitespace-nowrap animate-pulse">
            <Lock className="w-4 h-4" />
            <span className="font-semibold">Get Membership</span>
          </div>
        )}
        
        {profile?.horoscopeDocument?.url && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 text-secondary text-xs font-telex shadow-md backdrop-blur-sm" title="Horoscope available">
            <FileText className="w-4 h-4 text-primary" />
            <span className="font-semibold">Horoscope</span>
          </div>
        )}
      </div>

      {/* Profile Info - Always visible when not hovered */}
      {!isHovered && (
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10 text-white space-y-1">
          <h3 className="font-viga text-3xl font-bold mb-1">
            {profile.fullName}
          </h3>
          <p className="font-telex text-sm text-gray-200">
            {profile.age || 'Age'}
          </p>
          {profile.occupation && (
            <p className="font-telex text-sm text-gray-300">
              {profile.occupation}
            </p>
          )}
          {profile.motherTongue && (
            <p className="font-telex text-xs text-gray-400">
              {profile.motherTongue}
            </p>
          )}
        </div>
      )}

      {/* Hover Action Buttons Only */}
      {isHovered && (
        <div className="absolute inset-0 flex items-center justify-center gap-6 z-20">
          {/* Chat Button */}
          <button
            onClick={handleChat}
            className="transition-all duration-200 hover:scale-110 rounded-full p-2"
            aria-label="Send message"
            title="Send message"
          >
            <MessageCircle
              size={40}
              className="stroke-white fill-none transition-all duration-200"
            />
          </button>

          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={isLoading}
            className={`transition-all duration-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
            }`}
            aria-label="Like profile"
          >
            <Heart
              size={40}
              className={`${
                liked
                  ? 'fill-red-500 stroke-red-500'
                  : 'stroke-white fill-none'
              } transition-all duration-200`}
            />
          </button>
        </div>
      )}

      </div>
    </Link>
  );
}
