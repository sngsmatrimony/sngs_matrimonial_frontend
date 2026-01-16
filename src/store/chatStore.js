'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosClient from '@/lib/api/client';

const useChatStore = create(
  persist(
    (set, get) => ({
      // State
      conversations: [],
      activeConversationId: null,
      messages: [],
      typingUsers: new Map(),
      onlineUsers: new Set(),
      unreadCounts: new Map(),
      isLoading: false,
      isLoadingMessages: false,
      isSending: false,
      error: null,
      currentUserKeys: null,
      otherUsersKeys: new Map(),

      // Actions
      setActiveConversationId: (conversationId) => {
        set({ activeConversationId: conversationId });
      },

      /**
       * Load all conversations for current user
       */
      loadConversations: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await axiosClient.get('/api/chat/conversations');
          const validConversations = response.data.data.filter((conv) => {
            return conv.otherParticipant && conv.otherParticipant.fullName;
          });

          set({
            conversations: validConversations,
            isLoading: false,
          });
          return validConversations;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to load conversations',
            isLoading: false,
          });
        }
      },

      /**
       * Get or create conversation with a user
       */
      getOrCreateConversation: async (otherUserId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axiosClient.get(
            `/api/chat/conversations/${otherUserId}`
          );
          const conversation = response.data.data;

          // Add to conversations list if not already there, and always set as active
          set((state) => {
            const exists = state.conversations.find(
              (c) => c._id === conversation._id
            );

            // Always set the active conversation ID when opening a conversation
            const newState = {
              activeConversationId: conversation._id,
              isLoading: false,
            };

            // Only add to conversations list if it's a new conversation
            if (!exists) {
              newState.conversations = [conversation, ...state.conversations];
            }

            return newState;
          });

          return conversation;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to get conversation',
            isLoading: false,
          });
        }
      },

      /**
       * Create conversation and send first message
       * Used when starting a new conversation from profile chat button
       */
      createConversationWithMessage: async (otherUserId, messageContent) => {
        set({ isSending: true, error: null });
        try {
          const response = await axiosClient.post(
            `/api/chat/users/${otherUserId}/conversations/messages`,
            { content: messageContent }
          );

          const { conversation, message } = response.data.data;

          // Add conversation to list and set as active
          set((state) => ({
            conversations: [conversation, ...state.conversations],
            activeConversationId: conversation._id,
            messages: [message],
            isSending: false,
          }));

          return { conversation, message };
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to send message',
            isSending: false,
          });
          throw error;
        }
      },

      /**
       * Load messages for a conversation
       */
      loadMessages: async (conversationId, limit = 50, offset = 0) => {
        set({ isLoadingMessages: true, error: null });
        try {
          const response = await axiosClient.get(
            `/api/chat/conversations/${conversationId}/messages`,
            { params: { limit, offset } }
          );

          const newMessages = response.data.data;

          set((state) => ({
            messages:
              offset === 0
                ? newMessages
                : [...newMessages, ...state.messages],
            isLoadingMessages: false,
          }));

          return newMessages;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to load messages',
            isLoadingMessages: false,
          });
        }
      },

      /**
       * Add new message to messages list
       */
      addMessage: (message) => {
        set((state) => ({
          messages: [...state.messages, message],
        }));
      },

      /**
       * Send a new message
       */
      sendMessage: async (conversationId, content) => {
        set({ isSending: true, error: null });
        try {
          const response = await axiosClient.post(
            `/api/chat/conversations/${conversationId}/messages`,
            { content }
          );

          const newMessage = response.data.data;

          // Add message to messages list
          get().addMessage(newMessage);

          // Update conversation with new message
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv._id === conversationId
                ? {
                    ...conv,
                    lastMessage: newMessage,
                  }
                : conv
            ),
            isSending: false,
          }));

          return newMessage;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to send message',
            isSending: false,
          });
          throw error;
        }
      },

      /**
       * Update message status (delivered/read)
       */
      updateMessageStatus: (messageId, status, data) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg._id === messageId
              ? {
                  ...msg,
                  [status]: status === 'readBy' ? [data] : data,
                }
              : msg
          ),
        }));
      },

      /**
       * Add typing user to set
       */
      setUserTyping: (userId, isTyping) => {
        set((state) => {
          const typingUsers = new Map(state.typingUsers);
          if (isTyping) {
            typingUsers.set(userId, true);
          } else {
            typingUsers.delete(userId);
          }
          return { typingUsers };
        });
      },

      /**
       * Set user online status
       */
      setUserOnline: (userId, isOnline) => {
        set((state) => {
          const onlineUsers = new Set(state.onlineUsers);
          if (isOnline) {
            onlineUsers.add(userId);
          } else {
            onlineUsers.delete(userId);
          }
          return { onlineUsers };
        });
      },

      /**
       * Mark message as read
       */
      markMessageAsRead: async (messageId, conversationId) => {
        try {
          await axiosClient.patch(`/api/chat/messages/${messageId}/read`, {
            conversationId,
          });

          get().updateMessageStatus(messageId, 'readBy', {
            userId: get().currentUserKeys?.userId,
            readAt: new Date(),
          });

          // Update conversation unread count
          set((state) => {
            const conversations = state.conversations.map((conv) =>
              conv._id === conversationId
                ? {
                    ...conv,
                    unreadCount: 0,
                  }
                : conv
            );
            return { conversations };
          });
        } catch {
          // Silently fail for read receipts
        }
      },

      /**
       * Mark all messages in a conversation as read
       */
      markConversationAsRead: async (conversationId) => {
        try {
          const state = get();
          const unreadMessages = state.messages.filter(
            (msg) => !msg.readBy || msg.readBy.length === 0
          );

          // Mark all unread messages as read
          for (const message of unreadMessages) {
            await axiosClient.patch(`/api/chat/messages/${message._id}/read`, {
              conversationId,
            });
            get().updateMessageStatus(message._id, 'readBy', {
              userId: get().currentUserKeys?.userId,
              readAt: new Date(),
            });
          }

          // Update conversation unread count to 0
          set((state) => {
            const conversations = state.conversations.map((conv) =>
              conv._id === conversationId
                ? {
                    ...conv,
                    unreadCount: 0,
                  }
                : conv
            );
            return { conversations };
          });
        } catch {
          // Silently fail for read receipts
        }
      },

      /**
       * Delete conversation
       */
      deleteConversation: async (conversationId) => {
        set({ isLoading: true, error: null });
        try {
          await axiosClient.delete(
            `/api/chat/conversations/${conversationId}`
          );

          set((state) => ({
            conversations: state.conversations.filter(
              (c) => c._id !== conversationId
            ),
            activeConversationId:
              state.activeConversationId === conversationId
                ? null
                : state.activeConversationId,
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to delete conversation',
            isLoading: false,
          });
        }
      },

      /**
       * Register user's encryption keys
       */
      registerKeys: async (identityKeyPair, signedPreKey, preKeys) => {
        try {
          const response = await axiosClient.post('/api/chat/keys/register', {
            identityKeyPair,
            signedPreKey,
            preKeys,
          });

          set({
            currentUserKeys: response.data.data,
          });

          return response.data.data;
        } catch (error) {
          throw error;
        }
      },

      /**
       * Get user's public keys
       */
      getUserPublicKeys: async (userId) => {
        try {
          const cached = get().otherUsersKeys.get(userId);
          if (cached) return cached;

          const response = await axiosClient.get(`/api/chat/keys/${userId}`);
          const keys = response.data.data;

          set((state) => ({
            otherUsersKeys: new Map(state.otherUsersKeys).set(userId, keys),
          }));

          return keys;
        } catch (error) {
          throw error;
        }
      },

      /**
       * Clear error
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Clear all chat data
       */
      clearChat: () => {
        set({
          conversations: [],
          activeConversationId: null,
          messages: [],
          typingUsers: new Map(),
          onlineUsers: new Set(),
          unreadCounts: new Map(),
          currentUserKeys: null,
          otherUsersKeys: new Map(),
        });
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        // Convert Map to Object for serialization
        unreadCounts: Object.fromEntries(state.unreadCounts),
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        // Convert Object back to Map on hydration
        unreadCounts: new Map(Object.entries(persistedState?.unreadCounts || {})),
      }),
    }
  )
);

export default useChatStore;
