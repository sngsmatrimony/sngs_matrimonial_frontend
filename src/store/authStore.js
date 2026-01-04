import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import client from '@/lib/api/client';
import useChatStore from './chatStore';
import { useLandingStore } from './landingStore';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      membership: {
        isActive: false,
        credits: 0,
        expiryDate: null,
        isExpired: false,
      },

      // Computed getter for admin status
      isAdmin: () => get().user?.role === 'admin',

      // Login action
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await client.post('/api/auth/login', { email, password });
          const { token, user } = response.data;

          localStorage.setItem('authToken', token);
          set({ 
            user, 
            token, 
            isLoading: false,
            membership: user.membership || {
              isActive: false,
              credits: 0,
              expiryDate: null,
              isExpired: false,
            }
          });
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Login failed';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      // Register action
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          console.log('[authStore] Sending registration request with data:', userData);
          const response = await client.post('/api/auth/register', userData);
          console.log('[authStore] Registration successful:', response.data);
          const { token, user } = response.data;

          localStorage.setItem('authToken', token);
          set({ 
            user, 
            token, 
            isLoading: false,
            membership: user.membership || {
              isActive: false,
              credits: 0,
              expiryDate: null,
              isExpired: false,
            }
          });
          return { success: true };
        } catch (error) {
          console.error('[authStore] Registration error details:');
          console.error('Status:', error.response?.status);
          console.error('Error message:', error.response?.data?.message);
          console.error('Error data:', error.response?.data);
          console.error('Full error:', error);

          // Extract validation errors from the errors array
          let errorMessage = error.response?.data?.message || 'Registration failed';

          if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
            const fieldErrors = error.response.data.errors
              .map(err => `${err.path}: ${err.msg}`)
              .join('\n');
            errorMessage = fieldErrors || errorMessage;
            console.error('[authStore] Validation errors:', fieldErrors);
          }

          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      // Initialize auth from localStorage
      initializeAuth: async () => {
        // First, try to restore from localStorage
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          set({ token: storedToken });
          // Try to get current user from API
          try {
            const response = await client.get('/api/auth/me');
            const userData = response.data.user;
            set({ 
              user: userData,
              membership: userData.membership || {
                isActive: false,
                credits: 0,
                expiryDate: null,
                isExpired: false,
              }
            });
          } catch (error) {
            // Token is invalid, clear it
            localStorage.removeItem('authToken');
            set({ token: null, user: null });
          }
        }
      },

      // Logout action
      logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        set({ user: null, token: null });
        
        // Clear other stores to prevent data leaks between users
        useChatStore.getState().clearChat();
        useLandingStore.getState().reset();
      },

      // Get current user
      getCurrentUser: async () => {
        try {
          const response = await client.get('/api/auth/me');
          const userData = response.data.user;
          set({ 
            user: userData,
            membership: userData.membership || {
              isActive: false,
              credits: 0,
              expiryDate: null,
              isExpired: false,
            }
          });
          return userData;
        } catch (error) {
          set({ user: null, token: null });
          return null;
        }
      },

      // Upload profile picture (mandatory)
      uploadProfilePicture: async (file) => {
        const formData = new FormData();
        formData.append('photo', file);

        try {
          console.log('[authStore] Uploading profile picture:', file.name, formData);
          const response = await client.post('/api/auth/upload-profile-picture', formData);
          console.log('[authStore] Profile picture response:', response.data);
          set({ user: response.data.user });
          return { success: true, profilePictureUrl: response.data.profilePictureUrl };
        } catch (error) {
          console.error('[authStore] Profile picture upload error:', error);
          return { success: false, error: error.response?.data?.message || 'Upload failed' };
        }
      },

      // Set profile banner color
      setProfileBannerColor: async (color) => {
        try {
          const response = await client.post('/api/auth/set-profile-banner-color', { color });
          set({ user: response.data.user });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.response?.data?.message || 'Failed to set color' };
        }
      },

      // Upload gallery photo
      uploadPhoto: async (file) => {
        const formData = new FormData();
        formData.append('photo', file);

        try {
          console.log('[authStore] Uploading gallery photo:', file.name);
          const response = await client.post('/api/auth/upload-photo', formData);
          console.log('[authStore] Gallery photo response:', response.data);
          set({ user: response.data.user });
          return { success: true, photoUrl: response.data.photoUrl };
        } catch (error) {
          console.error('[authStore] Gallery photo upload error:', error);
          return { success: false, error: error.response?.data?.message || 'Upload failed' };
        }
      },

      // Delete gallery photo
      deletePhoto: async (index) => {
        try {
          const response = await client.delete(`/api/auth/photo/${index}`);
          set({ user: response.data.user });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.response?.data?.message || 'Delete failed' };
        }
      },

      // Upload horoscope document
      uploadHoroscopeDocument: async (file) => {
        const formData = new FormData();
        formData.append('document', file);

        try {
          console.log('[authStore] Uploading horoscope document:', file.name);
          const response = await client.post('/api/auth/upload-horoscope-document', formData);
          console.log('[authStore] Horoscope document response:', response.data);
          set((state) => ({
            user: {
              ...state.user,
              horoscopeDocument: response.data.horoscopeDocument
            }
          }));
          return { success: true, horoscopeDocument: response.data.horoscopeDocument };
        } catch (error) {
          console.error('[authStore] Horoscope upload error:', error);
          return { success: false, error: error.response?.data?.message || 'Upload failed' };
        }
      },

      // Delete horoscope document
      deleteHoroscopeDocument: async () => {
        try {
          const response = await client.delete('/api/auth/horoscope-document');
          set((state) => ({
            user: {
              ...state.user,
              horoscopeDocument: undefined
            }
          }));
          return { success: true };
        } catch (error) {
          console.error('[authStore] Horoscope delete error:', error);
          return { success: false, error: error.response?.data?.message || 'Delete failed' };
        }
      },

      // Update membership state
      updateMembership: (membershipData) => {
        set({ membership: membershipData });
      },

      // Refresh membership from API
      refreshMembership: async () => {
        try {
          const response = await client.get('/api/membership/me');
          const membershipData = response.data.data;
          set({ membership: membershipData });
          return membershipData;
        } catch (error) {
          console.error('Error refreshing membership:', error);
          return null;
        }
      },
    }),
    {
      name: 'auth-store',
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          const item = localStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: (name) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(name);
          }
        },
      },
    }
  )
);
