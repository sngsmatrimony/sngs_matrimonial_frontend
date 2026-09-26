'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ChevronLeft, ChevronRight, HeartHandshake, MapPin, Briefcase, Users, Images } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { toastSuccess, toastError } from '@/lib/toast';
import { convertTo24Hour, buildTimeFromDropdowns, parseTimeToDropdowns } from '@/lib/time';
import { client } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useLandingStore } from '@/store/landingStore';
import { useIdProofRequired } from '@/hooks/useIdProofRequired';
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
  timeOfBirth_hours: z.string().optional(),
  timeOfBirth_minutes: z.string().optional(),
  timeOfBirth_meridiem: z.string().optional(),
  motherTongue: z.string().min(1, 'Please select your mother tongue'),
  height: z.string().min(1, 'Please select your height'),
  physicalStatus: z.string().min(1, 'Please select your physical status'),
  maritalStatus: z.string().min(1, 'Please select your marital status'),
  gender: z.string().min(1, 'Please select your gender'),
  seekingGender: z.string().min(1, 'Please select who you are seeking'),
  placeOfBirth: z.string().min(1, 'Please enter your place of birth').max(100, 'Maximum 100 characters'),
  complexion: z.enum(['Very Fair', 'Fair', 'Wheatish', 'Wheatish Brown', 'Dark', 'Very Dark'], {
    errorMap: () => ({ message: 'Please select your complexion' })
  }),
  languagesKnown: z.array(z.string()).min(1, 'Please select at least one language').max(10, 'Maximum 10 languages'),
  weight: z.number({ required_error: 'Please enter your weight', invalid_type_error: 'Please enter your weight' }).min(30, 'Weight must be at least 30 kg').max(200, 'Weight must be at most 200 kg'),
  bloodGroup: z.string().min(1, 'Please select your blood group'),
  diet: z.enum(['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Both (Veg & Non-Veg)'], {
    errorMap: () => ({ message: 'Please select your diet preference' })
  }),
  religion: z.string().min(1, 'Please select your religion'),
  caste: z.string().optional(),
  shuddhaJathakam: z.string().optional(),
  doshamTypes: z.array(z.string()).optional().default([]),
  nakshatra: z.string().optional(),
  raasi: z.string().optional(),
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
}).superRefine((data, ctx) => {
  if (data.religion === 'Hindu') {
    if (!data.caste) {
      ctx.addIssue({ code: 'custom', message: 'Please select your caste', path: ['caste'] });
    }
    if (!data.shuddhaJathakam) {
      ctx.addIssue({ code: 'custom', message: 'Please select shuddha jathakam status', path: ['shuddhaJathakam'] });
    }
    if (!data.nakshatra) {
      ctx.addIssue({ code: 'custom', message: 'Please select your nakshatra', path: ['nakshatra'] });
    }
    if (!data.raasi) {
      ctx.addIssue({ code: 'custom', message: 'Please select your raasi', path: ['raasi'] });
    }
  }
  if (data.shuddhaJathakam === 'No' && (!data.doshamTypes || data.doshamTypes.length === 0)) {
    ctx.addIssue({ code: 'custom', message: 'Please select at least one dosham type', path: ['doshamTypes'] });
  }
});

// Step 2: Addresses
const step2Schema = z.object({
  presentResidentialAddress: z.object({
    country: z.string().min(1, 'Please select your country'),
    street: z.string().min(1, 'Please enter your street address'),
    area: z.string().min(1, 'Please enter your area or locality'),
    landmark: z.string().min(1, 'Please enter a nearby landmark'),
    pincode: z.string().min(1, 'Please enter your pincode'),
    city: z.string().min(1, 'Please enter your city'),
    state: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.country === 'India' && !data.state) {
      ctx.addIssue({ code: 'custom', message: 'Please select your state', path: ['state'] });
    }
  }),
  nativePlaceAddress: z.object({
    country: z.string().optional(),
    street: z.string().optional(),
    area: z.string().optional(),
    landmark: z.string().optional(),
    pincode: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
});

// Step 3: Professional Details
const step3Schema = z.object({
  education: z.string().min(1, 'Please select your education'),
  employmentType: z.string().min(1, 'Please select your employment type'),
  occupation: z.string().min(1, 'Please select your occupation'),
  annualIncomeCurrency: z.string().min(1, 'Please select currency'),
  annualIncomeAmount: z.string().min(1, 'Please select/enter income amount'),
  professionalAdditionalInfo: z.string().min(1, 'Please share some additional information').max(500, 'Maximum 500 characters'),
});

// Step 4: Family & Additional Details
const step4Schema = z.object({
  fatherName: z.string().min(1, "Father's name is required"),
  fatherOccupation: z.string().min(1, "Please enter father's occupation"),
  motherName: z.string().min(1, "Mother's name is required"),
  motherOccupation: z.string().min(1, "Please enter mother's occupation"),
  residentialStatus: z.string().min(1, 'Please select your residential status'),
  familyStatus: z.string().min(1, 'Please select your family status'),
});

// Step 5: Preferences & Media
const step5Schema = z.object({
  ageFrom: z.string().min(1, 'Please select minimum age'),
  ageTo: z.string().min(1, 'Please select maximum age'),
  interests: z.array(z.string()).min(1, 'Please select at least one interest'),
  profileAbout: z.string().min(1, 'Please tell us about yourself').max(1000, 'About must be at most 1000 characters'),
  profileBannerColor: z.string().optional(),
}).refine(data => {
  const from = parseInt(data.ageFrom);
  const to = parseInt(data.ageTo);
  return from >= 18 && from <= 90 && to >= from && to <= 90;
}, {
  message: 'Please enter a valid age range (minimum age must be at least 18, maximum age cannot exceed 90)',
  path: ['ageTo'],
});

export default function EditProfileForm({ userProfile, user, onCancel, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { uploadProfilePicture, setProfileBannerColor, deleteHoroscopeDocument, deleteIdProof } = useAuthStore();
  const { setUserProfile } = useLandingStore();
  const idProofRequired = useIdProofRequired();

  // Parse existing timeOfBirth (24-hour format) to dropdown values (12-hour format)
  const existingTimeDropdowns = user?.timeOfBirth ? parseTimeToDropdowns(user.timeOfBirth) : { hours: '', minutes: '', meridiem: '' };

  const [formData, setFormData] = useState({
    // Step 1: Personal Details
    mobileNumber: user?.mobileNumber || '',
    alternateMobileNumber: user?.alternateMobileNumber || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth) : null,
    timeOfBirth_hours: existingTimeDropdowns.hours,
    timeOfBirth_minutes: existingTimeDropdowns.minutes,
    timeOfBirth_meridiem: existingTimeDropdowns.meridiem,
    motherTongue: user?.motherTongue || '',
    height: user?.height || '',
    physicalStatus: user?.physicalStatus || '',
    maritalStatus: user?.maritalStatus || '',
    gender: user?.gender || '',
    seekingGender: user?.seekingGender || '',
    placeOfBirth: user?.placeOfBirth || '',
    complexion: user?.complexion || '',
    languagesKnown: user?.languagesKnown || [],
    // Step 2: Religion & Addresses
    religion: user?.religion || '',
    caste: user?.caste || '',
    shuddhaJathakam: user?.shuddhaJathakam || '',
    doshamTypes: user?.doshamTypes || [],
    nakshatra: user?.nakshatra || '',
    raasi: user?.raasi || '',
    // Step 3: Location Details
    country: user?.country || '',
    state: user?.state || '',
    city: user?.city || '',
    presentResidentialAddress: user?.presentResidentialAddress || { country: user?.country || '', street: '', area: '', landmark: '', pincode: '', city: user?.city || '', state: user?.state || '' },
    nativePlaceAddress: user?.nativePlaceAddress || { country: '', street: '', area: '', landmark: '', pincode: '', city: '', state: '' },
    // Step 4: Professional Details
    education: user?.education || '',
    employmentType: user?.employmentType || '',
    occupation: user?.occupation || '',
    annualIncomeCurrency: user?.annualIncome?.currency || 'INR',
    annualIncomeAmount: user?.annualIncome?.displayText || '',
    professionalAdditionalInfo: user?.professionalAdditionalInfo || '',
    // Step 5: Family & Additional Details
    fatherName: user?.fatherName || '',
    fatherOccupation: user?.fatherOccupation || '',
    motherName: user?.motherName || '',
    motherOccupation: user?.motherOccupation || '',
    weight: user?.weight || undefined,
    bloodGroup: user?.bloodGroup || '',
    diet: user?.diet || '',
    residentialStatus: user?.residentialStatus || '',
    familyStatus: user?.familyStatus || '',
    // Step 5: Preferences & Media
    ageFrom: user?.ageFrom?.toString() || '',
    ageTo: user?.ageTo?.toString() || '',
    interests: user?.interests || [],
    profileAbout: user?.profileAbout || '',
    profileBannerColor: user?.profileBanner?.bannerColor || userProfile?.profileBanner?.bannerColor || '#FFB3BA',
    // File uploads
    profilePicture: null,
    galleryPhotos: [],
    horoscope: null, // Only set when user uploads a NEW file; existing doc is shown via existingHoroscopeDoc
    idProof: null, // Only set when user uploads a NEW file; existing doc is shown via existingIdProof
  });

  const getSchemaForStep = (step) => {
    switch (step) {
      case 1: return step1Schema;
      case 2: return step2Schema;
      case 3: return step3Schema;
      case 4: return step4Schema;
      case 5: return step5Schema;
      default: return step1Schema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchemaForStep(currentStep)),
    defaultValues: formData,
    mode: 'onChange',
    reValidateMode: 'onChange',
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

  const handleDeleteHoroscope = useCallback(async () => {
    try {
      const result = await deleteHoroscopeDocument();
      if (result.success) {
        // Clear horoscope from local state
        setFormData(prev => ({
          ...prev,
          horoscope: null
        }));
        toastSuccess('Horoscope document deleted successfully');
      } else {
        toastError(result.error || 'Failed to delete horoscope document');
      }
    } catch (err) {
      toastError('Failed to delete horoscope document');
    }
  }, [deleteHoroscopeDocument]);

  const handleDeleteIdProof = useCallback(async () => {
    try {
      const result = await deleteIdProof();
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          idProof: null
        }));
        toastSuccess('ID proof deleted successfully');
      } else {
        toastError(result.error || 'Failed to delete ID proof');
      }
    } catch (err) {
      toastError('Failed to delete ID proof');
    }
  }, [deleteIdProof]);

  const saveCurrentStepData = () => {
    const currentValues = form.getValues();

    // Preserve file state - these are managed separately from react-hook-form
    setFormData(prev => ({
      ...prev,
      ...currentValues,
      // Explicitly preserve file properties (prevent overwriting with undefined)
      profilePicture: prev.profilePicture,
      galleryPhotos: prev.galleryPhotos,
      horoscope: prev.horoscope,
      idProof: prev.idProof,
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

    if (currentStep === 5) {
      const hasExistingIdProof = !!(user?.idProof?.url || userProfile?.idProof?.url);
      if (idProofRequired && !formData.idProof?.file && !hasExistingIdProof) {
        toastError('Please upload an ID proof document to continue.');
        return;
      }
      await submitUpdate();
      return;
    }

    const isValid = await form.trigger();

    if (!isValid) {
      toastError('Some fields are not filled in correctly. Please check and try again.');
      return;
    }

    const values = form.getValues();
    setFormData(prev => ({
      ...prev,
      ...values,
      // Explicitly preserve file properties
      profilePicture: prev.profilePicture,
      galleryPhotos: prev.galleryPhotos,
      horoscope: prev.horoscope,
      idProof: prev.idProof,
    }));
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
      // Merge accumulated formData (all steps) with latest RHF state (step 5 inputs)
      const formValues = { ...formData, ...form.getValues() };

      const parsedIncome = parseIncomeAmount(formValues.annualIncomeCurrency, formValues.annualIncomeAmount);

      // Build 12-hour time from dropdown selections, then convert to 24-hour
      const timeOfBirthString = buildTimeFromDropdowns(
        formValues.timeOfBirth_hours,
        formValues.timeOfBirth_minutes,
        formValues.timeOfBirth_meridiem
      );
      const timeOfBirth24 = timeOfBirthString ? convertTo24Hour(timeOfBirthString) : '';

      const updateData = {
        mobileNumber: formValues.mobileNumber,
        alternateMobileNumber: formValues.alternateMobileNumber,
        dateOfBirth: formValues.dateOfBirth,
        timeOfBirth: timeOfBirth24,
        motherTongue: formValues.motherTongue,
        placeOfBirth: formValues.placeOfBirth || '',
        complexion: formValues.complexion || '',
        languagesKnown: formValues.languagesKnown || [],
        height: formValues.height,
        physicalStatus: formValues.physicalStatus,
        maritalStatus: formValues.maritalStatus,
        gender: formValues.gender,
        seekingGender: formValues.seekingGender,
        religion: formValues.religion,
        caste: formValues.religion === 'Hindu' ? formValues.caste : '',
        shuddhaJathakam: formValues.religion === 'Hindu' ? formValues.shuddhaJathakam : '',
        doshamTypes: formValues.shuddhaJathakam === 'No' ? formValues.doshamTypes : [],
        nakshatra: formValues.religion === 'Hindu' ? (formValues.nakshatra || null) : null,
        raasi: formValues.religion === 'Hindu' ? (formValues.raasi || null) : null,
        country: formValues.presentResidentialAddress?.country || '',
        state: formValues.presentResidentialAddress?.country === 'India' ? formValues.presentResidentialAddress?.state : '',
        city: formValues.presentResidentialAddress?.city || '',
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
        professionalAdditionalInfo: formValues.professionalAdditionalInfo || '',
        fatherName: formValues.fatherName,
        fatherOccupation: formValues.fatherOccupation,
        motherName: formValues.motherName,
        motherOccupation: formValues.motherOccupation,
        weight: formValues.weight,
        bloodGroup: formValues.bloodGroup,
        diet: formValues.diet || '',
        residentialStatus: formValues.residentialStatus,
        familyStatus: formValues.familyStatus,
        ageFrom: parseInt(formValues.ageFrom),
        ageTo: parseInt(formValues.ageTo),
        interests: formValues.interests,
        profileAbout: formValues.profileAbout,
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
        if (formData.profilePicture?.file) {
          await useAuthStore.getState().uploadProfilePicture(formData.profilePicture.file);
        }

        if (formData.galleryPhotos?.length > 0) {
          for (const photo of formData.galleryPhotos) {
            if (photo.file && !photo.existing) {
              await useAuthStore.getState().uploadPhoto(photo.file);
            }
          }
        }

        if (formData.horoscope?.file) {
          try {
            await useAuthStore.getState().uploadHoroscopeDocument(formData.horoscope.file);
          } catch (error) {
            console.warn('Horoscope upload warning:', error.message);
          }
        }

        if (formData.idProof?.file) {
          try {
            await useAuthStore.getState().uploadIdProof(formData.idProof.file);
          } catch (error) {
            console.warn('ID proof upload warning:', error.message);
          }
        }
      } catch (mediaErr) {
        console.warn('Media upload warning:', mediaErr.message);
      }

      const profileResponse = await client.get('/api/profiles/me/view');
      setUserProfile(profileResponse.data.data);

      // Refresh auth store user data to get updated approval status
      await useAuthStore.getState().refreshUser();

      // Use server message if profile was resubmitted, otherwise default message
      const successMessage = response.data.resubmittedForApproval
        ? 'Profile updated and resubmitted for approval. Our team will review it shortly.'
        : 'Profile updated successfully!';
      toastSuccess(successMessage);
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
    { label: 'Personal Details', icon: HeartHandshake },
    { label: 'Religion & Addresses', icon: MapPin },
    { label: 'Professional Details', icon: Briefcase },
    { label: 'Family & Additional', icon: Users },
    { label: 'Preferences & Media', icon: Images },
  ];
  const progressValue = (currentStep / 5) * 100;
  const CurrentStepIcon = stepTitles[currentStep - 1].icon;

  return (
    <Card className="border border-white/40 shadow-xl bg-white w-full max-w-3xl mx-auto rounded-[28px] overflow-hidden py-0 gap-0">
      <CardHeader className="pb-7 pt-9 px-6 sm:px-10 bg-gradient-to-br from-[#2C3E50] via-[#233240] to-[#1A2733] relative overflow-hidden">
        {/* Subtle decorative texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_15%_20%,#D4A843_0%,transparent_45%),radial-gradient(circle_at_85%_80%,#D4A843_0%,transparent_45%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D4A843]/0 via-[#D4A843] to-[#D4A843]/0" />

        <div className="flex items-center justify-between mb-5 relative">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => {
                if (currentStep > 1) {
                  handleBackNavigation();
                } else {
                  onCancel();
                }
              }}
              className="flex h-9 items-center gap-1 pl-2 pr-3 rounded-full text-white/70 hover:bg-white/10 hover:text-[#D4A843] transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={1.75} />
              <span className="hidden sm:inline font-sans text-sm">Back</span>
            </button>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#F5E6C3] to-[#EAD5A0] text-[#2C3E50] ring-2 ring-[#D4A843]/40 ring-offset-2 ring-offset-[#2C3E50] shadow-lg shrink-0">
              <CurrentStepIcon className="w-5 h-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-sans text-[11px] tracking-[0.18em] uppercase text-[#D4A843] font-semibold mb-0.5">
                Step {currentStep} of 5
              </p>
              <CardTitle className="font-serif text-2xl text-white font-bold leading-tight tracking-tight">
                {stepTitles[currentStep - 1].label}
              </CardTitle>
            </div>
          </div>
        </div>

        <Progress value={progressValue} className="h-1.5 bg-white/15 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-[#D4A843] [&>div]:to-[#F0C868] [&>div]:rounded-full" />
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <div className="space-y-6 py-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm font-medium whitespace-pre-wrap">
                {error}
              </div>
            )}

            {currentStep === 1 && (
              <PersonalDetailsStep
                form={form}
                user={user}
                userProfile={userProfile}
                horoscope={formData.horoscope}
                onFileUpdate={handleFileUpdate}
                onDeleteHoroscope={handleDeleteHoroscope}
              />
            )}
            {currentStep === 2 && <LocationAddressStep form={form} />}
            {currentStep === 3 && <ProfessionalDetailsStep form={form} />}
            {currentStep === 4 && <FamilyDetailsStep form={form} />}
            {currentStep === 5 && (
              <PreferencesMediaStep
                form={form}
                user={user}
                userProfile={userProfile}
                profilePicture={formData.profilePicture}
                galleryPhotos={formData.galleryPhotos}
                onFileUpdate={handleFileUpdate}
                idProof={formData.idProof}
                idProofRequired={idProofRequired}
                onDeleteIdProof={handleDeleteIdProof}
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
          className="flex-1 font-sans"
        >
          Back
        </Button>

        <Button
          onClick={validateAndProceed}
          disabled={isLoading}
          className="flex-1 bg-primary text-primary-foreground font-sans font-semibold"
        >
          {isLoading ? 'Saving...' : currentStep === 5 ? 'Save Profile' : 'Next'}
          {!isLoading && currentStep < 5 && <ChevronRight className="ml-2 w-4 h-4" />}
        </Button>
      </div>
    </Card>
  );
}
