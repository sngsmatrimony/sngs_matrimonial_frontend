'use client';

import { useState } from 'react';
import { Clock, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { toastSuccess, toastError, toastInfo } from '@/lib/toast';

export default function ApprovalStatusBanner() {
  const { isPending, isRejected, getLatestRejectionReason, refreshUser } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const user = await refreshUser();
      if (user?.approvalStatus === 'approved') {
        toastSuccess('Your profile has been approved! You now have full access.');
        window.location.reload();
      } else if (user?.approvalStatus === 'pending') {
        toastInfo('Status checked. Your profile is still under review.');
      } else if (user?.approvalStatus === 'rejected') {
        toastError('Your profile requires updates. Please review the feedback below.');
      }
    } catch {
      toastError('Failed to check status. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Don't show banner if approved
  if (!isPending() && !isRejected()) {
    return null;
  }

  const rejectionReason = getLatestRejectionReason();

  // Pending status banner
  if (isPending()) {
    return (
      <div className="bg-[#F5E6C3]/40 border-b border-[#D4A843]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#B8860B] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-serif font-semibold text-[#8A6A1A] text-sm sm:text-base">
                  Profile Under Review
                </p>
                <p className="font-sans text-[#8A6A1A]/90 text-xs sm:text-sm mt-1">
                  Your profile is being reviewed by our team. You can access your Profile and Settings while we verify your information.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 border-[#D4A843]/40 text-[#8A6A1A] hover:bg-[#F5E6C3]/70 hover:text-[#1A1A1A] font-sans font-medium whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Checking...' : 'Check Status'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Rejected status banner
  if (isRejected()) {
    return (
      <div className="bg-[#FBEAE5] border-b border-[#E8B4A0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-[#C75B39] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-serif font-semibold text-[#8A3B22] text-sm sm:text-base">
                    Action Required
                  </p>
                  <p className="font-sans text-[#8A3B22]/90 text-xs sm:text-sm mt-1">
                    Your profile needs updates before it can be approved. Please review the feedback and edit your profile.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 border-[#E8B4A0] text-[#8A3B22] hover:bg-[#F5DDD5] hover:text-[#1A1A1A] font-sans font-medium whitespace-nowrap"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Checking...' : 'Recheck'}
              </Button>
            </div>

            {rejectionReason && (
              <div className="ml-8 p-3 bg-white rounded-lg border border-[#E8B4A0]">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#C75B39] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-sans text-[#8A3B22] text-xs font-semibold mb-1">
                      Admin Feedback:
                    </p>
                    <p className="font-sans text-[#2C3E50] text-sm">
                      {rejectionReason}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
