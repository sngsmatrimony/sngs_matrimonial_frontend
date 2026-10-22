"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/store/adminAuthStore";
import { BarChart3, Users, Settings, Shield, LogOut, CreditCard, ScrollText, Phone, Receipt, UserPlus, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import HelpButton from "@/components/layout/HelpButton";
import { adminApi } from "@/lib/api/admin";

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const { admin, isLoading, logout, initializeAuth } = useAdminAuthStore();

    // Don't protect login and forgot password routes
    const isAuthRoute =
        pathname === "/admin/login" ||
        pathname.startsWith("/admin/forgot-password");

    // Polled so the header badges reflect new pending activity without a
    // manual refresh — only enabled once actually authenticated so these
    // don't fire on the login screen.
    const { data: pendingApprovalData } = useQuery({
        queryKey: ["adminPendingApprovalCount"],
        queryFn: async () => (await adminApi.getPendingApprovalCount()).data,
        enabled: !isAuthRoute && !!admin,
        refetchInterval: 60 * 1000,
    });
    // Badge = profiles awaiting approval + ID proofs uploaded after approval
    // that still need a check.
    const idProofPendingCount = pendingApprovalData?.data?.idProofPendingCount || 0;
    const pendingApprovalCount = (pendingApprovalData?.data?.pendingCount || 0) + idProofPendingCount;

    // Initialize auth and determine authorization
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    useEffect(() => {
        if (!isLoading && !isAuthRoute) {
            if (!admin) {
                router.push("/admin/login");
            }
        }
    }, [admin, isLoading, router, isAuthRoute]);

    const handleLogout = () => {
        logout();
        router.push("/admin/login");
    };

    // For login and forgot password pages, just render the content without the admin layout
    if (isAuthRoute) {
        return children;
    }

    // !admin: the redirect effect above is on its way — don't flash the
    // portal (or fire its API calls) for a signed-out visitor meanwhile.
    if (isLoading || !admin) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-secondary">Loading admin portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Top Header - Similar to Dashboard */}
                <header className="border-b border-gray-100 bg-white shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-2">
                        <Link href="/admin" className="flex items-center gap-2 sm:gap-3 min-w-0 hover:opacity-80 transition-opacity cursor-pointer">
                            <Image
                                src="/logo_1.png"
                                alt="SNGS Matrimonial Logo"
                                width={48}
                                height={48}
                                className="h-10 sm:h-12 w-auto"
                                style={{ width: 'auto', height: 'auto' }}
                            />
                            <h1 className="font-serif text-lg sm:text-2xl text-accent whitespace-nowrap">
                                SNGS Admin
                            </h1>
                        </Link>

                        {/* Welcome Message - Center */}
                        <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
                            <span className="font-sans text-gray-600">
                                Welcome,
                            </span>
                            <span className="font-serif text-secondary">
                                {admin?.email?.split("@")[0]}
                            </span>
                        </div>

                        {/* Help Button - Right */}
                        <HelpButton />

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-sans"
                        >
                            <LogOut size={18} />
                            <span>Logout</span>
                        </button>
                    </div>
                </header>

                {/* Navigation Tabs */}
                <div className="bg-black border-b border-gray-900">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-5 sm:gap-6 2xl:gap-8 overflow-x-auto text-sm 2xl:text-base">
                            <Link
                                href="/admin"
                                className={`py-4 font-sans font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                                    pathname === "/admin"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-white hover:text-gray-300"
                                }`}
                            >
                                <BarChart3 size={20} />
                                <span>
                                    Dashboard
                                </span>
                            </Link>
                            <Link
                                href="/admin/users"
                                className={`relative py-4 font-sans font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                                    pathname.startsWith("/admin/users")
                                        ? "border-primary text-primary"
                                        : "border-transparent text-white hover:text-gray-300"
                                }`}
                            >
                                <span className="relative">
                                    <Users size={20} />
                                    {pendingApprovalCount > 0 && (
                                        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-semibold flex items-center justify-center">
                                            {pendingApprovalCount > 9 ? "9+" : pendingApprovalCount}
                                        </span>
                                    )}
                                </span>
                                <span>Users</span>
                            </Link>
                            <Link
                                href="/admin/membership-plans"
                                className={`py-4 font-sans font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                                    pathname.startsWith("/admin/membership-plans")
                                        ? "border-primary text-primary"
                                        : "border-transparent text-white hover:text-gray-300"
                                }`}
                            >
                                <CreditCard size={20} />
                                <span>Plans</span>
                            </Link>
                            <Link
                                href="/admin/transactions"
                                className={`py-4 font-sans font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                                    pathname.startsWith("/admin/transactions")
                                        ? "border-primary text-primary"
                                        : "border-transparent text-white hover:text-gray-300"
                                }`}
                            >
                                <Receipt size={20} />
                                <span>Transactions</span>
                            </Link>
                            <Link
                                href="/admin/activity-logs"
                                className={`py-4 font-sans font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                                    pathname.startsWith("/admin/activity-logs")
                                        ? "border-primary text-primary"
                                        : "border-transparent text-white hover:text-gray-300"
                                }`}
                            >
                                <ScrollText size={20} />
                                <span>Activity Logs</span>
                            </Link>
                            <Link
                                href="/admin/phone-requests"
                                className={`py-4 font-sans font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                                    pathname.startsWith("/admin/phone-requests")
                                        ? "border-primary text-primary"
                                        : "border-transparent text-white hover:text-gray-300"
                                }`}
                            >
                                <Phone size={20} />
                                <span>Contact Unlocks</span>
                            </Link>
                            <Link
                                href="/admin/registration-leads"
                                className={`py-4 font-sans font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                                    pathname.startsWith("/admin/registration-leads")
                                        ? "border-primary text-primary"
                                        : "border-transparent text-white hover:text-gray-300"
                                }`}
                            >
                                <UserPlus size={20} />
                                <span>Started Filling</span>
                            </Link>
                            <Link
                                href="/admin/alliance-registrations"
                                className={`py-4 font-sans font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                                    pathname.startsWith("/admin/alliance-registrations")
                                        ? "border-primary text-primary"
                                        : "border-transparent text-white hover:text-gray-300"
                                }`}
                            >
                                <CalendarCheck size={20} />
                                <span>Alliance Meet</span>
                            </Link>
                            <Link
                                href="/admin/admins"
                                className={`py-4 font-sans font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                                    pathname.startsWith("/admin/admins")
                                        ? "border-primary text-primary"
                                        : "border-transparent text-white hover:text-gray-300"
                                }`}
                            >
                                <Shield size={20} />
                                <span>Admins</span>
                            </Link>
                            <Link
                                href="/admin/settings"
                                className={`py-4 font-sans font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                                    pathname.startsWith("/admin/settings")
                                        ? "border-primary text-primary"
                                        : "border-transparent text-white hover:text-gray-300"
                                }`}
                            >
                                <Settings size={20} />
                                <span>
                                    Settings
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <div className="flex-1 p-6 overflow-auto">{children}</div>
            </main>
        </div>
    );
}
