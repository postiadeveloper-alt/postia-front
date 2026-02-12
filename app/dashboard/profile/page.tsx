'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import apiService from '@/lib/api.service';
import { User, Mail, Building2, Instagram, LogOut, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const INDUSTRIES = [
    'Tecnología', 'Moda y Ropa', 'Salud y Bienestar', 'Belleza y Cosmética',
    'Alimentos y Bebidas', 'Bienes Raíces', 'Finanzas', 'Educación', 'Viajes y Turismo',
    'Entretenimiento', 'Servicios Profesionales', 'Retail / E-commerce', 'Hogar y Jardín',
    'Automotriz', 'Arte y Diseño', 'Sin Fines de Lucro', 'Otro'
];

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const { businessProfiles, refreshProfiles, removeProfile } = useBusinessProfile();
    const [loading, setLoading] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);

    // New business profile form
    const [showNewForm, setShowNewForm] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectedAccount, setConnectedAccount] = useState<any>(null);
    const [newProfileForm, setNewProfileForm] = useState({ brandName: '', industry: '' });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'instagram-connected' && event.data.success) {
                setConnectedAccount(event.data.account);
                setNewProfileForm(prev => ({
                    ...prev,
                    brandName: event.data.account.name || event.data.account.username || '',
                }));
                setIsConnecting(false);
            } else if (event.data?.type === 'instagram-error') {
                setIsConnecting(false);
                alert('Falló la conexión con Instagram: ' + event.data.error);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleConnectInstagram = async () => {
        setIsConnecting(true);
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
        } catch (error: any) {
            console.error('Failed to get auth URL:', error);
            setIsConnecting(false);
            alert('Falló el inicio de la conexión con Instagram: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleCreateProfile = async () => {
        if (!connectedAccount || !newProfileForm.brandName || !newProfileForm.industry) {
            alert('Por favor conecta una cuenta de Instagram y completa los campos requeridos.');
            return;
        }

        let accountId = connectedAccount.id;
        if (!accountId) {
            try {
                const accounts = await apiService.getInstagramAccounts();
                const match = accounts.find((a: any) =>
                    a.username === connectedAccount.username || a.username === connectedAccount.name
                );
                if (match) accountId = match.id;
            } catch (err) {
                console.error('Failed to fetch accounts:', err);
            }
        }

        if (!accountId) {
            alert('No se pudo encontrar la cuenta de Instagram. Recarga la página e intenta de nuevo.');
            return;
        }

        setIsCreating(true);
        try {
            await apiService.createBusinessProfile({
                instagramAccountId: accountId,
                brandName: newProfileForm.brandName,
                industry: newProfileForm.industry,
            });
            await refreshProfiles();
            setShowNewForm(false);
            setConnectedAccount(null);
            setNewProfileForm({ brandName: '', industry: '' });
        } catch (error: any) {
            console.error('Failed to create profile:', error);
            const msg = error.response?.data?.message;
            alert('Error al crear el perfil: ' + (Array.isArray(msg) ? msg.join(', ') : msg || error.message));
        } finally {
            setIsCreating(false);
        }
    };

    const handleRemoveProfile = async (profileId: string, brandName: string) => {
        if (!confirm(`¿Estás seguro de eliminar el perfil "${brandName}"? Esto también eliminará la cuenta de Instagram vinculada.`)) return;

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

    const handleCancelNew = () => {
        setShowNewForm(false);
        setConnectedAccount(null);
        setNewProfileForm({ brandName: '', industry: '' });
        setIsConnecting(false);
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary">
                    Configuración del Perfil
                </h1>
                <p className="text-gray-400 mt-1">Administra tu cuenta y perfiles de negocio</p>
            </div>

            {/* User Information */}
            <div className="glass-card p-6">
                <h3 className="text-xl font-semibold mb-6">Información Personal</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-2">
                            <User className="w-4 h-4" />
                            Nombre Completo
                        </label>
                        <Input value={user?.fullName || ''} disabled />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-2">
                            <Mail className="w-4 h-4" />
                            Correo Electrónico
                        </label>
                        <Input value={user?.email || ''} disabled />
                    </div>
                    {user?.agencyName && (
                        <div>
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-2">
                                <Building2 className="w-4 h-4" />
                                Nombre de la Agencia
                            </label>
                            <Input value={user.agencyName} disabled />
                        </div>
                    )}
                </div>
            </div>

            {/* Business Profiles */}
            <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Perfiles de Negocio
                    </h3>
                    {!showNewForm && (
                        <Button
                            onClick={() => setShowNewForm(true)}
                            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Perfil
                        </Button>
                    )}
                </div>

                {businessProfiles.length === 0 && !showNewForm ? (
                    <div className="text-center py-8 text-gray-400">
                        Aún no tienes perfiles de negocio. ¡Crea uno para comenzar!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {businessProfiles.map((profile: any) => (
                            <div key={profile.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-lg font-semibold">
                                        {profile.brandName?.charAt(0) || 'B'}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{profile.brandName}</p>
                                        <p className="text-sm text-gray-400">{profile.industry || 'Sin industria'}</p>
                                        {profile.instagramAccount?.username && (
                                            <p className="text-xs text-pink-400 flex items-center gap-1 mt-1">
                                                <Instagram className="w-3 h-3" />
                                                @{profile.instagramAccount.username}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleRemoveProfile(profile.id, profile.brandName)}
                                    variant="ghost"
                                    size="sm"
                                    disabled={removingId === profile.id}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                    {removingId === profile.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4 mr-1" />
                                    )}
                                    Eliminar
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* New Profile Form */}
                {showNewForm && (
                    <div className="mt-6 p-5 bg-white/5 rounded-xl border border-white/10 space-y-4">
                        <h4 className="font-semibold text-lg">Crear Nuevo Perfil de Negocio</h4>

                        {/* Step 1: Connect Instagram */}
                        {!connectedAccount ? (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center mx-auto mb-4">
                                    <Instagram className="w-8 h-8 text-white" />
                                </div>
                                <p className="text-gray-400 mb-4">
                                    Primero, conecta la cuenta de Instagram Business para este perfil.
                                </p>
                                <Button
                                    onClick={handleConnectInstagram}
                                    disabled={isConnecting}
                                    className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:opacity-90 text-white"
                                >
                                    {isConnecting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Conectando...
                                        </>
                                    ) : (
                                        <>
                                            <Instagram className="w-4 h-4 mr-2" />
                                            Conectar con Instagram
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Connected account preview */}
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                    {connectedAccount.profilePictureUrl && (
                                        <img src={connectedAccount.profilePictureUrl} alt="" className="w-10 h-10 rounded-full" />
                                    )}
                                    <div>
                                        <p className="font-medium text-white">@{connectedAccount.username}</p>
                                        <p className="text-sm text-green-400">✓ Cuenta conectada</p>
                                    </div>
                                </div>

                                {/* Step 2: Brand details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Nombre de la Marca *
                                        </label>
                                        <Input
                                            value={newProfileForm.brandName}
                                            onChange={(e) => setNewProfileForm(prev => ({ ...prev, brandName: e.target.value }))}
                                            placeholder="Mi Empresa"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Industria *
                                        </label>
                                        <select
                                            value={newProfileForm.industry}
                                            onChange={(e) => setNewProfileForm(prev => ({ ...prev, industry: e.target.value }))}
                                            className="w-full h-10 px-3 rounded-md bg-background border border-input text-white"
                                        >
                                            <option value="">Selecciona una industria</option>
                                            {INDUSTRIES.map(ind => (
                                                <option key={ind} value={ind}>{ind}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500">
                                    Podrás editar más detalles del perfil después en la sección &quot;Negocio&quot;.
                                </p>

                                <div className="flex gap-3 pt-2">
                                    <Button onClick={handleCreateProfile} disabled={isCreating || !newProfileForm.brandName || !newProfileForm.industry}
                                        className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Creando...
                                            </>
                                        ) : (
                                            'Crear Perfil'
                                        )}
                                    </Button>
                                    <Button variant="ghost" onClick={handleCancelNew}>
                                        Cancelar
                                    </Button>
                                </div>
                            </>
                        )}

                        {!connectedAccount && (
                            <div className="flex justify-end">
                                <Button variant="ghost" onClick={handleCancelNew}>
                                    Cancelar
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            <div className="glass-card p-6 border-red-500/20">
                <h3 className="text-xl font-semibold mb-4 text-red-400">Zona de Peligro</h3>
                <div className="space-y-3">
                    <Button
                        onClick={logout}
                        className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                    </Button>
                </div>
            </div>
        </div>
    );
}
