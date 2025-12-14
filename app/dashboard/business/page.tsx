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
};

export default function BusinessPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [accountId, setAccountId] = useState<string | null>(null);
    const [formData, setFormData] = useState<BusinessProfileForm>(initialFormState);
    const [newItem, setNewItem] = useState(''); // Temp state for adding array items

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
            const payload = { ...formData, instagramAccountId: accountId };

            if (formData.id) {
                await apiService.updateBusinessProfile(formData.id, payload);
            } else {
                await apiService.createBusinessProfile(payload);
            }
            alert('Business profile saved successfully!');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile.');
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
                <h2 className="text-2xl font-bold text-white mb-2">No Account Connected</h2>
                <p className="text-gray-400">Please connect an Instagram account in the Profile tab first.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary flex items-center gap-2">
                    <Building2 className="w-8 h-8 text-primary" />
                    Business Profile
                </h1>
                <p className="text-gray-400 mt-1">Manage your brand identity and preferences</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="glass-card p-6 space-y-6">
                    <h3 className="text-xl font-semibold border-b border-white/10 pb-4">Brand Identity</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Brand Name</label>
                            <input
                                name="brandName"
                                value={formData.brandName}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                                placeholder="e.g. Acme Corp"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Industry</label>
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
                        <label className="block text-sm font-medium text-gray-300">Brand Description</label>
                        <textarea
                            name="brandDescription"
                            value={formData.brandDescription}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                            placeholder="Describe your business..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Visual Style</label>
                            <select
                                name="visualStyle"
                                value={formData.visualStyle}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                            >
                                <option value="" className="bg-gray-900">Select style</option>
                                <option value="Minimalist" className="bg-gray-900">Minimalist</option>
                                <option value="Bold" className="bg-gray-900">Bold</option>
                                <option value="Vintage" className="bg-gray-900">Vintage</option>
                                <option value="Luxury" className="bg-gray-900">Luxury</option>
                                <option value="Playful" className="bg-gray-900">Playful</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Communication Tone</label>
                            <select
                                name="communicationTone"
                                value={formData.communicationTone}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                            >
                                <option value="" className="bg-gray-900">Select tone</option>
                                <option value="Professional" className="bg-gray-900">Professional</option>
                                <option value="Friendly" className="bg-gray-900">Friendly</option>
                                <option value="Humorous" className="bg-gray-900">Humorous</option>
                                <option value="Inspirational" className="bg-gray-900">Inspirational</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Target Audience</label>
                        <input
                            name="targetAudience"
                            value={formData.targetAudience}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                            placeholder="e.g. Millennials, Tech enthusiasts"
                        />
                    </div>
                </div>

                <div className="glass-card p-6 space-y-6">
                    <h3 className="text-xl font-semibold border-b border-white/10 pb-4">Content Strategy</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderArrayInput('Content Themes', 'contentThemes', 'Add theme (Press Enter)')}
                        {renderArrayInput('Brand Colors', 'brandColors', 'Add hex code (e.g. #FF0000)')}
                        {renderArrayInput('Product Categories', 'productCategories', 'Add category')}
                        {renderArrayInput('Prohibited Topics', 'prohibitedTopics', 'Add topic to avoid')}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Content Guidelines</label>
                        <textarea
                            name="contentGuidelines"
                            value={formData.contentGuidelines}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                            placeholder="Any specific guidelines..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Brand Values</label>
                        <textarea
                            name="brandValues"
                            value={formData.brandValues}
                            onChange={handleChange}
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                            placeholder="e.g. Sustainability, Innovation"
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
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
