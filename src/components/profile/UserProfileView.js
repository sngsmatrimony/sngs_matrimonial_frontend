'use client';

import { useEffect, useState } from 'react';
import { useLandingStore } from '@/store/landingStore';
import { useAuthStore } from '@/store/authStore';
import { client } from '@/lib/api/client';
import { toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import EditProfileForm from './EditProfileForm';
import { Pencil, Briefcase, Users } from 'lucide-react';

// Info Card Component
const InfoCard = ({ icon: Icon, title, children, className = '' }) => (
  <div className={`bg-white border-2 border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow ${className}`}>
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={24} className="text-primary" />}
      <h3 className="font-viga text-xl text-secondary">{title}</h3>
    </div>
    {children}
  </div>
);

// Info Field Component
const InfoField = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="font-telex text-secondary/70 text-sm">{label}</span>
    <span className="font-maven text-secondary font-medium">{value || '—'}</span>
  </div>
);

// Convert 24-hour format (HH:mm) to 12-hour format with AM/PM
const formatTimeToAMPM = (time24) => {
  if (!time24) return null;
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

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
        <div className="max-w-3xl mx-auto">
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
  const bannerStyle = {
    backgroundColor: userProfile?.profileBanner?.bannerColor || '#FFB3BA'
  };

  const profileImageUrl = userProfile?.profilePicture?.url;

  console.log('Using profile image URL:', profileImageUrl);

  return (
    <div className="px-4 md:px-8 py-8">
      {/* Profile Banner with Edit Button */}
      <div
        className="w-full h-64 bg-cover bg-center rounded-t-2xl relative mb-8 shadow-lg"
        style={bannerStyle}
      >
        <Button
          onClick={() => setIsEditMode(true)}
          className="absolute top-4 right-4 bg-primary hover:bg-accent text-black font-maven text-base gap-2"
        >
          <Pencil className="w-4 h-4" />
          Edit Profile
        </Button>
      </div>

      {/* Profile Header - Overlapped */}
      <div className="max-w-4xl mx-auto -mt-16 relative z-10 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Profile Picture */}
          <div className="relative w-40 h-40 rounded-2xl border-4 border-white overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
            {profileImageUrl ? (
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
            ) : (
              <div className="text-center text-gray-400 font-maven text-sm">
                No Photo
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 pt-4">
            <h1 className="font-viga text-4xl text-secondary mb-2">
              {user?.fullName}
            </h1>
            <p className="font-telex text-secondary mb-4">
              {user?.age || 'Age'} • {user?.gender}
            </p>

            {/* About Myself */}
            {user?.about && (
              <div className="mb-6">
                <h3 className="font-viga text-lg text-secondary mb-2">
                  About
                </h3>
                <p className="font-maven text-gray-700 leading-relaxed">{user.about}</p>
              </div>
            )}

            {/* Seeking Preferences */}
            {(user?.seekingGender || user?.ageFrom || user?.ageTo) && (
              <p className="font-telex text-sm text-secondary/70">
                Seeking: <span className="font-maven text-secondary">{user?.seekingGender}</span> |
                Age: <span className="font-maven text-secondary">{user?.ageFrom}-{user?.ageTo}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Information Cards */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Personal Details Card */}
        {(user?.religion || user?.caste || user?.motherTongue || user?.maritalStatus || user?.height || user?.physicalStatus || user?.weight || user?.bloodGroup || user?.familyStatus) && (
          <InfoCard
            title="💑 Personal Details"
            className="mb-6"
          >
            <InfoField label="Religion" value={user?.religion} />
            {user?.motherTongue && <InfoField label="Mother Tongue" value={user.motherTongue} />}
            {user?.caste && <InfoField label="Caste" value={user.caste} />}
            {user?.maritalStatus && <InfoField label="Marital Status" value={user.maritalStatus} />}
            {user?.height && <InfoField label="Height" value={user.height} />}
            {user?.weight && <InfoField label="Weight" value={`${user.weight} kg`} />}
            {user?.physicalStatus && <InfoField label="Physical Status" value={user.physicalStatus} />}
            {user?.bloodGroup && <InfoField label="Blood Group" value={user.bloodGroup} />}
            {user?.familyStatus && <InfoField label="Family Status" value={user.familyStatus} />}
            {user?.isDivorcee && <InfoField label="Marital Status" value="Divorced" />}
          </InfoCard>
        )}

        {/* Birth Details Card */}
        {(user?.dateOfBirth || user?.timeOfBirth || user?.nakshatra || user?.raasi || user?.shuddhaJathakam || user?.doshamTypes) && (
          <InfoCard
            title="💫 Birth Details"
            className="mb-6"
          >
            {user?.dateOfBirth && (
              <InfoField
                label="Date of Birth"
                value={new Date(user.dateOfBirth).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              />
            )}
            {user?.timeOfBirth && (
              <InfoField
                label="Time of Birth"
                value={formatTimeToAMPM(user.timeOfBirth)}
              />
            )}
            {user?.nakshatra && <InfoField label="Star" value={user.nakshatra} />}
            {user?.raasi && <InfoField label="Raasi" value={user.raasi} />}
            {user?.shuddhaJathakam && <InfoField label="Shuddha Jathakam" value={user.shuddhaJathakam} />}
            {user?.doshamTypes && user.doshamTypes.length > 0 && (
              <div className="py-2 border-b border-gray-100">
                <span className="font-telex text-secondary/70 text-sm block mb-2">Dosham</span>
                <div className="flex flex-wrap gap-2">
                  {user.doshamTypes.map((dosham, idx) => (
                    <span key={idx} className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                      {dosham}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </InfoCard>
        )}

        {/* Professional Information Card */}
        {(user?.education || user?.employmentType || user?.occupation || user?.annualIncome) && (
          <InfoCard
            title="💼 Professional"
            icon={Briefcase}
            className="mb-6"
          >
            <InfoField label="Education" value={user?.education} />
            <InfoField label="Employment Type" value={user?.employmentType} />
            <InfoField label="Occupation" value={user?.occupation} />
            {user?.annualIncome && (
              <InfoField
                label="Annual Income"
                value={`${user.annualIncome.currency} ${user.annualIncome.amount}`}
              />
            )}
          </InfoCard>
        )}

        {/* Address Information Card */}
        {(user?.residentialStatus || (userProfile?.presentResidentialAddress && Object.values(userProfile.presentResidentialAddress).some(v => v)) ||
          (userProfile?.nativePlaceAddress && Object.values(userProfile.nativePlaceAddress).some(v => v))) && (
          <InfoCard
            title="📍 Address Information"
            className="mb-6"
          >
            {user?.residentialStatus && <InfoField label="Residential Status" value={user.residentialStatus} />}
            {userProfile?.presentResidentialAddress && Object.values(userProfile.presentResidentialAddress).some(v => v) && (
              <div className="py-3 border-b border-gray-100">
                <span className="font-telex text-secondary/70 text-sm block mb-2">Present Residential Address</span>
                <span className="font-maven text-secondary">
                  {[
                    userProfile.presentResidentialAddress.street,
                    userProfile.presentResidentialAddress.area,
                    userProfile.presentResidentialAddress.landmark,
                    userProfile.presentResidentialAddress.city,
                    userProfile.presentResidentialAddress.state,
                    userProfile.presentResidentialAddress.pincode,
                  ].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
            )}
            {userProfile?.nativePlaceAddress && Object.values(userProfile.nativePlaceAddress).some(v => v) && (
              <div className="py-3">
                <span className="font-telex text-secondary/70 text-sm block mb-2">Native Place Address</span>
                <span className="font-maven text-secondary">
                  {[
                    userProfile.nativePlaceAddress.street,
                    userProfile.nativePlaceAddress.area,
                    userProfile.nativePlaceAddress.landmark,
                    userProfile.nativePlaceAddress.city,
                    userProfile.nativePlaceAddress.state,
                    userProfile.nativePlaceAddress.pincode,
                  ].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
            )}
          </InfoCard>
        )}

        {/* Interests Section */}
        {userProfile?.interests && userProfile.interests.length > 0 && (
          <InfoCard
            title="⭐ Interests"
            className="mb-6"
          >
            <div className="flex flex-wrap gap-2">
              {userProfile.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="bg-primary text-black font-telex text-sm px-4 py-2 rounded-full hover:bg-accent transition-colors"
                >
                  {interest}
                </span>
              ))}
            </div>
          </InfoCard>
        )}

        {/* Hobbies Section */}
        {userProfile?.hobbies && (
          <InfoCard
            title="🎨 Hobbies"
            className="mb-6"
          >
            <p className="font-maven text-gray-700 leading-relaxed">{userProfile.hobbies}</p>
          </InfoCard>
        )}

        {/* Photos Gallery */}
        {userProfile?.gallery?.photos && userProfile.gallery.photos.length > 0 && (
          <div className="mb-8">
            <h3 className="font-viga text-2xl text-secondary flex items-center gap-2 mb-4">
              📸 Photos ({userProfile.gallery.photos.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {userProfile.gallery.photos.map((photo, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-100 hover:shadow-lg transition-shadow"
                >
                  <img
                    src={photo.url}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Videos Section */}
        {userProfile?.gallery?.videos && userProfile.gallery.videos.length > 0 && (
          <div className="mb-8">
            <h3 className="font-viga text-2xl text-secondary flex items-center gap-2 mb-4">
              🎬 Videos ({userProfile.gallery.videos.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userProfile.gallery.videos.map((video, idx) => (
                <div
                  key={idx}
                  className="relative aspect-video rounded-xl overflow-hidden bg-gray-200 border-2 border-gray-100 hover:shadow-lg transition-shadow"
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

      {/* Footer spacing */}
      <div className="h-16" />
    </div>
  );
}
