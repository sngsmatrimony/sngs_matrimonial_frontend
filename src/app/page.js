'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { LogOut, User, Heart, Compass, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useLandingStore } from '@/store/landingStore';
import BrowseProfiles from '@/components/profile/BrowseProfiles';
import LikedProfiles from '@/components/profile/LikedProfiles';
import UserProfileView from '@/components/profile/UserProfileView';
import ChatLayout from '@/components/chat/ChatLayout';

export default function Home() {
  const { token, user, initializeAuth, logout } = useAuthStore();
  const { activeTab, setActiveTab, selectedChatUserId } = useLandingStore();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      setIsInitialized(true);
    };
    init();
  }, [initializeAuth]);

  // Show loader while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-primary animate-spin"></div>
          <p className="font-maven text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  const isAuthenticated = token && user;

  if (isAuthenticated) {
    const handleLogout = () => {
      logout();
      router.push('/login');
    };

    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-gray-100 fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.jpeg"
                alt="SNGS Matrimonial Logo"
                width={48}
                height={48}
                className="w-auto h-12"
              />
              <h1 className="font-viga text-2xl text-accent hidden sm:block">
                SNGS Matrimonial
              </h1>
            </div>

            {/* Welcome Message */}
            <div className="hidden md:flex items-center gap-2">
              <span className="font-maven text-gray-600">Welcome,</span>
              <span className="font-viga text-secondary">{user?.fullName}</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-telex"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-black border-b border-gray-900 pt-2 mt-4 fixed top-16 left-0 right-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-8 overflow-x-auto">
              {/* Browse Tab */}
              <button
                onClick={() => setActiveTab('browse')}
                className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'browse'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-white hover:text-gray-300'
                }`}
              >
                <Compass size={20} />
                <span className="hidden sm:inline">Browse</span>
              </button>

              {/* Liked Tab */}
              <button
                onClick={() => setActiveTab('liked')}
                className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'liked'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-white hover:text-gray-300'
                }`}
              >
                <Heart size={20} />
                <span className="hidden sm:inline">Liked</span>
              </button>

              {/* Messages Tab */}
              <button
                onClick={() => setActiveTab('messages')}
                className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'messages'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-white hover:text-gray-300'
                }`}
              >
                <MessageCircle size={20} />
                <span className="hidden sm:inline">Messages</span>
              </button>

              {/* Profile Tab */}
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-white hover:text-gray-300'
                }`}
              >
                <User size={20} />
                <span className="hidden sm:inline">My Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white pt-32 mt-4">
          {activeTab === 'browse' && <BrowseProfiles />}
          {activeTab === 'liked' && <LikedProfiles />}
          {activeTab === 'messages' && <ChatLayout initialUserId={selectedChatUserId} />}
          {activeTab === 'profile' && <UserProfileView />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.jpeg"
              alt="SNGS Matrimonial Logo"
              width={48}
              height={48}
              className="w-auto h-12"
            />
            <h1 className="font-viga text-2xl text-accent">SNGS Matrimonial</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="font-telex text-accent font-semibold text-sm uppercase tracking-wide">
                Welcome to SNGS Matrimonial
              </p>
              <h2 className="font-viga text-4xl sm:text-5xl text-secondary leading-tight">
                Find Your Perfect Match
              </h2>
              <p className="font-maven text-lg text-gray-600 leading-relaxed">
                Join thousands of individuals on their journey to find true companionship. Our secure platform connects you with compatible matches based on values, interests, and life goals.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 font-telex font-semibold shadow-lg hover:shadow-xl transition-all">
                  Sign Up
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full border-2 border-secondary text-secondary hover:bg-gray-100 hover:text-secondary h-12 font-telex">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative h-96 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="/images/bg_1.jpg"
              alt="Happy couples"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h3 className="font-viga text-3xl sm:text-4xl text-secondary mb-4">
            Find Your Partner In Just Few Steps
          </h3>
          <p className="font-maven text-gray-600 max-w-2xl mx-auto text-lg">
            SNGS Matrimonial will help you find your perfect match with just a few steps. You focus on what is most important to you, we do all the work.
          </p>
        </div>

        {/* Steps Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6 relative z-10">
              <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h4 className="font-viga text-2xl text-secondary mb-3">Create Profile</h4>
            <p className="font-maven text-gray-600">
              Register to SNGS Matrimonial, fill up your profile completely, and put a beautiful image to showcase yourself.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-accent/10 mb-6 relative z-10">
              <svg className="w-12 h-12 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h4 className="font-viga text-2xl text-secondary mb-3">Find Your Partner</h4>
            <p className="font-maven text-gray-600">
              Search for interests that you like. You&apos;ll also be recommended users based on your preferences and values.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/10 mb-6 relative z-10">
              <svg className="w-12 h-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className="font-viga text-2xl text-secondary mb-3">Connect & Chat</h4>
            <p className="font-maven text-gray-600">
              Add friends, approach them, and chat with them. Be sure to share your audio, photos, and videos too.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center mt-16">
          <Link href="/register">
            <Button className="font-telex bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 font-semibold shadow-lg hover:shadow-xl transition-all">
              Sign Up Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
