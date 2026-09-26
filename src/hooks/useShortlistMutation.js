'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { toastSuccess, toastError } from '@/lib/toast';

/**
 * Shortlist/unshortlist mutations — a private bookmark, distinct from
 * Express Interest (see useLikeMutation.js, which this mirrors).
 */
export function useShortlistMutation() {
  const queryClient = useQueryClient();

  const shortlistMutation = useMutation({
    mutationFn: async ({ profileId, profile }) => {
      await client.post(`/api/profiles/${profileId}/shortlist`);
      return { profileId, profile };
    },
    onMutate: async ({ profileId, profile }) => {
      await queryClient.cancelQueries({ queryKey: ['shortlistedProfiles'] });
      await queryClient.cancelQueries({ queryKey: ['browseProfiles'] });

      const previousShortlisted = queryClient.getQueryData(['shortlistedProfiles']);
      const previousBrowseProfiles = queryClient.getQueryData(['browseProfiles']);

      queryClient.setQueryData(['shortlistedProfiles'], (old) => {
        if (!old) return [profile];
        if (old.some((p) => p._id === profileId)) return old;
        return [...old, profile];
      });

      queryClient.setQueryData(['browseProfiles'], (old) => {
        if (!old) return old;
        const newShortlistedIds = old.shortlistedIds?.includes(profileId)
          ? old.shortlistedIds
          : [...(old.shortlistedIds || []), profileId];
        return { ...old, shortlistedIds: newShortlistedIds };
      });

      return { previousShortlisted, previousBrowseProfiles };
    },
    onError: (err, variables, context) => {
      if (context?.previousShortlisted !== undefined) {
        queryClient.setQueryData(['shortlistedProfiles'], context.previousShortlisted);
      }
      if (context?.previousBrowseProfiles !== undefined) {
        queryClient.setQueryData(['browseProfiles'], context.previousBrowseProfiles);
      }
      toastError(err.response?.data?.message || 'Error shortlisting profile');
    },
    onSuccess: () => {
      toastSuccess('Profile shortlisted!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['shortlistedProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['browseProfiles'] });
    },
  });

  const unshortlistMutation = useMutation({
    mutationFn: async ({ profileId }) => {
      await client.post(`/api/profiles/${profileId}/unshortlist`);
      return { profileId };
    },
    onMutate: async ({ profileId }) => {
      await queryClient.cancelQueries({ queryKey: ['shortlistedProfiles'] });
      await queryClient.cancelQueries({ queryKey: ['browseProfiles'] });

      const previousShortlisted = queryClient.getQueryData(['shortlistedProfiles']);
      const previousBrowseProfiles = queryClient.getQueryData(['browseProfiles']);

      queryClient.setQueryData(['shortlistedProfiles'], (old) => {
        if (!old) return old;
        return old.filter((p) => p._id !== profileId);
      });

      queryClient.setQueryData(['browseProfiles'], (old) => {
        if (!old) return old;
        const newShortlistedIds = old.shortlistedIds?.filter((id) => id !== profileId) || [];
        return { ...old, shortlistedIds: newShortlistedIds };
      });

      return { previousShortlisted, previousBrowseProfiles };
    },
    onError: (err, variables, context) => {
      if (context?.previousShortlisted !== undefined) {
        queryClient.setQueryData(['shortlistedProfiles'], context.previousShortlisted);
      }
      if (context?.previousBrowseProfiles !== undefined) {
        queryClient.setQueryData(['browseProfiles'], context.previousBrowseProfiles);
      }
      toastError(err.response?.data?.message || 'Error removing shortlist');
    },
    onSuccess: () => {
      toastSuccess('Removed from shortlist');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['shortlistedProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['browseProfiles'] });
    },
  });

  const toggleShortlist = (profileId, profile, isCurrentlyShortlisted) => {
    if (isCurrentlyShortlisted) {
      unshortlistMutation.mutate({ profileId });
    } else {
      shortlistMutation.mutate({ profileId, profile });
    }
  };

  return {
    shortlistMutation,
    unshortlistMutation,
    toggleShortlist,
    isLoading: shortlistMutation.isPending || unshortlistMutation.isPending,
  };
}
