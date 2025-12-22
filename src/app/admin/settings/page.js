'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Save, Loader2 } from 'lucide-react';
import { toastSuccess, toastError } from '@/lib/toast';
import client from '@/lib/api/client';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    contactEmail: '',
    contactMobile: '',
  });

  // Fetch current settings
  const { data: contactInfo, isLoading } = useQuery({
    queryKey: ['contactInfo'],
    queryFn: async () => {
      const response = await client.get('/api/settings/contact-info');
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
    </div>
  );
}
