'use client';

import { useEffect, useState } from 'react';
import { useLandingStore } from '@/store/landingStore';
import { useAuthStore } from '@/store/authStore';
import { client } from '@/lib/api/client';
import { toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EditProfileForm from './EditProfileForm';
import { Pencil } from 'lucide-react';

// Section heading component (matching register flow)
const SectionHeading = ({ children }) => (
  <h3 className="font-viga text-lg text-secondary mb-4 mt-6 first:mt-0">
    {children}
  </h3>
);

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
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      {/* Profile Banner */}
      <div
        className="w-full h-48 bg-cover bg-center rounded-t-lg shadow-lg relative"
        style={bannerStyle}
      >
        {/* Edit Button */}
        <Button
          onClick={() => setIsEditMode(true)}
          className="absolute top-4 right-4 bg-primary hover:bg-accent text-black font-maven text-base gap-2"
        >
          <Pencil className="w-4 h-4" />
          Edit Profile
        </Button>
      </div>

      {/* Main Card Container */}
      <Card className="border-0 shadow-lg bg-white rounded-b-lg rounded-t-none">
        <CardHeader className="pb-6 border-b border-gray-100">
          <div className="flex items-center gap-6 mt-0">
            {/* Profile Picture */}
            <div className="relative w-32 h-32 rounded-xl border-4 border-white overflow-hidden bg-gray-100 shadow-md -mt-24 flex items-center justify-center">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={user?.fullName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image failed to load:', profileImageUrl);
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div style="color: #999; font-size: 12px; text-align: center;">No Image</div>';
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
            <div className="flex-1">
              <CardTitle className="font-viga text-3xl text-secondary mb-2">
                {user?.fullName}
              </CardTitle>
              <p className="font-telex text-secondary mb-2">
                {user?.age || 'Age'} • {user?.gender}
              </p>
              <p className="font-telex text-sm text-secondary/70">
                Seeking: {user?.seekingGender} | Age: {user?.ageFrom}-{user?.ageTo}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-5">
            {/* Personal Details */}
            {(user?.caste || user?.religion || user?.isDivorcee || user?.nakshatra || user?.raasi) && (
              <>
                <SectionHeading>Personal Details</SectionHeading>
                <div className="space-y-2">
                  {user?.caste && (
                    <p className="font-maven text-base text-secondary">
                      <span className="font-semibold">Caste:</span> {user.caste}
                    </p>
                  )}
                  {user?.religion && (
                    <p className="font-maven text-base text-secondary">
                      <span className="font-semibold">Religion:</span> {user.religion}
                    </p>
                  )}
                  {user?.nakshatra && (
                    <p className="font-maven text-base text-secondary">
                      <span className="font-semibold">Star Details:</span> {user.nakshatra}
                    </p>
                  )}
                  {user?.raasi && (
                    <p className="font-maven text-base text-secondary">
                      <span className="font-semibold">Raasi:</span> {user.raasi}
                    </p>
                  )}
                  {user?.isDivorcee && (
                    <p className="font-maven text-base text-secondary">
                      <span className="font-semibold">Marital Status:</span> Divorced
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Physical & Health Details */}
            {(user?.height || user?.physicalStatus || user?.weight || user?.bloodGroup) && (
              <>
                <SectionHeading>Physical & Health Information</SectionHeading>
                <div className="space-y-2">
                  {user?.height && (
                    <p className="font-maven text-base text-secondary">
                      <span className="font-semibold">Height:</span> {user.height}
                    </p>
                  )}
                  {user?.physicalStatus && (
                    <p className="font-maven text-base text-secondary">
                      <span className="font-semibold">Physical Status:</span> {user.physicalStatus}
                    </p>
                  )}
                  {user?.weight && (
                    <p className="font-maven text-base text-secondary">
                      <span className="font-semibold">Weight:</span> {user.weight} kg
                    </p>
                  )}
                  {user?.bloodGroup && (
                    <p className="font-maven text-base text-secondary">
                      <span className="font-semibold">Blood Group:</span> {user.bloodGroup}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Family Information */}
            {(user?.fatherName || user?.motherName || user?.familyStatus || user?.residentialStatus) && (
              <>
                <SectionHeading>Family Information</SectionHeading>
                <div className="space-y-2">
                  {user?.fatherName && (
                    <p className="font-maven text-base text-secondary">
                      <span className="font-semibold">Father's Name:</span> {user.fatherName}
                      {user?.fatherOccupation && ` (${user.fatherOccupation})`}
                    </p>
                  )}
                  {user?.motherName && (
                    <p className="font-maven text-base text-secondary">
                      <span className="font-semibold">Mother's Name:</span> {user.motherName}
                      {user?.motherOccupation && ` (${user.motherOccupation})`}
                    </p>
                  )}
                  {user?.familyStatus && (
                    <p className="font-maven text-base text-secondary">
                      <span className="font-semibold">Family Status:</span> {user.familyStatus}
                    </p>
                  )}
                  {user?.residentialStatus && (
                    <p className="font-maven text-base text-secondary">
                      <span className="font-semibold">Residential Status:</span> {user.residentialStatus}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* About */}
            {user?.about && (
              <>
                <SectionHeading>About</SectionHeading>
                <p className="font-maven text-base text-secondary">{user.about}</p>
              </>
            )}

            {/* Professional Details */}
            {(user?.education || user?.employmentType || user?.occupation || user?.annualIncome) && (
              <>
                <SectionHeading>Professional Details</SectionHeading>
                <div className="space-y-2">
                  {user?.education && (
                    <p className="font-maven text-base text-secondary">
                      <span className="font-semibold">Education:</span> {user.education}
                    </p>
                  )}
                  {user?.employmentType && (
                    <p className="font-maven text-base text-secondary">
                      <span className="font-semibold">Employment Type:</span> {user.employmentType}
                    </p>
                  )}
                  {user?.occupation && (
                    <p className="font-maven text-base text-secondary">
                      <span className="font-semibold">Occupation:</span> {user.occupation}
                    </p>
                  )}
                  {user?.annualIncome && (
                    <p className="font-maven text-base text-secondary">
                      <span className="font-semibold">Annual Income:</span> {user.annualIncome.currency} {user.annualIncome.amount}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Address Information */}
            {((userProfile?.presentResidentialAddress && Object.values(userProfile.presentResidentialAddress).some(v => v)) ||
              (userProfile?.nativePlaceAddress && Object.values(userProfile.nativePlaceAddress).some(v => v))) && (
              <>
                <SectionHeading>Address Information</SectionHeading>
                {userProfile?.presentResidentialAddress && Object.values(userProfile.presentResidentialAddress).some(v => v) && (
                  <div className="mb-4">
                    <p className="font-maven font-semibold text-secondary mb-2">Present Residential Address</p>
                    <p className="font-maven text-base text-secondary">
                      {[
                        userProfile.presentResidentialAddress.street,
                        userProfile.presentResidentialAddress.area,
                        userProfile.presentResidentialAddress.landmark,
                        userProfile.presentResidentialAddress.city,
                        userProfile.presentResidentialAddress.state,
                        userProfile.presentResidentialAddress.pincode,
                      ].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                )}
                {userProfile?.nativePlaceAddress && Object.values(userProfile.nativePlaceAddress).some(v => v) && (
                  <div>
                    <p className="font-maven font-semibold text-secondary mb-2">Native Place Address</p>
                    <p className="font-maven text-base text-secondary">
                      {[
                        userProfile.nativePlaceAddress.street,
                        userProfile.nativePlaceAddress.area,
                        userProfile.nativePlaceAddress.landmark,
                        userProfile.nativePlaceAddress.city,
                        userProfile.nativePlaceAddress.state,
                        userProfile.nativePlaceAddress.pincode,
                      ].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Interests Section */}
            {userProfile?.interests && userProfile.interests.length > 0 && (
              <>
                <SectionHeading>Interests</SectionHeading>
                <div className="flex flex-wrap gap-2">
                  {userProfile.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="bg-primary text-black font-telex px-4 py-2 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* Hobbies Section */}
            {userProfile?.hobbies && (
              <>
                <SectionHeading>Hobbies</SectionHeading>
                <p className="font-maven text-base text-secondary">{userProfile.hobbies}</p>
              </>
            )}

            {/* Photos Gallery */}
            {userProfile?.gallery?.photos && userProfile.gallery.photos.length > 0 && (
              <>
                <SectionHeading>Photos</SectionHeading>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {userProfile.gallery.photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden shadow-sm"
                    >
                      <img
                        src={photo.url}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Videos Section */}
            {userProfile?.gallery?.videos && userProfile.gallery.videos.length > 0 && (
              <>
                <SectionHeading>Videos</SectionHeading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userProfile.gallery.videos.map((video, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 shadow-sm"
                    >
                      <video
                        src={video.url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
