'use client';

import { useEffect, useState } from 'react';
import { useLandingStore } from '@/store/landingStore';
import { useAuthStore } from '@/store/authStore';
import { client } from '@/lib/api/client';
import { toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import EditProfileForm from './EditProfileForm';
import { Pencil } from 'lucide-react';

export default function UserProfileView() {
  const { userProfile, setUserProfile, isLoading, setIsLoading } =
    useLandingStore();
  const { user } = useAuthStore();
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await client.get('/api/profiles/me/view');
      console.log('Profile data received:', response.data.data);
      console.log('Profile picture:', response.data.data?.profilePicture);
      setUserProfile(response.data.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toastError('Failed to load your profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-secondary mx-auto mb-4" />
          <p className="font-maven text-secondary">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-maven text-lg text-secondary">
            Unable to load profile
          </p>
        </div>
      </div>
    );
  }

  // Show edit form when in edit mode
  if (isEditMode) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <EditProfileForm
            userProfile={userProfile}
            user={user}
            onCancel={() => setIsEditMode(false)}
            onSuccess={() => {
              setIsEditMode(false);
              fetchUserProfile();
            }}
          />
        </div>
      </div>
    );
  }

  // Get banner style
  const bannerStyle = userProfile?.profileBanner?.type === 'image'
    ? {
        backgroundImage: `url(${userProfile.profileBanner.image?.url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { backgroundColor: userProfile?.profileBanner?.color || '#FFE100' };

  const profileImageUrl =
    userProfile?.profilePicture?.url || '/images/default-profile.png';

  console.log('Using profile image URL:', profileImageUrl);

  return (
    <div className="min-h-screen bg-white">
      {/* Profile Banner */}
      <div
        className="w-full h-64 bg-cover bg-center relative"
        style={bannerStyle}
      >
        {/* Edit Button */}
        <Button
          onClick={() => setIsEditMode(true)}
          className="absolute top-4 right-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg font-semibold gap-2"
        >
          <Pencil className="w-4 h-4" />
          Edit Profile
        </Button>
      </div>

      {/* Profile Header - Overlapped */}
      <div className="px-4 md:px-8">
        <div className="max-w-4xl mx-auto -mt-16 relative z-10 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Profile Picture */}
            <div className="relative w-40 h-40 rounded-2xl border-4 border-white overflow-hidden shadow-lg bg-gray-100">
              <img
                src={profileImageUrl}
                alt={user?.fullName}
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
                {user?.fullName}
              </h1>
              <p className="font-telex text-secondary mb-4">
                {user?.age || 'Age'} • {user?.gender}
              </p>

              {/* About */}
              {user?.about && (
                <div className="mb-6">
                  <h3 className="font-viga text-lg text-secondary mb-2">
                    About
                  </h3>
                  <p className="font-maven text-gray-700">{user.about}</p>
                </div>
              )}

              {/* Seeking */}
              <p className="font-telex text-sm text-gray-500">
                Seeking: {user?.seekingGender} | Age: {user?.ageFrom}-
                {user?.ageTo}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs and Content */}
        <div className="max-w-4xl mx-auto">
          {/* Interests Section */}
          {userProfile?.interests && userProfile.interests.length > 0 && (
            <div className="mb-8">
              <h3 className="font-viga text-2xl text-secondary mb-4">
                Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {userProfile.interests.map((interest, idx) => (
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
          {userProfile?.hobbies && (
            <div className="mb-8">
              <h3 className="font-viga text-2xl text-secondary mb-4">
                Hobbies
              </h3>
              <p className="font-maven text-gray-700">{userProfile.hobbies}</p>
            </div>
          )}

          {/* Photos Gallery */}
          {userProfile?.gallery?.photos && userProfile.gallery.photos.length > 0 && (
            <div className="mb-8">
              <h3 className="font-viga text-2xl text-secondary mb-4">Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {userProfile.gallery.photos.map((photo, idx) => (
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
          {userProfile?.gallery?.videos && userProfile.gallery.videos.length > 0 && (
            <div className="mb-8">
              <h3 className="font-viga text-2xl text-secondary mb-4">Videos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userProfile.gallery.videos.map((video, idx) => (
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
