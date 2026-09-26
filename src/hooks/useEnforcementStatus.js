'use client';

import { useQuery } from '@tanstack/react-query';
import client from '@/lib/api/client';

/**
 * Whether membership restrictions are currently enforced (admin-controlled
 * toggle). Single source of truth for locked-content UI, kept in sync with
 * the same setting the backend uses to actually gate access.
 */
export function useEnforcementStatus() {
  const { data } = useQuery({
    queryKey: ['enforcementStatus'],
    queryFn: async () => {
      const response = await client.get('/api/settings/enforcement-status');
      return response.data.data;
    },
    staleTime: 60 * 1000, // 1 minute cache
    retry: 1,
    placeholderData: { isEnabled: false },
  });

  return !!data?.isEnabled;
}
