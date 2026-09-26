'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, Save, Loader2, Lock, Eye, EyeOff, FileText, UserPlus, Search, MessageCircle, Sparkles, ShieldAlert, IdCard } from 'lucide-react';
import { toastSuccess, toastError } from '@/lib/toast';
import adminClient from '@/lib/api/adminClient';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    contactEmail: '',
    contactMobile: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // How It Works content state
  const [howItWorksData, setHowItWorksData] = useState({
    sectionTitle: '',
    sectionSubtitle: '',
    steps: [
      { title: '', description: '' },
      { title: '', description: '' },
      { title: '', description: '' },
    ],
  });

  // Hero content state
  const [heroData, setHeroData] = useState({
    badge: '',
    title: '',
    subtitle: '',
  });

  // Membership enforcement toggle state
  const [enforcementEnabled, setEnforcementEnabled] = useState(false);

  // ID proof required toggle state
  const [idProofRequiredEnabled, setIdProofRequiredEnabled] = useState(false);

  // Fetch current settings
  const { data: contactInfo, isLoading } = useQuery({
    queryKey: ['contactInfo'],
    queryFn: async () => {
      const response = await adminClient.get('/api/settings/contact-info');
      return response.data.data;
    },
  });

  // Fetch How It Works content
  const { data: howItWorksContent, isLoading: isLoadingHowItWorks } = useQuery({
    queryKey: ['howItWorksContent'],
    queryFn: async () => {
      const response = await adminApi.getHowItWorksContent();
      return response.data.data;
    },
  });

  // Fetch Hero content
  const { data: heroContent, isLoading: isLoadingHeroContent } = useQuery({
    queryKey: ['heroContent'],
    queryFn: async () => {
      const response = await adminApi.getHeroContent();
      return response.data.data;
    },
  });

  // Fetch membership enforcement setting
  const { data: enforcementSettings, isLoading: isLoadingEnforcement } = useQuery({
    queryKey: ['enforcementSettings'],
    queryFn: async () => {
      const response = await adminApi.getEnforcementSettings();
      return response.data.data;
    },
  });

  // Fetch ID proof required setting
  const { data: idProofSettings, isLoading: isLoadingIdProof } = useQuery({
    queryKey: ['idProofSettings'],
    queryFn: async () => {
      const response = await adminApi.getIdProofSettings();
      return response.data.data;
    },
  });

  // Auto-fill form when data is loaded
  useEffect(() => {
    if (contactInfo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding editable local form state from async-loaded server data, not derivable at render time
      setFormData({
        contactEmail: contactInfo.contactEmail || '',
        contactMobile: contactInfo.contactMobile || '',
      });
    }
  }, [contactInfo]);

  // Auto-fill How It Works form when data is loaded
  useEffect(() => {
    if (howItWorksContent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding editable local form state from async-loaded server data
      setHowItWorksData({
        sectionTitle: howItWorksContent.sectionTitle || '',
        sectionSubtitle: howItWorksContent.sectionSubtitle || '',
        steps: howItWorksContent.steps || [
          { title: '', description: '' },
          { title: '', description: '' },
          { title: '', description: '' },
        ],
      });
    }
  }, [howItWorksContent]);

  // Auto-fill Hero form when data is loaded
  useEffect(() => {
    if (heroContent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding editable local form state from async-loaded server data
      setHeroData({
        badge: heroContent.badge || '',
        title: heroContent.title || '',
        subtitle: heroContent.subtitle || '',
      });
    }
  }, [heroContent]);

  // Auto-fill enforcement toggle when data is loaded
  useEffect(() => {
    if (enforcementSettings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding editable local toggle state from async-loaded server data
      setEnforcementEnabled(!!enforcementSettings.isEnabled);
    }
  }, [enforcementSettings]);

  // Auto-fill ID proof required toggle when data is loaded
  useEffect(() => {
    if (idProofSettings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding editable local toggle state from async-loaded server data
      setIdProofRequiredEnabled(!!idProofSettings.isEnabled);
    }
  }, [idProofSettings]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => adminApi.updateContactInfo(data),
    onSuccess: () => {
      // Invalidate contact info cache globally
      queryClient.invalidateQueries({ queryKey: ['contactInfo'] });
      toastSuccess('Contact information updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update contact information';
      toastError(message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Password validation
  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain uppercase, lowercase, and numbers';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords don't match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      const response = await adminClient.post('/api/admin-auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.data;
    },
    onSuccess: () => {
      toastSuccess('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({});
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to change password';
      toastError(message);
    },
  });

  // Password change submit handler
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (validatePasswordForm()) {
      changePasswordMutation.mutate(passwordData);
    }
  };

  // Password change handler
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
    // Clear error for this field
    if (passwordErrors[e.target.name]) {
      setPasswordErrors({
        ...passwordErrors,
        [e.target.name]: undefined,
      });
    }
  };

  // How It Works update mutation
  const updateHowItWorksMutation = useMutation({
    mutationFn: (data) => adminApi.updateHowItWorksContent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['howItWorksContent'] });
      toastSuccess('How It Works content updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update How It Works content';
      toastError(message);
    },
  });

  // How It Works submit handler
  const handleHowItWorksSubmit = (e) => {
    e.preventDefault();
    updateHowItWorksMutation.mutate(howItWorksData);
  };

  // How It Works field change handler
  const handleHowItWorksChange = (field, value) => {
    setHowItWorksData({
      ...howItWorksData,
      [field]: value,
    });
  };

  // How It Works step change handler
  const handleStepChange = (index, field, value) => {
    const newSteps = [...howItWorksData.steps];
    newSteps[index] = {
      ...newSteps[index],
      [field]: value,
    };
    setHowItWorksData({
      ...howItWorksData,
      steps: newSteps,
    });
  };

  // Membership enforcement update mutation
  const updateEnforcementMutation = useMutation({
    mutationFn: (isEnabled) => adminApi.updateEnforcementSettings({ isEnabled }),
    onSuccess: (_response, isEnabled) => {
      queryClient.invalidateQueries({ queryKey: ['enforcementSettings'] });
      toastSuccess(`Membership enforcement ${isEnabled ? 'enabled' : 'disabled'}`);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update enforcement setting';
      toastError(message);
      // Revert the optimistic toggle on failure
      setEnforcementEnabled((prev) => !prev);
    },
  });

  const handleEnforcementToggle = () => {
    const next = !enforcementEnabled;
    setEnforcementEnabled(next);
    updateEnforcementMutation.mutate(next);
  };

  // ID proof required update mutation
  const updateIdProofMutation = useMutation({
    mutationFn: (isEnabled) => adminApi.updateIdProofSettings({ isEnabled }),
    onSuccess: (_response, isEnabled) => {
      queryClient.invalidateQueries({ queryKey: ['idProofSettings'] });
      toastSuccess(`ID proof requirement ${isEnabled ? 'enabled' : 'disabled'}`);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update ID proof setting';
      toastError(message);
      // Revert the optimistic toggle on failure
      setIdProofRequiredEnabled((prev) => !prev);
    },
  });

  const handleIdProofToggle = () => {
    const next = !idProofRequiredEnabled;
    setIdProofRequiredEnabled(next);
    updateIdProofMutation.mutate(next);
  };

  // Hero content update mutation
  const updateHeroMutation = useMutation({
    mutationFn: (data) => adminApi.updateHeroContent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['heroContent'] });
      toastSuccess('Hero content updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update Hero content';
      toastError(message);
    },
  });

  // Hero submit handler
  const handleHeroSubmit = (e) => {
    e.preventDefault();
    updateHeroMutation.mutate(heroData);
  };

  // Hero field change handler
  const handleHeroChange = (field, value) => {
    setHeroData({
      ...heroData,
      [field]: value,
    });
  };

  // Step icons for display
  const stepIcons = [
    <UserPlus key="step1" size={20} className="text-primary" />,
    <Search key="step2" size={20} className="text-accent" />,
    <MessageCircle key="step3" size={20} className="text-success" />,
  ];

  if (isLoading || isLoadingHowItWorks || isLoadingHeroContent || isLoadingEnforcement || isLoadingIdProof) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary font-sans">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-secondary mb-2">Settings</h1>
        <p className="font-sans text-gray-600">
          Manage contact information displayed in the header
        </p>
      </div>

      <Accordion type="single" collapsible defaultValue="contact" className="space-y-4">
        {/* Contact Information Section */}
        <AccordionItem value="contact" className="border rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Mail size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-serif text-lg text-secondary">Contact Information</h3>
                <p className="font-sans text-sm text-gray-500">Update contact details displayed in header</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Email */}
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="font-sans flex items-center gap-2">
                  <Mail size={16} className="text-primary" />
                  Contact Email
                </Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="info@sngsmatrimony.com"
                  required
                  className="font-sans"
                />
                <p className="text-xs text-gray-500 font-sans">
                  Users can click this email to send messages
                </p>
              </div>

              {/* Contact Mobile */}
              <div className="space-y-2">
                <Label htmlFor="contactMobile" className="font-sans flex items-center gap-2">
                  <Phone size={16} className="text-primary" />
                  Contact Mobile Number
                </Label>
                <Input
                  id="contactMobile"
                  name="contactMobile"
                  type="tel"
                  value={formData.contactMobile}
                  onChange={handleChange}
                  placeholder="9876543210"
                  pattern="[6-9]\d{9}"
                  required
                  className="font-sans"
                />
                <p className="text-xs text-gray-500 font-sans">
                  10-digit Indian mobile number (without +91)
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-sans"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>

        {/* Change Password Section */}
        <AccordionItem value="password" className="border rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Lock size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-serif text-lg text-secondary">Change Password</h3>
                <p className="font-sans text-sm text-gray-500">Update your admin password to keep your account secure</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="font-sans">
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                    className="font-sans pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-destructive font-sans">
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="font-sans">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                    className="font-sans pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 font-sans">
                  Must be at least 8 characters with uppercase, lowercase, and numbers
                </p>
                {passwordErrors.newPassword && (
                  <p className="text-xs text-destructive font-sans">
                    {passwordErrors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="font-sans">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                    className="font-sans pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-destructive font-sans">
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-sans"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Change Password
                  </>
                )}
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>

        {/* Hero Section Editor */}
        <AccordionItem value="hero" className="border rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Sparkles size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-serif text-lg text-secondary">Homepage Hero Section</h3>
                <p className="font-sans text-sm text-gray-500">Edit the main banner content displayed at the top of the homepage</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <form onSubmit={handleHeroSubmit} className="space-y-6">
              {/* Badge */}
              <div className="space-y-2">
                <Label htmlFor="heroBadge" className="font-sans">
                  Badge Text
                </Label>
                <Input
                  id="heroBadge"
                  value={heroData.badge}
                  onChange={(e) => handleHeroChange('badge', e.target.value)}
                  placeholder="Welcome to SNGS Matrimonial"
                  maxLength={50}
                  required
                  className="font-sans"
                />
                <p className="text-xs text-gray-500 font-sans">
                  Small text displayed above the title (max 50 characters)
                </p>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="heroTitle" className="font-sans">
                  Title
                </Label>
                <Input
                  id="heroTitle"
                  value={heroData.title}
                  onChange={(e) => handleHeroChange('title', e.target.value)}
                  placeholder="Find Your Perfect Match"
                  maxLength={100}
                  required
                  className="font-sans"
                />
                <p className="text-xs text-gray-500 font-sans">
                  Main heading text (max 100 characters)
                </p>
              </div>

              {/* Subtitle */}
              <div className="space-y-2">
                <Label htmlFor="heroSubtitle" className="font-sans">
                  Subtitle
                </Label>
                <Textarea
                  id="heroSubtitle"
                  value={heroData.subtitle}
                  onChange={(e) => handleHeroChange('subtitle', e.target.value)}
                  placeholder="Join thousands of individuals on their journey..."
                  maxLength={500}
                  required
                  rows={4}
                  className="font-sans resize-none"
                />
                <p className="text-xs text-gray-500 font-sans">
                  Description paragraph below the title (max 500 characters)
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={updateHeroMutation.isPending}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-sans"
              >
                {updateHeroMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>

        {/* How It Works Section Editor */}
        <AccordionItem value="howItWorks" className="border rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <FileText size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-serif text-lg text-secondary">Homepage &quot;How It Works&quot; Section</h3>
                <p className="font-sans text-sm text-gray-500">Edit the content displayed in the &quot;Find Your Partner In Just Few Steps&quot; section</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <form onSubmit={handleHowItWorksSubmit} className="space-y-6">
              {/* Section Title */}
              <div className="space-y-2">
                <Label htmlFor="sectionTitle" className="font-sans">
                  Section Title
                </Label>
                <Input
                  id="sectionTitle"
                  value={howItWorksData.sectionTitle}
                  onChange={(e) => handleHowItWorksChange('sectionTitle', e.target.value)}
                  placeholder="Find Your Partner In Just Few Steps"
                  maxLength={200}
                  required
                  className="font-sans"
                />
                <p className="text-xs text-gray-500 font-sans">
                  Main heading for the section (max 200 characters)
                </p>
              </div>

              {/* Section Subtitle */}
              <div className="space-y-2">
                <Label htmlFor="sectionSubtitle" className="font-sans">
                  Section Subtitle
                </Label>
                <Textarea
                  id="sectionSubtitle"
                  value={howItWorksData.sectionSubtitle}
                  onChange={(e) => handleHowItWorksChange('sectionSubtitle', e.target.value)}
                  placeholder="SNGS Matrimonial will help you find your perfect match..."
                  maxLength={500}
                  required
                  rows={3}
                  className="font-sans resize-none"
                />
                <p className="text-xs text-gray-500 font-sans">
                  Description below the heading (max 500 characters)
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                <Label className="font-sans text-base">Steps</Label>

                {howItWorksData.steps.map((step, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                        {stepIcons[index]}
                      </div>
                      <span className="font-sans font-medium text-secondary">
                        Step {index + 1}
                      </span>
                    </div>

                    {/* Step Title */}
                    <div className="space-y-2">
                      <Label htmlFor={`step-${index}-title`} className="font-sans text-sm">
                        Title
                      </Label>
                      <Input
                        id={`step-${index}-title`}
                        value={step.title}
                        onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                        placeholder={`Step ${index + 1} title`}
                        maxLength={100}
                        required
                        className="font-sans"
                      />
                    </div>

                    {/* Step Description */}
                    <div className="space-y-2">
                      <Label htmlFor={`step-${index}-description`} className="font-sans text-sm">
                        Description
                      </Label>
                      <Textarea
                        id={`step-${index}-description`}
                        value={step.description}
                        onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                        placeholder={`Description for step ${index + 1}`}
                        maxLength={500}
                        required
                        rows={3}
                        className="font-sans resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={updateHowItWorksMutation.isPending}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-sans"
              >
                {updateHowItWorksMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>

        {/* Access Control - Membership Enforcement Toggle */}
        <AccordionItem value="accessControl" className="border rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <ShieldAlert size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-serif text-lg text-secondary">Access Control</h3>
                <p className="font-sans text-sm text-gray-500">Control whether non-member users are restricted from premium features</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="flex items-start justify-between gap-6 p-4 rounded-lg border border-[#D4A843]/15 bg-gradient-to-br from-[#FDF8F0] to-[#F5E6C3]/30 mb-4">
              <div>
                <Label className="font-sans text-[#1A1A1A]">
                  {enforcementEnabled ? 'Restrictions enforced' : 'Promotional period (everything free)'}
                </Label>
                <p className="text-xs text-[#2C3E50]/60 font-sans mt-1 max-w-md">
                  Off = promotional mode, full access for everyone regardless of membership.
                  On = restrictions enforced for users without an active membership and credits.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enforcementEnabled}
                onClick={handleEnforcementToggle}
                disabled={updateEnforcementMutation.isPending}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                  enforcementEnabled ? 'bg-[#D4A843]' : 'bg-[#2C3E50]/20'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    enforcementEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 rounded-lg border border-[#D4A843]/25 bg-gradient-to-br from-[#F5E6C3]/50 to-[#FDF8F0]">
              <p className="font-sans text-sm text-[#1A1A1A] mb-2">
                When this is switched ON, users without an active membership and credits are restricted from:
              </p>
              <ul className="font-sans text-sm text-[#2C3E50] space-y-1 list-disc list-inside">
                <li>Viewing another member&apos;s full profile details (contact info, horoscope, gallery)</li>
                <li>Downloading horoscope documents</li>
                <li>Browsing full search results (capped to a small teaser list with an upgrade prompt)</li>
                <li>Starting a <strong>new</strong> chat conversation with a match</li>
              </ul>
              <p className="font-sans text-xs text-[#2C3E50]/70 mt-2">
                Conversations already started before the toggle was switched on stay fully accessible either way.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ID Proof Verification Toggle */}
        <AccordionItem value="idProofRequired" className="border rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <IdCard size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-serif text-lg text-secondary">ID Proof Verification</h3>
                <p className="font-sans text-sm text-gray-500">Control whether every member must upload a government ID proof</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="flex items-start justify-between gap-6 p-4 rounded-lg border border-[#D4A843]/15 bg-gradient-to-br from-[#FDF8F0] to-[#F5E6C3]/30">
              <div>
                <Label className="font-sans text-[#1A1A1A]">
                  {idProofRequiredEnabled ? 'ID proof required for everyone' : 'ID proof optional'}
                </Label>
                <p className="text-xs text-[#2C3E50]/60 font-sans mt-1 max-w-md">
                  On = every new registration and profile edit must include a government ID proof
                  document. Off = ID proof upload stays optional for everyone.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={idProofRequiredEnabled}
                onClick={handleIdProofToggle}
                disabled={updateIdProofMutation.isPending}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                  idProofRequiredEnabled ? 'bg-[#D4A843]' : 'bg-[#2C3E50]/20'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    idProofRequiredEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
