'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useLandingStore } from '@/store/landingStore';
import { client } from '@/lib/api/client';
import { toastSuccess, toastError } from '@/lib/toast';

export default function ProfileCard({ profile, isLiked = false }) {
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    try {
      if (liked) {
        // Unlike
        await client.post(`/api/profiles/${profile._id}/unlike`);
        setLiked(false);
        toastSuccess('Profile removed from likes');
      } else {
        // Like
        await client.post(`/api/profiles/${profile._id}/like`);
        setLiked(true);
        toastSuccess('Profile liked!');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toastError(error.response?.data?.message || 'Error updating like');
    } finally {
      setIsLoading(false);
    }
  };

  // Get profile picture URL
  const profileImageUrl =
    profile?.profilePicture?.url || '/images/default-profile.png';

  // Get profile banner
  const bannerStyle = profile?.profileBanner?.type === 'image'
    ? { backgroundImage: `url(${profile.profileBanner.image?.url})` }
    : { backgroundColor: profile?.profileBanner?.color || '#FFE100' };

  return (
    <div
      className="relative h-96 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Profile Banner Background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 hover:scale-105"
        style={bannerStyle}
      />

      {/* Dark overlay on hover */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isHovered ? 'opacity-60' : 'opacity-0'
        }`}
      />

      {/* Profile Picture - Always visible */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-4 z-10">
        <div className="flex items-end gap-3">
          <div className="relative w-20 h-20 rounded-full border-4 border-white bg-gray-200 overflow-hidden flex items-center justify-center">
            <img
              src={profileImageUrl}
              alt={profile.fullName}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Profile card image failed to load:', profileImageUrl);
                e.target.style.display = 'none';
              }}
              onLoad={() => {
                console.log('Profile card image loaded:', profileImageUrl);
              }}
            />
          </div>
          {!isHovered && (
            <div className="text-white mb-2">
              <h3 className="font-viga text-2xl font-bold">
                {profile.fullName}
              </h3>
              <p className="font-telex text-sm text-gray-100">
                {profile.age || 'Age'} • {profile.gender}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hover Details Content */}
      {isHovered && (
        <div className="absolute inset-0 flex flex-col justify-between p-6 z-20 text-white overflow-y-auto">
          {/* Header */}
          <div>
            <h2 className="font-viga text-3xl mb-1">{profile.fullName}</h2>
            <p className="font-telex text-sm text-gray-200 mb-4">
              {profile.age || 'Age'} • {profile.gender}
            </p>

            {/* About */}
            {profile.about && (
              <div className="mb-4">
                <p className="font-telex text-xs uppercase text-gray-300 mb-1">
                  About
                </p>
                <p className="font-maven text-sm line-clamp-2">
                  {profile.about}
                </p>
              </div>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="mb-4">
                <p className="font-telex text-xs uppercase text-gray-300 mb-2">
                  Interests
                </p>
                <div className="flex flex-wrap gap-1">
                  {profile.interests.slice(0, 5).map((interest, idx) => (
                    <span
                      key={idx}
                      className="bg-yellow-400 text-black text-xs font-telex px-2 py-1 rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                  {profile.interests.length > 5 && (
                    <span className="bg-gray-400 text-white text-xs font-telex px-2 py-1 rounded-full">
                      +{profile.interests.length - 5}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Hobbies */}
            {profile.hobbies && (
              <div>
                <p className="font-telex text-xs uppercase text-gray-300 mb-1">
                  Hobbies
                </p>
                <p className="font-maven text-sm line-clamp-2">
                  {profile.hobbies}
                </p>
              </div>
            )}
          </div>

          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={isLoading}
            className={`self-start mt-4 transition-all duration-200 ${
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

      {/* Online indicator dot */}
      <div className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-white z-20" />
    </div>
  );
}
