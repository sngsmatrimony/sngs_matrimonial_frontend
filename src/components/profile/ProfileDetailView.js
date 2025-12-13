'use client';

import { useEffect, useState } from 'react';
import { Heart, MessageCircle, MapPin, Briefcase, Book, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLandingStore } from '@/store/landingStore';
import Header from '@/components/layout/Header';
import { client } from '@/lib/api/client';
import { toastSuccess, toastError } from '@/lib/toast';

// Information Card Component
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
const InfoField = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-2">
      {Icon && <Icon size={16} className="text-secondary/60" />}
      <span className="font-telex text-secondary/70 text-sm">{label}</span>
    </div>
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

export default function ProfileDetailView({ profileId }) {
  const router = useRouter();
  const { setActiveTab, setSelectedChatUserId } = useLandingStore();
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

  const handleChat = () => {
    setActiveTab('messages');
    setSelectedChatUserId(profileId);
    router.push('/');
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
  const bannerStyle = {
    backgroundColor: profile?.profileBanner?.bannerColor || '#FFB3BA'
  };

  const profileImageUrl = profile?.profilePicture?.url;

  return (
    <div className="min-h-screen bg-white">
      <Header showLogout={true} />
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

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2 z-40">
          {/* Chat Button */}
          <button
            onClick={handleChat}
            className="bg-white/90 hover:bg-white rounded-full p-2 transition-all duration-200 flex items-center justify-center hover:scale-110"
            aria-label="Send message"
            title="Send message"
          >
            <MessageCircle
              size={28}
              className="stroke-secondary fill-none transition-all duration-200"
            />
          </button>

          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={isLikeLoading}
            className={`bg-white/90 hover:bg-white rounded-full p-2 transition-all duration-200 flex items-center justify-center ${
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

              {/* About Myself */}
              {profile?.aboutMyself && (
                <div className="mb-6">
                  <h3 className="font-viga text-lg text-secondary mb-2">
                    About
                  </h3>
                  <p className="font-maven text-gray-700 leading-relaxed">{profile.aboutMyself}</p>
                </div>
              )}

              {/* Seeking Preferences */}
              {(profile?.seekingGender || profile?.ageFrom || profile?.ageTo) && (
                <p className="font-telex text-sm text-secondary/70">
                  Seeking: <span className="font-maven text-secondary">{profile?.seekingGender}</span> |
                  Age: <span className="font-maven text-secondary">{profile?.ageFrom}-{profile?.ageTo}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information Cards */}
        <div className="max-w-4xl mx-auto">
          {/* Personal Details Card */}
          {(profile?.motherTongue || profile?.height || profile?.physicalStatus || profile?.maritalStatus || profile?.complexion || profile?.diet || profile?.weight || profile?.bloodGroup || profile?.familyStatus) && (
            <InfoCard title="💑 Personal Details" className="mb-6">
              <InfoField label="Mother Tongue" value={profile?.motherTongue} />
              <InfoField label="Height" value={profile?.height} />
              <InfoField label="Weight" value={profile?.weight ? `${profile.weight} kg` : null} />
              <InfoField label="Physical Status" value={profile?.physicalStatus} />
              <InfoField label="Blood Group" value={profile?.bloodGroup} />
              <InfoField label="Marital Status" value={profile?.maritalStatus} />
              {profile?.complexion && <InfoField label="Complexion" value={profile.complexion} />}
              {profile?.diet && <InfoField label="Diet" value={profile.diet} />}
              {profile?.familyStatus && <InfoField label="Family Status" value={profile.familyStatus} />}
            </InfoCard>
          )}

          {/* Languages Known Card */}
          {profile?.languagesKnown && profile.languagesKnown.length > 0 && (
            <InfoCard title="🗣️ Languages Known" className="mb-6">
              <div className="flex flex-wrap gap-2">
                {profile.languagesKnown.map((language, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-100 text-gray-800 font-maven text-sm px-3 py-1 rounded-full"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </InfoCard>
          )}

          {/* Birth Details Card */}
          {(profile?.dateOfBirth || profile?.timeOfBirth || profile?.placeOfBirth || profile?.nakshatra || profile?.raasi || profile?.shuddhaJathakam || profile?.doshamTypes) && (
            <InfoCard title="💫 Birth Details" className="mb-6">
              {profile?.dateOfBirth && (
                <InfoField
                  label="Date of Birth"
                  value={new Date(profile.dateOfBirth).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                />
              )}
              {profile?.timeOfBirth && (
                <InfoField
                  label="Time of Birth"
                  value={formatTimeToAMPM(profile.timeOfBirth)}
                />
              )}
              {profile?.nakshatra && <InfoField label="Star" value={profile.nakshatra} />}
              {profile?.raasi && <InfoField label="Raasi" value={profile.raasi} />}
              {profile?.shuddhaJathakam && <InfoField label="Shuddha Jathakam" value={profile.shuddhaJathakam} />}
              {profile?.doshamTypes && profile.doshamTypes.length > 0 && (
                <div className="py-2 border-b border-gray-100">
                  <span className="font-telex text-secondary/70 text-sm block mb-2">Dosham</span>
                  <div className="flex flex-wrap gap-2">
                    {profile.doshamTypes.map((dosham, idx) => (
                      <span key={idx} className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                        {dosham}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {profile?.placeOfBirth && <InfoField label="Place of Birth" value={profile.placeOfBirth} />}
            </InfoCard>
          )}

          {/* Religion & Location Card */}
          {(profile?.religion || profile?.caste || profile?.country || profile?.state || profile?.city) && (
            <InfoCard title="🙏 Religion & Location" icon={MapPin} className="mb-6">
              <InfoField label="Religion" value={profile?.religion} />
              {profile?.caste && <InfoField label="Caste" value={profile.caste} />}
              <InfoField label="Country" value={profile?.country} />
              {profile?.state && <InfoField label="State" value={profile.state} />}
              {profile?.city && <InfoField label="City" value={profile.city} />}
            </InfoCard>
          )}

          {/* Professional Information Card */}
          {(profile?.education || profile?.employmentType || profile?.occupation || profile?.annualIncome || profile?.additionalInfo) && (
            <InfoCard title="💼 Professional" icon={Briefcase} className="mb-6">
              <InfoField label="Education" value={profile?.education} />
              <InfoField label="Employment Type" value={profile?.employmentType} />
              <InfoField label="Occupation" value={profile?.occupation} />
              {profile?.annualIncome && (
                <InfoField
                  label="Annual Income"
                  value={profile.annualIncome.displayText || `${profile.annualIncome.currency} ${profile.annualIncome.min?.toLocaleString()}-${profile.annualIncome.max?.toLocaleString()}`}
                />
              )}
              {profile?.additionalInfo && (
                <div className="py-3 border-b border-gray-100 last:border-0">
                  <span className="font-telex text-secondary/70 text-sm block mb-2">Additional Information</span>
                  <p className="font-maven text-secondary whitespace-pre-line">{profile.additionalInfo}</p>
                </div>
              )}
            </InfoCard>
          )}

          {/* Address Information Card */}
          {(profile?.residentialStatus || (profile?.presentResidentialAddress && Object.values(profile.presentResidentialAddress).some(v => v)) ||
            (profile?.nativePlaceAddress && Object.values(profile.nativePlaceAddress).some(v => v))) && (
            <InfoCard title="📍 Address Information" className="mb-6">
              {profile?.residentialStatus && <InfoField label="Residential Status" value={profile.residentialStatus} />}
              {profile?.presentResidentialAddress && Object.values(profile.presentResidentialAddress).some(v => v) && (
                <div className="py-3 border-b border-gray-100">
                  <span className="font-telex text-secondary/70 text-sm block mb-2">Present Residential Address</span>
                  <span className="font-maven text-secondary">
                    {[
                      profile.presentResidentialAddress.street,
                      profile.presentResidentialAddress.area,
                      profile.presentResidentialAddress.landmark,
                      profile.presentResidentialAddress.city,
                      profile.presentResidentialAddress.state,
                      profile.presentResidentialAddress.pincode,
                    ].filter(Boolean).join(', ') || '—'}
                  </span>
                </div>
              )}
              {profile?.nativePlaceAddress && Object.values(profile.nativePlaceAddress).some(v => v) && (
                <div className="py-3">
                  <span className="font-telex text-secondary/70 text-sm block mb-2">Native Place Address</span>
                  <span className="font-maven text-secondary">
                    {[
                      profile.nativePlaceAddress.street,
                      profile.nativePlaceAddress.area,
                      profile.nativePlaceAddress.landmark,
                      profile.nativePlaceAddress.city,
                      profile.nativePlaceAddress.state,
                      profile.nativePlaceAddress.pincode,
                    ].filter(Boolean).join(', ') || '—'}
                  </span>
                </div>
              )}
            </InfoCard>
          )}

          {/* About Section */}
          {profile?.about && (
            <InfoCard title="📝 About Me" className="mb-6">
              <p className="font-maven text-gray-700 leading-relaxed">{profile.about}</p>
            </InfoCard>
          )}

          {/* Interests Section */}
          {profile?.interests && profile.interests.length > 0 && (
            <InfoCard title="⭐ Interests" className="mb-6">
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, idx) => (
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
          {profile?.hobbies && (
            <InfoCard title="🎨 Hobbies" className="mb-6">
              <p className="font-maven text-gray-700 leading-relaxed">{profile.hobbies}</p>
            </InfoCard>
          )}

          {/* Contact Information Card */}
          {(profile?.mobileNumber || profile?.alternateMobileNumber || profile?.sngsMembershipNumber) && (
            <InfoCard title="📞 Contact Information" className="mb-6">
              {profile?.mobileNumber && (
                <InfoField
                  label="Mobile Number"
                  value={`+91 ${profile.mobileNumber}`}
                />
              )}
              {profile?.alternateMobileNumber && (
                <InfoField
                  label="Alternate Mobile Number"
                  value={`+91 ${profile.alternateMobileNumber}`}
                />
              )}
              {profile?.sngsMembershipNumber && (
                <InfoField
                  label="SNGS Membership Number"
                  value={profile.sngsMembershipNumber}
                />
              )}
            </InfoCard>
          )}

          {/* Photos Gallery */}
          {profile?.gallery?.photos && profile.gallery.photos.length > 0 && (
            <div className="mb-8">
              <h3 className="font-viga text-2xl text-secondary mb-4 flex items-center gap-2">
                📸 Photos ({profile.gallery.photos.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profile.gallery.photos.map((photo, idx) => (
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
        </div>
      </div>

      {/* Footer spacing */}
      <div className="h-16" />
    </div>
  );
}
