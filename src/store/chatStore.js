'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosClient from '@/lib/api/client';

// ChatList reads conversation.lastMessage.preview (that's the shape
// GET /api/chat/conversations returns, built server-side from
// content.substring(0, 100) - see chat.controller.js). A message object
// from the send/receive path only has `.content`, not `.preview`, so
// writing it straight into lastMessage silently breaks the sidebar preview
// ("No messages yet") until the next full conversation-list reload.
function toListPreview(message) {
  return {
    ...message,
    preview: (message?.content || '').substring(0, 100),
  };
}

const useChatStore = create(
  persist(
    (set, get) => ({
      // State
      conversations: [],
      activeConversationId: null,
      messages: [],
      typingUsers: new Map(),
      onlineUsers: new Set(),
      isLoading: false,
      isLoadingMessages: false,
      isSending: false,
      error: null,
      currentUserKeys: null,
      otherUsersKeys: new Map(),
      // Track in-flight requests to prevent duplicates
      pendingConversationRequests: new Set(),

      // Actions
      setActiveConversationId: (conversationId) => {
        set({ activeConversationId: conversationId });
      },

      /**
       * Load all conversations for current user
       * Deduplicates by otherParticipant._id
       */
      loadConversations: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await axiosClient.get('/api/chat/conversations');
          const validConversations = response.data.data.filter((conv) => {
            return conv.otherParticipant && conv.otherParticipant.fullName;
          });

          // Deduplicate conversations by otherParticipant._id
          const seen = new Map();
          const deduplicatedConversations = validConversations.filter((conv) => {
            const participantId = conv.otherParticipant?._id;
            if (!participantId || seen.has(participantId)) {
              return false;
            }
            seen.set(participantId, true);
            return true;
          });

          set((state) => {
            // This runs on every socket reconnect (SocketContext.jsx), which
            // can fire seconds after a conversation was already opened via
            // getOrCreateConversation. A blind replace here can race with
            // that: if this fetch's snapshot predates the conversation
            // becoming query-able server-side, it silently drops the one
            // conversation the user is actively looking at, kicking their
            // open chat back to the empty "select a conversation" state.
            // Keep the actively-open conversation even if this particular
            // fetch didn't return it.
            const merged = deduplicatedConversations.some((c) => c._id === state.activeConversationId)
              ? deduplicatedConversations
              : (() => {
                  const stillActive = state.conversations.find((c) => c._id === state.activeConversationId);
                  return stillActive ? [stillActive, ...deduplicatedConversations] : deduplicatedConversations;
                })();

            return { conversations: merged, isLoading: false };
          });
          return deduplicatedConversations;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to load conversations',
            isLoading: false,
          });
        }
      },

      /**
       * Get or create conversation with a user
       * Prevents duplicate requests and deduplicates by participant ID
       */
      getOrCreateConversation: async (otherUserId) => {
        // Prevent duplicate requests for the same user
        const pendingRequests = get().pendingConversationRequests;
        if (pendingRequests.has(otherUserId)) {
          // Request already in progress, find existing conversation and set as active
          const existingConv = get().conversations.find(
            (c) => c.otherParticipant?._id === otherUserId
          );
          if (existingConv) {
            set({ activeConversationId: existingConv._id });
            return existingConv;
          }
          return null;
        }

        // Check if conversation already exists by other participant ID
        const existingConv = get().conversations.find(
          (c) => c.otherParticipant?._id === otherUserId
        );
        if (existingConv) {
          set({ activeConversationId: existingConv._id });
          return existingConv;
        }

        // Mark request as pending
        set((state) => ({
          pendingConversationRequests: new Set(state.pendingConversationRequests).add(otherUserId),
          isLoading: true,
          error: null,
        }));

        try {
          const response = await axiosClient.get(
            `/api/chat/conversations/${otherUserId}`
          );
          const conversation = response.data.data;

          // Add to conversations list if not already there, and always set as active
          set((state) => {
            // Check by both conversation ID and participant ID to prevent duplicates
            const existsByConvId = state.conversations.find(
              (c) => c._id === conversation._id
            );
            const existsByParticipantId = state.conversations.find(
              (c) => c.otherParticipant?._id === otherUserId
            );

            // Remove from pending requests
            const newPendingRequests = new Set(state.pendingConversationRequests);
            newPendingRequests.delete(otherUserId);

            // Always set the active conversation ID when opening a conversation
            const newState = {
              activeConversationId: conversation._id,
              isLoading: false,
              pendingConversationRequests: newPendingRequests,
            };

            // Only add to conversations list if it's truly a new conversation
            if (!existsByConvId && !existsByParticipantId) {
              newState.conversations = [conversation, ...state.conversations];
            }

            return newState;
          });

          return conversation;
        } catch (error) {
          // Clear pending request on error
          set((state) => {
            const newPendingRequests = new Set(state.pendingConversationRequests);
            newPendingRequests.delete(otherUserId);
            return {
              error: error.response?.data?.message || 'Failed to get conversation',
              isLoading: false,
              pendingConversationRequests: newPendingRequests,
            };
          });
        }
      },

      /**
       * Create conversation and send first message
       * Used when starting a new conversation from profile chat button
       * Prevents duplicate conversations
       */
      createConversationWithMessage: async (otherUserId, messageContent) => {
        // Check if conversation already exists
        const existingConv = get().conversations.find(
          (c) => c.otherParticipant?._id === otherUserId
        );
        if (existingConv) {
          // Use existing conversation, just send the message
          set({ activeConversationId: existingConv._id });
          const message = await get().sendMessage(existingConv._id, messageContent);
          return { conversation: existingConv, message };
        }

        set({ isSending: true, error: null });
        try {
          const response = await axiosClient.post(
            `/api/chat/users/${otherUserId}/conversations/messages`,
            { content: messageContent }
          );

          const { conversation, message } = response.data.data;

          // Add conversation to list and set as active (with duplicate check)
          set((state) => {
            const existsByConvId = state.conversations.find(
              (c) => c._id === conversation._id
            );
            const existsByParticipantId = state.conversations.find(
              (c) => c.otherParticipant?._id === otherUserId
            );

            const newState = {
              activeConversationId: conversation._id,
              messages: [message],
              isSending: false,
            };

            if (!existsByConvId && !existsByParticipantId) {
              newState.conversations = [conversation, ...state.conversations];
            }

            return newState;
          });

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
       * Receive message from socket - updates both messages and conversation list
       * @param {Object} message - The received message
       * @param {string} conversationId - The conversation ID
       */
      receiveMessage: (message, conversationId) => {
        const conversationExists = get().conversations.some((c) => c._id === conversationId);

        // The socket payload only ever carries { message, conversationId } —
        // never the full conversation (otherParticipant, createdAt, etc.), so
        // a brand-new conversation's first message has nothing to merge into
        // the list here. Without this, the badge/preview silently stayed
        // stale until the next manual reload re-fetched the list from the API.
        if (!conversationExists) {
          get().loadConversations();
          if (get().activeConversationId === conversationId) {
            set((state) => ({ messages: [...state.messages, message] }));
          }
          return;
        }

        set((state) => {
          // Only add to messages if this is the active conversation
          const isActiveConversation = state.activeConversationId === conversationId;

          // Update conversations list - move to top and update lastMessage
          const updatedConversations = state.conversations.map((conv) =>
            conv._id === conversationId
              ? {
                  ...conv,
                  lastMessage: toListPreview(message),
                  unreadCount: isActiveConversation ? 0 : (conv.unreadCount || 0) + 1,
                }
              : conv
          );

          // Sort conversations to put most recent at top
          updatedConversations.sort((a, b) => {
            const aTime = a.lastMessage?.timestamp || a.createdAt;
            const bTime = b.lastMessage?.timestamp || b.createdAt;
            return new Date(bTime) - new Date(aTime);
          });

          return {
            messages: isActiveConversation
              ? [...state.messages, message]
              : state.messages,
            conversations: updatedConversations,
          };
        });
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
                    lastMessage: toListPreview(newMessage),
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
       * Track who is typing in each conversation (conversationId -> userId),
       * so a typing indicator never leaks into a different open chat.
       */
      setUserTyping: (userId, isTyping, conversationId) => {
        if (!conversationId) return;
        set((state) => {
          const typingUsers = new Map(state.typingUsers);
          if (isTyping) {
            typingUsers.set(conversationId, userId);
          } else if (typingUsers.get(conversationId) === userId) {
            typingUsers.delete(conversationId);
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

          get().updateMessageStatus(messageId, 'isRead', true);

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
       * @param {string} conversationId
       * @param {string} currentUserId - passed in by the caller (chatStore
       *   doesn't otherwise know who's logged in) so messages the current
       *   user sent themselves are never re-submitted as "read".
       */
      markConversationAsRead: async (conversationId, currentUserId) => {
        try {
          const state = get();
          // The API returns messages with an `isRead` boolean (see
          // getConversationMessages), not a `readBy` array — filtering on
          // `readBy` here always matched every message (it's never present
          // on this shape), which silently re-marked the whole history,
          // including the current user's own messages, on every open.
          const unreadMessages = state.messages.filter((msg) => {
            const senderId = typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId;
            const isOwnMessage = currentUserId && senderId?.toString() === currentUserId.toString();
            return !isOwnMessage && !msg.isRead;
          });

          // Mark all unread messages as read
          for (const message of unreadMessages) {
            await axiosClient.patch(`/api/chat/messages/${message._id}/read`, {
              conversationId,
            });
            get().updateMessageStatus(message._id, 'isRead', true);
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
          currentUserKeys: null,
          otherUsersKeys: new Map(),
        });
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
      }),
    }
  )
);

export default useChatStore;
