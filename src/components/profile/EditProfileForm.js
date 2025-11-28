'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { toastSuccess, toastError } from '@/lib/toast';
import { client } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useLandingStore } from '@/store/landingStore';
import {
  PersonalDetailsStep,
  LocationAddressStep,
  ProfessionalDetailsStep,
  FamilyDetailsStep,
  PreferencesMediaStep,
} from '@/components/profile-form-steps';

// Step 1: Personal Details (DOB, Mother Tongue, Gender, Seeking, Height, Physical Status, Marital Status)
const step1Schema = z.object({
  dateOfBirth: z.date({ message: 'Please select your date of birth' }),
  motherTongue: z.string().min(1, 'Please select your mother tongue'),
  height: z.string().min(1, 'Please select your height'),
  physicalStatus: z.string().min(1, 'Please select your physical status'),
  maritalStatus: z.string().min(1, 'Please select your marital status'),
  gender: z.string().min(1, 'Please select your gender'),
  seekingGender: z.string().min(1, 'Please select who you are seeking'),
}).refine((data) => {
  if (!data.dateOfBirth) return false;
  const today = new Date();
  let age = today.getFullYear() - data.dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - data.dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < data.dateOfBirth.getDate())) {
    age--;
  }
  return age >= 18 && age <= 90;
}, {
  message: 'Age must be between 18 and 90 years',
  path: ['dateOfBirth'],
});

// Step 2: Religion & Addresses (Religion, Caste, Jathakam, etc. + Addresses)
const step2Schema = z.object({
  religion: z.string().min(1, 'Please select your religion'),
  caste: z.string().optional(),
  shuddhaJathakam: z.string().optional(),
  doshamTypes: z.array(z.string()).optional().default([]),
  nakshatra: z.string().optional().nullable(),
  raasi: z.string().optional().nullable(),
  country: z.string().min(1, 'Please select your country'),
  state: z.string().optional(),
  city: z.string().optional(),
  presentResidentialAddress: z.object({
    street: z.string().optional(),
    area: z.string().optional(),
    landmark: z.string().optional(),
    pincode: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
  nativePlaceAddress: z.object({
    street: z.string().optional(),
    area: z.string().optional(),
    landmark: z.string().optional(),
    pincode: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
}).refine((data) => {
  if (data.religion === 'Hindu' && !data.caste) {
    return false;
  }
  return true;
}, {
  message: 'Caste is required for Hindu religion',
  path: ['caste'],
}).refine((data) => {
  if (data.country === 'India' && !data.state) {
    return false;
  }
  return true;
}, {
  message: 'State is required for India',
  path: ['state'],
}).refine((data) => {
  if (data.shuddhaJathakam === 'No' && (!data.doshamTypes || data.doshamTypes.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Please select at least one dosham type',
  path: ['doshamTypes'],
});

// Step 3: Location Details (Country, State, City, Addresses)
const step3Schema = z.object({
  country: z.string().min(1, 'Please select your country'),
  state: z.string().optional(),
  city: z.string().optional(),
  presentResidentialAddress: z.object({
    street: z.string().optional(),
    area: z.string().optional(),
    landmark: z.string().optional(),
    pincode: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
  nativePlaceAddress: z.object({
    street: z.string().optional(),
    area: z.string().optional(),
    landmark: z.string().optional(),
    pincode: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
}).refine((data) => {
  if (data.country === 'India' && !data.state) {
    return false;
  }
  return true;
}, {
  message: 'State is required for India',
  path: ['state'],
});

// Step 4: Professional Details
const step4Schema = z.object({
  education: z.string().min(1, 'Please select your education'),
  employmentType: z.string().min(1, 'Please select your employment type'),
  occupation: z.string().min(1, 'Please select your occupation'),
  annualIncomeCurrency: z.string().min(1, 'Please select currency'),
  annualIncomeAmount: z.string().min(1, 'Please select/enter income amount'),
});

// Step 5: Family & Additional Details
const step5Schema = z.object({
  fatherName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherName: z.string().optional(),
  motherOccupation: z.string().optional(),
  weight: z.number().min(30, 'Weight must be at least 30 kg').max(200, 'Weight must be at most 200 kg').nullable().optional(),
  bloodGroup: z.string().optional(),
  residentialStatus: z.string().optional(),
  familyStatus: z.string().min(1, 'Please select your family status'),
  about: z.string().min(50, 'About must be at least 50 characters').max(1000, 'About must be at most 1000 characters'),
});

// Step 6: Preferences & Media
const step6Schema = z.object({
  ageFrom: z.string().min(1, 'Please select minimum age'),
  ageTo: z.string().min(1, 'Please select maximum age'),
  interests: z.array(z.string()).optional().default([]),
  hobbies: z.string().optional(),
  profileBannerColor: z.string().optional(),
}).refine(data => {
  const from = parseInt(data.ageFrom);
  const to = parseInt(data.ageTo);
  return from >= 18 && from <= 90 && to >= from && to <= 90;
}, {
  message: 'Age range must be valid (18-90) and max >= min',
  path: ['ageTo'],
});

export default function EditProfileForm({ userProfile, user, onCancel, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { uploadProfilePicture, setProfileBannerColor } = useAuthStore();
  const { setUserProfile } = useLandingStore();

  const [formData, setFormData] = useState({
    // Step 1: Personal Details
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth) : null,
    motherTongue: user?.motherTongue || '',
    height: user?.height || '',
    physicalStatus: user?.physicalStatus || '',
    maritalStatus: user?.maritalStatus || '',
    gender: user?.gender || '',
    seekingGender: user?.seekingGender || '',
    // Step 2: Religion & Addresses
    religion: user?.religion || '',
    caste: user?.caste || '',
    shuddhaJathakam: user?.shuddhaJathakam || '',
    doshamTypes: user?.doshamTypes || [],
    nakshatra: user?.nakshatra || undefined,
    raasi: user?.raasi || undefined,
    // Step 3: Location Details
    country: user?.country || '',
    state: user?.state || '',
    city: user?.city || '',
    presentResidentialAddress: user?.presentResidentialAddress || { street: '', area: '', landmark: '', pincode: '', city: '', state: '' },
    nativePlaceAddress: user?.nativePlaceAddress || { street: '', area: '', landmark: '', pincode: '', city: '', state: '' },
    // Step 4: Professional Details
    education: user?.education || '',
    employmentType: user?.employmentType || '',
    occupation: user?.occupation || '',
    annualIncomeCurrency: user?.annualIncome?.currency || 'INR',
    annualIncomeAmount: user?.annualIncome?.displayText || '',
    // Step 5: Family & Additional Details
    fatherName: user?.fatherName || '',
    fatherOccupation: user?.fatherOccupation || '',
    motherName: user?.motherName || '',
    motherOccupation: user?.motherOccupation || '',
    weight: user?.weight || undefined,
    bloodGroup: user?.bloodGroup || '',
    residentialStatus: user?.residentialStatus || '',
    familyStatus: user?.familyStatus || '',
    about: user?.about || user?.aboutMyself || '',
    // Step 6: Preferences & Media
    ageFrom: user?.ageFrom?.toString() || '',
    ageTo: user?.ageTo?.toString() || '',
    interests: user?.interests || [],
    hobbies: user?.hobbies || '',
    profileBannerColor: user?.profileBanner?.bannerColor || userProfile?.profileBanner?.bannerColor || '#FFB3BA',
    // File uploads
    profilePicture: null,
    galleryPhotos: [],
    galleryVideos: [],
  });

  const getSchemaForStep = (step) => {
    switch (step) {
      case 1: return step1Schema;
      case 2: return step2Schema;
      case 3: return step3Schema;
      case 4: return step4Schema;
      case 5: return step5Schema;
      case 6: return step6Schema;
      default: return step1Schema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchemaForStep(currentStep)),
    defaultValues: formData,
    mode: 'onBlur',
  });

  // Track previous step to only reset form when step changes
  const prevStepRef = useRef(currentStep);

  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      // Step changed, reset form with current formData
      form.reset(formData);
      prevStepRef.current = currentStep;
    }
  }, [currentStep, form, formData]);

  const handleFileUpdate = useCallback((fileType, fileData) => {
    setFormData(prev => ({
      ...prev,
      [fileType]: fileData
    }));
  }, []);

  const saveCurrentStepData = () => {
    const currentValues = form.getValues();

    // Preserve file state - these are managed separately from react-hook-form
    setFormData(prev => ({
      ...prev,
      ...currentValues,
      // Explicitly preserve file properties (prevent overwriting with undefined)
      profilePicture: prev.profilePicture,
      galleryPhotos: prev.galleryPhotos,
      galleryVideos: prev.galleryVideos,
    }));
  };

  const handleBackNavigation = () => {
    // Save current form state before going back
    saveCurrentStepData();

    // Now safe to go back - useEffect will reset with saved data
    setCurrentStep(currentStep - 1);
  };

  const validateAndProceed = async () => {
    setError('');

    if (currentStep === 6) {
      await submitUpdate();
      return;
    }

    const isValid = await form.trigger();

    if (!isValid) {
      const errors = form.formState.errors;
      const errorMessages = [];
      Object.entries(errors).forEach(([, error]) => {
        if (error?.message) {
          errorMessages.push(error.message);
        }
      });

      const msg = errorMessages.length > 0
        ? errorMessages.join('\n')
        : `Please fill in all required fields correctly`;

      setError(msg);
      toastError(msg);
      return;
    }

    const values = form.getValues();
    setFormData(prev => ({ ...prev, ...values }));
    setCurrentStep(currentStep + 1);
  };

  const parseIncomeAmount = (currency, amount) => {
    if (currency === 'INR') {
      const inrRanges = {
        '₹1 lakh and below': { min: 0, max: 100000 },
        '₹1-2 lakhs': { min: 100000, max: 200000 },
        '₹2-3 lakhs': { min: 200000, max: 300000 },
        '₹3-4 lakhs': { min: 300000, max: 400000 },
        '₹4-5 lakhs': { min: 400000, max: 500000 },
        '₹5-6 lakhs': { min: 500000, max: 600000 },
        '₹6-7 lakhs': { min: 600000, max: 700000 },
        '₹7-8 lakhs': { min: 700000, max: 800000 },
        '₹8-9 lakhs': { min: 800000, max: 900000 },
        '₹9-10 lakhs': { min: 900000, max: 1000000 },
        '₹10-12 lakhs': { min: 1000000, max: 1200000 },
        '₹12-15 lakhs': { min: 1200000, max: 1500000 },
        '₹15-20 lakhs': { min: 1500000, max: 2000000 },
        '₹20-30 lakhs': { min: 2000000, max: 3000000 },
        '₹30-50 lakhs': { min: 3000000, max: 5000000 },
        '₹50-70 lakhs': { min: 5000000, max: 7000000 },
        '₹70-90 lakhs': { min: 7000000, max: 9000000 },
        '₹90 lakhs - 1 crore': { min: 9000000, max: 10000000 },
        '₹1 crore and above': { min: 10000000, max: 100000000 },
      };
      const range = inrRanges[amount];
      if (range) {
        return { min: range.min, max: range.max, displayText: amount };
      }
    }
    const numAmount = parseInt(amount, 10);
    return { min: numAmount, max: numAmount, displayText: `${currency} ${numAmount.toLocaleString()}` };
  };

  const submitUpdate = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Get the latest form values from react-hook-form
      const formValues = form.getValues();

      const parsedIncome = parseIncomeAmount(formValues.annualIncomeCurrency, formValues.annualIncomeAmount);

      const updateData = {
        dateOfBirth: formValues.dateOfBirth,
        motherTongue: formValues.motherTongue,
        height: formValues.height,
        physicalStatus: formValues.physicalStatus,
        maritalStatus: formValues.maritalStatus,
        gender: formValues.gender,
        seekingGender: formValues.seekingGender,
        religion: formValues.religion,
        caste: formValues.religion === 'Hindu' ? formValues.caste : '',
        shuddhaJathakam: formValues.religion === 'Hindu' ? formValues.shuddhaJathakam : '',
        doshamTypes: formValues.shuddhaJathakam === 'No' ? formValues.doshamTypes : [],
        nakshatra: formValues.nakshatra || null,
        raasi: formValues.raasi || null,
        country: formValues.country,
        state: formValues.country === 'India' ? formValues.state : '',
        city: formValues.city,
        presentResidentialAddress: formValues.presentResidentialAddress || {},
        nativePlaceAddress: formValues.nativePlaceAddress || {},
        education: formValues.education,
        employmentType: formValues.employmentType,
        occupation: formValues.occupation,
        annualIncome: {
          currency: formValues.annualIncomeCurrency,
          min: parsedIncome.min,
          max: parsedIncome.max,
          displayText: parsedIncome.displayText,
        },
        fatherName: formValues.fatherName,
        fatherOccupation: formValues.fatherOccupation,
        motherName: formValues.motherName,
        motherOccupation: formValues.motherOccupation,
        weight: formValues.weight,
        bloodGroup: formValues.bloodGroup,
        residentialStatus: formValues.residentialStatus,
        familyStatus: formValues.familyStatus,
        about: formValues.about,
        ageFrom: parseInt(formValues.ageFrom),
        ageTo: parseInt(formValues.ageTo),
        interests: formValues.interests,
        hobbies: formValues.hobbies,
      };

      const response = await client.put('/api/profiles/update', updateData);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update profile');
      }

      // Handle banner color if changed
      const currentBannerColor = user?.profileBanner?.bannerColor || userProfile?.profileBanner?.bannerColor;
      if (formValues.profileBannerColor && formValues.profileBannerColor !== currentBannerColor) {
        const colorResult = await setProfileBannerColor(formValues.profileBannerColor);
        if (!colorResult.success) {
          throw new Error(`Failed to set profile banner color: ${colorResult.error}`);
        }
      }

      // Upload media files if any
      try {
        console.log('[EditProfile] Starting media uploads...');
        console.log('[EditProfile] profilePicture:', formData.profilePicture);

        if (formData.profilePicture?.file) {
          console.log('[EditProfile] Uploading profile picture:', formData.profilePicture.file.name);
          const picResult = await useAuthStore.getState().uploadProfilePicture(formData.profilePicture.file);
          console.log('[EditProfile] Profile picture upload result:', picResult);
        } else {
          console.log('[EditProfile] No profile picture file found');
        }

        if (formData.galleryPhotos?.length > 0) {
          console.log('[EditProfile] Uploading gallery photos:', formData.galleryPhotos.length);
          for (const photo of formData.galleryPhotos) {
            if (photo.file && !photo.existing) {
              console.log('[EditProfile] Uploading photo:', photo.file.name);
              const photoResult = await useAuthStore.getState().uploadPhoto(photo.file);
              console.log('[EditProfile] Photo upload result:', photoResult);
            }
          }
        }

        if (formData.galleryVideos?.length > 0) {
          console.log('[EditProfile] Uploading gallery videos:', formData.galleryVideos.length);
          for (const video of formData.galleryVideos) {
            if (video.file && !video.existing) {
              console.log('[EditProfile] Uploading video:', video.file.name);
              const vidResult = await useAuthStore.getState().uploadVideo(video.file, video.duration);
              console.log('[EditProfile] Video upload result:', vidResult);
            }
          }
        }
      } catch (mediaErr) {
        console.warn('Media upload warning:', mediaErr.message);
        // Don't fail profile update if media upload fails
      }

      const profileResponse = await client.get('/api/profiles/me/view');
      setUserProfile(profileResponse.data.data);

      toastSuccess('Profile updated successfully!');
      onSuccess?.();
    } catch (err) {
      const msg = `Error: ${err.message || 'Please try again.'}`;
      setError(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitles = [
    '💑 Personal Details',
    '🙏 Religion & Addresses',
    '📍 Location Details',
    '💼 Professional Details',
    '👨‍👩‍👧‍👦 Family & Additional',
    '📸 Preferences & Media'
  ];
  const progressValue = (currentStep / 6) * 100;

  return (
    <Card className="border-0 shadow-lg bg-white w-full max-w-3xl mx-auto">
      <CardHeader className="pb-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (currentStep > 1) {
                handleBackNavigation();
              } else {
                onCancel();
              }
            }}
            className="p-0 h-auto hover:bg-transparent"
          >
            <ChevronLeft className="w-6 h-6 text-secondary" />
          </Button>

          <CardTitle className="font-viga text-2xl text-secondary flex-1 ml-4">
            {stepTitles[currentStep - 1]}
          </CardTitle>

          <div className="font-telex text-sm text-secondary/70 whitespace-nowrap">
            Step {currentStep}/6
          </div>
        </div>

        <Progress value={progressValue} className="h-2" />
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <div className="space-y-6 py-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm font-medium whitespace-pre-wrap">
                {error}
              </div>
            )}

            {currentStep === 1 && <PersonalDetailsStep form={form} />}
            {currentStep === 2 && <LocationAddressStep form={form} />}
            {currentStep === 3 && <LocationAddressStep form={form} />}
            {currentStep === 4 && <ProfessionalDetailsStep form={form} />}
            {currentStep === 5 && <FamilyDetailsStep form={form} />}
            {currentStep === 6 && (
              <PreferencesMediaStep
                form={form}
                userProfile={userProfile}
                profilePicture={formData.profilePicture}
                galleryPhotos={formData.galleryPhotos}
                galleryVideos={formData.galleryVideos}
                onFileUpdate={handleFileUpdate}
              />
            )}
          </div>
        </Form>
      </CardContent>

      <div className="flex gap-3 p-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (currentStep > 1) {
              handleBackNavigation();
            } else {
              onCancel();
            }
          }}
          className="flex-1 font-maven"
        >
          Back
        </Button>

        <Button
          onClick={validateAndProceed}
          disabled={isLoading}
          className="flex-1 bg-primary text-primary-foreground font-maven"
        >
          {isLoading ? 'Saving...' : currentStep === 6 ? 'Save Profile' : 'Next'}
          {!isLoading && currentStep < 6 && <ChevronRight className="ml-2 w-4 h-4" />}
        </Button>
      </div>
    </Card>
  );
}
