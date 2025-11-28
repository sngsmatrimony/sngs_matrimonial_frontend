'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import useChatStore from '@/store/chatStore';
import {
  initializeSocket,
  disconnectSocket,
  onMessageReceived,
  onMessageDelivered,
  onMessageReadReceipt,
  onTypingIndicator,
  onUserOnline,
  onUserOffline,
} from '@/lib/socket';
import {
  generateKeyPair,
  exportPrivateKey,
  exportPublicKey,
  encryptMessage,
  decryptMessage,
} from '@/lib/encryption';
import Header from '@/components/layout/Header';
import ChatLayout from '@/components/chat/ChatLayout';
import { toastError, toastSuccess, toastInfo } from '@/lib/toast';
import axiosClient from '@/lib/api/client';

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, isLoading: authLoading } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    messages,
    loadConversations,
    addMessage,
    updateMessageStatus,
    setUserTyping,
    setUserOnline,
    registerKeys,
    getUserPublicKeys,
  } = useChatStore();

  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [userKeys, setUserKeys] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // Get userId from URL params if provided
  const userIdFromParams = searchParams.get('userId');

  /**
   * Initialize Socket.io connection and setup listeners
   */
  useEffect(() => {
    if (!user || !token || authLoading) return;

    const initSocket = async () => {
      try {
        // Initialize Socket.io
        const socketInstance = initializeSocket(token);
        setSocket(socketInstance);
        setIsConnected(true);
        toastInfo('Connected to chat');

        // Setup Socket.io event listeners
        onMessageReceived(({ message, conversationId }) => {
          addMessage(message);
          toastInfo(`New message from ${message.senderId.fullName}`);
        });

        onMessageDelivered(({ messageId, conversationId }) => {
          updateMessageStatus(messageId, 'deliveredTo', user._id);
        });

        onMessageReadReceipt(({ messageId, readBy }) => {
          updateMessageStatus(messageId, 'readBy', {
            userId: readBy,
            readAt: new Date(),
          });
        });

        onTypingIndicator(({ userId, isTyping }) => {
          setUserTyping(userId, isTyping);
        });

        onUserOnline(({ userId }) => {
          setUserOnline(userId, true);
        });

        onUserOffline(({ userId }) => {
          setUserOnline(userId, false);
        });
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        toastError('Failed to connect to chat');
      }
    };

    initSocket();

    return () => {
      disconnectSocket();
    };
  }, [user, token, authLoading, addMessage, updateMessageStatus, setUserTyping, setUserOnline]);

  /**
   * Initialize encryption keys
   */
  useEffect(() => {
    if (!user || !token || authLoading) return;

    const initializeKeys = async () => {
      try {
        // Check if keys are already registered
        const { publicKey, privateKey } = await generateKeyPair();
        setUserKeys({
          publicKey,
          privateKey,
        });

        // Export keys to JWK format
        const publicKeyJWK = await exportPublicKey(publicKey);
        const privateKeyJWK = await exportPrivateKey(privateKey);

        // For simplicity, we'll just store them locally
        // In production, register with backend
        localStorage.setItem(
          `user_keys_${user._id}`,
          JSON.stringify({
            publicKey: publicKeyJWK,
            privateKey: privateKeyJWK,
          })
        );

        toastSuccess('Encryption keys initialized');
      } catch (error) {
        console.error('Failed to initialize encryption:', error);
        toastError('Failed to initialize encryption keys');
      }
    };

    initializeKeys();
  }, [user, token, authLoading]);

  /**
   * Load conversations on mount
   */
  useEffect(() => {
    if (!user || !isConnected) return;

    loadConversations();
  }, [user, isConnected, loadConversations]);

  /**
   * Open conversation with specific user if userId provided
   */
  useEffect(() => {
    if (!userIdFromParams || !user || !socket) return;

    const openConversation = async () => {
      try {
        await loadConversations();
        // The conversation will be created/loaded when user clicks
      } catch (error) {
        console.error('Failed to open conversation:', error);
      }
    };

    openConversation();
  }, [userIdFromParams, user, socket, loadConversations]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-medium" style={{ fontFamily: 'Maven Pro' }}>
            Loading chat...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-white">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive mb-4" style={{ fontFamily: 'Maven Pro' }}>
            Not authenticated
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md"
            style={{ fontFamily: 'Telex' }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header showLogout={true} />
      <div className="flex-1 overflow-hidden">
        <ChatLayout
          initialUserId={userIdFromParams}
          conversations={conversations}
          socket={socket}
          userKeys={userKeys}
          isSending={isSending}
          setIsSending={setIsSending}
        />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-full h-screen bg-white">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-medium" style={{ fontFamily: 'Maven Pro' }}>
              Loading chat...
            </p>
          </div>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
