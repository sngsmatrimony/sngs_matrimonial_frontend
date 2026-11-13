'use client';

import { useQuery } from '@tanstack/react-query';
import client from '@/lib/api/client';

/**
 * Whether members can download other members' profiles (admin "Profile
 * Downloads" toggle). Downloading — the Share Profile button and every
 * "Downloading a profile" cost line — is shown only while this is on. The
 * backend refuses downloads when it's off, so this only keeps the UI in step.
 */
export function useProfileDownloadsEnabled() {
  const { data } = useQuery({
    queryKey: ['profileDownloadsStatus'],
    queryFn: async () => {
      const response = await client.get('/api/settings/profile-downloads-status');
      return response.data.data;
    },
    staleTime: 60 * 1000, // 1 minute cache
    retry: 1,
    // On by default, so the usual case doesn't flicker.
    placeholderData: { isEnabled: true },
  });

  return data?.isEnabled !== false;
}
