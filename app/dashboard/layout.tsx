'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import OnboardingModal from '@/components/OnboardingModal';
import apiService from '@/lib/api.service';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [checkingProfiles, setCheckingProfiles] = useState(true);

    useEffect(() => {
        console.log('DashboardLayout: Auth check - loading:', loading, 'isAuthenticated:', isAuthenticated);
        if (!loading && !isAuthenticated) {
            console.log('DashboardLayout: Redirecting to login...');
            router.push('/auth/login');
        }
    }, [isAuthenticated, loading, router]);

    // Check for business profiles to trigger onboarding
    useEffect(() => {
        const checkOnboarding = async () => {
            if (isAuthenticated && !loading) {
                try {
                    const profiles = await apiService.getBusinessProfiles();
                    if (!profiles || profiles.length === 0) {
                        setShowOnboarding(true);
                    }
                } catch (error) {
                    console.error('Failed to check business profiles:', error);
                } finally {
                    setCheckingProfiles(false);
                }
            }
        };

        checkOnboarding();
    }, [isAuthenticated, loading]);

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
        // Refresh the page or trigger a re-fetch if needed
        window.location.reload();
    };

    if (loading || (isAuthenticated && checkingProfiles)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading Postia...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>

            <OnboardingModal
                isOpen={showOnboarding}
                onComplete={handleOnboardingComplete}
            />
        </div>
    );
}
