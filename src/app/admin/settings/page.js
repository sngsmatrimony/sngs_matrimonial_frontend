'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Save, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
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

  // Fetch current settings
  const { data: contactInfo, isLoading } = useQuery({
    queryKey: ['contactInfo'],
    queryFn: async () => {
      const response = await adminClient.get('/api/settings/contact-info');
      return response.data.data;
    },
  });

  // Auto-fill form when data is loaded
  useEffect(() => {
    if (contactInfo) {
      setFormData({
        contactEmail: contactInfo.contactEmail || '',
        contactMobile: contactInfo.contactMobile || '',
      });
    }
  }, [contactInfo]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary font-maven">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-viga text-3xl text-secondary mb-2">Settings</h1>
        <p className="font-maven text-gray-600">
          Manage contact information displayed in the header
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-viga">Contact Information</CardTitle>
          <CardDescription className="font-maven">
            This information will be displayed in the header across all pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Email */}
            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="font-telex flex items-center gap-2">
                <Mail size={16} className="text-primary" />
                Contact Email
              </Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="info@sngsmatrimonial.com"
                required
                className="font-maven"
              />
              <p className="text-xs text-gray-500 font-maven">
                Users can click this email to send messages
              </p>
            </div>

            {/* Contact Mobile */}
            <div className="space-y-2">
              <Label htmlFor="contactMobile" className="font-telex flex items-center gap-2">
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
                className="font-maven"
              />
              <p className="text-xs text-gray-500 font-maven">
                10-digit Indian mobile number (without +91)
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-telex"
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
        </CardContent>
      </Card>

      {/* Change Password Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-viga flex items-center gap-2">
            <Lock size={20} className="text-primary" />
            Change Password
          </CardTitle>
          <CardDescription className="font-maven">
            Update your admin password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="font-telex">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="font-maven pr-10"
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
                <p className="text-xs text-destructive font-maven">
                  {passwordErrors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="font-telex">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="font-maven pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 font-maven">
                Must be at least 8 characters with uppercase, lowercase, and numbers
              </p>
              {passwordErrors.newPassword && (
                <p className="text-xs text-destructive font-maven">
                  {passwordErrors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-telex">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="font-maven pr-10"
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
                <p className="text-xs text-destructive font-maven">
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-telex"
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
        </CardContent>
      </Card>
    </div>
  );
}
