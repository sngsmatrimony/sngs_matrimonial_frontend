'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { ShieldCheck, Users, Search, MessageCircle, Star, Heart, Award, CheckCircle2 } from 'lucide-react';

// Default hero content fallback
const DEFAULT_HERO_CONTENT = {
  badge: 'Welcome to SNGS Matrimonial',
  title: 'Find Your Perfect Match',
  subtitle: 'Within the Malayali Ezhava Community',
};

// Default content fallback
const DEFAULT_HOW_IT_WORKS = {
  sectionTitle: 'Find Your Partner In Just Few Steps',
  sectionSubtitle: 'SNGS Matrimonial will help you find your perfect match with just a few steps. You focus on what is most important to you, we do all the work.',
  steps: [
    {
      title: 'Create Profile',
      description: 'Register for free, add your details, and complete our trusted verification process.',
    },
    {
      title: 'Find Matches',
      description: 'Browse profiles using deep filters like Sub-caste, Family Deity, and Nakshatra.',
    },
    {
      title: 'Connect & Chat',
      description: 'Express interest securely and chat directly once there is mutual consent.',
    },
  ],
};

export default function Home() {
  const { token, user, initializeAuth } = useAuthStore();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initTimeout, setInitTimeout] = useState(false);
  const heroContent = DEFAULT_HERO_CONTENT;
  const howItWorksContent = DEFAULT_HOW_IT_WORKS;

  // Initialize auth on mount
  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      setIsInitialized(true);
    };
    init();
  }, [initializeAuth]);

  // Timeout safety net
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isInitialized) {
        setInitTimeout(true);
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [isInitialized]);


  // Redirect authenticated users
  useEffect(() => {
    if (isInitialized && token && user) {
      router.push('/browse');
    }
  }, [isInitialized, token, user, router]);

  // Loading state
  if ((!isInitialized && !initTimeout) || (token && user)) {
    return (
      <div className="min-h-screen bg-[#FDF8F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#F5E6C3] border-t-[#D4A843] animate-spin"></div>
          <p className="font-sans text-[#2C3E50] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F0] font-sans flex flex-col">
      <main className="flex-1">
        {/* 1. EXPANDED HERO SECTION */}
        <section className="relative w-full h-[85vh] min-h-[600px] flex items-center justify-center bg-[#1A1A1A]">
          <Image
            src="/images/bg_1.webp"
            alt="Traditional Malayali Wedding"
            fill
            priority
            className="object-cover opacity-65"
          />
          {/* Navy/Charcoal gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/50 to-transparent" />

          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <p className="font-sans text-[#D4A843] font-semibold text-sm uppercase tracking-[0.2em] mb-4">
              {heroContent.badge}
            </p>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-[56px] text-white font-bold leading-tight mb-6">
              {heroContent.title} <br />
              <span className="text-[#F5E6C3] text-3xl md:text-4xl lg:text-[42px] font-medium block mt-2">
                {heroContent.subtitle}
              </span>
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto font-light">
              Join thousands of verified families on a platform built on deep community roots, trust, and shared values.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/register" 
                className="w-full sm:w-auto bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] px-8 py-3.5 rounded-lg font-medium transition-all duration-300 text-lg shadow-lg"
              >
                Register Free
              </Link>
              <Link 
                href="/login" 
                className="w-full sm:w-auto border-2 border-[#F5E6C3] text-[#F5E6C3] hover:bg-[#F5E6C3] hover:text-[#1A1A1A] px-8 py-3.5 rounded-lg font-medium transition-all duration-300 text-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* 2. TRUST BAR: Key Statistics */}
        <section className="bg-[#2C3E50] py-8 border-b-4 border-[#D4A843]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-white/10">
              <div className="px-4">
                <div className="text-3xl font-serif text-[#D4A843] font-bold mb-1">5,000+</div>
                <div className="text-sm text-[#F5E6C3] uppercase tracking-wider font-medium">Members</div>
              </div>
              <div className="px-4">
                <div className="text-3xl font-serif text-[#D4A843] font-bold mb-1">500+</div>
                <div className="text-sm text-[#F5E6C3] uppercase tracking-wider font-medium">Success Stories</div>
              </div>
              <div className="px-4">
                <div className="text-3xl font-serif text-[#D4A843] font-bold mb-1">100%</div>
                <div className="text-sm text-[#F5E6C3] uppercase tracking-wider font-medium">Verified Profiles</div>
              </div>
              <div className="px-4">
                <div className="text-3xl font-serif text-[#D4A843] font-bold mb-1">Global</div>
                <div className="text-sm text-[#F5E6C3] uppercase tracking-wider font-medium">India & NRI</div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. OUR HERITAGE (Offline Alliances Placeholder) */}
        <section className="py-20 bg-[#FDF8F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] font-bold mb-4">Decades of Offline Trust,<br/>Now Online</h2>
              <div className="w-16 h-1 bg-[#D4A843] mx-auto mb-6"></div>
              <p className="text-[#2C3E50] text-lg leading-relaxed">
                Before SNGS Matrimony became a digital platform, we spent years facilitating offline marriage alliances, 
                bringing families together through community gatherings and personal introductions. 
                Our digital foundation is built on those real-world relationships.
              </p>
            </div>
            
           {/* 3. OUR HERITAGE (Offline Event Pictures) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 1, src: '/images/bg_2.jpg', alt: 'Community gathering event' },
                { id: 2, src: '/images/bg_3.jpg', alt: 'Traditional family meeting' },
                { id: 3, src: '/images/bg_4.jpg', alt: 'Matrimonial success event' }
              ].map((item) => (
                <div 
                  key={item.id} 
                  className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 border border-[#D4A843]/20 group"
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  {/* Optional: Subtle gradient overlay at the bottom to make the image pop */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. HOW IT WORKS */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] font-bold mb-4">
                {howItWorksContent.sectionTitle}
              </h2>
              <div className="w-16 h-1 bg-[#D4A843] mx-auto mb-6"></div>
              <p className="font-sans text-[#2C3E50] max-w-2xl mx-auto text-lg">
                {howItWorksContent.sectionSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-[#F5E6C3] via-[#D4A843] to-[#F5E6C3] z-0"></div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-[#FDF8F0] border-2 border-[#D4A843] rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <Users className="w-10 h-10 text-[#2C3E50]" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">{howItWorksContent.steps[0]?.title}</h3>
                <p className="text-[#2C3E50]">{howItWorksContent.steps[0]?.description}</p>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-[#FDF8F0] border-2 border-[#D4A843] rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <Search className="w-10 h-10 text-[#2C3E50]" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">{howItWorksContent.steps[1]?.title}</h3>
                <p className="text-[#2C3E50]">{howItWorksContent.steps[1]?.description}</p>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-[#FDF8F0] border-2 border-[#D4A843] rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <MessageCircle className="w-10 h-10 text-[#2C3E50]" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">{howItWorksContent.steps[2]?.title}</h3>
                <p className="text-[#2C3E50]">{howItWorksContent.steps[2]?.description}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. SUCCESS STORIES */}
        <section className="py-20 bg-[#2C3E50]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl text-white font-bold mb-4">Success Stories</h2>
              <div className="w-16 h-1 bg-[#D4A843] mx-auto mb-6"></div>
              <p className="text-[#F5E6C3] text-lg">Real couples who found their forever on SNGS Matrimony.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { names: "Rahul & Anjali", loc: "Bengaluru", quote: "We were looking for someone who shared our modern outlook but deeply respected our Ezhava traditions. SNGS made the search so seamless for our families." },
                { names: "Arun & Meera", loc: "Dubai, UAE", quote: "Being an NRI, finding the right match from Kerala seemed difficult. The specific location and horoscope filters helped us connect across borders." },
                { names: "Kiran & Divya", loc: "Kochi", quote: "The verification process gave my parents immense peace of mind. We met through the platform in January and were married by August." }
              ].map((review, idx) => (
                <div key={idx} className="bg-[#FDF8F0] rounded-2xl p-8 shadow-xl relative mt-8">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#D4A843] rounded-full flex items-center justify-center shadow-md border-4 border-[#FDF8F0]">
                    <Heart className="w-8 h-8 text-white fill-white" />
                  </div>
                  <div className="flex justify-center gap-1 mb-6 mt-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 text-[#D4A843] fill-[#D4A843]" />
                    ))}
                  </div>
                  <p className="text-[#1A1A1A] text-center italic mb-6 leading-relaxed">&ldquo;{review.quote}&rdquo;</p>
                  <div className="text-center border-t border-[#D4A843]/20 pt-4">
                    <h4 className="font-serif font-bold text-[#2C3E50] text-lg">{review.names}</h4>
                    <span className="text-sm text-[#C75B39] font-medium">{review.loc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. MEMBERSHIP & COMMUNITY TRUST */}
        <section className="py-20 bg-[#FDF8F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#D4A843]/20 overflow-hidden flex flex-col lg:flex-row">
              
              <div className="lg:w-1/2 p-8 sm:p-12 bg-gradient-to-br from-white to-[#F5E6C3]/30">
                <Award className="w-12 h-12 text-[#D4A843] mb-6" />
                <h2 className="font-serif text-3xl text-[#1A1A1A] font-bold mb-4">Premium Memberships</h2>
                <p className="text-[#2C3E50] mb-8">
                  Upgrade to unlock unlimited chats, priority profile listing, and a dedicated family dashboard with downloadable PDFs.
                </p>
                <ul className="space-y-4 mb-10">
                  {['Unlimited verified profile searches', 'Direct messaging with mutual consent', 'Downloadable horoscope & profile PDFs'].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#2E7D32] shrink-0 mt-0.5" />
                      <span className="text-[#1A1A1A] font-medium">{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/membership/purchase" className="inline-block bg-[#1A1A1A] text-white px-8 py-3.5 rounded-lg font-medium hover:bg-[#2C3E50] transition-colors shadow-lg">
                  View Pricing Plans
                </Link>
              </div>

              <div className="lg:w-1/2 p-8 sm:p-12 bg-[#2C3E50] text-white flex flex-col justify-center">
                <ShieldCheck className="w-12 h-12 text-[#D4A843] mb-6" />
                <h2 className="font-serif text-3xl font-bold mb-4">Safe. Private. Verified.</h2>
                <p className="text-[#F5E6C3] mb-8">
                  Your family&apos;s privacy is our top priority. We use strict data masking to ensure your contact details are only shared when you are ready.
                </p>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-[#D4A843] mb-1">Manual Profile Approvals</h4>
                    <p className="text-sm text-white/80">Every profile is reviewed by our admin team before becoming active.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#D4A843] mb-1">Contact Masking</h4>
                    <p className="text-sm text-white/80">Phone numbers remain hidden until mutual consent is established.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}