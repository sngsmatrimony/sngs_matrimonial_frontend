'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { client } from '@/lib/api/client';
import { toastSuccess, toastError } from '@/lib/toast';

export default function ProfileDetailView({ profileId }) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [profileId]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await client.get(`/api/profiles/${profileId}`);
      setProfile(response.data.data);
      // Check if profile is already liked
      setLiked(response.data.data?.isLiked || false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toastError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    setIsLikeLoading(true);
    try {
      if (liked) {
        await client.post(`/api/profiles/${profileId}/unlike`);
        setLiked(false);
        toastSuccess('Profile removed from likes');
      } else {
        await client.post(`/api/profiles/${profileId}/like`);
        setLiked(true);
        toastSuccess('Profile liked!');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toastError(error.response?.data?.message || 'Error updating like');
    } finally {
      setIsLikeLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-secondary mx-auto mb-4" />
          <p className="font-maven text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-maven text-lg text-secondary mb-4">
            Unable to load profile
          </p>
          <Link href="/" className="text-primary hover:text-accent">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  // Get banner style
  const bannerStyle = profile?.profileBanner?.type === 'image'
    ? {
        backgroundImage: `url(${profile.profileBanner.image?.url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { backgroundColor: profile?.profileBanner?.color || '#FFE100' };

  const profileImageUrl =
    profile?.profilePicture?.url || '/images/default-profile.png';

  return (
    <div className="min-h-screen bg-white">
      {/* Profile Banner with overlay buttons */}
      <div
        className="w-full h-64 bg-cover bg-center relative"
        style={bannerStyle}
      >
        {/* Back Button */}
        <Link
          href="/"
          className="absolute top-4 left-4 bg-black/70 hover:bg-black text-white rounded-full p-2 transition-all duration-200 flex items-center justify-center z-40"
          aria-label="Go back"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={isLikeLoading}
          className={`absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 transition-all duration-200 flex items-center justify-center z-40 ${
            isLikeLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
          }`}
          aria-label="Like profile"
        >
          <Heart
            size={28}
            className={`${
              liked
                ? 'fill-red-500 stroke-red-500'
                : 'stroke-secondary fill-none'
            } transition-all duration-200`}
          />
        </button>
      </div>

      {/* Profile Header - Overlapped */}
      <div className="px-4 md:px-8">
        <div className="max-w-4xl mx-auto -mt-16 relative z-10 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Profile Picture */}
            <div className="relative w-40 h-40 rounded-2xl border-4 border-white overflow-hidden shadow-lg bg-gray-100">
              <img
                src={profileImageUrl}
                alt={profile?.fullName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Image failed to load:', profileImageUrl);
                  e.target.style.display = 'none';
                  e.target.parentElement.style.display = 'flex';
                  e.target.parentElement.style.alignItems = 'center';
                  e.target.parentElement.style.justifyContent = 'center';
                  e.target.parentElement.innerHTML += '<div style="color: #999; font-size: 12px; text-align: center;">No Image</div>';
                }}
                onLoad={() => {
                  console.log('Profile image loaded successfully:', profileImageUrl);
                }}
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 pt-4">
              <h1 className="font-viga text-4xl text-secondary mb-2">
                {profile?.fullName}
              </h1>
              <p className="font-telex text-secondary mb-4">
                {profile?.age || 'Age'} • {profile?.gender}
              </p>

              {/* About */}
              {profile?.about && (
                <div className="mb-6">
                  <h3 className="font-viga text-lg text-secondary mb-2">
                    About
                  </h3>
                  <p className="font-maven text-gray-700">{profile.about}</p>
                </div>
              )}

              {/* Seeking */}
              {(profile?.seekingGender || profile?.ageFrom || profile?.ageTo) && (
                <p className="font-telex text-sm text-gray-500">
                  Seeking: {profile?.seekingGender} | Age: {profile?.ageFrom}-
                  {profile?.ageTo}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs and Content */}
        <div className="max-w-4xl mx-auto">
          {/* Interests Section */}
          {profile?.interests && profile.interests.length > 0 && (
            <div className="mb-8">
              <h3 className="font-viga text-2xl text-secondary mb-4">
                Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="bg-primary text-black font-telex px-4 py-2 rounded-full"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Hobbies Section */}
          {profile?.hobbies && (
            <div className="mb-8">
              <h3 className="font-viga text-2xl text-secondary mb-4">
                Hobbies
              </h3>
              <p className="font-maven text-gray-700">{profile.hobbies}</p>
            </div>
          )}

          {/* Photos Gallery */}
          {profile?.gallery?.photos && profile.gallery.photos.length > 0 && (
            <div className="mb-8">
              <h3 className="font-viga text-2xl text-secondary mb-4">Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profile.gallery.photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-lg overflow-hidden"
                  >
                    <img
                      src={photo.url}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos Section */}
          {profile?.gallery?.videos && profile.gallery.videos.length > 0 && (
            <div className="mb-8">
              <h3 className="font-viga text-2xl text-secondary mb-4">Videos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.gallery.videos.map((video, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-video rounded-lg overflow-hidden bg-gray-200"
                  >
                    <video
                      src={video.url}
                      controls
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer spacing */}
      <div className="h-16" />
    </div>
  );
}
