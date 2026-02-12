'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Instagram, ArrowRight, Sparkles, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import apiService from '@/lib/api.service';

interface NoProfileBannerProps {
    onProfileCreated: () => void;
}

const INDUSTRIES = [
    'Tecnología', 'Moda y Ropa', 'Salud y Bienestar', 'Belleza y Cosmética',
    'Alimentos y Bebidas', 'Bienes Raíces', 'Finanzas', 'Educación', 'Viajes y Turismo',
    'Entretenimiento', 'Servicios Profesionales', 'Retail / E-commerce', 'Hogar y Jardín',
    'Automotriz', 'Arte y Diseño', 'Sin Fines de Lucro', 'Otro'
];

export default function NoProfileBanner({ onProfileCreated }: NoProfileBannerProps) {
    const [showForm, setShowForm] = useState(false);
    const [step, setStep] = useState<'instagram' | 'details'>('instagram');
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectedAccount, setConnectedAccount] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'instagram-connected') {
                if (event.data.success) {
                    setConnectedAccount(event.data.account);
                    setFormData(prev => ({
                        ...prev,
                        brandName: event.data.account.name || event.data.account.username || '',
                        brandDescription: event.data.account.biography || '',
                    }));
                    setStep('details');
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
            [field]: [...prev[field], val],
        }));
        setPendingItems(prev => ({ ...prev, [key]: '' }));
    };

    const handleRemoveItem = (field: 'contentThemes' | 'productCategories' | 'prohibitedTopics', index: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index),
        }));
    };

    const handleAddColor = () => {
        if (formData.brandColors.length >= 5) return;
        if (formData.brandColors.includes(pendingColor)) return;
        setFormData(prev => ({
            ...prev,
            brandColors: [...prev.brandColors, pendingColor],
        }));
    };

    const handleRemoveColor = (index: number) => {
        setFormData(prev => ({
            ...prev,
            brandColors: prev.brandColors.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async () => {
        if (!connectedAccount) return;
        setIsSubmitting(true);

        try {
            await apiService.createBusinessProfile({
                instagramAccountId: connectedAccount.id,
                brandName: formData.brandName,
                industry: formData.industry,
                description: formData.brandDescription,
                targetAudience: formData.targetAudience,
                brandValues: formData.brandValues,
                visualStyle: formData.visualStyle,
                communicationTone: formData.communicationTone,
                brandColors: formData.brandColors,
                contentThemes: formData.contentThemes,
                productCategories: formData.productCategories,
                prohibitedTopics: formData.prohibitedTopics,
                contentGuidelines: formData.contentGuidelines,
            });

            onProfileCreated();
        } catch (error) {
            console.error('Failed to create business profile:', error);
            alert('Error al crear el perfil. Por favor intenta de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!showForm) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl mx-auto"
            >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 border border-primary/30">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative p-8 md:p-12">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            {/* Icon */}
                            <div className="flex-shrink-0">
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
                                    <Building2 className="w-12 h-12 text-white" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    <span className="text-sm font-medium text-primary">¡Bienvenido a Postia!</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                    Registra tu Perfil de Negocio
                                </h2>
                                <p className="text-gray-400 text-lg mb-6 max-w-xl">
                                    Conecta tu cuenta de Instagram Business para comenzar a crear contenido increíble con IA, 
                                    programar publicaciones y hacer crecer tu marca.
                                </p>

                                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                                    <Button
                                        onClick={() => setShowForm(true)}
                                        className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white px-8 py-3 h-auto text-lg font-semibold shadow-lg shadow-primary/25 flex items-center gap-2"
                                    >
                                        <Instagram className="w-5 h-5" />
                                        Conectar Instagram
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>
                                </div>

                                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-500 justify-center md:justify-start">
                                    <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Contenido con IA
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Programación automática
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Análisis de rendimiento
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto"
        >
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                            {step === 'instagram' ? (
                                <Instagram className="w-5 h-5 text-white" />
                            ) : (
                                <Building2 className="w-5 h-5 text-white" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {step === 'instagram' ? 'Conectar Instagram' : 'Detalles del Negocio'}
                            </h2>
                            <p className="text-sm text-gray-400">
                                {step === 'instagram' 
                                    ? 'Vincula tu cuenta de Instagram Business' 
                                    : 'Cuéntanos sobre tu marca'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setShowForm(false);
                            setStep('instagram');
                            setConnectedAccount(null);
                        }}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 'instagram' ? (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center mx-auto mb-6">
                                <Instagram className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Conecta tu cuenta de Instagram Business
                            </h3>
                            <p className="text-gray-400 mb-6 max-w-md mx-auto">
                                Necesitamos acceso a tu cuenta de Instagram Business para poder crear y programar contenido.
                            </p>
                            <Button
                                onClick={handleConnectInstagram}
                                disabled={isConnecting}
                                className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:opacity-90 text-white px-8 py-3 h-auto text-lg font-semibold"
                            >
                                {isConnecting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Conectando...
                                    </>
                                ) : (
                                    <>
                                        <Instagram className="w-5 h-5 mr-2" />
                                        Conectar con Instagram
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Connected account info */}
                            {connectedAccount && (
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                                    {connectedAccount.profilePictureUrl && (
                                        <img 
                                            src={connectedAccount.profilePictureUrl} 
                                            alt="" 
                                            className="w-12 h-12 rounded-full"
                                        />
                                    )}
                                    <div>
                                        <p className="font-medium text-white">@{connectedAccount.username}</p>
                                        <p className="text-sm text-green-400">✓ Cuenta conectada</p>
                                    </div>
                                </div>
                            )}

                            {/* Form fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Nombre de la Marca *
                                    </label>
                                    <Input
                                        value={formData.brandName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, brandName: e.target.value }))}
                                        placeholder="Mi Empresa"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Industria *
                                    </label>
                                    <select
                                        value={formData.industry}
                                        onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                                        className="w-full h-10 px-3 rounded-md bg-background border border-input text-white"
                                    >
                                        <option value="">Selecciona una industria</option>
                                        {INDUSTRIES.map(ind => (
                                            <option key={ind} value={ind}>{ind}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Descripción de la Marca
                                </label>
                                <textarea
                                    value={formData.brandDescription}
                                    onChange={(e) => setFormData(prev => ({ ...prev, brandDescription: e.target.value }))}
                                    placeholder="Describe tu marca, productos o servicios..."
                                    className="w-full h-24 px-3 py-2 rounded-md bg-background border border-input text-white resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Audiencia Objetivo
                                </label>
                                <Input
                                    value={formData.targetAudience}
                                    onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                                    placeholder="ej: Jóvenes emprendedores de 25-35 años"
                                    className="w-full"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Tono de Comunicación
                                    </label>
                                    <Input
                                        value={formData.communicationTone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, communicationTone: e.target.value }))}
                                        placeholder="ej: Profesional pero cercano"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Estilo Visual
                                    </label>
                                    <Input
                                        value={formData.visualStyle}
                                        onChange={(e) => setFormData(prev => ({ ...prev, visualStyle: e.target.value }))}
                                        placeholder="ej: Minimalista y moderno"
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {/* Colors */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Colores de Marca
                                </label>
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="color"
                                        value={pendingColor}
                                        onChange={(e) => setPendingColor(e.target.value)}
                                        className="w-10 h-10 rounded cursor-pointer"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddColor}
                                        disabled={formData.brandColors.length >= 5}
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Agregar
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.brandColors.map((color, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10"
                                        >
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: color }}
                                            />
                                            <span className="text-xs text-gray-300">{color}</span>
                                            <button
                                                onClick={() => handleRemoveColor(idx)}
                                                className="ml-1 text-gray-400 hover:text-white"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Content Themes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Temas de Contenido
                                </label>
                                <div className="flex items-center gap-2 mb-2">
                                    <Input
                                        value={pendingItems.themes}
                                        onChange={(e) => setPendingItems(prev => ({ ...prev, themes: e.target.value }))}
                                        placeholder="ej: Tips de productividad"
                                        className="flex-1"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddItem('contentThemes', 'themes');
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddItem('contentThemes', 'themes')}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.contentThemes.map((theme, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm"
                                        >
                                            {theme}
                                            <button onClick={() => handleRemoveItem('contentThemes', idx)}>
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="pt-4 border-t border-border">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !formData.brandName || !formData.industry}
                                    className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white py-3 h-auto text-lg font-semibold"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Creando perfil...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5 mr-2" />
                                            Crear Perfil de Negocio
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
