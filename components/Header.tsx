'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { LogOut, Bell, ChevronDown, Building2, X, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function Header() {
    const { user, logout } = useAuth();
    const { businessProfiles, selectedProfile, selectedBusinessProfile, loading, setSelectedProfile, removeProfile } = useBusinessProfile();
    const [showDropdown, setShowDropdown] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

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

    const handleRemoveProfile = async (e: React.MouseEvent, profileId: string, brandName: string) => {
        e.stopPropagation();
        if (!confirm(`¿Estás seguro de que quieres eliminar el perfil "${brandName}"? Esto también eliminará la cuenta de Instagram vinculada.`)) return;

        setRemovingId(profileId);
        try {
            await removeProfile(profileId);
        } catch (error: any) {
            console.error('Failed to remove profile:', error);
            alert('Error al eliminar el perfil: ' + (error.response?.data?.message || error.message));
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <header className="h-16 glass-card border-b border-border px-6 flex items-center justify-between relative z-50">
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
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                                        {selectedBusinessProfile.brandName.charAt(0)}
                                    </div>
                                    <div className="text-left min-w-0 max-w-[180px]">
                                        <p className="text-sm font-medium truncate" title={selectedBusinessProfile.brandName}>{selectedBusinessProfile.brandName}</p>
                                        {selectedBusinessProfile.instagramAccount?.username && (
                                            <p className="text-xs text-gray-400 truncate" title={`@${selectedBusinessProfile.instagramAccount.username}`}>@{selectedBusinessProfile.instagramAccount.username}</p>
                                        )}
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
                            <div className="absolute top-full left-0 mt-2 w-80 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-[70] overflow-hidden">
                                <div className="p-2">
                                    {/* All Profiles option */}
                                    <>
                                        <button
                                                onClick={() => {
                                                    setSelectedProfile('all');
                                                    setShowDropdown(false);
                                                }}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${selectedProfile === 'all'
                                                    ? 'bg-primary/20 text-primary'
                                                    : 'hover:bg-white/5 text-gray-300'
                                                    }`}
                                            >
                                                <Building2 className="w-5 h-5" />
                                                <span className="text-sm font-medium">Todos los Perfiles</span>
                                            </button>
                                            <div className="my-2 border-t border-white/10"></div>
                                        </>

                                    {/* Business Profile items */}
                                    {businessProfiles.map((profile) => (
                                        <div
                                            key={profile.id}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${selectedProfile === profile.instagramAccount?.id
                                                ? 'bg-primary/20 text-primary'
                                                : 'hover:bg-white/5 text-gray-300'
                                                }`}
                                        >
                                            <button
                                                onClick={() => {
                                                    setSelectedProfile(profile.instagramAccount?.id || profile.id);
                                                    setShowDropdown(false);
                                                }}
                                                className="flex-1 flex items-center gap-3 text-left"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                                    {profile.brandName.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate" title={profile.brandName}>{profile.brandName}</p>
                                                    {profile.instagramAccount?.username && (
                                                        <p className="text-xs text-gray-400 truncate" title={`@${profile.instagramAccount.username}`}>@{profile.instagramAccount.username}</p>
                                                    )}
                                                </div>
                                            </button>

                                            {/* Remove button */}
                                            <button
                                                onClick={(e) => handleRemoveProfile(e, profile.id, profile.brandName)}
                                                disabled={removingId === profile.id}
                                                className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 disabled:opacity-50"
                                                title="Eliminar perfil"
                                            >
                                                {removingId === profile.id ? (
                                                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <X className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    ))}

                                    {/* Add Profile button */}
                                    <div className="mt-2 pt-2 border-t border-white/10">
                                        <button
                                            onClick={() => {
                                                router.push('/dashboard/profile');
                                                setShowDropdown(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300 transition-all"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                <Plus className="w-4 h-4 text-primary" />
                                            </div>
                                            <span className="text-sm font-medium">Añadir Perfil</span>
                                        </button>
                                    </div>
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
