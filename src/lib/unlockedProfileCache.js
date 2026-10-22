/**
 * After a profile opens successfully (paid for, or already unlocked), update
 * the cached search / Liked / Shortlist lists right away, so its card shows
 * the real name and photo and never asks to spend credits again — without
 * waiting for a page refresh.
 */
const LIST_KEYS = ['browseProfiles', 'browseProfilesOutside'];
const ARRAY_KEYS = ['likedProfiles', 'shortlistedProfiles'];

export function markProfileUnlocked(queryClient, profile) {
  if (!queryClient || !profile?._id) return;
  const id = String(profile._id);
  const addr = profile.presentResidentialAddress || {};
  const patch = (p) => (String(p?._id) === id
    ? {
      ...p,
      nameMasked: false,
      fullName: profile.fullName,
      profilePicture: profile.profilePicture,
      occupation: profile.occupation,
      presentResidentialAddress: { city: addr.city, state: addr.state, country: addr.country },
    }
    : p);

  for (const key of LIST_KEYS) {
    queryClient.setQueriesData({ queryKey: [key] }, (data) => (data?.pages
      ? { ...data, pages: data.pages.map((page) => ({ ...page, profiles: (page.profiles || []).map(patch) })) }
      : data));
  }
  for (const key of ARRAY_KEYS) {
    queryClient.setQueriesData({ queryKey: [key] }, (data) => (Array.isArray(data) ? data.map(patch) : data));
  }
  // Refresh the rest of each list the next time it's shown.
  [...LIST_KEYS, ...ARRAY_KEYS].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
}
