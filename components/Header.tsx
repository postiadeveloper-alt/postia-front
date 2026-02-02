'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { LogOut, Bell, ChevronDown, Building2, Plus, X, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useState, useRef, useEffect } from 'react';
import apiService from '@/lib/api.service';
import { motion, AnimatePresence } from 'framer-motion';

const INDUSTRIES = [
    'Tecnología', 'Moda y Ropa', 'Salud y Bienestar', 'Belleza y Cosmética',
    'Alimentos y Bebidas', 'Bienes Raíces', 'Finanzas', 'Educación', 'Viajes y Turismo',
    'Entretenimiento', 'Servicios Profesionales', 'Retail / E-commerce', 'Hogar y Jardín',
    'Automotriz', 'Arte y Diseño', 'Sin Fines de Lucro', 'Otro'
];

export function Header() {
    const { user, logout } = useAuth();
    const { businessProfiles, selectedProfile, selectedBusinessProfile, loading, setSelectedProfile, refreshProfiles } = useBusinessProfile();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // New account setup modal state
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [newAccount, setNewAccount] = useState<any>(null);
    const [setupForm, setSetupForm] = useState({ brandName: '', industry: '' });
    const [isCreatingProfile, setIsCreatingProfile] = useState(false);

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

    // Listen for Instagram connection/disconnection events
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'instagram-connected' && event.data.success) {
                // A new account was connected - show setup modal
                const account = event.data.account;
                if (account) {
                    setNewAccount(account);
                    setSetupForm({
                        brandName: account.name || account.username || '',
                        industry: ''
                    });
                    setShowSetupModal(true);
                }
                // Also refresh profiles in case it already has one
                refreshProfiles();
            } else if (event.data?.type === 'instagram-disconnected') {
                // Refresh profiles when an account is disconnected
                refreshProfiles();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [refreshProfiles]);

    const handleConnectAccount = async () => {
        try {
            const authUrl = await apiService.getInstagramAuthUrl();
            const width = 600;
            const height = 700;
            const left = window.screenX + (window.innerWidth - width) / 2;
            const top = window.screenY + (window.innerHeight - height) / 2;

            window.open(
                authUrl,
                'Conectar Instagram',
                `width=${width},height=${height},left=${left},top=${top}`
            );
            setShowDropdown(false);
        } catch (error: any) {
            console.error('Failed to get auth URL:', error);
            alert('Falló el inicio de la conexión con Instagram: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleCreateBusinessProfile = async () => {
        if (!newAccount || !setupForm.brandName || !setupForm.industry) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }

        // Try to get the account ID - it might be in the newAccount object or we need to fetch it
        let accountId = newAccount.id;

        if (!accountId) {
            // Fetch Instagram accounts to find the newly connected one
            try {
                const accounts = await apiService.getInstagramAccounts();
                const match = accounts.find((a: any) =>
                    a.username === newAccount.username ||
                    a.username === newAccount.name
                );
                if (match) {
                    accountId = match.id;
                }
            } catch (err) {
                console.error('Failed to fetch accounts:', err);
            }
        }

        if (!accountId) {
            alert('No se pudo encontrar la cuenta de Instagram. Por favor, recarga la página e intenta de nuevo.');
            return;
        }

        setIsCreatingProfile(true);
        try {
            await apiService.createBusinessProfile({
                instagramAccountId: accountId,
                brandName: setupForm.brandName,
                industry: setupForm.industry,
            });

            // Refresh profiles to show the new one
            await refreshProfiles();

            // Close modal
            setShowSetupModal(false);
            setNewAccount(null);
            setSetupForm({ brandName: '', industry: '' });
        } catch (error: any) {
            console.error('Failed to create business profile:', error);
            const serverMessage = error.response?.data?.message;
            let displayMessage = error.message || 'Error desconocido';
            if (Array.isArray(serverMessage)) {
                displayMessage = serverMessage.join(', ');
            } else if (typeof serverMessage === 'string') {
                displayMessage = serverMessage;
            }
            alert('Error al crear el perfil: ' + displayMessage);
        } finally {
            setIsCreatingProfile(false);
        }
    };

    const handleSkipSetup = () => {
        setShowSetupModal(false);
        setNewAccount(null);
        setSetupForm({ brandName: '', industry: '' });
    };

    return (
        <>
            <header className="h-16 glass-card border-b border-border px-6 flex items-center justify-between relative z-50">
                <div className="flex items-center gap-6">
                    <h2 className="text-xl font-semibold">Panel de Control</h2>

                    {/* Business Profile Selector */}
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
                                    <span className="text-sm font-medium">{businessProfiles.length > 0 ? 'Todos los Perfiles' : 'Añadir Cuenta'}</span>
                                </>
                            )}
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-[70] overflow-hidden">
                                <div className="p-2">
                                    {businessProfiles.length > 0 && (
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

                                            {businessProfiles.map((profile) => (
                                                <button
                                                    key={profile.instagramAccount.id}
                                                    onClick={() => {
                                                        setSelectedProfile(profile.instagramAccount.id);
                                                        setShowDropdown(false);
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${selectedProfile === profile.instagramAccount.id
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

                                            <div className="my-2 border-t border-white/10"></div>
                                        </>
                                    )}

                                    {/* Add Account Button */}
                                    <button
                                        onClick={handleConnectAccount}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-white/5 text-gray-300"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                                            <Plus className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-sm font-medium">Añadir Cuenta</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

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

            {/* New Account Setup Modal */}
            <AnimatePresence>
                {showSetupModal && newAccount && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && handleSkipSetup()}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl border border-white/5">
                                        <Sparkles className="w-5 h-5 text-pink-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Configurar Nueva Cuenta</h2>
                                        <p className="text-xs text-gray-400">Completa el perfil de negocio</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSkipSetup}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-4">
                                {/* Connected Account Preview */}
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                    {newAccount.profilePictureUrl ? (
                                        <img
                                            src={newAccount.profilePictureUrl}
                                            alt="Profile"
                                            className="w-10 h-10 rounded-full border border-white/20"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full" />
                                    )}
                                    <div className="overflow-hidden">
                                        <div className="font-medium text-white truncate">@{newAccount.username}</div>
                                        <div className="text-xs text-gray-400 truncate">
                                            {newAccount.followersCount?.toLocaleString() || '0'} seguidores
                                        </div>
                                    </div>
                                    <div className="ml-auto">
                                        <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                                            Conectado
                                        </div>
                                    </div>
                                </div>

                                {/* Brand Name */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-300">
                                        Nombre de la Marca <span className="text-red-400">*</span>
                                    </label>
                                    <Input
                                        value={setupForm.brandName}
                                        onChange={(e) => setSetupForm({ ...setupForm, brandName: e.target.value })}
                                        placeholder="Ej. Mi Negocio"
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                </div>

                                {/* Industry */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-300">
                                        Industria <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        value={setupForm.industry}
                                        onChange={(e) => setSetupForm({ ...setupForm, industry: e.target.value })}
                                        className="w-full h-10 bg-gray-800/50 border border-white/10 rounded-md px-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="" className="bg-gray-900">Seleccionar Industria</option>
                                        {INDUSTRIES.map(ind => (
                                            <option key={ind} value={ind} className="bg-gray-900">{ind}</option>
                                        ))}
                                    </select>
                                </div>

                                <p className="text-xs text-gray-500">
                                    Podrás editar más detalles del perfil de negocio después en la sección "Negocio".
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="flex gap-3 p-5 border-t border-white/10">
                                <button
                                    onClick={handleSkipSetup}
                                    disabled={isCreatingProfile}
                                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                                >
                                    Omitir
                                </button>
                                <button
                                    onClick={handleCreateBusinessProfile}
                                    disabled={isCreatingProfile || !setupForm.brandName || !setupForm.industry}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCreatingProfile ? 'Creando...' : 'Crear Perfil'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
