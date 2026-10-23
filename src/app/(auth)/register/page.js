'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AuthBackground from '@/components/auth/AuthBackground';
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
import { useFirebasePhoneAuth } from '@/hooks/useFirebasePhoneAuth';
import { getFriendlyErrorMessage } from '@/lib/errorMessages';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { FormAlert } from '@/components/ui/form-alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuthStore } from '@/store/authStore';
import { useIdProofRequired } from '@/hooks/useIdProofRequired';
import { toastSuccess, toastError } from '@/lib/toast';
import { convertTo24Hour, buildTimeFromDropdowns } from '@/lib/time';
import { noPasteHandlers } from '@/lib/noPasteHandlers';
import { MONTHS, COUNTRIES } from '@/lib/constants/formData';
import { setMonth, setYear, format } from 'date-fns';
import {
  PersonalDetailsStep,
  LocationAddressStep,
  ProfessionalDetailsStep,
  FamilyDetailsStep,
  PreferencesMediaStep,
} from '@/components/profile-form-steps';

// Step 1: Quick Start — the minimal set of fields a visitor commits to before
// deciding whether to finish the rest of the form. Deliberately excludes
// email/password (now step 7, "Account Finish") so starting a profile asks
// for almost nothing up front. Mobile is Firebase-OTP-verified here (not
// deferred) since this is also what the "started filling" Supabase lead row
// is keyed on, and what the new mobile-OTP login feature needs trustworthy.
const getAge = (dob) => {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

const CURRENT_YEAR = new Date().getFullYear();
// Only years that can produce an 18–90 age (the same range the backend enforces).
const DOB_YEARS = Array.from({ length: 73 }, (_, i) => CURRENT_YEAR - 18 - i);

const step1Schema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100, 'Full name must be at most 100 characters'),
  dateOfBirth: z.date({ error: 'Please select your date of birth' })
    .refine((dob) => {
      const age = getAge(dob);
      return age >= 18 && age <= 90;
    }, 'Age must be between 18 and 90 years'),
  gender: z.string().min(1, 'Please select your gender'),
  seekingGender: z.string().min(1, 'Please select who you are looking for'),
  placeCountry: z.string().min(1, 'Please select your country'),
  placeCity: z.string().min(1, 'Please enter your city'),
  mobileNumber: z.string().min(1, 'Mobile number is required').regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number (starting with 6-9)'),
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
}).refine(data => {
  const from = parseInt(data.ageFrom, 10);
  const to = parseInt(data.ageTo, 10);
  return to >= from;
}, {
  message: 'Age to must be greater than or equal to age from',
  path: ['ageTo'],
});

// Step 7: Account Finish — email (OTP-verified, same flow as before, just
// relocated) + password + the optional alternate mobile number.
const step7Schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/\d/, 'Must contain number'),
  confirmPassword: z.string(),
  alternateMobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number (starting with 6-9)').optional().or(z.literal('')),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Reuse schemas from EditProfileForm
// dateOfBirth lives in step1Schema now (quick-start) — not duplicated here.
const step2Schema = z.object({
  timeOfBirth_hours: z.string().optional(),
  timeOfBirth_minutes: z.string().optional(),
  timeOfBirth_meridiem: z.string().optional(),
  motherTongue: z.string().min(1, 'Please select your mother tongue'),
  height: z.string().min(1, 'Please select your height'),
  physicalStatus: z.string().min(1, 'Please select your physical status'),
  maritalStatus: z.string().min(1, 'Please select your marital status'),
  // gender/seekingGender live in step1Schema now (quick-start) — not duplicated here.
  religion: z.string().min(1, 'Please select your religion'),
  caste: z.string().optional(),
  shuddhaJathakam: z.string().optional(),
  doshamTypes: z.array(z.string()).optional().default([]),
  nakshatra: z.string().optional(),
  raasi: z.string().optional(),
  languagesKnown: z.array(z.string()).min(1, 'Please select at least one language').max(10, 'Maximum 10 languages'),
  placeOfBirth: z.string().min(1, 'Please enter your place of birth').max(100, 'Maximum 100 characters'),
  complexion: z.enum(['Very Fair', 'Fair', 'Wheatish', 'Wheatish Brown', 'Dark', 'Very Dark'], {
    error: 'Please select your complexion',
  }),
  // Same 30–200 range Edit Profile enforces, so a typo here can't make the
  // profile un-editable later.
  weight: z.number({ error: 'Please enter your weight' }).min(30, 'Weight must be at least 30 kg').max(200, 'Weight must be at most 200 kg'),
  bloodGroup: z.string().min(1, 'Please select your blood group'),
  diet: z.enum(['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Both (Veg & Non-Veg)'], {
    error: 'Please select your diet preference',
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
    // Raasi is deliberately optional even for Hindu members — see User.js.
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
  employmentType: z.string().optional(),
  occupation: z.string().optional(),
  annualIncomeCurrency: z.string().optional(),
  annualIncomeAmount: z.string().optional(),
  professionalAdditionalInfo: z.string().max(500, 'Maximum 500 characters').optional(),
});

const step5Schema = z.object({
  fatherName: z.string().min(1, "Father's name is required"),
  fatherOccupation: z.string().optional(),
  motherName: z.string().min(1, "Mother's name is required"),
  motherOccupation: z.string().optional(),
  residentialStatus: z.string().min(1, 'Please select your residential status'),
  familyStatus: z.string().min(1, 'Please select your family status'),
});

// ageFrom/ageTo live in step1Schema now (quick-start, "preferred partner"
// age range) — not duplicated here.
const step6Schema = z.object({
  interests: z.array(z.string()).min(1, 'Please select at least one interest'),
  profileAbout: z.string().min(1, 'Please tell us about yourself').max(1000, 'About must be at most 1000 characters'),
  partnerPreferenceDescription: z.string().max(1000, 'Partner preference description must be at most 1000 characters').optional(),
  profileBannerColor: z.string().optional(),
});

// Turns backend/JS-level errors into plain, user-facing messages.
// getFriendlyErrorMessage now lives in src/lib/errorMessages.js (shared with
// useFirebasePhoneAuth.js) \u2014 imported above.


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

  // Mobile OTP Verification (Firebase Phone Auth) — the SMS itself is sent
  // directly by Firebase from the browser, not via our backend; the
  // backend's only job is verifying the resulting ID token at final submit
  // (see submitRegistration's mobileIdToken and auth.controller.js's register).
  // Logic lives in the shared useFirebasePhoneAuth hook (also used by the
  // login page's mobile-OTP option and Edit Profile).
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
  } = useFirebasePhoneAuth('recaptcha-container');

  // Check the number isn't already a member BEFORE sending a Firebase OTP —
  // same as the email check. An existing member is pointed to sign in.
  const [checkingMobile, setCheckingMobile] = useState(false);
  const [mobileTaken, setMobileTaken] = useState(false);
  const checkAndSendMobileOTP = async (mobile) => {
    setCheckingMobile(true);
    setMobileTaken(false);
    try {
      await client.post('/api/auth/register/check-mobile', { mobileNumber: mobile });
    } catch (error) {
      setCheckingMobile(false);
      // 404 = a server without this check yet (e.g. mid-deploy): don't block
      // sign-ups over it; the final registration step still rejects duplicates.
      if (error.response?.status === 404) {
        sendMobileOTP(mobile);
        return;
      }
      if (error.response?.status === 409) {
        setMobileTaken(true);
        form.setError('mobileNumber', { type: 'manual', message: 'This mobile number is already registered.' });
      } else {
        toastError(getFriendlyErrorMessage(error, 'Could not check this number. Please try again.'));
      }
      return;
    }
    setCheckingMobile(false);
    sendMobileOTP(mobile);
  };

  // Saved progress ("draft"): stored after every completed step, keyed by the
  // verified mobile number. Verifying the same number again offers to
  // continue. Password, email OTP token and files are never saved.
  const draftTokenRef = useRef('');
  // Highest step saved in THIS visit — re-verifying the number mid-way
  // (e.g. the OTP expired near the end) must not offer to "continue".
  const sessionStepsRef = useRef(0);
  const [resumeOffer, setResumeOffer] = useState(null);
  const [resumeBusy, setResumeBusy] = useState(false);

  // Draft calls use fetch rather than the shared client: its 401 handler
  // treats any 401 as "signed out" and redirects to /login.
  const draftRequest = (method, body, { keepalive = false } = {}) => fetch(`${client.defaults.baseURL}/api/auth/register/draft`, {
    method,
    keepalive,
    headers: { 'Content-Type': 'application/json', 'X-Draft-Token': draftTokenRef.current },
    body: body ? JSON.stringify(body) : undefined,
  });

  const loadDraft = async (mobile, idToken) => {
    try {
      const res = await client.post('/api/auth/register/draft/resume', { mobileNumber: mobile, mobileIdToken: idToken });
      draftTokenRef.current = res.data.draftToken || '';
      const draft = res.data.draft;
      if (draft?.completedSteps > 0 && draft.completedSteps > sessionStepsRef.current) setResumeOffer(draft);
    } catch {
      // Saving progress is a convenience — registration works without it.
      draftTokenRef.current = '';
    }
  };


  // The step form also holds (stale, empty) copies of the file fields, so
  // merging its values must never overwrite the files actually chosen.
  const withFiles = (merged) => ({
    ...merged,
    profilePicture: formData.profilePicture,
    galleryPhotos: formData.galleryPhotos,
    horoscope: formData.horoscope,
    idProof: formData.idProof,
  });

  const saveDraft = (completedSteps, data) => {
    sessionStepsRef.current = Math.max(sessionStepsRef.current, completedSteps);
    if (!draftTokenRef.current) return;
    const {
      password, confirmPassword, profilePicture, galleryPhotos, horoscope, idProof, // never saved
      ...rest
    } = data;
    const dob = rest.dateOfBirth;
    const body = {
      completedSteps,
      data: {
        ...rest,
        dateOfBirth: dob instanceof Date && !Number.isNaN(dob.getTime()) ? format(dob, 'yyyy-MM-dd') : (dob || null),
      },
    };
    // keepalive lets the save finish even if the tab is closed right after
    // Next (browsers cap keepalive bodies at 64 KB).
    const keepalive = JSON.stringify(body).length < 60000;
    draftRequest('PUT', body, { keepalive }).catch(() => {});
  };

  const continueFromDraft = () => {
    const { completedSteps, data } = resumeOffer;
    const restored = { ...formData, ...data };
    if (typeof data.dateOfBirth === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)) {
      const [y, m, d] = data.dateOfBirth.split('-').map(Number);
      restored.dateOfBirth = new Date(y, m - 1, d);
    }
    // Keep the number just verified and any files chosen in this visit.
    restored.mobileNumber = form.getValues('mobileNumber') || formData.mobileNumber;
    restored.profilePicture = formData.profilePicture;
    restored.galleryPhotos = formData.galleryPhotos;
    restored.horoscope = formData.horoscope;
    restored.idProof = formData.idProof;
    setFormData(restored);
    sessionStepsRef.current = Math.max(sessionStepsRef.current, completedSteps);
    // Photos aren't kept in a draft, so a finished step 6 resumes there.
    setCurrentStep(Math.min(completedSteps + 1, 6));
    setResumeOffer(null);
    toastSuccess(completedSteps >= 6
      ? 'Welcome back! Please add your photos again to finish.'
      : 'Welcome back! Continuing where you left off.');
  };

  const startFresh = async () => {
    setResumeBusy(true);
    try {
      const res = await draftRequest('DELETE');
      if (!res.ok) throw new Error(String(res.status));
      setResumeOffer(null);
    } catch {
      // Keep the choice open: otherwise the old step count would survive.
      toastError('We couldn’t clear your saved progress. Please check your connection and try again.');
    } finally {
      setResumeBusy(false);
    }
  };

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1 — Quick Start
    fullName: '',
    mobileNumber: '',
    placeCountry: '',
    placeCity: '',
    // Step 7 — Account Finish
    email: '',
    password: '',
    confirmPassword: '',
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
    // ageFrom/ageTo captured in Step 1 (Quick Start) now — kept here as
    // shared formData, just no longer gathered during Step 6.
    ageFrom: '',
    ageTo: '',
    // Step 6
    interests: [],
    profileAbout: '',
    partnerPreferenceDescription: '',
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
      case 7: return step7Schema;
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

  // Every step change (Next, Back, resuming a saved draft, going back to
  // re-verify the phone) starts the new step at the top of the page instead
  // of wherever the member had scrolled to on the previous one, and moves
  // keyboard / screen-reader focus to the new step's heading.
  const stepHeadingRef = useRef(null);
  const scrolledStepRef = useRef(currentStep);
  useEffect(() => {
    if (scrolledStepRef.current === currentStep) return; // not on first load
    scrolledStepRef.current = currentStep;
    window.scrollTo({ top: 0, behavior: 'auto' });
    stepHeadingRef.current?.focus({ preventScroll: true });
  }, [currentStep]);

  // Step-1 details are kept from the moment the phone is OTP-verified —
  // before Next — so someone who verifies and then leaves is still on the
  // admin's list. Saved to registration_leads and phone_verified_leads; the
  // latter is cleared by the server once they press Next. Plain fetch with
  // keepalive (survives closing the tab), and errors are ignored: this never
  // interrupts registration.
  const leadCaptureStoppedRef = useRef(false);
  const captureVerifiedLead = useCallback((idToken) => {
    if (leadCaptureStoppedRef.current) return;
    const v = form.getValues();
    const token = idToken || mobileIdToken;
    const mobile = v.mobileNumber || formData.mobileNumber;
    if (!token || !mobile) return;
    const dob = v.dateOfBirth instanceof Date && !Number.isNaN(v.dateOfBirth.getTime()) ? format(v.dateOfBirth, 'yyyy-MM-dd') : undefined;
    fetch(`${client.defaults.baseURL}/api/auth/register/verified`, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobileNumber: mobile,
        mobileIdToken: token,
        fullName: v.fullName,
        dateOfBirth: dob,
        gender: v.gender,
        seekingGender: v.seekingGender,
        placeCountry: v.placeCountry,
        placeCity: v.placeCity,
        ageFrom: v.ageFrom,
        ageTo: v.ageTo,
      }),
    }).catch(() => {});
  }, [form, formData.mobileNumber, mobileIdToken]);

  // Keep it up to date while they finish step 1 (2s after they stop typing).
  useEffect(() => {
    if (currentStep !== 1 || !mobileVerified || !mobileIdToken) return undefined;
    let timer;
    const subscription = form.watch(() => {
      clearTimeout(timer);
      timer = setTimeout(() => captureVerifiedLead(), 2000);
    });
    return () => { clearTimeout(timer); subscription.unsubscribe(); };
  }, [currentStep, mobileVerified, mobileIdToken, form, captureVerifiedLead]);

  const verifyMobileAndLoadDraft = async () => {
    const idToken = await verifyMobileOTP();
    if (idToken) {
      leadCaptureStoppedRef.current = false;
      captureVerifiedLead(idToken);
      await loadDraft(form.getValues('mobileNumber') || formData.mobileNumber, idToken);
    }
  };

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
    // Income is optional now — nothing entered means nothing to send,
    // not a parsed "NaN" range.
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
        toastSuccess('Email verified successfully.');
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

  // Saves the quick-start answers as a "started filling" lead in Supabase
  // the moment someone clears step 1 — even if they never come back. Admin
  // sees these in a read-only "Started Filling" tab and follows up manually
  // (no automated reminder email). Mirrors firebaseAdminService verification
  // the final /api/auth/register call also does, so a lead can't be faked
  // with an unverified mobile number.
  const startRegistrationLead = async (values) => {
    try {
      await client.post('/api/auth/register/start', {
        fullName: values.fullName,
        // Calendar date as picked (not toISOString()) — local midnight in IST
        // serializes to the previous day in UTC, which a Postgres `date`
        // column would then store one day early.
        dateOfBirth: format(values.dateOfBirth, 'yyyy-MM-dd'),
        gender: values.gender,
        seekingGender: values.seekingGender,
        placeCountry: values.placeCountry,
        placeCity: values.placeCity,
        mobileNumber: values.mobileNumber,
        mobileIdToken,
        ageFrom: values.ageFrom,
        ageTo: values.ageTo,
      });
      return true;
    } catch (error) {
      toastError(getFriendlyErrorMessage(error, 'We couldn’t save your details. Please try again.'));
      return false;
    }
  };

  const validateAndProceed = async () => {
    setError('');

    if (currentStep === 1) {
      const isValid = await form.trigger();
      if (!isValid) {
        toastError('Some fields are not filled in correctly. Please check and try again.');
        return;
      }

      const values = form.getValues();
      // No more "verified, still on step 1" saves once Next is pressed.
      leadCaptureStoppedRef.current = true;
      setIsLoading(true);
      const saved = await startRegistrationLead(values);
      setIsLoading(false);
      if (!saved) {
        leadCaptureStoppedRef.current = false;
        return;
      }

      const next = {
        ...formData,
        ...values,
        // Prefill the later address step's country/city from this quick
        // answer so the user isn't asked for the same thing twice.
        presentResidentialAddress: {
          ...formData.presentResidentialAddress,
          country: values.placeCountry,
          city: values.placeCity,
        },
        profilePicture: formData.profilePicture,
        galleryPhotos: formData.galleryPhotos,
        horoscope: formData.horoscope,
        idProof: formData.idProof,
      };
      setFormData(next);
      saveDraft(1, next);
      setCurrentStep(currentStep + 1);
      return;
    }

    if (currentStep === 6) {
      const isValid = await form.trigger();
      if (!isValid) {
        toastError('Some fields are not filled in correctly. Please check and try again.');
        return;
      }

      if (idProofRequired && !formData.idProof?.file) {
        toastError('Please upload an ID proof document to continue.');
        return;
      }

      // The Profile Photo / Gallery Photos sections both show a "Required"
      // badge, but nothing was actually enforcing that before this — these
      // uploads happen as separate calls after the main form submits, so an
      // unchecked click-through could (and did) reach admin approval with
      // no photos at all.
      if (!formData.profilePicture) {
        toastError('Please upload a profile photo to continue.');
        return;
      }

      if (!formData.galleryPhotos || formData.galleryPhotos.length < 1) {
        toastError('Please upload at least one gallery photo to continue.');
        return;
      }

      const values = form.getValues();
      const next = withFiles({ ...formData, ...values });
      setFormData(next);
      saveDraft(6, next);
      setCurrentStep(currentStep + 1);
      return;
    }

    if (currentStep === 7) {
      const isValid = await form.trigger();
      if (!isValid) {
        toastError('Some fields are not filled in correctly. Please check and try again.');
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
      // Safety net: never create an account without the required photos.
      if (!updatedFormData.profilePicture || !(updatedFormData.galleryPhotos || []).length) {
        toastError('Please add your profile photo and at least one gallery photo.');
        setFormData(updatedFormData);
        setCurrentStep(6);
        return;
      }
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
    const next = withFiles({ ...formData, ...values });
    setFormData(next);
    saveDraft(currentStep, next);
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
        mobileIdToken: mobileIdToken,
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
        employmentType: submissionData.employmentType || undefined,
        occupation: submissionData.occupation || undefined,
        professionalAdditionalInfo: submissionData.professionalAdditionalInfo || '',
        annualIncome: {
          currency: submissionData.annualIncomeCurrency || 'INR',
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
        partnerPreferenceDescription: submissionData.partnerPreferenceDescription || '',
        profileBanner: {
          bannerType: 'color',
          bannerColor: submissionData.profileBannerColor,
        },
      };

      const result = await register(registrationData);

      if (result.success) {
        // The account exists from here on; photos/documents upload as separate
        // calls. The store's upload actions return { success: false } rather
        // than throwing, so every result must be checked — otherwise a failed
        // photo upload silently leaves a photo-less profile in the approval queue.
        const store = useAuthStore.getState();
        const failed = [];
        const safely = async (fn) => {
          try {
            return await fn();
          } catch (error) {
            return { success: false, error: error.message };
          }
        };

        if (submissionData.profilePicture?.file) {
          const res = await safely(() => store.uploadProfilePicture(submissionData.profilePicture.file));
          if (!res?.success) failed.push('profile photo');
        }
        const newGallery = (submissionData.galleryPhotos || []).filter((photo) => photo.file && !photo.existing);
        let galleryUploaded = 0;
        for (const photo of newGallery) {
          const res = await safely(() => store.uploadPhoto(photo.file));
          if (res?.success) galleryUploaded++;
        }
        if (newGallery.length > 0 && galleryUploaded < newGallery.length) {
          failed.push(galleryUploaded === 0 ? 'gallery photos' : `${newGallery.length - galleryUploaded} gallery photo(s)`);
        }
        if (submissionData.horoscope?.file) {
          const res = await safely(() => store.uploadHoroscopeDocument(submissionData.horoscope.file));
          if (!res?.success) failed.push('horoscope document');
        }
        if (submissionData.idProof?.file) {
          const res = await safely(() => store.uploadIdProof(submissionData.idProof.file));
          if (!res?.success) failed.push('ID proof');
        }

        if (failed.length > 0) {
          // Profile page lets a pending member add the missing files (Edit Profile).
          toastError(
            `Your account was created, but your ${failed.join(', ')} didn't upload. Please add them on your profile page — your profile can't be approved without your photos.`,
            { duration: 12000 }
          );
          router.push('/profile');
        } else {
          toastSuccess('Registration successful. Logging you in...');
          router.push('/');
        }
      } else {
        // Mobile was verified back in step 1 — if the whole form took long
        // enough that the Firebase ID token's ~1hr validity lapsed before
        // this final submit, the backend rejects with this specific message.
        // Send them back to re-verify instead of leaving them stuck on a
        // generic error at the very last step, with everything else they
        // already filled in still intact (one shared formData object).
        if (/mobile.*verif.*expired|verify your mobile number again/i.test(result.error || '')) {
          toastError('Your mobile verification expired. Please verify your mobile number again.');
          setCurrentStep(1);
          resetMobileVerification();
          setIsLoading(false);
          return;
        }
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
    { label: 'Quick Start', icon: UserPlus },
    { label: 'Personal Details', icon: HeartHandshake },
    { label: 'Location Details', icon: MapPin },
    { label: 'Professional Details', icon: Briefcase },
    { label: 'Family & Additional Details', icon: Users },
    { label: 'Preferences & Media', icon: Images },
    { label: 'Account Finish', icon: Mail },
  ];
  const progressValue = (currentStep / 7) * 100;
  const CurrentStepIcon = stepTitles[currentStep - 1].icon;
  const isFinalStep = currentStep === 7;
  const submitDisabled = isLoading || (isFinalStep && !emailVerified);
  const submitLabel = isLoading
    ? 'Processing...'
    : isFinalStep && !emailVerified
      ? 'Verify Email to Continue'
      : isFinalStep
        ? 'Complete Registration'
        : 'Next';
  // For the quick-start Date of Birth picker — same pattern PersonalDetailsStep
  // uses for the same field in later editing contexts.
  const displayDate = form.watch('dateOfBirth');

  return (
    <>
      {/* 1. FIXED EDGE-TO-EDGE BACKGROUND (behind everything, including portaled dropdowns) */}
      <AuthBackground alt="SNGS Matrimonial Registration Background" />

      {/* 2. CONTENT WRAPPER (z-10) */}
      <div className="relative z-10 flex items-center justify-center min-h-screen w-full p-4 py-24">
        
        {currentStep === 1 ? (
          /* STEP 1: QUICK START CARD — the minimal commitment before deciding
             to finish the rest of the form. Name, age, place, a verified
             mobile number, and a quick preferred-partner age range; nothing
             else. Clearing this step saves a "started filling" lead to
             Supabase (see startRegistrationLead) so an admin can follow up
             even if the person never comes back. */
          <Card className="border border-white/40 shadow-[0_25px_70px_-20px_rgba(0,0,0,0.55)] bg-white/97 ring-1 ring-[#D4A843]/15 w-full max-w-2xl mx-auto rounded-[28px] overflow-hidden py-0 gap-0">
            <CardHeader className="pb-7 pt-9 px-6 sm:px-10 bg-gradient-to-br from-[#2C3E50] via-[#233240] to-[#1A2733] relative overflow-hidden">
              {/* Subtle decorative texture */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_15%_20%,#D4A843_0%,transparent_45%),radial-gradient(circle_at_85%_80%,#D4A843_0%,transparent_45%)]" />
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D4A843]/0 via-[#D4A843] to-[#D4A843]/0" />
              <div className="flex items-center justify-between mb-5 relative">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#F5E6C3] to-[#EAD5A0] text-[#2C3E50] ring-2 ring-[#D4A843]/40 ring-offset-2 ring-offset-[#2C3E50] shadow-lg shrink-0">
                    <UserPlus className="w-5 h-5" strokeWidth={1.75} />
                  </span>
                  <div ref={currentStep === 1 ? stepHeadingRef : undefined} tabIndex={-1} className="outline-none">
                    <p className="font-sans text-[11px] tracking-[0.18em] uppercase text-[#D4A843] font-semibold mb-0.5">
                      Step 1 of 7
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

            <form onSubmit={(e) => { e.preventDefault(); validateAndProceed(); }}>
            <CardContent className="px-6 sm:px-10">
              <Form {...form}>
                <div className="space-y-4 py-6">
                  <FormAlert message={error} onDismiss={() => setError('')} />

                  {/* Invisible Firebase reCAPTCHA widget required before an SMS can be
                      sent — renders nothing visible (size: 'invisible'), see useFirebasePhoneAuth. */}
                  <div id="recaptcha-container" />

                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sans text-[#1A1A1A] font-medium">Full Name *</FormLabel>
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
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sans text-[#1A1A1A] font-medium">Age (Date of Birth) *</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          <Select value={displayDate ? displayDate.getDate().toString().padStart(2, '0') : ''} onValueChange={(day) => {
                            const baseDate = displayDate || new Date(new Date().getFullYear() - 25, 0, 1);
                            const newDate = new Date(baseDate);
                            newDate.setDate(parseInt(day, 10));
                            field.onChange(newDate);
                          }}>
                            <FormControl>
                              <SelectTrigger className="font-sans h-12 rounded-xl border-[#D4A843]/25 text-[#1A1A1A] focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50">
                                <SelectValue placeholder="Day" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                <SelectItem key={day} value={day.toString().padStart(2, '0')}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select value={displayDate ? (displayDate.getMonth() + 1).toString().padStart(2, '0') : ''} onValueChange={(month) => {
                            const baseDate = displayDate || new Date(new Date().getFullYear() - 25, 0, 1);
                            const newDate = setMonth(baseDate, parseInt(month, 10) - 1);
                            field.onChange(newDate);
                          }}>
                            <FormControl>
                              <SelectTrigger className="font-sans h-12 rounded-xl border-[#D4A843]/25 text-[#1A1A1A] focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50">
                                <SelectValue placeholder="Month" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                                <SelectItem key={month} value={(idx + 1).toString().padStart(2, '0')}>
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select value={displayDate ? displayDate.getFullYear().toString() : ''} onValueChange={(year) => {
                            const baseDate = displayDate || new Date(parseInt(year, 10), 0, 1);
                            const newDate = setYear(baseDate, parseInt(year, 10));
                            field.onChange(newDate);
                          }}>
                            <FormControl>
                              <SelectTrigger className="font-sans h-12 rounded-xl border-[#D4A843]/25 text-[#1A1A1A] focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50">
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DOB_YEARS.map(year => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-sans text-[#1A1A1A] font-medium">Gender *</FormLabel>
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="font-sans h-12 rounded-xl border-[#D4A843]/25 text-[#1A1A1A] focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="seekingGender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-sans text-[#1A1A1A] font-medium">Preferred Partner Gender *</FormLabel>
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="font-sans h-12 rounded-xl border-[#D4A843]/25 text-[#1A1A1A] focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50">
                                <SelectValue placeholder="Select preference" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="placeCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-sans text-[#1A1A1A] font-medium">Country *</FormLabel>
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="font-sans h-12 rounded-xl border-[#D4A843]/25 text-[#1A1A1A] focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COUNTRIES.map(country => (
                                <SelectItem key={country} value={country}>
                                  {country}
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
                      name="placeCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-sans text-[#1A1A1A] font-medium">City *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter city"
                              className="font-sans h-12 rounded-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50"
                            />
                          </FormControl>
                          <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sans text-[#1A1A1A] font-medium">Mobile Number *</FormLabel>
                        <div className="flex gap-2.5">
                          <div className="flex flex-1">
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
                                disabled={mobileVerified}
                                className="font-sans flex-1 h-12 rounded-l-none rounded-r-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const mobileVal = e.currentTarget.value.trim();
                                    if (!mobileVerified && !mobileOtpLoading && !checkingMobile && /^[6-9]\d{9}$/.test(mobileVal)) {
                                      checkAndSendMobileOTP(mobileVal);
                                    }
                                  }
                                }}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setFormData(prev => ({ ...prev, mobileNumber: e.target.value }));
                                  if (mobileTaken) setMobileTaken(false);
                                  if (mobileVerified) {
                                    resetMobileVerification();
                                  }
                                  if (form.formState.errors.mobileNumber) form.trigger('mobileNumber');
                                }}
                              />
                            </FormControl>
                          </div>
                          {!mobileVerified && (
                            <Button
                              type="button"
                              onClick={() => checkAndSendMobileOTP(formData.mobileNumber)}
                              disabled={mobileOtpLoading || checkingMobile || !/^[6-9]\d{9}$/.test(formData.mobileNumber)}
                              className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold whitespace-nowrap h-12 px-5 rounded-xl shadow-sm"
                            >
                              {checkingMobile ? 'Checking...' : mobileOtpLoading ? 'Sending...' : 'Verify Mobile'}
                            </Button>
                          )}
                          {mobileVerified && (
                            <div className="flex items-center gap-2 px-4 h-12 bg-green-50 text-green-700 rounded-xl border border-green-200">
                              <ShieldCheck className="w-4.5 h-4.5 shrink-0" strokeWidth={1.75} />
                              <span className="font-sans font-semibold text-sm whitespace-nowrap">Verified</span>
                            </div>
                          )}
                        </div>
                        <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
                        {mobileVerified && (
                          <button
                            type="button"
                            onClick={() => {
                              // Progress from here on belongs to the new number,
                              // once it's verified (that issues a new draft token).
                              draftTokenRef.current = '';
                              resetMobileVerification();
                            }}
                            className="font-sans text-sm font-medium text-[#B8860B] hover:text-[#1A1A1A] underline underline-offset-4 mt-1"
                          >
                            Change number
                          </button>
                        )}
                        {mobileTaken && (
                          <p className="font-sans text-sm text-[#2C3E50] mt-1">
                            Already a member?{' '}
                            <a href="/login" className="font-semibold text-[#B8860B] underline underline-offset-2">Sign in with this number</a>
                          </p>
                        )}
                        {/* Required by Google's terms whenever the reCAPTCHA badge is
                            hidden via CSS (see globals.css's .grecaptcha-badge rule). */}
                        <p className="font-sans text-[11px] text-[#2C3E50]/50 mt-1">
                          This site is protected by reCAPTCHA and the Google{' '}
                          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#2C3E50]/70">
                            Privacy Policy
                          </a>{' '}
                          and{' '}
                          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#2C3E50]/70">
                            Terms of Service
                          </a>{' '}
                          apply.
                        </p>
                      </FormItem>
                    )}
                  />

                  {mobileVerificationStep === 'otp' && !mobileVerified && (
                    <div className="space-y-3 p-4 bg-[#F5E6C3]/40 rounded-xl border border-[#D4A843]/30 border-l-4 border-l-[#D4A843]">
                      <p className="font-sans text-sm text-[#2C3E50]">
                        Enter the 6-digit code sent to <strong className="text-[#1A1A1A]">+91 {formData.mobileNumber}</strong>
                      </p>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        maxLength={6}
                        value={mobileOtpValue}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setMobileOtpValue(cleaned);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (!mobileOtpLoading && mobileOtpValue.length === 6) {
                              verifyMobileAndLoadDraft();
                            }
                          }
                        }}
                        className="text-center text-2xl tracking-[0.5em] font-sans h-12 rounded-xl bg-white border-[#D4A843]/40 focus-visible:ring-[#D4A843]/40"
                      />
                      <div className="flex gap-2.5">
                        <Button
                          type="button"
                          onClick={verifyMobileAndLoadDraft}
                          disabled={mobileOtpLoading || !mobileOtpValue || mobileOtpValue.length !== 6}
                          className="flex-1 bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold h-11 rounded-xl shadow-sm"
                        >
                          {mobileOtpLoading ? 'Verifying...' : 'Verify OTP'}
                        </Button>
                        <Button
                          type="button"
                          onClick={resendMobileOTP}
                          disabled={mobileResendTimer > 0}
                          variant="outline"
                          className="font-sans h-11 rounded-xl border-[#D4A843]/40 text-[#2C3E50] hover:bg-[#F5E6C3]/30"
                        >
                          {mobileResendTimer > 0 ? `Resend (${mobileResendTimer}s)` : 'Resend OTP'}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="font-sans text-sm font-medium text-[#1A1A1A]">Preferred Partner Age Range *</p>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="ageFrom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-sans text-xs text-[#2C3E50]/70">From</FormLabel>
                            <Select value={field.value || ''} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="font-sans h-12 rounded-xl border-[#D4A843]/25 text-[#1A1A1A] focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50">
                                  <SelectValue placeholder="Min age" />
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
                            <FormLabel className="font-sans text-xs text-[#2C3E50]/70">To</FormLabel>
                            <Select value={field.value || ''} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="font-sans h-12 rounded-xl border-[#D4A843]/25 text-[#1A1A1A] focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50">
                                  <SelectValue placeholder="Max age" />
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
                  </div>
                </div>
              </Form>
            </CardContent>

            <div className="flex gap-3 px-6 sm:px-10 py-6 border-t border-[#D4A843]/15 bg-gradient-to-b from-[#F5E6C3]/30 to-[#F5E6C3]/10">
              <Button
                type="button"
                variant="outline"
                className="flex-1 font-sans h-12 rounded-xl border-[#D4A843]/30 text-[#2C3E50] font-medium hover:bg-[#F5E6C3]/40 hover:border-[#D4A843]/50 transition-all duration-200"
                onClick={() => router.push('/login')}
              >
                Back to Login
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !mobileVerified}
                className="flex-1 bg-gradient-to-r from-[#D4A843] to-[#C99A3A] hover:from-[#C99A3A] hover:to-[#B8860B] text-[#1A1A1A] font-sans font-semibold h-12 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-200"
              >
                {!mobileVerified
                  ? 'Verify Mobile to Continue'
                  : isLoading ? 'Saving...' : 'Next'}
                {!isLoading && mobileVerified && <ChevronRight className="ml-2 w-4 h-4" />}
              </Button>
            </div>
            </form>
          </Card>
        ) : (
          
          /* STEPS 2 TO 7: DETAILS CARDS */
          <Card className="border border-white/40 shadow-[0_25px_70px_-20px_rgba(0,0,0,0.55)] bg-white/97 ring-1 ring-[#D4A843]/15 w-full max-w-2xl mx-auto rounded-[28px] overflow-hidden py-0 gap-0">
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
                  <div ref={currentStep === 1 ? undefined : stepHeadingRef} tabIndex={-1} className="outline-none">
                    <p className="font-sans text-[11px] tracking-[0.18em] uppercase text-[#D4A843] font-semibold mb-0.5">
                      Step {currentStep} of 7
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
            <CardContent className="px-6 sm:px-10">
              <Form {...form}>
                <div className="space-y-6 py-8">
                  <FormAlert message={error} onDismiss={() => setError('')} />

                  {currentStep === 2 && <PersonalDetailsStep form={form} horoscope={formData.horoscope} onFileUpdate={handleFileUpdate} hideDateOfBirth hideGender />}
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
                      hidePreferredAgeRange
                    />
                  )}
                  {currentStep === 7 && (
                    <>
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
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (!otpLoading && otpValue.length === 6) {
                                  verifyOTP();
                                }
                              }
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
                            <FormLabel className="font-sans text-[#1A1A1A] font-medium">Password *</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  {...field}
                                  {...noPasteHandlers}
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
                            <FormLabel className="font-sans text-[#1A1A1A] font-medium">Confirm Password *</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  {...field}
                                  {...noPasteHandlers}
                                  type={showConfirmPassword ? 'text' : 'password'}
                                  autoComplete="new-password"
                                  placeholder="Re-enter your password"
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
                    </>
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
                type="submit"
                disabled={submitDisabled}
                className="flex-1 bg-gradient-to-r from-[#D4A843] to-[#C99A3A] hover:from-[#C99A3A] hover:to-[#B8860B] text-[#1A1A1A] font-sans font-semibold h-12 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-200"
              >
                {submitLabel}
                {!isLoading && !isFinalStep && <ChevronRight className="ml-2 w-4 h-4" />}
              </Button>
            </div>
            </form>
          </Card>
        )}
      </div>

      {/* A choice is required: closing without one would let the next save
          overwrite saved steps while the step count stays. */}
      <AlertDialog open={!!resumeOffer}>
        <AlertDialogContent className="font-sans" onEscapeKeyDown={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl text-[#1A1A1A]">
              Welcome back{resumeOffer?.data?.fullName ? `, ${resumeOffer.data.fullName.split(' ')[0]}` : ''}!
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-[15px] leading-relaxed text-[#2C3E50]">
                <p>
                  You have already completed <strong className="text-[#1A1A1A]">{resumeOffer?.completedSteps} of 7 steps</strong>
                  {resumeOffer?.updatedAt ? ` (last saved ${new Date(resumeOffer.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})` : ''}.
                  Would you like to continue with your saved details or start fresh?
                </p>
                <Progress value={((resumeOffer?.completedSteps || 0) / 7) * 100} className="h-2" />
                <p className="text-sm text-[#2C3E50]/70">
                  For your privacy, photos and documents are not saved until you finish, so you will add those again.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={startFresh}
              disabled={resumeBusy}
              className="h-11 border-2 border-[#D4A843] text-[#1A1A1A] hover:bg-[#F5E6C3]/40"
            >
              {resumeBusy ? 'Clearing...' : 'Start fresh'}
            </Button>
            <Button
              type="button"
              onClick={continueFromDraft}
              disabled={resumeBusy}
              className="h-11 bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-semibold"
            >
              Continue where I left off
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}