'use client';

import ChatLayout from '@/components/chat/ChatLayout';
import { useLandingStore } from '@/store/landingStore';

export default function MessagesPage() {
  const { selectedChatUserId } = useLandingStore();
  
  return <ChatLayout initialUserId={selectedChatUserId} />;
}
