'use client';

import PasswordSection from './PasswordSection';
// TEMPORARILY DISABLED: Membership section (no live payment keys yet)
// import MembershipSection from './MembershipSection';
import AccountManagementSection from './AccountManagementSection';

export default function UserSettings() {
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-[#1A1A1A] mb-2">Settings</h1>
        <p className="font-sans text-[#2C3E50]/70">
          Manage your account security and preferences
        </p>
      </div>

      <div className="space-y-6">
        <PasswordSection />
        {/* TEMPORARILY DISABLED: Membership section (no live payment keys yet)
        <MembershipSection />
        */}
        <AccountManagementSection />
      </div>
    </div>
  );
}
