'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ChevronLeft, ChevronRight, HeartHandshake, MapPin, Briefcase, Users, Images, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { toastSuccess, toastError } from '@/lib/toast';
import { convertTo24Hour, buildTimeFromDropdowns, parseTimeToDropdowns } from '@/lib/time';
import { client } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useLandingStore } from '@/store/landingStore';
import { useIdProofRequired } from '@/hooks/useIdProofRequired';
import { useFirebasePhoneAuth } from '@/hooks/useFirebasePhoneAuth';
import { getFriendlyErrorMessage } from '@/lib/errorMessages';
import { Input } from '@/components/ui/input';
import EmailChangeDialog from './EmailChangeDialog';
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
    error: 'Please select your complexion',
  }),
  languagesKnown: z.array(z.string()).min(1, 'Please select at least one language').max(10, 'Maximum 10 languages'),
  weight: z.number({ error: 'Please enter your weight' }).min(30, 'Weight must be at least 30 kg').max(200, 'Weight must be at most 200 kg'),
  bloodGroup: z.string().min(1, 'Please select your blood group'),
  diet: z.enum(['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Both (Veg & Non-Veg)'], {
    error: 'Please select your diet preference',
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
    // Raasi is deliberately optional even for Hindu members — see User.js.
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
  employmentType: z.string().optional(),
  occupation: z.string().optional(),
  annualIncomeCurrency: z.string().optional(),
  annualIncomeAmount: z.string().optional(),
  professionalAdditionalInfo: z.string().max(500, 'Maximum 500 characters').optional(),
});

// Step 4: Family & Additional Details
const step4Schema = z.object({
  fatherName: z.string().min(1, "Father's name is required"),
  fatherOccupation: z.string().optional(),
  motherName: z.string().min(1, "Mother's name is required"),
  motherOccupation: z.string().optional(),
  residentialStatus: z.string().min(1, 'Please select your residential status'),
  familyStatus: z.string().min(1, 'Please select your family status'),
});

// Step 5: Preferences & Media
const step5Schema = z.object({
  ageFrom: z.string().min(1, 'Please select minimum age'),
  ageTo: z.string().min(1, 'Please select maximum age'),
  interests: z.array(z.string()).min(1, 'Please select at least one interest'),
  profileAbout: z.string().min(1, 'Please tell us about yourself').max(1000, 'About must be at most 1000 characters'),
  partnerPreferenceDescription: z.string().max(1000, 'Partner preference description must be at most 1000 characters').optional(),
  profileBannerColor: z.string().optional(),
}).refine(data => {
  const from = parseInt(data.ageFrom);
  const to = parseInt(data.ageTo);
  return from >= 18 && from <= 90 && to >= from && to <= 90;
}, {
  message: 'Please enter a valid age range (minimum age must be at least 18, maximum age cannot exceed 90)',
  path: ['ageTo'],
});

export default function EditProfileForm({ userProfile, user, onCancel, onSuccess, initialStep = 1 }) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { uploadProfilePicture, setProfileBannerColor, deleteHoroscopeDocument, deleteIdProof } = useAuthStore();
  const { setUserProfile } = useLandingStore();
  const idProofRequired = useIdProofRequired();

  // Documents deleted during this edit session. `userProfile` is a snapshot
  // taken when the form opened, so without this a deleted ID proof/horoscope
  // keeps showing (and a second Remove hits a 404).
  const [removedDocs, setRemovedDocs] = useState({});
  // A gallery photo uploads as soon as it's picked; hold Save until it lands.
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [photosPreparing, setPhotosPreparing] = useState(false);
  const withoutRemoved = (profile) => {
    if (!profile) return profile;
    const next = { ...profile };
    for (const key of Object.keys(removedDocs)) next[key] = undefined;
    return next;
  };
  const docsUser = withoutRemoved(user);
  const docsUserProfile = withoutRemoved(userProfile);

  // Full name, mobile number, and email live outside the step wizard's
  // react-hook-form state: all three carry consequences (re-approval, OTP
  // verification) that don't fit the "every step's fields always resubmit
  // together" pattern the rest of this form uses, so they're handled as
  // their own small, explicit flows.
  const [fullNameValue, setFullNameValue] = useState(user?.fullName || userProfile?.fullName || '');
  const [mobileNumberValue, setMobileNumberValue] = useState(user?.mobileNumber || '');
  // Kept out of react-hook-form like the fields above: step navigation merges
  // form.getValues() over formData, which would overwrite edits made here.
  const [alternateMobileValue, setAlternateMobileValue] = useState(user?.alternateMobileNumber || '');
  const [showReapprovalConfirm, setShowReapprovalConfirm] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const originalFullName = (user?.fullName || userProfile?.fullName || '').trim();
  const originalMobileNumber = (user?.mobileNumber || '').trim();
  const mobileChanged = mobileNumberValue.trim() !== originalMobileNumber;


  // A new mobile number must be OTP-verified — it's also a login credential.
  const {
    mobileVerificationStep,
    mobileOtpValue,
    setMobileOtpValue,
    mobileOtpLoading,
    mobileVerified,
    mobileIdToken,
    mobileResendTimer,
    sendMobileOTP,
    verifyMobileOTP,
    resendMobileOTP,
    resetMobileVerification,
  } = useFirebasePhoneAuth('recaptcha-container-edit-profile');

  // Parse existing timeOfBirth (24-hour format) to dropdown values (12-hour format)
  const existingTimeDropdowns = user?.timeOfBirth ? parseTimeToDropdowns(user.timeOfBirth) : { hours: '', minutes: '', meridiem: '' };

  const [formData, setFormData] = useState({
    // Step 1: Personal Details
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
    partnerPreferenceDescription: user?.partnerPreferenceDescription || '',
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

  // Each of these sends an approved profile back for review (a rejected one
  // is resubmitted by any save). A new ID proof does NOT — the profile stays
  // live and only the Verified tick waits for an admin to check the ID.
  const reapprovalReasons = [
    fullNameValue.trim() !== originalFullName && 'changing your name',
    mobileChanged && 'changing your mobile number',
  ].filter(Boolean);
  const reapprovalReasonsText = (() => {
    const text = reapprovalReasons.length > 1
      ? `${reapprovalReasons.slice(0, -1).join(', ')} and ${reapprovalReasons[reapprovalReasons.length - 1]}`
      : reapprovalReasons[0] || '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  })();

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
        setRemovedDocs(prev => ({ ...prev, horoscopeDocument: true }));
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
        setRemovedDocs(prev => ({ ...prev, idProof: true }));
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
      const hasExistingIdProof = !!(docsUser?.idProof?.url || docsUserProfile?.idProof?.url);
      if (idProofRequired && !formData.idProof?.file && !hasExistingIdProof) {
        toastError('Please upload an ID proof document to continue.');
        return;
      }

      // PreferencesMediaStep pre-populates formData.profilePicture/galleryPhotos
      // from the existing profile on mount, so these are already truthy for
      // an existing member who hasn't touched either section — this only
      // fires when one is genuinely missing (new registrant edge cases,
      // data anomalies, or every gallery photo having just been removed).
      if (!formData.profilePicture) {
        toastError('Please upload a profile photo to continue.');
        return;
      }

      if (!formData.galleryPhotos || formData.galleryPhotos.length < 1) {
        toastError('Please upload at least one gallery photo to continue.');
        return;
      }

      if (!fullNameValue.trim() || fullNameValue.trim().length < 2) {
        toastError('Please enter your full name.');
        return;
      }

      if (!/^[6-9]\d{9}$/.test(mobileNumberValue.trim())) {
        toastError('Please enter a valid 10-digit mobile number.');
        return;
      }

      if (alternateMobileValue && !/^[6-9]\d{9}$/.test(alternateMobileValue.trim())) {
        toastError('Please enter a valid 10-digit alternate mobile number, or leave it blank.');
        return;
      }

      if (mobileChanged && !mobileVerified) {
        toastError('Please verify your new mobile number with OTP before saving (Step 1, Account Details).');
        return;
      }

      // A name or mobile number change is identity-relevant the same way the
      // original approval was, so either one needs a fresh review — warn
      // before it's submitted, same as the email-change flow's own warning
      // before it sends an OTP.
      if (reapprovalReasons.length > 0) {
        setShowReapprovalConfirm(true);
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
    // Income is optional — nothing entered means nothing to send, not a
    // parsed "NaN" range.
    if (!amount) {
      return { min: undefined, max: undefined, displayText: '' };
    }
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
    let idProofUploaded = false;

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
        fullName: fullNameValue.trim(),
        mobileNumber: mobileNumberValue.trim(),
        ...(mobileChanged && { mobileIdToken }),
        alternateMobileNumber: alternateMobileValue.trim(),
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
        // Sent as '' (not undefined) when cleared: updateProfile only
        // touches a field when the key is present at all, so undefined
        // here would mean "leave the old value alone" instead of clearing it.
        employmentType: formValues.employmentType || '',
        occupation: formValues.occupation || '',
        annualIncome: {
          currency: formValues.annualIncomeCurrency || 'INR',
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
        partnerPreferenceDescription: formValues.partnerPreferenceDescription || '',
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

      // Upload media files if any. The store's upload actions return
      // { success: false } instead of throwing, so each result is checked —
      // a failed upload must be reported, not reported as "updated successfully".
      const store = useAuthStore.getState();
      const failedUploads = [];
      const safely = async (fn) => {
        try {
          return await fn();
        } catch (error) {
          return { success: false, error: error.message };
        }
      };

      if (formData.profilePicture?.file) {
        const res = await safely(() => store.uploadProfilePicture(formData.profilePicture.file));
        if (!res?.success) failedUploads.push('profile photo');
      }
      const newGallery = (formData.galleryPhotos || []).filter((photo) => photo.file && !photo.existing);
      let galleryUploaded = 0;
      for (const photo of newGallery) {
        const res = await safely(() => store.uploadPhoto(photo.file));
        if (res?.success) galleryUploaded++;
      }
      if (galleryUploaded < newGallery.length) {
        failedUploads.push(`${newGallery.length - galleryUploaded} gallery photo(s)`);
      }
      if (formData.horoscope?.file) {
        const res = await safely(() => store.uploadHoroscopeDocument(formData.horoscope.file));
        if (!res?.success) failedUploads.push('horoscope document');
      }
      if (formData.idProof?.file) {
        const res = await safely(() => store.uploadIdProof(formData.idProof.file));
        idProofUploaded = !!res?.success;
        if (!res?.success) failedUploads.push('ID proof');
      }

      const profileResponse = await client.get('/api/profiles/me/view');
      setUserProfile(profileResponse.data.data);

      // Refresh auth store user data to get updated approval status
      await useAuthStore.getState().refreshUser();

      // Use server message if profile was resubmitted, otherwise default message
      const successMessage = response.data.resubmittedForApproval
        ? 'Profile updated and resubmitted for approval. Our team will review it shortly.'
        : idProofUploaded && user?.approvalStatus === 'approved'
          ? 'Profile updated. Your ID proof will be verified shortly — your profile stays visible meanwhile.'
          : 'Profile updated successfully!';
      if (failedUploads.length > 0) {
        toastError(
          `Your details were saved, but your ${failedUploads.join(', ')} didn't upload. Please try adding them again (JPEG or PNG photos, up to 10 MB).`,
          { duration: 12000 }
        );
      } else {
        toastSuccess(successMessage);
      }
      onSuccess?.();
    } catch (err) {
      const msg = getFriendlyErrorMessage(err, 'We couldn’t save your changes. Please try again.');
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

      <form onSubmit={(e) => { e.preventDefault(); validateAndProceed(); }}>
      <CardContent>
        <Form {...form}>
          <div className="space-y-6 py-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm font-medium whitespace-pre-wrap">
                {error}
              </div>
            )}

            {currentStep === 1 && (
              <>
                <div className="rounded-xl border border-[#D4A843]/20 bg-[#FDF8F0] p-5 space-y-4">
                  <h3 className="font-serif text-base font-semibold text-[#1A1A1A]">Account Details</h3>

                  <div>
                    <label className="font-sans text-sm font-medium text-[#1A1A1A] block mb-2">Full Name</label>
                    <input
                      type="text"
                      value={fullNameValue}
                      onChange={(e) => setFullNameValue(e.target.value)}
                      maxLength={100}
                      className="w-full h-12 px-4 rounded-xl border border-[#D4A843]/25 bg-white font-sans text-[15px] text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50"
                    />
                    <p className="text-xs text-[#2C3E50]/60 font-sans mt-1.5">
                      Changing your name will send your profile for re-approval.
                    </p>
                  </div>

                  <div>
                    <label className="font-sans text-sm font-medium text-[#1A1A1A] block mb-2">Mobile Number</label>
                    <div id="recaptcha-container-edit-profile" />
                    <div className="flex gap-2.5">
                      <div className="flex flex-1">
                        <div className="w-16 flex items-center justify-center border border-r-0 border-[#D4A843]/25 rounded-l-xl bg-[#F5E6C3]/50 font-sans text-sm text-[#2C3E50] font-medium">
                          +91
                        </div>
                        <input
                          type="tel"
                          value={mobileNumberValue}
                          onChange={(e) => {
                            setMobileNumberValue(e.target.value.replace(/\D/g, '').slice(0, 10));
                            if (mobileVerified || mobileVerificationStep === 'otp') resetMobileVerification();
                          }}
                          maxLength={10}
                          pattern="[0-9]*"
                          placeholder="9876543210"
                          className="w-full h-12 px-4 rounded-l-none rounded-r-xl border border-[#D4A843]/25 bg-white font-sans text-[15px] text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50"
                        />
                      </div>
                      {mobileChanged && !mobileVerified && (
                        <Button
                          type="button"
                          onClick={() => sendMobileOTP(mobileNumberValue.trim())}
                          disabled={mobileOtpLoading || !/^[6-9]\d{9}$/.test(mobileNumberValue.trim())}
                          className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold whitespace-nowrap h-12 px-5 rounded-xl"
                        >
                          {mobileOtpLoading ? 'Sending...' : 'Verify Mobile'}
                        </Button>
                      )}
                      {mobileChanged && mobileVerified && (
                        <div className="flex items-center gap-2 px-4 h-12 bg-green-50 text-[#2E7D32] rounded-xl border border-green-200">
                          <ShieldCheck className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                          <span className="font-sans font-semibold text-sm whitespace-nowrap">Verified</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[#2C3E50]/60 font-sans mt-1.5">
                      A new mobile number must be verified with OTP, and will send your profile for re-approval.
                    </p>
                    {mobileChanged && (
                      // Required by Google's terms since the reCAPTCHA badge is hidden (globals.css).
                      <p className="font-sans text-[11px] text-[#2C3E50]/50 mt-1">
                        This site is protected by reCAPTCHA and the Google{' '}
                        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#2C3E50]/70">Privacy Policy</a>{' '}
                        and{' '}
                        <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#2C3E50]/70">Terms of Service</a>{' '}
                        apply.
                      </p>
                    )}

                    {mobileChanged && mobileVerificationStep === 'otp' && !mobileVerified && (
                      <div className="mt-3 space-y-3 p-4 bg-[#F5E6C3]/40 rounded-xl border border-[#D4A843]/30 border-l-4 border-l-[#D4A843]">
                        <p className="font-sans text-sm text-[#2C3E50]">
                          Enter the 6-digit code sent to <strong className="text-[#1A1A1A]">+91 {mobileNumberValue}</strong>
                        </p>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="000000"
                          maxLength={6}
                          value={mobileOtpValue}
                          onChange={(e) => setMobileOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (!mobileOtpLoading && mobileOtpValue.length === 6) verifyMobileOTP();
                            }
                          }}
                          className="text-center text-2xl tracking-[0.5em] font-sans h-12 rounded-xl bg-white border-[#D4A843]/40 focus-visible:ring-[#D4A843]/40"
                        />
                        <div className="flex gap-2.5">
                          <Button
                            type="button"
                            onClick={verifyMobileOTP}
                            disabled={mobileOtpLoading || mobileOtpValue.length !== 6}
                            className="flex-1 bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold h-11 rounded-xl"
                          >
                            {mobileOtpLoading ? 'Verifying...' : 'Verify OTP'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={resendMobileOTP}
                            disabled={mobileResendTimer > 0}
                            className="font-sans h-11 rounded-xl border-[#D4A843]/40 text-[#2C3E50] hover:bg-[#F5E6C3]/30"
                          >
                            {mobileResendTimer > 0 ? `Resend (${mobileResendTimer}s)` : 'Resend OTP'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="font-sans text-sm font-medium text-[#1A1A1A] block mb-2">Alternate Mobile Number (optional)</label>
                    <div className="flex">
                      <div className="w-16 flex items-center justify-center border border-r-0 border-[#D4A843]/25 rounded-l-xl bg-[#F5E6C3]/50 font-sans text-sm text-[#2C3E50] font-medium">
                        +91
                      </div>
                      <input
                        type="tel"
                        value={alternateMobileValue}
                        onChange={(e) => setAlternateMobileValue(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        maxLength={10}
                        pattern="[0-9]*"
                        placeholder="9876543210"
                        className="w-full h-12 px-4 rounded-l-none rounded-r-xl border border-[#D4A843]/25 bg-white font-sans text-[15px] text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-sans text-sm font-medium text-[#1A1A1A] block mb-2">Email Address</label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-12 px-4 rounded-xl border border-[#D4A843]/15 bg-white/60 flex items-center font-sans text-[15px] text-[#2C3E50]/80 truncate">
                        {user?.email}
                      </div>
                      <Button type="button" variant="outline" onClick={() => setShowEmailDialog(true)}>
                        Change Email
                      </Button>
                    </div>
                  </div>
                </div>

                <PersonalDetailsStep
                  form={form}
                  user={docsUser}
                  userProfile={docsUserProfile}
                  horoscope={formData.horoscope}
                  onFileUpdate={handleFileUpdate}
                  onDeleteHoroscope={handleDeleteHoroscope}
                />
              </>
            )}
            {currentStep === 2 && <LocationAddressStep form={form} />}
            {currentStep === 3 && <ProfessionalDetailsStep form={form} />}
            {currentStep === 4 && <FamilyDetailsStep form={form} />}
            {currentStep === 5 && (
              <PreferencesMediaStep
                form={form}
                user={docsUser}
                userProfile={docsUserProfile}
                profilePicture={formData.profilePicture}
                galleryPhotos={formData.galleryPhotos}
                onFileUpdate={handleFileUpdate}
                idProof={formData.idProof}
                idProofRequired={idProofRequired}
                onDeleteIdProof={handleDeleteIdProof}
                uploadGalleryImmediately
                onGalleryUploadingChange={setGalleryUploading}
                onPreparingChange={setPhotosPreparing}
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
          type="submit"
          disabled={isLoading || galleryUploading || photosPreparing}
          className="flex-1 bg-primary text-primary-foreground font-sans font-semibold"
        >
          {isLoading ? 'Saving...' : galleryUploading ? 'Uploading photo...' : photosPreparing ? 'Preparing photo...' : currentStep === 5 ? 'Save Profile' : 'Next'}
          {!isLoading && currentStep < 5 && <ChevronRight className="ml-2 w-4 h-4" />}
        </Button>
      </div>
      </form>

      <AlertDialog open={showReapprovalConfirm} onOpenChange={setShowReapprovalConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Your Profile Will Be Sent for Re-Approval</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              {reapprovalReasonsText} requires our team to review your profile again. Until it&apos;s re-approved,
              your profile will be restricted the same way it was before your very first approval.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-sans">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="font-sans bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A]"
              onClick={() => {
                setShowReapprovalConfirm(false);
                submitUpdate();
              }}
            >
              Continue &amp; Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EmailChangeDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        currentEmail={user?.email}
        onEmailChanged={async () => {
          const profileResponse = await client.get('/api/profiles/me/view');
          setUserProfile(profileResponse.data.data);
          await useAuthStore.getState().refreshUser();
        }}
      />
    </Card>
  );
}
