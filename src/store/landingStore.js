import { create } from 'zustand';

export const useLandingStore = create((set) => ({
  // Tab state
  activeTab: 'browse', // 'browse', 'liked', 'profile'
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Browse profiles state
  profiles: [],
  setProfiles: (profiles) => set({ profiles }),
  likedProfilesIds: [],
  setLikedProfilesIds: (ids) => set({ likedProfilesIds: ids }),

  // Liked profiles state
  likedProfiles: [],
  setLikedProfiles: (profiles) => set({ likedProfiles: profiles }),

  // User profile state
  userProfile: null,
  setUserProfile: (profile) => set({ userProfile: profile }),

  // Loading and error states
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),

  // Reset state
  reset: () =>
    set({
      activeTab: 'browse',
      profiles: [],
      likedProfilesIds: [],
      likedProfiles: [],
      userProfile: null,
      isLoading: false,
      error: null,
    }),
}));
