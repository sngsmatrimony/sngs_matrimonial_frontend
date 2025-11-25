'use client';

import { useState, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, setMonth, setYear } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { MediaUpload } from '@/components/auth/MediaUpload';
import { toastSuccess, toastError } from '@/lib/toast';
import { Check, X } from 'lucide-react';
import { client } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useLandingStore } from '@/store/landingStore';
import Image from 'next/image';

const step1Schema = z.object({
  dateOfBirth: z.date({ message: 'Please select your date of birth' }),
  caste: z.string().optional().transform(val => val?.trim() || ''),
  religion: z.string().optional().transform(val => val?.trim() || ''),
  isDivorcee: z.boolean().optional(),
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
  // Step 4 has no form fields to validate since media is handled separately
}).strict();

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

const ValidationCheck = ({ isValid, label }) => (
  <div className={`text-xs flex items-center gap-1 ${isValid ? 'text-success' : 'text-secondary/60'}`}>
    {isValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
    <span>{label}</span>
  </div>
);

export default function EditProfileForm({ userProfile, user, onCancel, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1); // Start from step 1 (personal details)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { uploadProfilePicture, uploadProfileBanner, setProfileBannerColor } = useAuthStore();
  const { setUserProfile } = useLandingStore();

  const [formData, setFormData] = useState({
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth) : null,
    caste: user?.caste || '',
    religion: user?.religion || '',
    isDivorcee: user?.isDivorcee || false,
    gender: user?.gender || '',
    seekingGender: user?.seekingGender || '',
    ageFrom: user?.ageFrom?.toString() || '',
    ageTo: user?.ageTo?.toString() || '',
    about: user?.about || '',
    interests: user?.interests || [],
    hobbies: user?.hobbies || '',
    profilePicture: null,
    hasExistingProfilePicture: !!userProfile?.profilePicture?.url,
    profileBannerType: userProfile?.profileBanner?.type || 'color',
    profileBannerColor: userProfile?.profileBanner?.color || '#FFE100',
    profileBannerImage: null,
    hasExistingProfileBanner: !!userProfile?.profileBanner?.image?.url,
    existingPhotos: userProfile?.gallery?.photos || [],
    newPhotos: [],
    existingVideos: userProfile?.gallery?.videos || [],
    newVideos: [],
    deletedPhotoIndices: [],
    deletedVideoIndices: [],
  });
  const [originalPhotos] = useState(userProfile?.gallery?.photos || []);
  const [originalVideos] = useState(userProfile?.gallery?.videos || []);

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
    defaultValues: {
      dateOfBirth: formData.dateOfBirth,
      caste: formData.caste,
      religion: formData.religion,
      isDivorcee: formData.isDivorcee,
      gender: formData.gender,
      seekingGender: formData.seekingGender,
      ageFrom: formData.ageFrom,
      ageTo: formData.ageTo,
      about: formData.about,
      interests: formData.interests,
      hobbies: formData.hobbies,
    },
  });

  const watchAbout = useWatch({ control: form.control, name: 'about' });
  const watchHobbies = useWatch({ control: form.control, name: 'hobbies' });
  const watchInterests = useWatch({ control: form.control, name: 'interests' });

  const validateAndProceed = async () => {
    setError('');

    if (currentStep === 4) {
      await submitUpdate();
      return;
    }

    const isValid = await form.trigger();

    if (!isValid) {
      const errors = form.formState.errors;
      const errorMessages = [];
      Object.entries(errors).forEach(([field, error]) => {
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

  const submitUpdate = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Update basic profile information
      const updateData = {
        dateOfBirth: formData.dateOfBirth,
        caste: formData.caste,
        religion: formData.religion,
        isDivorcee: formData.isDivorcee,
        gender: formData.gender,
        seekingGender: formData.seekingGender,
        ageFrom: parseInt(formData.ageFrom),
        ageTo: parseInt(formData.ageTo),
        about: formData.about,
        interests: formData.interests,
        hobbies: formData.hobbies,
      };

      const response = await client.put('/api/profiles/update', updateData);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update profile');
      }

      // Handle profile picture upload if provided
      if (formData.profilePicture?.file) {
        const uploadResult = await uploadProfilePicture(formData.profilePicture.file);
        if (!uploadResult.success) {
          throw new Error(`Failed to upload profile picture: ${uploadResult.error}`);
        }
      }

      // Handle banner upload/color
      if (formData.profileBannerType === 'image' && formData.profileBannerImage?.file) {
        const uploadResult = await uploadProfileBanner(formData.profileBannerImage.file);
        if (!uploadResult.success) {
          throw new Error(`Failed to upload profile banner: ${uploadResult.error}`);
        }
      } else if (formData.profileBannerType === 'color' && formData.profileBannerColor) {
        const colorResult = await setProfileBannerColor(formData.profileBannerColor);
        if (!colorResult.success) {
          throw new Error(`Failed to set profile banner color: ${colorResult.error}`);
        }
      }

      // Delete photos if any were removed
      if (formData.deletedPhotoIndices.length > 0) {
        for (const photoIndex of formData.deletedPhotoIndices) {
          const deleteResult = await client.delete(`/api/auth/photo/${photoIndex}`);
          if (!deleteResult.data.success) {
            throw new Error(`Failed to delete photo: ${deleteResult.data.error}`);
          }
        }
      }

      // Delete videos if any were removed
      if (formData.deletedVideoIndices.length > 0) {
        for (const videoIndex of formData.deletedVideoIndices) {
          const deleteResult = await client.delete(`/api/auth/video/${videoIndex}`);
          if (!deleteResult.data.success) {
            throw new Error(`Failed to delete video: ${deleteResult.data.error}`);
          }
        }
      }

      // Upload new photos if any
      if (formData.newPhotos.length > 0) {
        for (const photo of formData.newPhotos) {
          const photoFormData = new FormData();
          photoFormData.append('photo', photo.file);
          const uploadResult = await client.post('/api/auth/upload-photo',
            photoFormData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
          if (!uploadResult.data.success) {
            throw new Error(`Failed to upload photo: ${uploadResult.data.error}`);
          }
        }
      }

      // Upload new videos if any
      if (formData.newVideos.length > 0) {
        for (const video of formData.newVideos) {
          const videoFormData = new FormData();
          videoFormData.append('video', video.file);
          const uploadResult = await client.post('/api/auth/upload-video',
            videoFormData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
          if (!uploadResult.data.success) {
            throw new Error(`Failed to upload video: ${uploadResult.data.error}`);
          }
        }
      }

      // Fetch updated profile
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
    setFormData(prev => ({
      ...prev,
      newPhotos: [...prev.newPhotos, ...newPhotos].slice(0, 10 - prev.existingPhotos.length)
    }));
  }, []);

  const handleVideoChange = useCallback((files) => {
    const newVideos = Array.from(files).map(file => ({ file, preview: URL.createObjectURL(file) }));
    setFormData(prev => ({
      ...prev,
      newVideos: [...prev.newVideos, ...newVideos].slice(0, 2 - prev.existingVideos.length)
    }));
  }, []);

  const stepTitles = ['💑 Personal Details', '❤️ Tell Us Your Preferences', '✨ About You', '📸 Update Your Media'];
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
                <FormField control={form.control} name="dateOfBirth" render={({ field }) => {
                  const [displayDate, setDisplayDate] = useState(field.value || new Date(2000, 0, 1));
                  const today = new Date();
                  const minYear = today.getFullYear() - 90;
                  const maxYear = today.getFullYear() - 18;

                  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
                  const days = Array.from({ length: daysInMonth(displayDate.getFullYear(), displayDate.getMonth()) }, (_, i) => i + 1);

                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-telex text-secondary font-semibold">Date of Birth</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full border-2 justify-start text-left font-normal h-11 ${!field.value ? 'text-gray-500' : ''} focus:ring-primary`}
                          >
                            📅 {field.value ? format(field.value, 'MMM dd, yyyy') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4 z-50 border-2 border-gray-200 shadow-xl bg-white" align="start">
                          <div className="space-y-4 w-80">
                            {/* Year and Month Selectors */}
                            <div className="grid grid-cols-2 gap-3">
                              <Select value={displayDate.getFullYear().toString()} onValueChange={(year) => setDisplayDate(setYear(displayDate, parseInt(year)))}>
                                <SelectTrigger className="border-2 border-gray-200">
                                  <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i).reverse().map(year => (
                                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select value={displayDate.getMonth().toString()} onValueChange={(month) => setDisplayDate(setMonth(displayDate, parseInt(month)))}>
                                <SelectTrigger className="border-2 border-gray-200">
                                  <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                  {monthNames.map((name, idx) => (
                                    <SelectItem key={idx} value={idx.toString()}>{name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Calendar Days Grid */}
                            <div className="border-t pt-3">
                              <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                  <div key={day} className="text-center text-xs font-semibold text-secondary/70">
                                    {day}
                                  </div>
                                ))}
                              </div>
                              <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).getDay() }).map((_, i) => (
                                  <div key={`empty-${i}`} />
                                ))}
                                {days.map(day => {
                                  const date = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
                                  const isSelected = field.value && format(field.value, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                                  const isDisabled = date > new Date(maxYear, today.getMonth(), today.getDate()) || date < new Date(minYear, 0, 1);

                                  return (
                                    <button
                                      key={day}
                                      type="button"
                                      onClick={() => {
                                        if (!isDisabled) {
                                          field.onChange(date);
                                        }
                                      }}
                                      disabled={isDisabled}
                                      className={`p-2 text-sm rounded transition-colors ${
                                        isSelected
                                          ? 'bg-primary text-secondary font-semibold'
                                          : isDisabled
                                          ? 'text-gray-300 cursor-not-allowed'
                                          : 'hover:bg-primary/20 text-secondary'
                                      }`}
                                    >
                                      {day}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      {field.value && (
                        <div className="text-xs text-secondary/70 mt-2 font-maven">
                          Age: {Math.floor((new Date() - field.value) / (365.25 * 24 * 60 * 60 * 1000))} years old
                        </div>
                      )}
                      <FormMessage className="text-destructive" />
                    </FormItem>
                  );
                }} />

                <FormField control={form.control} name="caste" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-telex text-secondary font-semibold">Caste (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your caste" className="border-2 border-gray-200 focus:border-primary focus:ring-primary" {...field} />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="religion" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-telex text-secondary font-semibold">Religion (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your religion" className="border-2 border-gray-200 focus:border-primary focus:ring-primary" {...field} />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="isDivorcee" render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer text-secondary">I am a divorcee</FormLabel>
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
                {/* Profile Picture */}
                <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 bg-primary/5">
                  <FormItem>
                    <FormLabel className="font-telex text-secondary font-semibold flex items-center gap-2">
                      📷 Profile Picture
                    </FormLabel>
                    <p className="text-xs text-secondary/60 mb-3 font-maven">View and update your profile picture (optional)</p>

                    {/* Current Profile Picture */}
                    {formData.hasExistingProfilePicture && !formData.profilePicture && (
                      <div className="mb-4">
                        <p className="text-xs font-maven text-secondary mb-2">Current Profile Picture</p>
                        <div className="relative w-32 h-32 mx-auto">
                          <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-gray-200">
                            <Image
                              src={userProfile?.profilePicture?.url}
                              alt="Current Profile"
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-secondary/60 text-center mt-2">Click &quot;Replace&quot; below to change</p>
                      </div>
                    )}

                    {/* New Profile Picture Preview */}
                    {formData.profilePicture ? (
                      <div className="relative w-32 h-32 mx-auto">
                        <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-primary">
                          <Image src={formData.profilePicture.preview} alt="Profile" fill className="object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, profilePicture: null }))}
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-lg"
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
                    <p className="text-xs text-secondary/60 mb-3 font-maven">View and update your banner (color or image)</p>

                    {/* Current Banner Display */}
                    {!formData.profileBannerImage && (
                      <div className="mb-4">
                        <p className="text-xs font-maven text-secondary mb-2">Current Banner</p>
                        <div
                          className="w-full h-24 rounded-lg border-2 border-gray-200"
                          style={{
                            backgroundColor: formData.profileBannerColor,
                            backgroundImage: formData.profileBannerType === 'image' && userProfile?.profileBanner?.image?.url
                              ? `url(${userProfile.profileBanner.image.url})`
                              : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                        <p className="text-xs text-secondary/60 text-center mt-2">
                          {formData.profileBannerType === 'color' ? 'Color Selected' : 'Image Banner'}
                        </p>
                      </div>
                    )}

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
                          <div className="relative w-full h-32">
                            <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-secondary">
                              <Image src={formData.profileBannerImage.preview} alt="Banner" fill className="object-cover" />
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, profileBannerImage: null }))}
                              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-lg"
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

                {/* Gallery Photos */}
                <FormItem>
                  <FormLabel className="font-telex text-secondary font-semibold">
                    📸 My Photos ({formData.existingPhotos.length + formData.newPhotos.length}/10)
                  </FormLabel>
                  <p className="text-xs text-secondary/60 mb-3 font-maven">View and manage your gallery photos</p>

                  {/* Existing Photos */}
                  {formData.existingPhotos.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-maven text-secondary mb-2">Current Photos</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        {formData.existingPhotos.map((photo, idx) => {
                          const originalIndex = originalPhotos.findIndex(p => p.url === photo.url);
                          return (
                            <div key={idx} className="relative aspect-square group">
                              <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-gray-200">
                                <Image src={photo.url} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  existingPhotos: prev.existingPhotos.filter((_, i) => i !== idx),
                                  deletedPhotoIndices: originalIndex !== -1 ? [...prev.deletedPhotoIndices, originalIndex] : prev.deletedPhotoIndices
                                }))}
                                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-lg"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* New Photos */}
                  {formData.newPhotos.length > 0 && (
                    <div className="mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        {formData.newPhotos.map((photo, idx) => (
                          <div key={idx} className="relative aspect-square group">
                            <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-success/30 bg-success/5">
                              <Image src={photo.preview} alt={`New Photo ${idx + 1}`} fill className="object-cover" />
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                newPhotos: prev.newPhotos.filter((_, i) => i !== idx)
                              }))}
                              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-lg"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.existingPhotos.length + formData.newPhotos.length < 10 && (
                    <MediaUpload type="photo" maxFiles={10 - formData.existingPhotos.length - formData.newPhotos.length} currentCount={formData.existingPhotos.length + formData.newPhotos.length} onFilesSelected={handlePhotoChange} files={[]} />
                  )}
                </FormItem>

                {/* Gallery Videos */}
                <FormItem>
                  <FormLabel className="font-telex text-secondary font-semibold">
                    🎬 My Videos ({formData.existingVideos.length + formData.newVideos.length}/2)
                  </FormLabel>
                  <p className="text-xs text-secondary/60 mb-3 font-maven">View and manage your gallery videos</p>

                  {/* Existing Videos */}
                  {formData.existingVideos.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-maven text-secondary mb-2">Current Videos</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {formData.existingVideos.map((video, idx) => {
                          const originalIndex = originalVideos.findIndex(v => v.url === video.url);
                          return (
                            <div key={idx} className="relative aspect-video group">
                              <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                                <video src={video.url} className="w-full h-full object-cover" />
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  existingVideos: prev.existingVideos.filter((_, i) => i !== idx),
                                  deletedVideoIndices: originalIndex !== -1 ? [...prev.deletedVideoIndices, originalIndex] : prev.deletedVideoIndices
                                }))}
                                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-lg"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* New Videos */}
                  {formData.newVideos.length > 0 && (
                    <div className="mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {formData.newVideos.map((video, idx) => (
                          <div key={idx} className="relative aspect-video group">
                            <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-success/30 bg-success/5">
                              <video src={video.preview} className="w-full h-full object-cover" />
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                newVideos: prev.newVideos.filter((_, i) => i !== idx)
                              }))}
                              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-lg"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.existingVideos.length + formData.newVideos.length < 2 && (
                    <MediaUpload type="video" maxFiles={2 - formData.existingVideos.length - formData.newVideos.length} maxDuration={120} currentCount={formData.existingVideos.length + formData.newVideos.length} onFilesSelected={handleVideoChange} files={[]} />
                  )}
                </FormItem>
              </>
            )}

            <div className="flex gap-4 pt-4">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="font-telex flex-1 bg-white border-2 border-secondary text-secondary hover:bg-secondary/5 h-12 text-base font-semibold transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={onCancel}
                  className="font-telex flex-1 bg-white border-2 border-secondary text-secondary hover:bg-secondary/5 h-12 text-base font-semibold transition-all duration-200"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="button"
                onClick={currentStep === 2 ? validateAndProceed : validateAndProceed}
                className="font-telex flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {currentStep === 4 ? (isLoading ? 'Saving...' : 'Save Changes') : (<>Next<ChevronRight className="w-4 h-4 ml-2" /></>)}
              </Button>
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
