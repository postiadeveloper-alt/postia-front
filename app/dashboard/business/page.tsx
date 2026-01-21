'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/lib/api.service';
import { Building2, Save, Loader2, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface BusinessProfileForm {
    id?: string;
    brandName: string;
    brandDescription: string;
    industry: string;
    targetAudience: string;
    brandValues: string;
    visualStyle: string;
    communicationTone: string;
    contentGuidelines: string;
    brandColors: string[];
    contentThemes: string[];
    productCategories: string[];
    prohibitedTopics: string[];
    logoUrl?: string;
}

const initialFormState: BusinessProfileForm = {
    brandName: '',
    brandDescription: '',
    industry: '',
    targetAudience: '',
    brandValues: '',
    visualStyle: '',
    communicationTone: '',
    contentGuidelines: '',
    brandColors: [],
    contentThemes: [],
    productCategories: [],
    prohibitedTopics: [],
    logoUrl: '',
};

export default function BusinessPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [accountId, setAccountId] = useState<string | null>(null);
    const [formData, setFormData] = useState<BusinessProfileForm>(initialFormState);
    const [newItem, setNewItem] = useState(''); // Temp state for adding array items
    const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const accounts = await apiService.getInstagramAccounts();
            if (accounts && accounts.length > 0) {
                const accId = accounts[0].id; // Use first account for now
                setAccountId(accId);

                try {
                    const profile = await apiService.getBusinessProfile(accId);
                    if (profile) {
                        setFormData({
                            id: profile.id,
                            brandName: profile.brandName || '',
                            brandDescription: profile.brandDescription || '',
                            industry: profile.industry || '',
                            targetAudience: profile.targetAudience || '',
                            brandValues: profile.brandValues || '',
                            visualStyle: profile.visualStyle || '',
                            communicationTone: profile.communicationTone || '',
                            contentGuidelines: profile.contentGuidelines || '',
                            brandColors: profile.brandColors || [],
                            contentThemes: profile.contentThemes || [],
                            productCategories: profile.productCategories || [],
                            prohibitedTopics: profile.prohibitedTopics || [],
                            logoUrl: profile.logoUrl || '',
                        });
                    }
                } catch (err: any) {
                    if (err.response && err.response.status !== 404) {
                        console.error('Error fetching profile:', err);
                    }
                    // If 404, it means no profile exists yet, which is fine
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleArrayAdd = (field: keyof BusinessProfileForm, value: string) => {
        if (!value.trim()) return;
        setFormData(prev => ({
            ...prev,
            [field]: [...(prev[field] as string[]), value.trim()]
        }));
    };

    const handleArrayRemove = (field: keyof BusinessProfileForm, index: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: (prev[field] as string[]).filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountId) return;

        try {
            setSaving(true);

            let currentLogoUrl = formData.logoUrl;

            // 1. Upload logo if there is a pending file
            if (pendingLogoFile) {
                const res = await apiService.uploadLogo(pendingLogoFile, accountId);
                currentLogoUrl = res.publicUrl;
            }

            // Prepare payload
            const { id: profileId, ...restFormData } = formData;
            const payload: any = {
                ...restFormData,
                logoUrl: currentLogoUrl
            };

            if (profileId) {
                // When updating, the ID is in the URL, not in the body
                // And instagramAccountId is also not allowed in PATCH body
                await apiService.updateBusinessProfile(profileId, payload);
            } else {
                // When creating, instagramAccountId IS required
                payload.instagramAccountId = accountId;
                await apiService.createBusinessProfile(payload);
            }

            // Clear pending file after successful save
            setPendingLogoFile(null);
            if (logoPreview) {
                URL.revokeObjectURL(logoPreview);
                setLogoPreview(null);
            }


            alert('¡Perfil del negocio guardado exitosamente!');
            loadData(); // Reload to get updated data
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Error al guardar el perfil.');
        } finally {
            setSaving(false);
        }
    };

    const renderArrayInput = (label: string, field: keyof BusinessProfileForm, placeholder: string) => (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">{label}</label>
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder={placeholder}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleArrayAdd(field, e.currentTarget.value);
                            e.currentTarget.value = '';
                        }
                    }}
                />
                <button
                    type="button"
                    className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30"
                    onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        handleArrayAdd(field, input.value);
                        input.value = '';
                    }}
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
                {(formData[field] as string[]).map((item, index) => (
                    <div key={index} className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full text-sm">
                        <span>{item}</span>
                        <button
                            type="button"
                            onClick={() => handleArrayRemove(field, index)}
                            className="text-red-400 hover:text-red-300"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderColorInput = () => (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Colores de Marca</label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="#000000"
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-2 text-white focus:outline-none focus:border-primary/50"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleArrayAdd('brandColors', e.currentTarget.value);
                                e.currentTarget.value = '';
                            }
                        }}
                    />
                    <input
                        type="color"
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-transparent border-none cursor-pointer"
                        onChange={(e) => {
                            const input = e.target.previousElementSibling as HTMLInputElement;
                            input.value = e.target.value.toUpperCase();
                        }}
                    />
                </div>
                <button
                    type="button"
                    className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30"
                    onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling?.querySelector('input[type="text"]') as HTMLInputElement;
                        handleArrayAdd('brandColors', input.value);
                        input.value = '';
                    }}
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
                {formData.brandColors.map((color, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm border border-white/5">
                        <div
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: color }}
                        />
                        <span>{color}</span>
                        <button
                            type="button"
                            onClick={() => handleArrayRemove('brandColors', index)}
                            className="text-red-400 hover:text-red-300 ml-1"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!accountId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <Building2 className="w-16 h-16 text-gray-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No hay cuenta conectada</h2>
                <p className="text-gray-400">Por favor, conecta una cuenta de Instagram en la pestaña Perfil primero.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary flex items-center gap-2">
                    <Building2 className="w-8 h-8 text-primary" />
                    Perfil de Negocio
                </h1>
                <p className="text-gray-400 mt-1">Gestiona la identidad y preferencias de tu marca</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="glass-card p-6 space-y-6">
                    <h3 className="text-xl font-semibold border-b border-white/10 pb-4">Logo de la Marca</h3>
                    <div className="flex items-center gap-8">
                        <div className="w-32 h-32 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-white/5 relative group">
                            {logoPreview || formData.logoUrl ? (
                                <img src={logoPreview || formData.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <div className="text-gray-500 flex flex-col items-center gap-2">
                                    <Plus className="w-6 h-6" />
                                    <span className="text-xs">Sin Logo</span>
                                </div>
                            )}
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <span className="text-xs text-white font-medium">Cambiar Logo</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setPendingLogoFile(file);
                                            if (logoPreview) URL.revokeObjectURL(logoPreview);
                                            setLogoPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                            </label>
                        </div>
                        <div className="flex-1 space-y-2">
                            <p className="text-sm text-gray-400">
                                Sube el logo de tu negocio. Eliminaremos automáticamente el fondo para usarlo en plantillas.
                            </p>
                            <p className="text-xs text-indigo-400">
                                Mejores resultados con fondos de alto contraste (como blanco o negro).
                            </p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 space-y-6">
                    <h3 className="text-xl font-semibold border-b border-white/10 pb-4">Identidad de Marca</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Nombre de la Marca</label>
                            <input
                                name="brandName"
                                value={formData.brandName}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                                placeholder="e.g. Acme Corp"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Industria</label>
                            <input
                                name="industry"
                                value={formData.industry}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                                placeholder="e.g. Fashion, Tech, Food"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Descripción de la Marca</label>
                        <textarea
                            name="brandDescription"
                            value={formData.brandDescription}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                            placeholder="Describe tu negocio..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">Estilo Visual</label>
                                <select
                                    name="visualStyle"
                                    value={formData.visualStyle}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                                >
                                    <option value="" className="bg-gray-900">Seleccionar estilo</option>
                                    <option value="Minimalist" className="bg-gray-900">Minimalista</option>
                                    <option value="Bold" className="bg-gray-900">Audaz</option>
                                    <option value="Vintage" className="bg-gray-900">Vintage</option>
                                    <option value="Luxury" className="bg-gray-900">Lujo</option>
                                    <option value="Playful" className="bg-gray-900">Juguetón</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">Tono de Comunicación</label>
                                <select
                                    name="communicationTone"
                                    value={formData.communicationTone}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                                >
                                    <option value="" className="bg-gray-900">Seleccionar tono</option>
                                    <option value="Professional" className="bg-gray-900">Profesional</option>
                                    <option value="Friendly" className="bg-gray-900">Amigable</option>
                                    <option value="Humorous" className="bg-gray-900">Humorístico</option>
                                    <option value="Inspirational" className="bg-gray-900">Inspirador</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Público Objetivo</label>
                            <input
                                name="targetAudience"
                                value={formData.targetAudience}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                                placeholder="ej. Millennials, Entusiastas de la tecnología"
                            />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 space-y-6">
                    <h3 className="text-xl font-semibold border-b border-white/10 pb-4">Estrategia de Contenido</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderArrayInput('Temáticas de Contenido', 'contentThemes', 'Añadir tema (Presiona Enter)')}
                        {renderColorInput()}
                        {renderArrayInput('Categorías de Productos', 'productCategories', 'Añadir categoría')}
                        {renderArrayInput('Temas Prohibidos', 'prohibitedTopics', 'Añadir tema a evitar')}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Pautas de Contenido</label>
                        <textarea
                            name="contentGuidelines"
                            value={formData.contentGuidelines}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                            placeholder="Cualquier pauta específica..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Valores de Marca</label>
                        <textarea
                            name="brandValues"
                            value={formData.brandValues}
                            onChange={handleChange}
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                            placeholder="ej. Sostenibilidad, Innovación"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
