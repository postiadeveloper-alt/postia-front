'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiService from '@/lib/api.service';
import { useAuth } from './AuthContext';

interface InstagramAccount {
    id: string;
    username: string;
    profilePictureUrl?: string;
    followersCount?: number;
}

interface BusinessProfile {
    id: string;
    brandName: string;
    industry?: string;
    description?: string;
    instagramAccount: InstagramAccount;
}

interface BusinessProfileContextType {
    businessProfiles: BusinessProfile[];
    selectedProfile: string; // 'all' or instagram account id
    selectedBusinessProfile: BusinessProfile | null;
    loading: boolean;
    setSelectedProfile: (profileId: string) => void;
    refreshProfiles: () => Promise<void>;
}

const BusinessProfileContext = createContext<BusinessProfileContextType | undefined>(undefined);

export function BusinessProfileProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            loadBusinessProfiles();
        }
    }, [isAuthenticated]);

    const loadBusinessProfiles = async () => {
        try {
            setLoading(true);
            const data = await apiService.getBusinessProfiles();
            setBusinessProfiles(data || []);
            
            // Auto-select first profile if only one exists
            if (data && data.length === 1) {
                setSelectedProfile(data[0].instagramAccount.id);
            }
        } catch (error) {
            console.error('Failed to load business profiles:', error);
            setBusinessProfiles([]);
        } finally {
            setLoading(false);
        }
    };

    const refreshProfiles = async () => {
        await loadBusinessProfiles();
    };

    // Get the full business profile object for the selected profile
    const selectedBusinessProfile = selectedProfile === 'all' 
        ? null 
        : businessProfiles.find(p => p.instagramAccount.id === selectedProfile) || null;

    return (
        <BusinessProfileContext.Provider 
            value={{ 
                businessProfiles, 
                selectedProfile, 
                selectedBusinessProfile,
                loading, 
                setSelectedProfile,
                refreshProfiles 
            }}
        >
            {children}
        </BusinessProfileContext.Provider>
    );
}

export function useBusinessProfile() {
    const context = useContext(BusinessProfileContext);
    if (context === undefined) {
        throw new Error('useBusinessProfile must be used within a BusinessProfileProvider');
    }
    return context;
}
