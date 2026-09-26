'use client';

import { useQuery } from '@tanstack/react-query';
import client from '@/lib/api/client';

/**
 * Whether ID-proof upload is currently mandatory for every member
 * (admin-controlled toggle). Read publicly so the registration form can
 * mark the field required/optional before the user has an account.
 */
export function useIdProofRequired() {
  const { data } = useQuery({
    queryKey: ['idProofRequiredStatus'],
    queryFn: async () => {
      const response = await client.get('/api/settings/id-proof-required-status');
      return response.data.data;
    },
    staleTime: 60 * 1000, // 1 minute cache
    retry: 1,
    placeholderData: { isEnabled: false },
  });

  return !!data?.isEnabled;
}
