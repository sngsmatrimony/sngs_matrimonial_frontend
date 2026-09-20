'use client';

import Header from '@/components/layout/Header';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <Header showLogout={false} />
      <div className="relative">
        {/* soft fade bridging the white header into the cream page — short and local, not stretched across the page */}
        <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-white to-transparent pointer-events-none" aria-hidden="true" />
        <div className="relative flex items-center justify-center bg-[#FDF8F0] p-4 min-h-[calc(100vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}