'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { LogOut, Bell, ChevronDown, Building2 } from 'lucide-react';
import { Button } from './ui/Button';
import { useState, useRef, useEffect } from 'react';

export function Header() {
    const { user, logout } = useAuth();
    const { businessProfiles, selectedProfile, selectedBusinessProfile, loading, setSelectedProfile } = useBusinessProfile();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="h-16 glass-card border-b border-border px-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <h2 className="text-xl font-semibold">Panel de Control</h2>
                
                {/* Business Profile Selector */}
                {businessProfiles.length > 0 && (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
                        >
                            {selectedBusinessProfile ? (
                                <>
                                    {selectedBusinessProfile.instagramAccount.profilePictureUrl ? (
                                        <img
                                            src={selectedBusinessProfile.instagramAccount.profilePictureUrl}
                                            alt={selectedBusinessProfile.brandName}
                                            className="w-6 h-6 rounded-full"
                                        />
                                    ) : (
                                        <Building2 className="w-5 h-5 text-primary" />
                                    )}
                                    <div className="text-left">
                                        <p className="text-sm font-medium">{selectedBusinessProfile.brandName}</p>
                                        <p className="text-xs text-gray-400">@{selectedBusinessProfile.instagramAccount.username}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Building2 className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm font-medium">Todos los Perfiles</span>
                                </>
                            )}
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            setSelectedProfile('all');
                                            setShowDropdown(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                                            selectedProfile === 'all'
                                                ? 'bg-primary/20 text-primary'
                                                : 'hover:bg-white/5 text-gray-300'
                                        }`}
                                    >
                                        <Building2 className="w-5 h-5" />
                                        <span className="text-sm font-medium">Todos los Perfiles</span>
                                    </button>
                                    
                                    <div className="my-2 border-t border-white/10"></div>
                                    
                                    {businessProfiles.map((profile) => (
                                        <button
                                            key={profile.instagramAccount.id}
                                            onClick={() => {
                                                setSelectedProfile(profile.instagramAccount.id);
                                                setShowDropdown(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                                                selectedProfile === profile.instagramAccount.id
                                                    ? 'bg-primary/20 text-primary'
                                                    : 'hover:bg-white/5 text-gray-300'
                                            }`}
                                        >
                                            {profile.instagramAccount.profilePictureUrl ? (
                                                <img
                                                    src={profile.instagramAccount.profilePictureUrl}
                                                    alt={profile.brandName}
                                                    className="w-6 h-6 rounded-full"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                                                    {profile.brandName.charAt(0)}
                                                </div>
                                            )}
                                            <div className="text-left">
                                                <p className="text-sm font-medium">{profile.brandName}</p>
                                                <p className="text-xs text-gray-400">@{profile.instagramAccount.username}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {loading && (
                    <div className="flex items-center gap-2 text-gray-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                        <span className="text-xs">Cargando...</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-border">
                    <div className="text-right">
                        <p className="text-sm font-medium">{user?.fullName || 'Usuario'}</p>
                        <p className="text-xs text-gray-400">{user?.email || ''}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold">
                        {user?.fullName?.charAt(0) || 'U'}
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={logout}
                    className="text-gray-400 hover:text-white"
                >
                    <LogOut className="w-5 h-5" />
                </Button>
            </div>
        </header>
    );
}
