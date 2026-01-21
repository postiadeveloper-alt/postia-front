'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, ArrowRight, Instagram, Building2, Rocket, Plus, X } from 'lucide-react';
import apiService from '@/lib/api.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface OnboardingModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

const INDUSTRIES = [
    'Tecnología', 'Moda y Ropa', 'Salud y Bienestar', 'Belleza y Cosmética',
    'Alimentos y Bebidas', 'Bienes Raíces', 'Finanzas', 'Educación', 'Viajes y Turismo',
    'Entretenimiento', 'Servicios Profesionales', 'Retail / E-commerce', 'Hogar y Jardín',
    'Automotriz', 'Arte y Diseño', 'Sin Fines de Lucro', 'Otro'
];

export default function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
    const [step, setStep] = useState(1);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectedAccount, setConnectedAccount] = useState<any>(null);
    const [formData, setFormData] = useState({
        brandName: '',
        industry: '',
        brandDescription: '',
        targetAudience: '',
        brandValues: '',
        visualStyle: '',
        communicationTone: '',
        brandColors: [] as string[],
        contentThemes: [] as string[],
        productCategories: [] as string[],
        prohibitedTopics: [] as string[],
        contentGuidelines: '',
    });
    const [pendingColor, setPendingColor] = useState('#6366F1');
    const [pendingItems, setPendingItems] = useState({
        themes: '',
        categories: '',
        topics: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Listen for messages from the OAuth popup
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'instagram-connected') {

                if (event.data.success) {
                    setConnectedAccount(event.data.account);

                    // Auto-fill some data if available
                    setFormData(prev => ({
                        ...prev,
                        brandName: event.data.account.name || event.data.account.username || '',
                        brandDescription: event.data.account.biography || '',
                    }));
                    setStep(2);
                    setIsConnecting(false);
                }
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
            alert('Falló el inicio de la conexión con Instagram: ' + (error.message || 'Error desconocido'));
        }
    };

    const handleAddItem = (field: 'contentThemes' | 'productCategories' | 'prohibitedTopics', key: keyof typeof pendingItems) => {
        const val = pendingItems[key].trim();
        if (!val) return;
        if (formData[field].includes(val)) return;

        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], val]
        }));
        setPendingItems(prev => ({ ...prev, [key]: '' }));
    };

    const handleRemoveItem = (field: keyof typeof formData, index: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: (prev[field] as any[]).filter((_, i) => i !== index)
        }));
    };

    const addColor = () => {
        const color = pendingColor.toUpperCase();
        if (formData.brandColors.includes(color)) return;
        setFormData(prev => ({
            ...prev,
            brandColors: [...prev.brandColors, color]
        }));
    };

    const handleCreateProfile = async () => {
        if (!connectedAccount) {
            alert('Error: No se encontró una cuenta conectada.');
            return;
        }

        let accountId = connectedAccount.id;

        // Safety check: ensure we have the account ID before proceeding.
        // If missing from the message event, fetch it directly from the API.
        if (!accountId) {
            try {
                console.log('Verificando estado de conexión de la cuenta...');
                const accounts = await apiService.getInstagramAccounts();
                const match = accounts.find((a: any) =>
                    a.username === connectedAccount.username ||
                    a.username === connectedAccount.name
                );

                if (match) {
                    console.log('Account verified successfully.');
                    accountId = match.id;
                    setConnectedAccount(match);
                }
            } catch (err) {
                console.error('Failed to verify account status:', err);
            }
        }

        if (!accountId) {
            console.error('Connected account has no ID:', connectedAccount);
            alert('Error: No se pudo recuperar el ID de la cuenta. Por favor, intenta recargar la página.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            instagramAccountId: accountId,
            ...formData
        };

        console.log('Creating business profile with payload:', payload);

        try {
            await apiService.createBusinessProfile(payload);
            onComplete();
        } catch (error: any) {
            console.error('Failed to create business profile:', error);

            const serverMessage = error.response?.data?.message;
            let displayMessage = error.message || 'Unknown error';

            if (Array.isArray(serverMessage)) {
                displayMessage = serverMessage.join(', ');
            } else if (typeof serverMessage === 'string') {
                displayMessage = serverMessage;
            }

            alert('Error al crear el perfil: ' + displayMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            >
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />
                    <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative bg-gray-900/90 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
                >
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                        <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            initial={{ width: '0%' }}
                            animate={{ width: step === 1 ? '50%' : '100%' }}
                        />
                    </div>

                    <div className="p-8">
                        {step === 1 ? (
                            <div className="space-y-8 text-center">
                                <div className="space-y-2">
                                    <div className="inline-flex p-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl mb-4 border border-white/5">
                                        <Sparkles className="w-8 h-8 text-pink-400" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white">¡Bienvenido a Postia!</h2>
                                    <p className="text-gray-400">
                                        Vamos a configurar tu espacio de trabajo. Primero, conecta la cuenta de Instagram que quieres gestionar.
                                    </p>
                                </div>

                                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-white/10 rounded-full">
                                            <Instagram className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-semibold text-white">Instagram Business</h3>
                                            <p className="text-sm text-gray-400">Conecta tu cuenta profesional</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleConnectInstagram}
                                        disabled={isConnecting}
                                        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-6 text-lg shadow-lg shadow-pink-500/20"
                                    >
                                        {isConnecting ? 'Conectando...' : 'Conectar Instagram'}
                                    </Button>
                                    <p className="mt-4 text-xs text-center text-gray-500">
                                        Asegúrate de que tu cuenta sea Business o Creator y esté vinculada a una página de Facebook.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="text-center space-y-2">
                                    <div className="inline-flex p-3 bg-green-500/20 rounded-xl mb-2 text-green-400">
                                        <Check className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">¡Cuenta Conectada!</h2>
                                    <p className="text-gray-400">
                                        Completa tu perfil de negocio para obtener los mejores resultados con la IA.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {connectedAccount && (
                                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                            {connectedAccount.profilePictureUrl ? (
                                                <img
                                                    src={connectedAccount.profilePictureUrl}
                                                    alt="Profile"
                                                    className="w-10 h-10 rounded-full border border-white/20"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full" />
                                            )}
                                            <div className="overflow-hidden">
                                                <div className="font-medium text-white truncate">@{connectedAccount.username}</div>
                                                <div className="text-xs text-gray-400 truncate">
                                                    {connectedAccount.followersCount?.toLocaleString()} seguidores
                                                </div>
                                            </div>
                                            <div className="ml-auto">
                                                <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                                                    Conectado
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Essential Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-400">Nombre de la Marca <span className="text-red-400">*</span></label>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                                <Input
                                                    value={formData.brandName}
                                                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                                                    className="pl-9 h-9 bg-white/5 border-white/10 text-white text-sm focus:border-primary"
                                                    placeholder="Ej. Postia Agency"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-400">Industria <span className="text-red-400">*</span></label>
                                            <select
                                                value={formData.industry}
                                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                                className="w-full h-9 bg-gray-800/50 border border-white/10 rounded-md px-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                            >
                                                <option value="" className="bg-gray-900">Seleccionar Industria</option>
                                                {INDUSTRIES.map(ind => (
                                                    <option key={ind} value={ind} className="bg-gray-900">{ind}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-400">Descripción de la Marca</label>
                                        <textarea
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600 min-h-[60px] resize-none"
                                            placeholder="¿Qué hace única a tu marca?"
                                            value={formData.brandDescription}
                                            onChange={(e) => setFormData({ ...formData, brandDescription: e.target.value })}
                                        />
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-400">Público Objetivo</label>
                                            <Input
                                                value={formData.targetAudience}
                                                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                                className="h-9 bg-white/5 border-white/10 text-sm text-white"
                                                placeholder="Ej. Jóvenes emprendedores"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-400">Valores de Marca</label>
                                            <Input
                                                value={formData.brandValues}
                                                onChange={(e) => setFormData({ ...formData, brandValues: e.target.value })}
                                                className="h-9 bg-white/5 border-white/10 text-sm text-white"
                                                placeholder="Ej. Transparencia, Innovación"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-400">Estilo Visual</label>
                                            <select
                                                value={formData.visualStyle}
                                                onChange={(e) => setFormData({ ...formData, visualStyle: e.target.value })}
                                                className="w-full h-9 bg-gray-800/50 border border-white/10 rounded-md px-3 text-sm text-white focus:outline-none"
                                            >
                                                <option value="" className="bg-gray-900">Estilo</option>
                                                <option value="Minimalista" className="bg-gray-900">Minimalista</option>
                                                <option value="Audaz" className="bg-gray-900">Audaz</option>
                                                <option value="Vintage" className="bg-gray-900">Vintage</option>
                                                <option value="Lujo" className="bg-gray-900">Lujo</option>
                                                <option value="Juguetón" className="bg-gray-900">Juguetón</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-400">Tono de Comunicación</label>
                                            <select
                                                value={formData.communicationTone}
                                                onChange={(e) => setFormData({ ...formData, communicationTone: e.target.value })}
                                                className="w-full h-9 bg-gray-800/50 border border-white/10 rounded-md px-3 text-sm text-white focus:outline-none"
                                            >
                                                <option value="" className="bg-gray-900">Tono</option>
                                                <option value="Profesional" className="bg-gray-900">Profesional</option>
                                                <option value="Amigable" className="bg-gray-900">Amigable</option>
                                                <option value="Humorístico" className="bg-gray-900">Humorístico</option>
                                                <option value="Inspiracional" className="bg-gray-900">Inspiracional</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Strategy Section */}
                                    <div className="space-y-4 pt-2 border-t border-white/5">
                                        {/* Colors UX Improved */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Colores de Marca</label>
                                            <div className="flex gap-2 items-center">
                                                <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/20 shrink-0">
                                                    <input
                                                        type="color"
                                                        value={pendingColor}
                                                        onChange={(e) => setPendingColor(e.target.value)}
                                                        className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={addColor}
                                                    className="h-10 px-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors flex items-center gap-2 border border-white/10"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    <span className="text-xs font-medium">Añadir</span>
                                                </button>
                                                <div className="flex flex-wrap gap-2 ml-2">
                                                    {formData.brandColors.map((c, i) => (
                                                        <div key={i} className="group relative w-8 h-8 rounded-full border border-white/20 shadow-lg" style={{ backgroundColor: c }}>
                                                            <button
                                                                onClick={() => handleRemoveItem('brandColors', i)}
                                                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-2 h-2 text-white" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tag Inputs for other fields */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Temas</label>
                                                <Input
                                                    value={pendingItems.themes}
                                                    onChange={(e) => setPendingItems({ ...pendingItems, themes: e.target.value })}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('contentThemes', 'themes'))}
                                                    className="h-9 bg-white/5 border-white/10 text-xs"
                                                    placeholder="Ej. Tutoriales (Enter)"
                                                />
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {formData.contentThemes.map((t, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px] flex items-center gap-1 border border-purple-500/20">
                                                            {t} <X className="w-2 h-2 cursor-pointer hover:text-white" onClick={() => handleRemoveItem('contentThemes', i)} />
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Categorías</label>
                                                <Input
                                                    value={pendingItems.categories}
                                                    onChange={(e) => setPendingItems({ ...pendingItems, categories: e.target.value })}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('productCategories', 'categories'))}
                                                    className="h-9 bg-white/5 border-white/10 text-xs"
                                                    placeholder="Ej. Skincare (Enter)"
                                                />
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {formData.productCategories.map((c, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px] flex items-center gap-1 border border-blue-500/20">
                                                            {c} <X className="w-2 h-2 cursor-pointer hover:text-white" onClick={() => handleRemoveItem('productCategories', i)} />
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Temas Prohibidos</label>
                                            <Input
                                                value={pendingItems.topics}
                                                onChange={(e) => setPendingItems({ ...pendingItems, topics: e.target.value })}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('prohibitedTopics', 'topics'))}
                                                className="h-9 bg-white/5 border-white/10 text-xs"
                                                placeholder="Contenido que prefieres evitar (Enter)"
                                            />
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {formData.prohibitedTopics.map((t, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-[10px] flex items-center gap-1 border border-red-500/20">
                                                        {t} <X className="w-2 h-2 cursor-pointer hover:text-white" onClick={() => handleRemoveItem('prohibitedTopics', i)} />
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-400">Instrucciones Adicionales</label>
                                            <textarea
                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white focus:border-primary min-h-[50px] resize-none"
                                                placeholder="Ej. Siempre usar emojis, no usar jerga..."
                                                value={formData.contentGuidelines}
                                                onChange={(e) => setFormData({ ...formData, contentGuidelines: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleCreateProfile}
                                    disabled={isSubmitting || !formData.brandName || !formData.industry}
                                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-5 text-lg shadow-lg shadow-blue-500/20 mt-4"
                                >
                                    {isSubmitting ? 'Configurando...' : 'Finalizar y Comenzar'}
                                </Button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
