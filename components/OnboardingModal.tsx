'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, ArrowRight, Instagram, Building2, Rocket } from 'lucide-react';
import apiService from '@/lib/api.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface OnboardingModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

const INDUSTRIES = [
    'Technology', 'Fashion & Apparel', 'Health & Wellness', 'Beauty & Cosmetics',
    'Food & Beverage', 'Real Estate', 'Finance', 'Education', 'Travel & Tourism',
    'Entertainment', 'Professional Services', 'Retail / E-commerce', 'Home & Garden',
    'Automotive', 'Art & Design', 'Non-Profit', 'Other'
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
        brandColors: '', // Stored as comma-separated string for input
        contentThemes: '',
        productCategories: '',
        prohibitedTopics: '',
        contentGuidelines: '',
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
                alert('Failed to connect Instagram: ' + event.data.error);
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
                'Connect Instagram',
                `width=${width},height=${height},left=${left},top=${top}`
            );
        } catch (error: any) {
            console.error('Failed to get auth URL:', error);
            setIsConnecting(false);
            alert('Failed to start Instagram connection: ' + (error.message || 'Unknown error'));
        }
    };

    const handleCreateProfile = async () => {
        if (!connectedAccount) {
            alert('Error: No connected account found.');
            return;
        }

        let accountId = connectedAccount.id;

        // Safety check: ensure we have the account ID before proceeding.
        // If missing from the message event, fetch it directly from the API.
        if (!accountId) {
            try {
                console.log('Verifying account connection status...');
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
            alert('Error: Could not retrieve Account ID. Please try refreshing the page.');
            return;
        }

        setIsSubmitting(true);

        // Helper to parse comma-separated strings to arrays
        const parseArray = (str: string) => str.split(',').map(s => s.trim()).filter(Boolean);

        const payload = {
            instagramAccountId: accountId,
            brandName: formData.brandName,
            industry: formData.industry,
            brandDescription: formData.brandDescription,
            targetAudience: formData.targetAudience,
            brandValues: formData.brandValues,
            visualStyle: formData.visualStyle,
            communicationTone: formData.communicationTone,
            contentGuidelines: formData.contentGuidelines,
            // Parse arrays
            brandColors: parseArray(formData.brandColors),
            contentThemes: parseArray(formData.contentThemes),
            productCategories: parseArray(formData.productCategories),
            prohibitedTopics: parseArray(formData.prohibitedTopics),
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

            alert('Failed to create profile: ' + displayMessage);
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
                            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
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
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Nombre de la Marca <span className="text-red-400">*</span></label>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                                                <Input
                                                    value={formData.brandName}
                                                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                                                    className="pl-10 bg-white/5 border-white/10 text-white focus:border-primary"
                                                    placeholder="Ej. Postia Agency"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Industria <span className="text-red-400">*</span></label>
                                            <select
                                                value={formData.industry}
                                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                                className="w-full h-10 bg-white/5 border border-white/10 rounded-md px-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                            >
                                                <option value="" className="bg-gray-900">Seleccionar Industria</option>
                                                {INDUSTRIES.map(ind => (
                                                    <option key={ind} value={ind} className="bg-gray-900">{ind}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Descripción de la Marca</label>
                                        <textarea
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600 min-h-[80px] resize-none"
                                            placeholder="Describe qué hace tu negocio, tu misión y qué te hace único..."
                                            value={formData.brandDescription}
                                            onChange={(e) => setFormData({ ...formData, brandDescription: e.target.value })}
                                        />
                                    </div>

                                    {/* Brand Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Público Objetivo</label>
                                            <Input
                                                value={formData.targetAudience}
                                                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                                className="bg-white/5 border-white/10 text-white focus:border-primary"
                                                placeholder="Ej. Mujeres 25-45 años interesadas en moda"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Valores de Marca</label>
                                            <Input
                                                value={formData.brandValues}
                                                onChange={(e) => setFormData({ ...formData, brandValues: e.target.value })}
                                                className="bg-white/5 border-white/10 text-white focus:border-primary"
                                                placeholder="Ej. Sostenibilidad, Innovación, Calidad"
                                            />
                                        </div>
                                    </div>

                                    {/* Style & Tone */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Estilo Visual</label>
                                            <select
                                                value={formData.visualStyle}
                                                onChange={(e) => setFormData({ ...formData, visualStyle: e.target.value })}
                                                className="w-full h-10 bg-white/5 border border-white/10 rounded-md px-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                            >
                                                <option value="" className="bg-gray-900">Seleccionar Estilo</option>
                                                <option value="Minimalist" className="bg-gray-900">Minimalista</option>
                                                <option value="Bold" className="bg-gray-900">Audaz / Llamativo</option>
                                                <option value="Vintage" className="bg-gray-900">Vintage / Retro</option>
                                                <option value="Luxury" className="bg-gray-900">Lujo / Elegante</option>
                                                <option value="Playful" className="bg-gray-900">Divertido / Juguetón</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Tono de Comunicación</label>
                                            <select
                                                value={formData.communicationTone}
                                                onChange={(e) => setFormData({ ...formData, communicationTone: e.target.value })}
                                                className="w-full h-10 bg-white/5 border border-white/10 rounded-md px-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                            >
                                                <option value="" className="bg-gray-900">Seleccionar Tono</option>
                                                <option value="Professional" className="bg-gray-900">Profesional</option>
                                                <option value="Friendly" className="bg-gray-900">Amigable / Cercano</option>
                                                <option value="Humorous" className="bg-gray-900">Humorístico</option>
                                                <option value="Inspirational" className="bg-gray-900">Inspiracional</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Strategy Lists */}
                                    <div className="space-y-4 pt-2">
                                        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Estrategia de Contenido</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">Colores de Marca</label>
                                                <Input
                                                    value={formData.brandColors}
                                                    onChange={(e) => setFormData({ ...formData, brandColors: e.target.value })}
                                                    className="bg-white/5 border-white/10 text-white focus:border-primary"
                                                    placeholder="#FF0000, #00FF00 (separados por coma)"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">Temas de Contenido</label>
                                                <Input
                                                    value={formData.contentThemes}
                                                    onChange={(e) => setFormData({ ...formData, contentThemes: e.target.value })}
                                                    className="bg-white/5 border-white/10 text-white focus:border-primary"
                                                    placeholder="Tips, Noticias, Promociones..."
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">Categorías de Producto</label>
                                                <Input
                                                    value={formData.productCategories}
                                                    onChange={(e) => setFormData({ ...formData, productCategories: e.target.value })}
                                                    className="bg-white/5 border-white/10 text-white focus:border-primary"
                                                    placeholder="Ropa, Accesorios, Calzado..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">Temas Prohibidos</label>
                                                <Input
                                                    value={formData.prohibitedTopics}
                                                    onChange={(e) => setFormData({ ...formData, prohibitedTopics: e.target.value })}
                                                    className="bg-white/5 border-white/10 text-white focus:border-primary"
                                                    placeholder="Política, Religión..."
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Guía de Contenido Adicional</label>
                                            <textarea
                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600 min-h-[60px] resize-none"
                                                placeholder="Instrucciones específicas para la IA..."
                                                value={formData.contentGuidelines}
                                                onChange={(e) => setFormData({ ...formData, contentGuidelines: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleCreateProfile}
                                    disabled={isSubmitting || !formData.brandName || !formData.industry}
                                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-6 text-lg shadow-lg shadow-blue-500/20"
                                >
                                    {isSubmitting ? (
                                        'Creando perfil...'
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Comenzar
                                            <Rocket className="w-5 h-5" />
                                        </span>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
