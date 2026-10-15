'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, Download, Lock, Phone } from 'lucide-react';
import ImageLightbox from '@/components/ui/image-lightbox';
import { Button } from '@/components/ui/button';
import SpendCreditsDialog from '@/components/shared/SpendCreditsDialog';
import { useAuthStore } from '@/store/authStore';
import { client } from '@/lib/api/client';
import { toastSuccess, toastError } from '@/lib/toast';

const TABS = [
  { value: 'about', label: 'About' },
  { value: 'family', label: 'Family' },
  { value: 'career', label: 'Education & Career' },
  { value: 'horoscope', label: 'Horoscope' },
  { value: 'preferences', label: 'Partner Preferences' },
  { value: 'photos', label: 'Photos' },
];

const Field = ({ label, value }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#D4A843]/10 last:border-0">
      <span className="font-sans text-[#2C3E50]/70 text-sm">{label}</span>
      <span className="font-sans text-[#1A1A1A] font-medium text-sm text-right">{value}</span>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="mb-6 last:mb-0">
    {title && <h3 className="font-serif text-base font-semibold text-[#1A1A1A] mb-2">{title}</h3>}
    <div className="bg-white border border-[#D4A843]/15 rounded-xl p-5">{children}</div>
  </div>
);

function formatTimeToAMPM(time24) {
  if (!time24) return null;
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function formatAddress(addr) {
  if (!addr) return null;
  const parts = [addr.street, addr.area, addr.landmark, addr.city, addr.state, addr.country, addr.pincode].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

/**
 * Replaces the masked contact section for a non-unlocked profile — spends
 * the plan's phoneAndChat cost to reveal the number AND enable starting a
 * chat with this specific person, together as one action (see
 * profile.controller.js's unlockContact). Reads the cost straight from the
 * logged-in member's plan so the confirm dialog can show it without a
 * separate lookup.
 */
function UnlockContactPanel({ profileId, onUnlocked }) {
  const { membership } = useAuthStore();
  const [showDialog, setShowDialog] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const costInfo = membership?.planId?.costs?.phoneAndChat;
  const unlimited = !!costInfo?.unlimited;
  const cost = costInfo?.cost ?? 0;

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      await client.post(`/api/profiles/${profileId}/unlock-contact`);
      toastSuccess('Contact & chat unlocked for this profile.');
      setShowDialog(false);
      onUnlocked?.();
    } catch (error) {
      const data = error.response?.data;
      if (data?.requiresCredits) {
        toastError(`You need ${data.requiredCredits} credits; you have ${data.currentCredits}.`);
      } else if (data?.requiresMembership) {
        toastError(data.message || 'An active membership is required.');
      } else {
        toastError(data?.message || 'Failed to unlock contact.');
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 py-2 text-[#2C3E50]/70">
        <Lock size={16} className="text-[#D4A843] shrink-0 mt-0.5" />
        <span className="font-sans text-sm">
          {unlimited
            ? 'Your plan includes unlimited contact & chat access — unlock this profile to start.'
            : `Unlock this profile's phone number and start chatting for ${cost} credit${cost === 1 ? '' : 's'}.`}
        </span>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() => (unlimited || cost === 0 ? handleUnlock() : setShowDialog(true))}
        disabled={isUnlocking}
        className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans"
      >
        <Phone size={14} className="mr-1.5" />
        {isUnlocking ? 'Unlocking...' : 'Unlock Phone & Chat'}
      </Button>
      {!unlimited && cost > 0 && (
        <SpendCreditsDialog
          open={showDialog}
          cost={cost}
          activityLabel="Unlocking phone number & chat"
          isLoading={isUnlocking}
          onConfirm={handleUnlock}
          onCancel={() => setShowDialog(false)}
        />
      )}
    </div>
  );
}

/**
 * The brief's 6-tab profile layout, shared by both the self and other
 * profile views. `contactMasked` (other-profile only) hides raw contact
 * numbers behind a pay-to-unlock prompt until the viewer spends the plan's
 * phoneAndChat cost (see UnlockContactPanel below) or the plan grants it
 * free. `onContactUnlocked` lets the parent re-fetch the profile after a
 * successful unlock, so the real number replaces the masked prompt.
 */
export default function ProfileTabs({ profile, mode = 'self', contactMasked = false, onDownloadHoroscope, onContactUnlocked }) {
  const [activeTab, setActiveTab] = useState('about');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      {/* One scrollable row on phones instead of tabs wrapping into ragged rows. */}
      <TabsList className="w-full flex flex-nowrap md:flex-wrap justify-start md:justify-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden h-auto bg-[#F5E6C3]/40 p-1 rounded-xl gap-1">
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="shrink-0 flex-none md:flex-1 whitespace-nowrap font-sans text-sm data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] data-[state=active]:shadow-sm text-[#2C3E50]/70 rounded-lg px-3 py-2"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* ABOUT */}
      <TabsContent value="about" className="pt-5">
        <Section title="Personal Details">
          <Field label="Mother Tongue" value={profile?.motherTongue} />
          <Field label="Height" value={profile?.height} />
          <Field label="Weight" value={profile?.weight ? `${profile.weight} kg` : null} />
          <Field label="Physical Status" value={profile?.physicalStatus} />
          <Field label="Marital Status" value={profile?.maritalStatus} />
          <Field label="Blood Group" value={profile?.bloodGroup} />
          <Field label="Complexion" value={profile?.complexion} />
          <Field label="Diet" value={profile?.diet} />
          <Field label="Religion" value={profile?.religion} />
          <Field label="Caste" value={profile?.caste} />
          {profile?.languagesKnown?.length > 0 && (
            <div className="py-2.5">
              <span className="font-sans text-[#2C3E50]/70 text-sm block mb-2">Languages Known</span>
              <div className="flex flex-wrap gap-2">
                {profile.languagesKnown.map((lang) => (
                  <span key={lang} className="bg-[#F5E6C3]/60 text-[#1A1A1A] font-sans text-xs px-3 py-1 rounded-full">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="Contact Information">
          {contactMasked ? (
            <UnlockContactPanel profileId={profile?._id} onUnlocked={onContactUnlocked} />
          ) : (
            <>
              <Field label="Mobile Number" value={profile?.mobileNumber ? `+91 ${profile.mobileNumber}` : null} />
              <Field label="Alternate Mobile" value={profile?.alternateMobileNumber ? `+91 ${profile.alternateMobileNumber}` : null} />
              {!profile?.mobileNumber && !profile?.alternateMobileNumber && (
                <p className="font-sans text-sm text-[#2C3E50]/60">No contact number on file.</p>
              )}
            </>
          )}
        </Section>
      </TabsContent>

      {/* FAMILY */}
      <TabsContent value="family" className="pt-5">
        <Section title="Family Details">
          <Field label="Father's Name" value={profile?.fatherName} />
          <Field label="Father's Occupation" value={profile?.fatherOccupation} />
          <Field label="Mother's Name" value={profile?.motherName} />
          <Field label="Mother's Occupation" value={profile?.motherOccupation} />
          <Field label="Family Status" value={profile?.familyStatus} />
          <Field label="Residential Status" value={profile?.residentialStatus} />
        </Section>
        <Section title="Address">
          <Field label="Present Residential Address" value={formatAddress(profile?.presentResidentialAddress)} />
          <Field label="Native Place (Tharavadu)" value={formatAddress(profile?.nativePlaceAddress)} />
        </Section>
      </TabsContent>

      {/* EDUCATION & CAREER */}
      <TabsContent value="career" className="pt-5">
        <Section title="Education & Career">
          <Field label="Education" value={profile?.education} />
          <Field label="Employment Type" value={profile?.employmentType} />
          <Field label="Occupation" value={profile?.occupation} />
          <Field
            label="Annual Income"
            value={
              profile?.annualIncome?.displayText ||
              (profile?.annualIncome
                ? `${profile.annualIncome.currency} ${profile.annualIncome.min?.toLocaleString()}-${profile.annualIncome.max?.toLocaleString()}`
                : null)
            }
          />
          {profile?.professionalAdditionalInfo && (
            <div className="pt-3 mt-1 border-t border-[#D4A843]/10">
              <span className="font-sans text-[#2C3E50]/70 text-sm block mb-1">Additional Information</span>
              <p className="font-sans text-[#1A1A1A] text-sm whitespace-pre-line">{profile.professionalAdditionalInfo}</p>
            </div>
          )}
        </Section>
      </TabsContent>

      {/* HOROSCOPE */}
      <TabsContent value="horoscope" className="pt-5">
        {mode === 'other' && profile?.horoscopeCompatibility?.applicable && (
          <Section title="Compatibility">
            <div className="flex items-start gap-3">
              <span className={`shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-full ${
                profile.horoscopeCompatibility.compatible ? 'bg-[#E3F1E4] text-[#2E7D32]' : 'bg-[#F5E6C3] text-[#B8860B]'
              }`}>
                {profile.horoscopeCompatibility.compatible ? '✓' : '!'}
              </span>
              <div>
                <p className="font-sans text-sm font-semibold text-[#1A1A1A]">
                  {profile.horoscopeCompatibility.compatible
                    ? 'Rashi compatibility looks favorable'
                    : 'Rashi compatibility may need a closer look'}
                </p>
                <p className="font-sans text-xs text-[#2C3E50]/70 mt-1">
                  Based on Raasi ({profile.horoscopeCompatibility.raasiA} &amp; {profile.horoscopeCompatibility.raasiB}) only —
                  a basic, preliminary indicator. Not a substitute for a full horoscope reading by a family astrologer.
                </p>
              </div>
            </div>
          </Section>
        )}
        <Section title="Birth & Horoscope Details">
          <Field
            label="Date of Birth"
            value={
              profile?.dateOfBirth
                ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : null
            }
          />
          <Field label="Time of Birth" value={formatTimeToAMPM(profile?.timeOfBirth)} />
          <Field label="Place of Birth" value={profile?.placeOfBirth} />
          <Field label="Nakshatra" value={profile?.nakshatra} />
          <Field label="Raasi" value={profile?.raasi} />
          <Field label="Shuddha Jathakam" value={profile?.shuddhaJathakam} />
          {profile?.doshamTypes?.length > 0 && (
            <div className="py-2.5">
              <span className="font-sans text-[#2C3E50]/70 text-sm block mb-2">Dosham</span>
              <div className="flex flex-wrap gap-2">
                {profile.doshamTypes.map((d) => (
                  <span key={d} className="bg-[#C75B39]/10 text-[#C75B39] font-sans text-xs px-2.5 py-1 rounded-full">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(profile?.horoscopeDocument?.url || profile?.horoscopeDocument?.locked) && (
            <div className="flex items-center justify-between py-2.5 border-t border-[#D4A843]/10 mt-1">
              <span className="font-sans text-[#2C3E50]/70 text-sm flex items-center gap-2">
                <FileText size={15} className="text-[#D4A843]" />
                Horoscope Document
              </span>
              <div className="flex items-center gap-4">
                {/* Viewing comes with the (paid) download unlock. */}
                {profile.horoscopeDocument.url ? (
                  <a
                    href={profile.horoscopeDocument.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#D4A843] hover:text-[#B8860B] font-sans font-medium text-sm underline"
                  >
                    View
                  </a>
                ) : (
                  <span className="font-sans text-xs text-[#2C3E50]/60">Available after download</span>
                )}
                {onDownloadHoroscope && (
                  <button
                    onClick={onDownloadHoroscope}
                    className="text-[#D4A843] hover:text-[#B8860B] font-sans font-medium text-sm underline cursor-pointer bg-transparent border-0 p-0 inline-flex items-center gap-1"
                  >
                    <Download size={13} />
                    Download
                  </button>
                )}
              </div>
            </div>
          )}
        </Section>
      </TabsContent>

      {/* PARTNER PREFERENCES */}
      <TabsContent value="preferences" className="pt-5">
        <Section title="Looking For">
          <Field label="Seeking" value={profile?.seekingGender} />
          <Field label="Age Range" value={profile?.ageFrom && profile?.ageTo ? `${profile.ageFrom} - ${profile.ageTo} years` : null} />
          {profile?.partnerPreferenceDescription && (
            <div className="pt-3 mt-1 border-t border-[#D4A843]/10">
              <span className="font-sans text-[#2C3E50]/70 text-sm block mb-1">Partner Preference</span>
              <p className="font-sans text-[#1A1A1A] text-sm whitespace-pre-line">{profile.partnerPreferenceDescription}</p>
            </div>
          )}
        </Section>
        {profile?.interests?.length > 0 && (
          <Section title="Interests">
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="bg-[#D4A843] text-[#1A1A1A] font-sans font-medium text-sm px-4 py-1.5 rounded-full"
                >
                  {interest}
                </span>
              ))}
            </div>
          </Section>
        )}
      </TabsContent>

      {/* PHOTOS */}
      <TabsContent value="photos" className="pt-5">
        {profile?.gallery?.photos?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {profile.gallery.photos.map((photo, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                aria-label={`View photo ${idx + 1}`}
                className="relative aspect-square rounded-xl overflow-hidden border border-[#D4A843]/15 hover:shadow-lg transition-shadow group cursor-pointer"
              >
                <Image
                  src={photo.url}
                  alt={`Photo ${idx + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                  sizes="(max-width: 768px) 50vw, 33vw"
                  unoptimized
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
              </button>
            ))}
          </div>
        ) : (
          <p className="font-sans text-sm text-[#2C3E50]/60 text-center py-8">No additional photos uploaded yet.</p>
        )}
      </TabsContent>

      <ImageLightbox
        images={(profile?.gallery?.photos || []).map((photo, idx) => ({ url: photo.url, alt: `Photo ${idx + 1}` }))}
        index={lightboxIndex}
        onOpenChange={setLightboxIndex}
      />
    </Tabs>
  );
}
