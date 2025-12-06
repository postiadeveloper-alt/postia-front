'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { APP_CONFIG } from '@/lib/constants';
import apiService from '@/lib/api.service';

interface User {
    id: string;
    email: string;
    fullName: string;
    agencyName?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string, agencyName?: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem(APP_CONFIG.tokenKey);
        const storedUser = localStorage.getItem('postia_user');

        console.log('AuthContext: Initializing, token exists:', !!token, 'user exists:', !!storedUser);

        if (token && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                console.log('AuthContext: Restoring user:', parsedUser);
                setUser(parsedUser);
            } catch (error) {
                console.error('Failed to parse stored user:', error);
                localStorage.removeItem(APP_CONFIG.tokenKey);
                localStorage.removeItem('postia_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const response = await apiService.login(email, password);
        console.log('AuthContext: Login response:', response);
        // FIX: Backend returns 'access_token', not 'token'
        localStorage.setItem(APP_CONFIG.tokenKey, response.access_token);
        localStorage.setItem('postia_user', JSON.stringify(response.user));
        setUser(response.user);
        console.log('AuthContext: User set, isAuthenticated:', !!response.user);
    };

    const register = async (email: string, password: string, fullName: string, agencyName?: string) => {
        const response = await apiService.register(email, password, fullName, agencyName);
        // FIX: Backend returns 'access_token', not 'token'
        localStorage.setItem(APP_CONFIG.tokenKey, response.access_token);
        localStorage.setItem('postia_user', JSON.stringify(response.user));
        setUser(response.user);
    };

    const logout = () => {
        localStorage.removeItem(APP_CONFIG.tokenKey);
        localStorage.removeItem('postia_user');
        setUser(null);
        window.location.href = '/auth/login';
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
