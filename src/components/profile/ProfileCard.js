'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle } from 'lucide-react';
import { useLandingStore } from '@/store/landingStore';
import { client } from '@/lib/api/client';
import { toastSuccess, toastError } from '@/lib/toast';

export default function ProfileCard({ profile, isLiked = false }) {
  const { setActiveTab, setSelectedChatUserId } = useLandingStore();
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

  const handleChat = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveTab('messages');
    setSelectedChatUserId(profile._id);
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
    <Link href={`/profiles/${profile._id}`}>
      <div
        className="relative h-96 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
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
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
      )}

      {/* Profile Info - Always visible when not hovered */}
      {!isHovered && (
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10 text-white">
          <h3 className="font-viga text-3xl font-bold mb-1">
            {profile.fullName}
          </h3>
          <p className="font-telex text-sm text-gray-200">
            {profile.age || 'Age'} • {profile.gender}
          </p>
        </div>
      )}

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

          {/* Action Buttons */}
          <div className="flex gap-4 self-start mt-4">
            {/* Chat Button */}
            <button
              onClick={handleChat}
              className="transition-all duration-200 hover:scale-110 hover:bg-primary hover:bg-opacity-20 rounded-full p-2"
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
        </div>
      )}

      {/* Online indicator dot */}
      <div className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-white z-20" />
      </div>
    </Link>
  );
}
