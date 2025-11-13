'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/authStore';
import { MediaUpload } from '@/components/auth/MediaUpload';
import { toastSuccess, toastError } from '@/lib/toast';
import { Check, X } from 'lucide-react';

const step1Schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const step2Schema = z.object({
  gender: z.string().min(1, 'Please select your gender'),
  seekingGender: z.string().min(1, 'Please select who you are seeking'),
  ageFrom: z.string().min(1, 'Please select minimum age'),
  ageTo: z.string().min(1, 'Please select maximum age'),
});

const step3Schema = z.object({
  about: z.string().min(10, 'Please tell us more about yourself (min 10 characters)'),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  hobbies: z.string().min(10, 'Please describe your hobbies (min 10 characters)'),
});

const step4Schema = z.object({
  // Step 4 has no form fields to validate since media is handled separately in formData
}).strict();

// Validation helper functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePassword = (password) => ({
  hasMinLength: password.length >= 8,
  hasUppercase: /[A-Z]/.test(password),
  hasLowercase: /[a-z]/.test(password),
  hasNumber: /\d/.test(password),
  isValid: password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password),
});

const validateMinLength = (text, minLength) => text.trim().length >= minLength;

const ValidationCheck = ({ isValid, label }) => (
  <div className={`text-xs flex items-center gap-1 ${isValid ? 'text-success' : 'text-secondary/60'}`}>
    {isValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
    <span>{label}</span>
  </div>
);

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

const getRandomColor = () => {
  return PROFILE_BANNER_COLORS[Math.floor(Math.random() * PROFILE_BANNER_COLORS.length)].value;
};

export default function RegisterPage() {
  const router = useRouter();
  const { register, uploadProfilePicture, uploadProfileBanner, setProfileBannerColor } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    gender: '', seekingGender: '', ageFrom: '', ageTo: '',
    about: '', interests: [], hobbies: '',
    profilePicture: null,
    profileBannerType: 'color',
    profileBannerColor: getRandomColor(),
    profileBannerImage: null,
    photos: [], videos: [],
  });

  const getSchemaForStep = (step) => {
    switch (step) {
      case 1: return step1Schema;
      case 2: return step2Schema;
      case 3: return step3Schema;
      case 4: return step4Schema;
      default: return step1Schema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchemaForStep(currentStep)),
    defaultValues: formData,
  });

  // Watch form fields for real-time validation
  const watchFullName = useWatch({ control: form.control, name: 'fullName' });
  const watchEmail = useWatch({ control: form.control, name: 'email' });
  const watchPassword = useWatch({ control: form.control, name: 'password' });
  const watchConfirmPassword = useWatch({ control: form.control, name: 'confirmPassword' });
  const watchAbout = useWatch({ control: form.control, name: 'about' });
  const watchHobbies = useWatch({ control: form.control, name: 'hobbies' });
  const watchInterests = useWatch({ control: form.control, name: 'interests' });

  const validateAndProceed = async () => {
    console.log('validateAndProceed called - currentStep:', currentStep);
    setError('');

    // For step 4, skip form validation since media is handled separately
    if (currentStep === 4) {
      console.log('Step 4 - skipping form validation, going straight to submission');
      await submitRegistration();
      return;
    }

    // Validate current step for steps 1-3
    const isValid = await form.trigger();
    console.log('Form validation result:', isValid);
    console.log('Form errors:', form.formState.errors);

    if (!isValid) {
      const errors = form.formState.errors;
      console.log('Form validation failed with errors:', errors);

      // Build user-friendly error messages
      const errorMessages = [];
      Object.entries(errors).forEach(([field, error]) => {
        if (error?.message) {
          errorMessages.push(error.message);
        }
      });

      const msg = errorMessages.length > 0
        ? errorMessages.join('\n')
        : `Please fill in all required fields correctly`;

      console.error('Validation errors:', msg);
      setError(msg);
      toastError(msg);
      return;
    }

    // Get current form values
    const values = form.getValues();
    console.log('Form values:', values);
    setFormData(prev => ({ ...prev, ...values }));

    console.log('Moving to next step:', currentStep + 1);
    setCurrentStep(currentStep + 1);
  };

  const submitRegistration = async () => {
    console.log('submitRegistration called');
    console.log('formData:', formData);
    setIsLoading(true);
    setError('');

    // Validate required media fields with detailed logging
    console.log('Checking profile picture:', {
      exists: !!formData.profilePicture,
      hasFile: !!formData.profilePicture?.file,
      preview: formData.profilePicture?.preview
    });

    if (!formData.profilePicture || !formData.profilePicture.file) {
      const msg = '📷 Please upload a profile picture to continue';
      console.error('Profile picture validation failed:', msg);
      setError(msg);
      toastError(msg);
      setIsLoading(false);
      return;
    }

    console.log('Checking banner:', {
      type: formData.profileBannerType,
      hasImage: !!formData.profileBannerImage?.file,
      hasColor: !!formData.profileBannerColor
    });

    if (formData.profileBannerType === 'image' && (!formData.profileBannerImage || !formData.profileBannerImage.file)) {
      const msg = '🎨 Please upload a profile banner image';
      console.error('Banner validation failed:', msg);
      setError(msg);
      toastError(msg);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Starting user registration...');
      const completeData = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        gender: formData.gender,
        seekingGender: formData.seekingGender,
        ageFrom: parseInt(formData.ageFrom),
        ageTo: parseInt(formData.ageTo),
        about: formData.about,
        interests: formData.interests,
        hobbies: formData.hobbies,
      };

      console.log('=== REGISTRATION REQUEST ===');
      console.log('Full payload being sent:', JSON.stringify(completeData, null, 2));
      console.log('Calling register with data:', completeData);

      const result = await register(completeData);

      console.log('=== REGISTRATION RESPONSE ===');
      console.log('Register result:', result);

      if (!result.success) {
        const msg = result.error || 'Registration failed. Please try again.';
        console.error('❌ Registration API error:', msg);

        // Format error message for better readability
        const formattedError = msg.includes('\n')
          ? msg
          : `❌ Registration Error:\n${msg}`;

        setError(formattedError);
        toastError(formattedError);
        setIsLoading(false);
        return;
      }

      console.log('✅ Registration successful');

      console.log('User registration successful, uploading media...');

      // Upload profile picture (mandatory)
      if (formData.profilePicture?.file) {
        console.log('Uploading profile picture...');
        const uploadResult = await uploadProfilePicture(formData.profilePicture.file);
        console.log('Profile picture upload result:', uploadResult);

        if (!uploadResult.success) {
          const msg = `📷 Failed to upload profile picture: ${uploadResult.error}`;
          console.error(msg);
          setError(msg);
          toastError(msg);
          setIsLoading(false);
          return;
        }
      }

      // Upload or set profile banner
      if (formData.profileBannerType === 'image' && formData.profileBannerImage?.file) {
        console.log('Uploading profile banner image...');
        const uploadResult = await uploadProfileBanner(formData.profileBannerImage.file);
        console.log('Profile banner upload result:', uploadResult);

        if (!uploadResult.success) {
          const msg = `🎨 Failed to upload profile banner: ${uploadResult.error}`;
          console.error(msg);
          setError(msg);
          toastError(msg);
          setIsLoading(false);
          return;
        }
      } else if (formData.profileBannerType === 'color' && formData.profileBannerColor) {
        console.log('Setting profile banner color:', formData.profileBannerColor);
        const colorResult = await setProfileBannerColor(formData.profileBannerColor);
        console.log('Profile banner color result:', colorResult);

        if (!colorResult.success) {
          const msg = `🎨 Failed to set profile banner color: ${colorResult.error}`;
          console.error(msg);
          setError(msg);
          toastError(msg);
          setIsLoading(false);
          return;
        }
      }

      console.log('All uploads successful!');
      toastSuccess('✅ Sign up completed successfully!');

      // Redirect to complete profile if there are gallery items, otherwise to home
      setTimeout(() => {
        if (formData.photos.length > 0 || formData.videos.length > 0) {
          router.push('/complete-profile');
        } else {
          router.push('/');
        }
      }, 1000);
    } catch (err) {
      const msg = `❌ An unexpected error occurred: ${err.message || 'Please try again.'}`;
      console.error('Unexpected error:', err);
      setError(msg);
      toastError(msg);
      setIsLoading(false);
    }
  };

  const handleProfilePictureChange = useCallback((files) => {
    if (files.length > 0) {
      const file = files[0];
      const preview = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, profilePicture: { file, preview } }));
    }
  }, []);

  const handleProfileBannerImageChange = useCallback((files) => {
    if (files.length > 0) {
      const file = files[0];
      const preview = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        profileBannerType: 'image',
        profileBannerImage: { file, preview }
      }));
    }
  }, []);

  const handlePhotoChange = useCallback((files) => {
    const newPhotos = Array.from(files).map(file => ({ file, preview: URL.createObjectURL(file) }));
    setFormData(prev => ({ ...prev, photos: [...prev.photos, ...newPhotos].slice(0, 10) }));
  }, []);

  const handleVideoChange = useCallback((files) => {
    const newVideos = Array.from(files).map(file => ({ file, preview: URL.createObjectURL(file) }));
    setFormData(prev => ({ ...prev, videos: [...prev.videos, ...newVideos].slice(0, 2) }));
  }, []);

  const stepTitles = ['💕 Create Your Account', '❤️ Tell Us Your Preferences', '✨ About You', '📸 Share Your Media'];
  const progressValue = (currentStep / 4) * 100;

  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardHeader className="space-y-4 pb-6 border-b border-gray-100">
        <CardTitle className="font-viga text-3xl text-center text-primary">{stepTitles[currentStep - 1]}</CardTitle>
        <Progress value={progressValue} className="mt-2 h-2" />
        <div className="font-telex text-center text-sm text-secondary/70 font-medium">
          Step <span className="text-primary font-bold">{currentStep}</span> of <span className="text-primary font-bold">4</span>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <div className="space-y-5">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm font-medium whitespace-pre-wrap">
                {error}
              </div>
            )}

            {currentStep === 1 && (
              <>
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="font-telex text-secondary font-semibold">Full Name</FormLabel>
                      {watchFullName && watchFullName.trim().length >= 2 && (
                        <Check className="w-4 h-4 text-success" />
                      )}
                    </div>
                    <FormControl>
                      <Input placeholder="John Doe" className="border-2 border-gray-200 focus:border-primary focus:ring-primary" {...field} />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="font-telex text-secondary font-semibold">Email</FormLabel>
                      {watchEmail && validateEmail(watchEmail) && (
                        <Check className="w-4 h-4 text-success" />
                      )}
                    </div>
                    <FormControl>
                      <Input placeholder="you@example.com" type="email" className="border-2 border-gray-200 focus:border-primary focus:ring-primary" {...field} />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => {
                  const passwordValidation = validatePassword(watchPassword || '');
                  return (
                    <FormItem>
                      <FormLabel className="font-telex text-secondary font-semibold">Password</FormLabel>
                      <FormControl>
                        <Input placeholder="••••••••" type="password" className="border-2 border-gray-200 focus:border-primary focus:ring-primary" {...field} />
                      </FormControl>
                      {watchPassword && (
                        <div className="mt-3 p-3 bg-secondary/5 rounded-lg space-y-1.5">
                          <ValidationCheck isValid={passwordValidation.hasMinLength} label="At least 8 characters" />
                          <ValidationCheck isValid={passwordValidation.hasUppercase} label="One uppercase letter (A-Z)" />
                          <ValidationCheck isValid={passwordValidation.hasLowercase} label="One lowercase letter (a-z)" />
                          <ValidationCheck isValid={passwordValidation.hasNumber} label="One number (0-9)" />
                        </div>
                      )}
                      <FormMessage className="text-destructive" />
                    </FormItem>
                  );
                }} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="font-telex text-secondary font-semibold">Confirm Password</FormLabel>
                      {watchConfirmPassword && watchPassword && watchConfirmPassword === watchPassword && (
                        <Check className="w-4 h-4 text-success" />
                      )}
                    </div>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" className="border-2 border-gray-200 focus:border-primary focus:ring-primary" {...field} />
                    </FormControl>
                    {watchConfirmPassword && watchPassword && watchConfirmPassword !== watchPassword && (
                      <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                    )}
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )} />
              </>
            )}

            {currentStep === 2 && (
              <>
                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-telex text-secondary font-semibold">I am</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-2 border-gray-200 focus:border-primary focus:ring-primary">
                          <SelectValue placeholder="Select your gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Man</SelectItem>
                        <SelectItem value="female">Woman</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="seekingGender" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-telex text-secondary font-semibold">Seeking a</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-2 border-gray-200 focus:border-primary focus:ring-primary">
                          <SelectValue placeholder="Select who you are seeking" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Man</SelectItem>
                        <SelectItem value="female">Woman</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="ageFrom" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-telex text-secondary font-semibold">Age From</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-2 border-gray-200 focus:border-primary focus:ring-primary">
                            <SelectValue placeholder="18" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 73 }, (_, i) => 18 + i).map(age => (
                            <SelectItem key={age} value={age.toString()}>{age}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-destructive" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="ageTo" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-telex text-secondary font-semibold">Age To</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-2 border-gray-200 focus:border-primary focus:ring-primary">
                            <SelectValue placeholder="90" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 73 }, (_, i) => 18 + i).map(age => (
                            <SelectItem key={age} value={age.toString()}>{age}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-destructive" />
                    </FormItem>
                  )} />
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <FormField control={form.control} name="about" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="font-telex text-secondary font-semibold">About Me</FormLabel>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-maven ${watchAbout && watchAbout.trim().length >= 10 ? 'text-success' : 'text-secondary/60'}`}>
                          {watchAbout?.length || 0}/10 min
                        </span>
                        {watchAbout && watchAbout.trim().length >= 10 && (
                          <Check className="w-4 h-4 text-success" />
                        )}
                      </div>
                    </div>
                    <FormControl>
                      <Textarea placeholder="Tell us something about yourself..." className="resize-none border-2 border-gray-200 focus:border-primary focus:ring-primary" rows={4} {...field} />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="interests" render={() => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="font-telex text-secondary font-semibold">My Interests</FormLabel>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-maven ${watchInterests && watchInterests.length >= 1 ? 'text-success' : 'text-secondary/60'}`}>
                          {watchInterests?.length || 0} selected
                        </span>
                        {watchInterests && watchInterests.length >= 1 && (
                          <Check className="w-4 h-4 text-success" />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {INTERESTS.map(interest => (
                        <FormField key={interest} control={form.control} name="interests" render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox checked={field.value?.includes(interest)} onCheckedChange={checked => checked ? field.onChange([...(field.value || []), interest]) : field.onChange(field.value?.filter(value => value !== interest))} />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer text-secondary">{interest}</FormLabel>
                          </FormItem>
                        )} />
                      ))}
                    </div>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="hobbies" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="font-telex text-secondary font-semibold">My Hobbies</FormLabel>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-maven ${watchHobbies && watchHobbies.trim().length >= 10 ? 'text-success' : 'text-secondary/60'}`}>
                          {watchHobbies?.length || 0}/10 min
                        </span>
                        {watchHobbies && watchHobbies.trim().length >= 10 && (
                          <Check className="w-4 h-4 text-success" />
                        )}
                      </div>
                    </div>
                    <FormControl>
                      <Textarea placeholder="What are your hobbies?" className="resize-none border-2 border-gray-200 focus:border-primary focus:ring-primary" rows={4} {...field} />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )} />
              </>
            )}

            {currentStep === 4 && (
              <>
                {/* Profile Picture - Mandatory */}
                <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 bg-primary/5">
                  <FormItem>
                    <FormLabel className="font-telex text-secondary font-semibold flex items-center gap-2">
                      📷 Profile Picture <span className="text-destructive">*</span>
                    </FormLabel>
                    <p className="text-xs text-secondary/60 mb-3 font-maven">This is mandatory and will be displayed on your profile</p>
                    {formData.profilePicture ? (
                      <div className="relative w-24 h-24 mx-auto">
                        <img src={formData.profilePicture.preview} alt="Profile" className="w-full h-full object-cover rounded-lg border-2 border-primary" />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, profilePicture: null }))}
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-destructive/90 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <MediaUpload type="photo" maxFiles={1} currentCount={0} onFilesSelected={handleProfilePictureChange} files={[]} />
                    )}
                  </FormItem>
                </div>

                {/* Profile Banner */}
                <div className="border-2 border-dashed border-secondary/30 rounded-lg p-4 bg-secondary/5">
                  <FormItem>
                    <FormLabel className="font-telex text-secondary font-semibold">🎨 Profile Banner</FormLabel>
                    <p className="text-xs text-secondary/60 mb-3 font-maven">Choose a color or upload an image (landscape format recommended)</p>

                    {/* Banner Type Selector */}
                    <div className="flex gap-3 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="bannerType"
                          value="color"
                          checked={formData.profileBannerType === 'color'}
                          onChange={(e) => setFormData(prev => ({ ...prev, profileBannerType: e.target.value }))}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-maven text-secondary">Color</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="bannerType"
                          value="image"
                          checked={formData.profileBannerType === 'image'}
                          onChange={(e) => setFormData(prev => ({ ...prev, profileBannerType: e.target.value }))}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-maven text-secondary">Image</span>
                      </label>
                    </div>

                    {/* Color Selector */}
                    {formData.profileBannerType === 'color' && (
                      <div className="grid grid-cols-5 gap-2">
                        {PROFILE_BANNER_COLORS.map(color => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, profileBannerColor: color.value }))}
                            className={`h-12 rounded-lg border-2 transition-all hover:scale-105 ${formData.profileBannerColor === color.value ? 'border-black border-4' : 'border-gray-300'}`}
                            style={{ backgroundColor: color.value }}
                            title={color.label}
                          />
                        ))}
                      </div>
                    )}

                    {/* Image Uploader */}
                    {formData.profileBannerType === 'image' && (
                      <>
                        {formData.profileBannerImage ? (
                          <div className="relative">
                            <img src={formData.profileBannerImage.preview} alt="Banner" className="w-full h-32 object-cover rounded-lg border-2 border-secondary" />
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, profileBannerImage: null }))}
                              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-destructive/90 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <MediaUpload type="photo" maxFiles={1} currentCount={0} onFilesSelected={handleProfileBannerImageChange} files={[]} />
                        )}
                      </>
                    )}
                  </FormItem>
                </div>

                {/* Gallery Photos - Optional */}
                <FormItem>
                  <FormLabel className="font-telex text-secondary font-semibold">📸 My Photos ({formData.photos.length}/10)</FormLabel>
                  <p className="text-xs text-secondary/60 mb-2 font-maven">Optional - Add more photos to your gallery</p>
                  <MediaUpload type="photo" maxFiles={10} currentCount={formData.photos.length} onFilesSelected={handlePhotoChange} files={formData.photos} onRemove={(i) => setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, idx) => idx !== i) }))} />
                </FormItem>

                {/* Gallery Videos - Optional */}
                <FormItem>
                  <FormLabel className="font-telex text-secondary font-semibold">🎬 My Videos ({formData.videos.length}/2)</FormLabel>
                  <p className="text-xs text-secondary/60 mb-2 font-maven">Optional - Add videos to your gallery</p>
                  <MediaUpload type="video" maxFiles={2} maxDuration={120} currentCount={formData.videos.length} onFilesSelected={handleVideoChange} files={formData.videos} onRemove={(i) => setFormData(prev => ({ ...prev, videos: prev.videos.filter((_, idx) => idx !== i) }))} />
                </FormItem>
              </>
            )}

            <div className="flex gap-4 pt-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="font-telex flex-1 bg-white border-2 border-secondary text-secondary hover:bg-secondary/5 h-12 text-base font-semibold transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              )}
              <Button
                type="button"
                onClick={validateAndProceed}
                className="font-telex flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {currentStep === 4 ? (isLoading ? 'Creating account...' : 'Complete Registration') : (<>Next<ChevronRight className="w-4 h-4 ml-2" /></>)}
              </Button>
            </div>
          </div>
        </Form>

        <div className="font-maven mt-6 pt-6 border-t border-gray-200 text-center text-sm">
          <span className="text-secondary/70">Already have an account? </span>
          <Link href="/login" className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
