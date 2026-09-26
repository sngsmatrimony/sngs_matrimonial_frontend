'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // <-- Added for the background image
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  UserPlus,
  HeartHandshake,
  MapPin,
  Briefcase,
  Users,
  Images,
  ShieldCheck,
  Mail,
} from 'lucide-react';
import client from '@/lib/api/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { FormAlert } from '@/components/ui/form-alert';
import { useAuthStore } from '@/store/authStore';
import { useIdProofRequired } from '@/hooks/useIdProofRequired';
import { toastSuccess, toastError } from '@/lib/toast';
import { convertTo24Hour, buildTimeFromDropdowns } from '@/lib/time';
import { MONTHS } from '@/lib/constants/formData';
import {
  PersonalDetailsStep,
  LocationAddressStep,
  ProfessionalDetailsStep,
  FamilyDetailsStep,
  PreferencesMediaStep,
} from '@/components/profile-form-steps';

// Step 1: Account Creation (unique to register)
const step1Schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/\d/, 'Must contain number'),
  confirmPassword: z.string(),
  mobileNumber: z.string().min(1, 'Mobile number is required').regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number (starting with 6-9)'),
  alternateMobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number (starting with 6-9)').optional().or(z.literal('')),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Reuse schemas from EditProfileForm
const step2Schema = z.object({
  dateOfBirth: z.date({
    required_error: 'Please select your date of birth',
    invalid_type_error: 'Please select a valid date of birth',
  }),
  timeOfBirth_hours: z.string().optional(),
  timeOfBirth_minutes: z.string().optional(),
  timeOfBirth_meridiem: z.string().optional(),
  motherTongue: z.string().min(1, 'Please select your mother tongue'),
  height: z.string().min(1, 'Please select your height'),
  physicalStatus: z.string().min(1, 'Please select your physical status'),
  maritalStatus: z.string().min(1, 'Please select your marital status'),
  gender: z.string().min(1, 'Please select your gender'),
  seekingGender: z.string().min(1, 'Please select who you are looking for'),
  religion: z.string().min(1, 'Please select your religion'),
  caste: z.string().optional(),
  shuddhaJathakam: z.string().optional(),
  doshamTypes: z.array(z.string()).optional().default([]),
  nakshatra: z.string().optional(),
  raasi: z.string().optional(),
  languagesKnown: z.array(z.string()).min(1, 'Please select at least one language').max(10, 'Maximum 10 languages'),
  placeOfBirth: z.string().min(1, 'Please enter your place of birth').max(100, 'Maximum 100 characters'),
  complexion: z.enum(['Very Fair', 'Fair', 'Wheatish', 'Wheatish Brown', 'Dark', 'Very Dark'], {
    errorMap: () => ({ message: 'Please select your complexion' })
  }),
  weight: z.number({ required_error: 'Please enter your weight', invalid_type_error: 'Please enter your weight' }).positive('Please enter a valid weight'),
  bloodGroup: z.string().min(1, 'Please select your blood group'),
  diet: z.enum(['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Both (Veg & Non-Veg)'], {
    errorMap: () => ({ message: 'Please select your diet preference' })
  }),
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
});

const step3Schema = z.object({
  presentResidentialAddress: z.object({
    country: z.string().min(1, 'Please select your country'),
    state: z.string().optional(),
    city: z.string().min(1, 'Please enter your city'),
    street: z.string().min(1, 'Please enter your street address'),
    area: z.string().min(1, 'Please enter your area or locality'),
    landmark: z.string().min(1, 'Please enter a nearby landmark'),
    pincode: z.string().min(1, 'Please enter your pincode'),
  }).superRefine((data, ctx) => {
    if (data.country === 'India' && !data.state) {
      ctx.addIssue({ code: 'custom', message: 'Please select your state', path: ['state'] });
    }
  }),
  nativePlaceAddress: z.object({
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    street: z.string().optional(),
    area: z.string().optional(),
    landmark: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
});

const step4Schema = z.object({
  education: z.string().min(1, 'Please select your education'),
  employmentType: z.string().min(1, 'Please select your employment type'),
  occupation: z.string().min(1, 'Please select your occupation'),
  annualIncomeCurrency: z.string().min(1, 'Please select your currency'),
  annualIncomeAmount: z.string().min(1, 'Please select your income amount'),
  professionalAdditionalInfo: z.string().min(1, 'Please share some additional information').max(500, 'Maximum 500 characters'),
});

const step5Schema = z.object({
  fatherName: z.string().min(1, "Father's name is required"),
  fatherOccupation: z.string().min(1, "Please enter father's occupation"),
  motherName: z.string().min(1, "Mother's name is required"),
  motherOccupation: z.string().min(1, "Please enter mother's occupation"),
  residentialStatus: z.string().min(1, 'Please select your residential status'),
  familyStatus: z.string().min(1, 'Please select your family status'),
});

const step6Schema = z.object({
  ageFrom: z.string()
    .min(1, 'Please select minimum age')
    .refine(val => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 18 && num <= 90;
    }, 'Age from must be between 18 and 90'),
  ageTo: z.string()
    .min(1, 'Please select maximum age')
    .refine(val => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 18 && num <= 90;
    }, 'Age to must be between 18 and 90'),
  interests: z.array(z.string()).min(1, 'Please select at least one interest'),
  profileAbout: z.string().min(1, 'Please tell us about yourself').max(1000, 'About must be at most 1000 characters'),
  profileBannerColor: z.string().optional(),
}).refine(data => {
  const from = parseInt(data.ageFrom, 10);
  const to = parseInt(data.ageTo, 10);
  return to >= from;
}, {
  message: 'Age to must be greater than or equal to age from',
  path: ['ageTo'],
});

// Turns backend/JS-level errors into plain, user-facing messages.
// Anything that looks like a stack trace, a parsing error, or another
// "for developers" message is swapped for a friendly fallback instead
// of being shown to the person filling out the form.
const TECHNICAL_ERROR_PATTERNS = [
  /unexpected (token|string|number|identifier|end of json)/i,
  /json\.parse|is not valid json/i,
  /is not a function/i,
  /cannot read propert/i,
  /undefined is not/i,
  /null is not/i,
  /syntaxerror|typeerror|referenceerror/i,
  /^\s*at\s+\S+\s*\(/m, // stack trace lines
  /\.(js|ts|jsx|tsx):\d+:\d+/, // file:line:col references
  /status code \d{3}/i,
  /expected .+ received/i, // raw zod type-mismatch messages
  /econnrefused|etimedout|enotfound/i,
];

const getFriendlyErrorMessage = (
  err,
  fallback = 'Something went wrong on our end. Please try again in a moment.'
) => {
  const raw =
    (typeof err === 'string' ? err : '') ||
    err?.response?.data?.message ||
    err?.message ||
    '';

  if (!raw) return fallback;

  if (/network error|failed to fetch/i.test(raw)) {
    return 'We couldn\u2019t reach the server. Please check your internet connection and try again.';
  }

  if (TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(raw))) {
    return fallback;
  }

  // Long, unpunctuated or code-like strings are unlikely to be meant for users
  if (raw.length > 160 || /[{}<>]/.test(raw)) {
    return fallback;
  }

  return raw;
};


export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const idProofRequired = useIdProofRequired();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Email OTP Verification State
  const [emailVerificationStep, setEmailVerificationStep] = useState('input'); // 'input', 'otp', 'verified'
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobileNumber: '',
    alternateMobileNumber: '',
    // Step 2-6 will be populated with defaults from shared component
    dateOfBirth: null,
    timeOfBirth_hours: '',
    timeOfBirth_minutes: '',
    timeOfBirth_meridiem: '',
    motherTongue: '',
    height: '',
    physicalStatus: '',
    maritalStatus: '',
    gender: '',
    seekingGender: '',
    religion: '',
    caste: '',
    shuddhaJathakam: '',
    doshamTypes: [],
    nakshatra: '',
    raasi: '',
    languagesKnown: [],
    placeOfBirth: '',
    complexion: '',
    // Step 3
    presentResidentialAddress: {
      country: '',
      state: '',
      city: '',
      street: '',
      area: '',
      landmark: '',
      pincode: '',
    },
    nativePlaceAddress: {
      country: '',
      state: '',
      city: '',
      street: '',
      area: '',
      landmark: '',
      pincode: '',
    },
    // Step 4
    education: '',
    employmentType: '',
    occupation: '',
    annualIncomeCurrency: 'INR',
    annualIncomeAmount: '',
    professionalAdditionalInfo: '',
    // Step 5
    fatherName: '',
    fatherOccupation: '',
    motherName: '',
    motherOccupation: '',
    weight: null,
    bloodGroup: '',
    residentialStatus: '',
    familyStatus: '',
    diet: '',
    // Step 6
    ageFrom: '',
    ageTo: '',
    interests: [],
    profileAbout: '',
    profileBannerColor: '#FFB3BA',
    // File uploads
    profilePicture: null,
    galleryPhotos: [],
    horoscope: null,
    idProof: null,
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
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const prevStepRef = useRef(currentStep);

  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
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
    setFormData(prev => ({
      ...prev,
      ...currentValues,
      profilePicture: prev.profilePicture,
      galleryPhotos: prev.galleryPhotos,
      horoscope: prev.horoscope,
      idProof: prev.idProof,
    }));
  };

  const handleBackNavigation = () => {
    saveCurrentStepData();
    setCurrentStep(currentStep - 1);
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

  const checkEmailUniqueness = async (email) => {
    try {
      const response = await client.post('/api/auth/register/check-email', { email });
      return response.data.available;
    } catch (error) {
      console.error('Check email error:', error);
      toastError(getFriendlyErrorMessage(error, 'We couldn\u2019t check that email right now. Please try again.'));
      return false;
    }
  };

  const sendOTP = async () => {
    const email = formData.email;
    if (!email || !z.string().email().safeParse(email).success) {
      toastError('Please enter a valid email address');
      return;
    }

    setOtpLoading(true);
    try {
      const isUnique = await checkEmailUniqueness(email);
      if (!isUnique) {
        setOtpLoading(false);
        return;
      }

      const response = await client.post('/api/auth/register/send-otp', { email });

      if (response.data.success) {
        toastSuccess('OTP sent to your email');
        setEmailVerificationStep('otp');
        setOtpSent(true);
        startResendTimer();
      } else {
        toastError(getFriendlyErrorMessage(response.data.message, 'We couldn\u2019t send the verification code. Please try again.'));
      }
    } catch (error) {
      toastError(getFriendlyErrorMessage(error, 'We couldn\u2019t send the verification code. Please try again.'));
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otpValue || otpValue.length !== 6) {
      toastError('Please enter a valid 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await client.post('/api/auth/register/verify-otp', {
        email: formData.email,
        otp: otpValue
      });

      if (response.data.success) {
        toastSuccess('Email verified successfully!');
        setVerificationToken(response.data.verificationToken);
        setEmailVerified(true);
        setEmailVerificationStep('verified');
      } else {
        toastError(getFriendlyErrorMessage(response.data.message, 'That code didn\u2019t match. Please check it and try again.'));
        setOtpValue('');
      }
    } catch (error) {
      toastError(getFriendlyErrorMessage(error, 'We couldn\u2019t verify that code right now. Please try again.'));
      setOtpValue('');
    } finally {
      setOtpLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resendOTP = async () => {
    setOtpValue('');
    setVerificationToken('');
    await sendOTP();
  };

  const validateAndProceed = async () => {
    setError('');

    if (currentStep === 6) {
      const isValid = await form.trigger();
      if (!isValid) {
        toastError('Some fields are not filled in correctly. Please check and try again.');
        setIsLoading(false);
        return;
      }

      if (idProofRequired && !formData.idProof?.file) {
        toastError('Please upload an ID proof document to continue.');
        setIsLoading(false);
        return;
      }

      const values = form.getValues();
      const updatedFormData = {
        ...formData,
        ...values,
        profilePicture: formData.profilePicture,
        galleryPhotos: formData.galleryPhotos,
        horoscope: formData.horoscope,
        idProof: formData.idProof,
      };
      setFormData(updatedFormData);
      setIsLoading(true);
      await submitRegistration(updatedFormData);
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
      profilePicture: prev.profilePicture,
      galleryPhotos: prev.galleryPhotos,
      horoscope: prev.horoscope,
      idProof: prev.idProof,
    }));
    setCurrentStep(currentStep + 1);
  };

  const submitRegistration = async (dataToSubmit = null) => {
    const submissionData = dataToSubmit || formData;
    setIsLoading(true);
    setError('');

    try {
      const dob = submissionData.dateOfBirth instanceof Date ? submissionData.dateOfBirth : new Date(submissionData.dateOfBirth);

      const ageFromValue = submissionData.ageFrom && submissionData.ageFrom !== ''
        ? parseInt(submissionData.ageFrom, 10)
        : null;
      const ageToValue = submissionData.ageTo && submissionData.ageTo !== ''
        ? parseInt(submissionData.ageTo, 10)
        : null;

      const ageFromValid = ageFromValue !== null && !isNaN(ageFromValue) && ageFromValue >= 18 && ageFromValue <= 90;
      const ageToValid = ageToValue !== null && !isNaN(ageToValue) && ageToValue >= 18 && ageToValue <= 90;

      if (!ageFromValid || !ageToValid) {
        const msg = 'Please select valid age preferences (18-90)';
        setError(msg);
        toastError(msg);
        setIsLoading(false);
        return;
      }

      const parsedIncome = parseIncomeAmount(submissionData.annualIncomeCurrency, submissionData.annualIncomeAmount);

      const timeOfBirthString = buildTimeFromDropdowns(
        submissionData.timeOfBirth_hours,
        submissionData.timeOfBirth_minutes,
        submissionData.timeOfBirth_meridiem
      );
      const timeOfBirth24 = timeOfBirthString ? convertTo24Hour(timeOfBirthString) : '';

      const registrationData = {
        fullName: submissionData.fullName,
        email: submissionData.email,
        password: submissionData.password,
        mobileNumber: submissionData.mobileNumber || '', 
        alternateMobileNumber: submissionData.alternateMobileNumber || '',
        verificationToken: verificationToken,
        dateOfBirth: dob.toISOString(),
        timeOfBirth: timeOfBirth24,
        motherTongue: submissionData.motherTongue,
        languagesKnown: submissionData.languagesKnown || [],
        placeOfBirth: submissionData.placeOfBirth || '',
        complexion: submissionData.complexion || '',
        height: submissionData.height,
        physicalStatus: submissionData.physicalStatus,
        maritalStatus: submissionData.maritalStatus,
        gender: submissionData.gender,
        seekingGender: submissionData.seekingGender,
        religion: submissionData.religion,
        caste: submissionData.religion === 'Hindu' ? submissionData.caste : '',
        shuddhaJathakam: submissionData.religion === 'Hindu' ? submissionData.shuddhaJathakam : '',
        doshamTypes: submissionData.shuddhaJathakam === 'No' ? submissionData.doshamTypes : [],
        nakshatra: submissionData.religion === 'Hindu' ? (submissionData.nakshatra || null) : null,
        raasi: submissionData.religion === 'Hindu' ? (submissionData.raasi || null) : null,
        country: submissionData.presentResidentialAddress?.country || '',
        state: submissionData.presentResidentialAddress?.country === 'India'
          ? submissionData.presentResidentialAddress?.state || ''
          : '',
        city: submissionData.presentResidentialAddress?.city || '',
        presentResidentialAddress: submissionData.presentResidentialAddress || {},
        nativePlaceAddress: submissionData.nativePlaceAddress || {},
        education: submissionData.education,
        employmentType: submissionData.employmentType,
        occupation: submissionData.occupation,
        professionalAdditionalInfo: submissionData.professionalAdditionalInfo || '',
        annualIncome: {
          currency: submissionData.annualIncomeCurrency,
          min: parsedIncome.min,
          max: parsedIncome.max,
          displayText: parsedIncome.displayText,
        },
        fatherName: submissionData.fatherName,
        fatherOccupation: submissionData.fatherOccupation,
        motherName: submissionData.motherName,
        motherOccupation: submissionData.motherOccupation,
        weight: submissionData.weight,
        bloodGroup: submissionData.bloodGroup,
        diet: submissionData.diet || '',
        residentialStatus: submissionData.residentialStatus,
        familyStatus: submissionData.familyStatus,
        ageFrom: ageFromValue,
        ageTo: ageToValue,
        interests: submissionData.interests,
        profileAbout: submissionData.profileAbout,
        profileBanner: {
          bannerType: 'color',
          bannerColor: submissionData.profileBannerColor,
        },
      };

      const result = await register(registrationData);

      if (result.success) {
        toastSuccess('Registration successful! Logging you in...');

        try {
          if (submissionData.profilePicture?.file) {
            await useAuthStore.getState().uploadProfilePicture(submissionData.profilePicture.file);
          }
          if (submissionData.galleryPhotos?.length > 0) {
            for (const photo of submissionData.galleryPhotos) {
              if (photo.file && !photo.existing) {
                await useAuthStore.getState().uploadPhoto(photo.file);
              }
            }
          }
          if (submissionData.horoscope?.file) {
            try {
              await useAuthStore.getState().uploadHoroscopeDocument(submissionData.horoscope.file);
            } catch (error) {
              console.warn('Horoscope upload warning:', error.message);
            }
          }
          if (submissionData.idProof?.file) {
            try {
              await useAuthStore.getState().uploadIdProof(submissionData.idProof.file);
            } catch (error) {
              console.warn('ID proof upload warning:', error.message);
            }
          }
        } catch (mediaErr) {
          console.warn('Media upload warning:', mediaErr.message);
        }

        router.push('/');
      } else {
        throw new Error(
          getFriendlyErrorMessage(result.error, 'Registration failed. Please check your details and try again.')
        );
      }
    } catch (err) {
      console.error('Registration error:', err);
      const msg = getFriendlyErrorMessage(
        err,
        'We couldn\u2019t complete your registration. Please check your details and try again.'
      );
      setError(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitles = [
    { label: 'Create Your Account', icon: UserPlus },
    { label: 'Personal Details', icon: HeartHandshake },
    { label: 'Location Details', icon: MapPin },
    { label: 'Professional Details', icon: Briefcase },
    { label: 'Family & Additional Details', icon: Users },
    { label: 'Preferences & Media', icon: Images },
  ];
  const progressValue = (currentStep / 6) * 100;
  const CurrentStepIcon = stepTitles[currentStep - 1].icon;

  return (
    <>
      {/* 1. FIXED EDGE-TO-EDGE BACKGROUND (behind everything, including portaled dropdowns) */}
      <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none">
        <Image
          src="/images/reception.png"
          alt="SNGS Matrimonial Registration Background"
          fill
          priority
          className="object-cover"
        />
        {/* Charcoal overlay with blur applied directly over the image */}
        <div className="absolute inset-0 bg-[#1A1A1A]/50 backdrop-blur-[2px]" />
      </div>

      {/* 2. CONTENT WRAPPER (z-10) */}
      <div className="relative z-10 flex items-center justify-center min-h-screen w-full p-4 py-24">
        
        {currentStep === 1 ? (
          /* STEP 1: ACCOUNT CREATION CARD */
          <Card className="border border-white/40 shadow-[0_25px_70px_-20px_rgba(0,0,0,0.55)] bg-white/97 backdrop-blur-xl ring-1 ring-[#D4A843]/15 w-full max-w-2xl mx-auto rounded-[28px] overflow-hidden py-0 gap-0">
            <CardHeader className="pb-7 pt-9 px-6 sm:px-10 bg-gradient-to-br from-[#2C3E50] via-[#233240] to-[#1A2733] relative overflow-hidden">
              {/* Subtle decorative texture */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_15%_20%,#D4A843_0%,transparent_45%),radial-gradient(circle_at_85%_80%,#D4A843_0%,transparent_45%)]" />
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D4A843]/0 via-[#D4A843] to-[#D4A843]/0" />
              <div className="flex items-center justify-between mb-5 relative">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#F5E6C3] to-[#EAD5A0] text-[#2C3E50] ring-2 ring-[#D4A843]/40 ring-offset-2 ring-offset-[#2C3E50] shadow-lg shrink-0">
                    <UserPlus className="w-5 h-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-sans text-[11px] tracking-[0.18em] uppercase text-[#D4A843] font-semibold mb-0.5">
                      Step 1 of 6
                    </p>
                    <CardTitle className="font-serif text-2xl text-white font-bold leading-tight tracking-tight">
                      {stepTitles[0].label}
                    </CardTitle>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 font-sans text-xs text-white/75 font-medium whitespace-nowrap">
                  <ShieldCheck className="w-4 h-4 text-[#D4A843]" strokeWidth={1.75} />
                  100% Verified Profiles
                </div>
              </div>
              <div className="relative">
                <Progress value={progressValue} className="h-1.5 bg-white/15 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-[#D4A843] [&>div]:to-[#F0C868] [&>div]:rounded-full" />
              </div>
            </CardHeader>

            <CardContent className="px-6 sm:px-10">
              <Form {...form}>
                <div className="space-y-6 py-8">
                  <FormAlert message={error} onDismiss={() => setError('')} />

                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sans text-[#1A1A1A] font-medium">Full Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your full name"
                            className="font-sans h-12 rounded-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50"
                            onChange={(e) => {
                              field.onChange(e);
                              if (form.formState.errors.fullName) {
                                form.trigger('fullName');
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sans text-[#1A1A1A] font-medium">Email Address *</FormLabel>
                        <div className="flex gap-2.5">
                          <div className="relative flex-1">
                            <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2C3E50]/50" strokeWidth={1.75} />
                            <FormControl>
                             <Input
                                {...field}
                                type="email"
                                placeholder="your@email.com"
                                className="font-sans pl-10 h-12 rounded-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50"
                                disabled={emailVerified}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const emailVal = e.currentTarget.value.trim();
                                    const isValidEmail = z.string().email().safeParse(emailVal).success;
                                    if (!emailVerified && !otpLoading && isValidEmail) {
                                      sendOTP();
                                    }
                                  }
                                }}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setFormData(prev => ({
                                    ...prev,
                                    email: e.target.value
                                  }));
                                  if (emailVerified) {
                                    setEmailVerified(false);
                                    setVerificationToken('');
                                    setEmailVerificationStep('input');
                                  }
                                  if (form.formState.errors.email) {
                                    form.trigger('email');
                                  }
                                }}
                              />
                            </FormControl>
                          </div>
                          {!emailVerified && (
                            <Button
                              type="button"
                              onClick={sendOTP}
                              disabled={otpLoading || !formData.email || !z.string().email().safeParse(formData.email).success}
                              className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold whitespace-nowrap h-12 px-5 rounded-xl shadow-sm"
                            >
                              {otpLoading ? 'Sending...' : 'Verify Email'}
                            </Button>
                          )}
                          {emailVerified && (
                            <div className="flex items-center gap-2 px-4 h-12 bg-green-50 text-green-700 rounded-xl border border-green-200">
                              <ShieldCheck className="w-4.5 h-4.5 shrink-0" strokeWidth={1.75} />
                              <span className="font-sans font-semibold text-sm whitespace-nowrap">Verified</span>
                            </div>
                          )}
                        </div>
                        <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
                      </FormItem>
                    )}
                  />

                  {emailVerificationStep === 'otp' && !emailVerified && (
                    <div className="space-y-4 p-5 bg-[#F5E6C3]/40 rounded-xl border border-[#D4A843]/30 border-l-4 border-l-[#D4A843]">
                      <p className="font-sans text-sm text-[#2C3E50]">
                        Enter the 6-digit code sent to <strong className="text-[#1A1A1A]">{formData.email}</strong>
                      </p>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        maxLength={6}
                        value={otpValue}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setOtpValue(cleaned);
                        }}
                        className="text-center text-2xl tracking-[0.5em] font-sans h-14 rounded-xl bg-white border-[#D4A843]/40 focus-visible:ring-[#D4A843]/40"
                      />
                      <div className="flex gap-2.5">
                        <Button
                          type="button"
                          onClick={verifyOTP}
                          disabled={otpLoading || !otpValue || otpValue.length !== 6}
                          className="flex-1 bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold h-11 rounded-xl shadow-sm"
                        >
                          {otpLoading ? 'Verifying...' : 'Verify OTP'}
                        </Button>
                        <Button
                          type="button"
                          onClick={resendOTP}
                          disabled={resendTimer > 0}
                          variant="outline"
                          className="font-sans h-11 rounded-xl border-[#D4A843]/40 text-[#2C3E50] hover:bg-[#F5E6C3]/30"
                        >
                          {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend OTP'}
                        </Button>
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sans text-[#1A1A1A] font-medium">Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              placeholder="At least 8 characters"
                              className="font-sans h-12 rounded-xl border-[#D4A843]/25 pr-11 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50"
                              onChange={(e) => {
                                field.onChange(e);
                                if (form.formState.errors.password) form.trigger('password');
                                if (form.formState.errors.confirmPassword) form.trigger('confirmPassword');
                              }}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            tabIndex={-1}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#2C3E50]/50 hover:text-[#D4A843] transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                          </button>
                        </div>
                        <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sans text-[#1A1A1A] font-medium">Confirm Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              type={showConfirmPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              placeholder="••••••••"
                              className="font-sans h-12 rounded-xl border-[#D4A843]/25 pr-11 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50"
                              onChange={(e) => {
                                field.onChange(e);
                                if (form.formState.errors.confirmPassword) form.trigger('confirmPassword');
                              }}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            tabIndex={-1}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#2C3E50]/50 hover:text-[#D4A843] transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                          </button>
                        </div>
                        <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sans text-[#1A1A1A] font-medium">Mobile Number *</FormLabel>
                        <div className="flex">
                          <div className="w-16 flex items-center justify-center border border-r-0 border-[#D4A843]/25 rounded-l-xl bg-[#F5E6C3]/50 font-sans text-sm text-[#2C3E50] font-medium">
                            +91
                          </div>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="9876543210"
                              maxLength={10}
                              pattern="[0-9]*"
                              className="font-sans flex-1 h-12 rounded-l-none rounded-r-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50"
                              onChange={(e) => {
                                field.onChange(e);
                                setFormData(prev => ({ ...prev, mobileNumber: e.target.value }));
                                if (form.formState.errors.mobileNumber) form.trigger('mobileNumber');
                              }}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="alternateMobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sans text-[#1A1A1A] font-medium">Alternate Mobile Number (Optional)</FormLabel>
                        <div className="flex">
                          <div className="w-16 flex items-center justify-center border border-r-0 border-[#D4A843]/25 rounded-l-xl bg-[#F5E6C3]/50 font-sans text-sm text-[#2C3E50] font-medium">
                            +91
                          </div>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="9876543210"
                              maxLength={10}
                              pattern="[0-9]*"
                              className="font-sans flex-1 h-12 rounded-l-none rounded-r-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50"
                              onChange={(e) => {
                                field.onChange(e);
                                if (form.formState.errors.alternateMobileNumber) form.trigger('alternateMobileNumber');
                              }}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            </CardContent>

            <div className="flex gap-3 px-6 sm:px-10 py-6 border-t border-[#D4A843]/15 bg-gradient-to-b from-[#F5E6C3]/30 to-[#F5E6C3]/10">
              <Button
                variant="outline"
                className="flex-1 font-sans h-12 rounded-xl border-[#D4A843]/30 text-[#2C3E50] font-medium hover:bg-[#F5E6C3]/40 hover:border-[#D4A843]/50 transition-all duration-200"
                onClick={() => router.push('/login')}
              >
                Back to Login
              </Button>
              <Button
                onClick={validateAndProceed}
                disabled={isLoading || !emailVerified}
                className="flex-1 bg-gradient-to-r from-[#D4A843] to-[#C99A3A] hover:from-[#C99A3A] hover:to-[#B8860B] text-[#1A1A1A] font-sans font-semibold h-12 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-200"
              >
                {!emailVerified ? 'Verify Email to Continue' : isLoading ? 'Validating...' : 'Next'}
                {!isLoading && emailVerified && <ChevronRight className="ml-2 w-4 h-4" />}
              </Button>
            </div>
          </Card>
        ) : (
          
          /* STEPS 2 TO 6: DETAILS CARDS */
          <Card className="border border-white/40 shadow-[0_25px_70px_-20px_rgba(0,0,0,0.55)] bg-white/97 backdrop-blur-xl ring-1 ring-[#D4A843]/15 w-full max-w-2xl mx-auto rounded-[28px] overflow-hidden py-0 gap-0">
            <CardHeader className="pb-7 pt-9 px-6 sm:px-10 bg-gradient-to-br from-[#2C3E50] via-[#233240] to-[#1A2733] relative overflow-hidden">
              {/* Subtle decorative texture */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_15%_20%,#D4A843_0%,transparent_45%),radial-gradient(circle_at_85%_80%,#D4A843_0%,transparent_45%)]" />
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D4A843]/0 via-[#D4A843] to-[#D4A843]/0" />
              <div className="flex items-center justify-between mb-5 relative">
                <div className="flex items-center gap-3.5">
                  <button
                    type="button"
                    onClick={handleBackNavigation}
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
                      Step {currentStep} of 6
                    </p>
                    <CardTitle className="font-serif text-2xl text-white font-bold leading-tight tracking-tight">
                      {stepTitles[currentStep - 1].label}
                    </CardTitle>
                  </div>
                </div>
              </div>
              <Progress value={progressValue} className="h-1.5 bg-white/15 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-[#D4A843] [&>div]:to-[#F0C868] [&>div]:rounded-full" />
            </CardHeader>

            <CardContent className="px-6 sm:px-10">
              <Form {...form}>
                <div className="space-y-6 py-8">
                  <FormAlert message={error} onDismiss={() => setError('')} />

                  {currentStep === 2 && <PersonalDetailsStep form={form} horoscope={formData.horoscope} onFileUpdate={handleFileUpdate} />}
                  {currentStep === 3 && <LocationAddressStep form={form} />}
                  {currentStep === 4 && <ProfessionalDetailsStep form={form} />}
                  {currentStep === 5 && <FamilyDetailsStep form={form} />}
                  {currentStep === 6 && (
                    <PreferencesMediaStep
                      form={form}
                      profilePicture={formData.profilePicture}
                      galleryPhotos={formData.galleryPhotos}
                      onFileUpdate={handleFileUpdate}
                      idProof={formData.idProof}
                      idProofRequired={idProofRequired}
                    />
                  )}
                </div>
              </Form>
            </CardContent>

            <div className="flex gap-3 px-6 sm:px-10 py-6 border-t border-[#D4A843]/15 bg-gradient-to-b from-[#F5E6C3]/30 to-[#F5E6C3]/10">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackNavigation}
                className="flex-1 font-sans h-12 rounded-xl border-[#D4A843]/30 text-[#2C3E50] font-medium hover:bg-[#F5E6C3]/40 hover:border-[#D4A843]/50 transition-all duration-200"
              >
                Back
              </Button>

              <Button
                onClick={validateAndProceed}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-[#D4A843] to-[#C99A3A] hover:from-[#C99A3A] hover:to-[#B8860B] text-[#1A1A1A] font-sans font-semibold h-12 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-200"
              >
                {isLoading ? 'Processing...' : currentStep === 6 ? 'Complete Registration' : 'Next'}
                {!isLoading && currentStep < 6 && <ChevronRight className="ml-2 w-4 h-4" />}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}