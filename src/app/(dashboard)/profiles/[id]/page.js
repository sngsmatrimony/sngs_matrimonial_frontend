'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { client } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { toastError, toastSuccess } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ProfileDetailView from '@/components/profile/ProfileDetailView';

export default function ProfileViewPage() {
  const router = useRouter();
  const params = useParams();
  const { membership, refreshMembership } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creditsDeducted, setCreditsDeducted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [params.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await client.get(`/api/profiles/${params.id}`);
      setProfile(response.data.data);
      setCreditsDeducted(response.data.data.creditsDeducted || false);

      if (response.data.data.creditsDeducted) {
        await refreshMembership();
        toastSuccess('1 credit deducted for viewing this profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);

      if (error.response?.data?.requiresCredits) {
        setError('insufficient-credits');
      } else if (error.response?.data?.requiresMembership) {
        setError('no-membership');
      } else if (error.response?.status === 404) {
        setError('not-found');
        toastError('Profile not found');
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        setError('fetch-error');
        toastError('Failed to load profile');
        setTimeout(() => {
          router.back();
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-[#D4A843]/15 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error === 'insufficient-credits' || error === 'no-membership') {
    return (
      <div className="min-h-screen bg-[#FDF8F0] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#D4A843]/20 shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#F5E6C3] flex items-center justify-center ring-1 ring-[#D4A843]/40">
            <Lock className="w-7 h-7 text-[#D4A843]" strokeWidth={1.75} />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-2">
            Unlock This Profile
          </h2>
          <p className="font-sans text-[#2C3E50]/80 mb-6 leading-relaxed">
            {error === 'insufficient-credits'
              ? "You're out of credits. Choose a membership plan to unlock this profile and keep browsing without limits."
              : 'An active membership is required to view full profiles. Choose a plan to unlock this profile and connect with matches.'}
          </p>
          <div className="flex flex-col gap-3">
            <Button
              asChild
              className="w-full bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold h-12 rounded-xl shadow-sm"
            >
              <Link href="/membership/purchase">
                <Sparkles className="w-4 h-4 mr-2" />
                View Membership Plans
              </Link>
            </Button>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full font-sans h-12 rounded-xl border-[#D4A843]/30"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="font-sans text-lg text-[#2C3E50] mb-6">
            {error === 'not-found' && 'Profile not found'}
            {!error && 'Failed to load profile'}
          </p>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="font-sans"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileDetailView profileId={params.id} />
      </div>
    </div>
  );
}
