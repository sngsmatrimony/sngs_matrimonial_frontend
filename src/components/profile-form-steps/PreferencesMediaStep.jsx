'use client';

import { useState, useEffect, useRef } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Image as ImageIcon, FileText } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { toastSuccess, toastError, toastWarning } from '@/lib/toast';

const INTERESTS = [
  'Painting', 'Coding', 'Poetry', 'Reading', 'Writing', 'Photography',
  'Music', 'Dancing', 'Cooking', 'Traveling', 'Gardening', 'Sports',
  'Fitness', 'Yoga', 'Meditation', 'Gaming', 'Movies', 'Theater', 'Volunteering', 'Fashion',
];

const PROFILE_BANNER_COLORS = [
  { value: '#FFB3BA', label: 'Pastel Rose', name: 'rose' },
  { value: '#FFFFBA', label: 'Pastel Vanilla', name: 'vanilla' },
  { value: '#BAE1FF', label: 'Pastel Sky', name: 'sky' },
  { value: '#BAFFC9', label: 'Pastel Mint', name: 'mint' },
  { value: '#E0BBE4', label: 'Pastel Lilac', name: 'lilac' },
  { value: '#FFDFD3', label: 'Pastel Coral', name: 'coral' },
  { value: '#D4F1F4', label: 'Pastel Cyan', name: 'cyan' },
  { value: '#F8B4D8', label: 'Pastel Mauve', name: 'mauve' },
  { value: '#C7CEEA', label: 'Pastel Periwinkle', name: 'periwinkle' },
  { value: '#FFEAA7', label: 'Pastel Butter', name: 'butter' },
];

export function PreferencesMediaStep({
  form,
  userProfile = null,
  profilePicture = null,
  galleryPhotos = [],
  onFileUpdate = null,
  user = null,
  idProof = null,
  idProofRequired = false,
  onDeleteIdProof = null,
}) {
  const { user: authUser } = useAuthStore();
  const hasInitialized = useRef(false);
  const profilePictureInputRef = useRef(null);
  const galleryPhotosInputRef = useRef(null);
  const idProofInputRef = useRef(null);

  const hasValidIdProofUrl = (doc) => doc?.url && doc.url.trim() !== '';
  const existingIdProof = hasValidIdProofUrl(user?.idProof)
    ? user.idProof
    : hasValidIdProofUrl(userProfile?.idProof)
      ? userProfile.idProof
      : null;

  const handleIdProofUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toastError('ID proof file must be under 5 MB');
      return;
    }

    const fileType = file.type === 'application/pdf' ? 'pdf' : 'image';
    const preview = fileType === 'pdf' ? null : URL.createObjectURL(file);

    onFileUpdate?.('idProof', {
      file,
      preview,
      fileType,
      fileName: file.name,
      fileSize: file.size,
    });
  };

  const removeIdProof = () => {
    if (idProof?.preview) {
      URL.revokeObjectURL(idProof.preview);
    }
    onFileUpdate?.('idProof', null);
    if (idProofInputRef.current) {
      idProofInputRef.current.value = '';
    }
  };

  // Fallback local state when onFileUpdate is not provided (backward compatibility)
  const [localProfilePicture, setLocalProfilePicture] = useState(null);
  const [localGalleryPhotos, setLocalGalleryPhotos] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize with existing media on mount (only once)
  useEffect(() => {
    if (!onFileUpdate || hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    // Profile picture from userProfile or authUser
    if (userProfile?.profilePicture?.url || authUser?.profilePicture?.url) {
      const profilePic = userProfile?.profilePicture?.url || authUser?.profilePicture?.url;
      onFileUpdate('profilePicture', {
        preview: profilePic,
        existing: true,
      });
    }

    // Gallery photos from userProfile
    if (userProfile?.gallery?.photos && Array.isArray(userProfile.gallery.photos) && userProfile.gallery.photos.length > 0) {
      const existingPhotos = userProfile.gallery.photos.map(photo => ({
        preview: photo.url,
        existing: true,
      }));
      onFileUpdate('galleryPhotos', existingPhotos);
    }

  }, [onFileUpdate, userProfile, authUser]);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);

    // Use parent state if available, otherwise use local state
    const currentPhotos = onFileUpdate
      ? (galleryPhotos || []).length
      : localGalleryPhotos.length;

    if (currentPhotos + files.length > 10) {
      toastWarning('Maximum 10 photos allowed');
      return;
    }

    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    if (onFileUpdate) {
      onFileUpdate('galleryPhotos', [...(galleryPhotos || []), ...newPhotos]);
    } else {
      setLocalGalleryPhotos(prev => [...prev, ...newPhotos]);
    }

    // Reset input to allow selecting the same file again
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleProfilePictureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const pictureData = {
      file,
      preview: URL.createObjectURL(file)
    };

    if (onFileUpdate) {
      onFileUpdate('profilePicture', pictureData);
    } else {
      setLocalProfilePicture(pictureData);
    }

    // Reset input to allow selecting a different file
    if (e.target) {
      e.target.value = '';
    }
  };

  const removePhoto = async (index) => {
    const photos = onFileUpdate ? galleryPhotos : localGalleryPhotos;
    const photo = photos?.[index];

    if (!photo) return;

    setIsDeleting(true);

    try {
      // If it's an existing photo (already on server), delete from backend
      if (photo.existing) {
        const result = await useAuthStore.getState().deletePhoto(index);
        if (!result.success) {
          console.error('[PreferencesMediaStep] Failed to delete photo:', result.error);
          toastError('Failed to delete photo: ' + result.error);
          return;
        }
      }

      // Remove from local state (works for both new and existing after API call)
      if (onFileUpdate) {
        const newPhotos = photos.filter((_, i) => i !== index);
        onFileUpdate('galleryPhotos', newPhotos);
      } else {
        setLocalGalleryPhotos(prev => prev.filter((_, i) => i !== index));
      }
    } catch (err) {
      console.error('[PreferencesMediaStep] Error removing photo:', err);
      toastError('Failed to delete photo');
    } finally {
      setIsDeleting(false);
    }
  };

  const removeProfilePicture = () => {
    if (onFileUpdate) {
      onFileUpdate('profilePicture', null);
    } else {
      setLocalProfilePicture(null);
    }
  };


  return (
    <div className="space-y-6">
      {/* <h2 className="font-serif text-xl text-[#1A1A1A]">Preferences & Media</h2> */}

      {/* Age Range */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="ageFrom"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Preferred Age From *</FormLabel>
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-sans h-12 rounded-xl border-[#D4A843]/25 text-[#1A1A1A] focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50">
                    <SelectValue placeholder="Select minimum age" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from({ length: 73 }, (_, i) => 18 + i).map(age => (
                    <SelectItem key={age} value={age.toString()}>
                      {age}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ageTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Preferred Age To *</FormLabel>
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-sans h-12 rounded-xl border-[#D4A843]/25 text-[#1A1A1A] focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50">
                    <SelectValue placeholder="Select maximum age" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from({ length: 73 }, (_, i) => 18 + i).map(age => (
                    <SelectItem key={age} value={age.toString()}>
                      {age}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
            </FormItem>
          )}
        />
      </div>

      {/* Interests */}
      <FormField
        control={form.control}
        name="interests"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Interests *</FormLabel>
            <FormControl>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {INTERESTS.map(interest => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      checked={field.value?.includes(interest) || false}
                      onCheckedChange={(checked) => {
                        const newValue = checked
                          ? [...(field.value || []), interest]
                          : (field.value || []).filter(i => i !== interest);
                        field.onChange(newValue);
                      }}
                      id={interest}
                    />
                    <label htmlFor={interest} className="font-sans text-[#1A1A1A] cursor-pointer text-sm">
                      {interest}
                    </label>
                  </div>
                ))}
              </div>
            </FormControl>
            <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
          </FormItem>
        )}
      />

      {/* About Myself */}
      <FormField
        control={form.control}
        name="profileAbout"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">About Myself *</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Tell us about yourself"
                className="font-sans min-h-32"
                maxLength={1000}
              />
            </FormControl>
            <div className="text-sm mt-2 text-muted-foreground">
              {field.value?.length || 0}/1000 characters
            </div>
            <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
          </FormItem>
        )}
      />

      {/* Profile Picture */}
      <div className="space-y-3 p-5 border border-[#D4A843]/20 rounded-xl bg-[#FDF8F0]/60">
        <div className="flex items-center gap-2">
          <h3 className="font-sans font-semibold text-[#1A1A1A]">Profile Photo</h3>
          <span className="text-[10px] font-sans font-bold uppercase tracking-wide text-[#C75B39] bg-[#FBEAE5] border border-[#E8B4A0] px-2 py-0.5 rounded-full">
            Required
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {(onFileUpdate ? profilePicture : localProfilePicture) && (
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/30 shrink-0 group">
              <Image
                src={(onFileUpdate ? profilePicture : localProfilePicture).preview}
                alt="Profile"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeProfilePicture()}
                disabled={isDeleting}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-red-500 text-white rounded-full pl-1.5 pr-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <X size={12} />
                <span className="font-sans text-[10px] font-medium">Remove</span>
              </button>
            </div>
          )}

          <div className="flex-1 w-full space-y-2">
            <Input
              ref={profilePictureInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleProfilePictureUpload}
              className="font-sans"
            />
            <p className="flex items-start gap-1.5 text-xs text-gray-500 font-sans">
              <ImageIcon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" strokeWidth={1.75} />
              JPEG or PNG, up to 10 MB. Use a clear, recent, well-lit photo of your face — low-quality or blurry photos may not be approved by our admin team.
            </p>
          </div>
        </div>
      </div>

      {/* Profile Banner */}
      <div className="space-y-3 p-5 border border-[#D4A843]/20 rounded-xl bg-[#FDF8F0]/60">
        <FormField
          control={form.control}
          name="profileBannerColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-sans font-semibold text-[#1A1A1A] text-base">Profile Banner Color</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {PROFILE_BANNER_COLORS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => field.onChange(color.value)}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        field.value === color.value ? 'border-secondary scale-110' : 'border-gray-300 hover:border-secondary/50'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
            </FormItem>
          )}
        />
      </div>

      {/* Gallery Photos */}
      <div className="space-y-3 p-5 border border-[#D4A843]/20 rounded-xl bg-[#FDF8F0]/60">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-sans font-semibold text-[#1A1A1A]">Gallery Photos</h3>
            <span className="text-[10px] font-sans font-bold uppercase tracking-wide text-[#C75B39] bg-[#FBEAE5] border border-[#E8B4A0] px-2 py-0.5 rounded-full">
              At least 1 required
            </span>
          </div>
          <p className="text-sm text-[#1A1A1A] font-sans">{((onFileUpdate ? galleryPhotos : localGalleryPhotos) || []).length}/10 added</p>
        </div>
        <Input
          ref={galleryPhotosInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png"
          onChange={handlePhotoUpload}
          className="font-sans"
        />
        <p className="flex items-start gap-1.5 text-xs text-gray-500 font-sans">
          <ImageIcon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" strokeWidth={1.75} />
          JPEG or PNG, up to 10 MB each. Add at least one clear, good-quality photo — blurry, dark, or heavily filtered photos may delay admin approval.
        </p>
        {((onFileUpdate ? galleryPhotos : localGalleryPhotos) || []).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {((onFileUpdate ? galleryPhotos : localGalleryPhotos) || []).map((photo, idx) => {
              // Ensure photo has preview property
              const previewSrc = photo.preview || (photo.file ? URL.createObjectURL(photo.file) : null);
              if (!previewSrc) return null;

              return (
                <div key={idx} className="relative group">
                  <Image
                    src={previewSrc}
                    alt={`Photo ${idx + 1}`}
                    width={100}
                    height={100}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    disabled={isDeleting}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ID Proof */}
      <div className="space-y-3 p-5 border border-[#D4A843]/20 rounded-xl bg-[#FDF8F0]/60">
        <div className="flex items-center gap-2">
          <h3 className="font-sans font-semibold text-[#1A1A1A]">ID Proof</h3>
          <span
            className={`text-[10px] font-sans font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
              idProofRequired
                ? 'text-[#C75B39] bg-[#FBEAE5] border-[#E8B4A0]'
                : 'text-[#2C3E50]/60 bg-[#F5E6C3]/40 border-[#D4A843]/20'
            }`}
          >
            {idProofRequired ? 'Required' : 'Optional'}
          </span>
        </div>
        <p className="font-sans text-xs text-gray-500">
          A government-issued ID (Aadhaar, Passport, Driving License, Voter ID). Accepted formats: PDF, JPEG, PNG. Maximum size: 5 MB
        </p>

        <Input
          ref={idProofInputRef}
          type="file"
          accept=".pdf,image/jpeg,image/png"
          onChange={handleIdProofUpload}
          className="font-sans cursor-pointer"
        />

        {existingIdProof && !idProof && (
          <div className="relative flex items-center gap-3 p-3 bg-[#FDF8F0] border border-[#D4A843]/20 rounded-xl">
            {existingIdProof.fileType === 'pdf' ? (
              <FileText className="text-red-500" size={32} />
            ) : (
              <div className="relative w-24 h-24 rounded overflow-hidden">
                <Image src={existingIdProof.url} alt="Current ID proof" fill className="object-cover" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-sans text-sm font-medium">Current ID Proof</p>
              <p className="font-sans text-xs text-gray-500">
                Uploaded {existingIdProof.uploadedAt ? new Date(existingIdProof.uploadedAt).toLocaleDateString() : 'Previously'}
              </p>
            </div>
            {onDeleteIdProof && (
              <button
                type="button"
                onClick={onDeleteIdProof}
                className="flex items-center gap-1 px-2 py-1.5 hover:bg-red-50 rounded-lg transition text-red-500"
              >
                <X size={18} />
                <span className="font-sans text-xs font-medium">Remove</span>
              </button>
            )}
          </div>
        )}

        {idProof && (
          <div className="relative flex items-center gap-3 p-3 bg-white border border-primary rounded-lg">
            {idProof.fileType === 'pdf' ? (
              <FileText className="text-red-500" size={32} />
            ) : (idProof.preview || idProof.url) ? (
              <div className="relative w-24 h-24 rounded overflow-hidden">
                <Image src={idProof.preview || idProof.url} alt="ID proof preview" fill className="object-cover" />
              </div>
            ) : null}
            <div className="flex-1">
              <p className="font-sans text-sm font-medium truncate">{idProof.fileName || 'ID Proof'}</p>
              <p className="font-sans text-xs text-gray-500">
                {idProof.fileSize ? `${(idProof.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Existing Upload'}
              </p>
            </div>
            <button
              type="button"
              onClick={removeIdProof}
              className="flex items-center gap-1 px-2 py-1.5 hover:bg-red-50 rounded-lg transition text-red-500"
            >
              <X size={18} />
              <span className="font-sans text-xs font-medium">Remove</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}