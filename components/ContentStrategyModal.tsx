'use client';

import { useState } from 'react';
import { X, Sparkles, Calendar, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ContentStrategyModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessProfiles: any[];
    selectedProfileId: string;
    currentMonth: Date;
    onGenerate: (data: {
        businessProfileId: string;
        selectedDays: number[];
        monthYear: string;
    }) => Promise<void>;
}

const DAYS_OF_WEEK = [
    { value: 0, label: 'Domingo', short: 'Dom' },
    { value: 1, label: 'Lunes', short: 'Lun' },
    { value: 2, label: 'Martes', short: 'Mar' },
    { value: 3, label: 'Miércoles', short: 'Mié' },
    { value: 4, label: 'Jueves', short: 'Jue' },
    { value: 5, label: 'Viernes', short: 'Vie' },
    { value: 6, label: 'Sábado', short: 'Sáb' },
];

export default function ContentStrategyModal({
    isOpen,
    onClose,
    businessProfiles,
    selectedProfileId,
    currentMonth,
    onGenerate,
}: ContentStrategyModalProps) {
    const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Default: Mon, Wed, Fri
    const [profileId, setProfileId] = useState(selectedProfileId !== 'all' ? selectedProfileId : '');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDayToggle = (day: number) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day].sort()
        );
    };

    const handleGenerate = async () => {
        if (!profileId) {
            setError('Por favor selecciona un perfil de negocio');
            return;
        }
        if (selectedDays.length === 0) {
            setError('Por favor selecciona al menos un día');
            return;
        }

        setError(null);
        setIsGenerating(true);

        try {
            await onGenerate({
                businessProfileId: profileId,
                selectedDays,
                monthYear: format(currentMonth, 'yyyy-MM'),
            });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al generar la estrategia de contenido');
        } finally {
            setIsGenerating(false);
        }
    };

    const selectedProfile = businessProfiles.find(p => p.instagramAccount?.id === profileId);

    // Calculate number of posts that will be generated
    const getEstimatedPosts = () => {
        // Rough estimate: ~4-5 weeks per month
        return selectedDays.length * 4;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-primary to-purple-600 rounded-xl">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Estrategia de Contenido IA</h2>
                                <p className="text-sm text-gray-400">
                                    Generar contenido para {format(currentMonth, 'MMMM yyyy', { locale: es })}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Business Profile Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Seleccionar Perfil de Negocio
                            </label>
                            <select
                                value={profileId}
                                onChange={(e) => setProfileId(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all [&>option]:bg-gray-800 [&>option]:text-white"
                            >
                                <option value="" className="bg-gray-800 text-white">Elige un perfil...</option>
                                {businessProfiles.map((profile) => (
                                    <option key={profile.id} value={profile.instagramAccount?.id} className="bg-gray-800 text-white">
                                        {profile.brandName} (@{profile.instagramAccount?.username})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selected Profile Preview */}
                        {selectedProfile && (
                            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    {selectedProfile.instagramAccount?.profilePictureUrl && (
                                        <img
                                            src={selectedProfile.instagramAccount.profilePictureUrl}
                                            alt={selectedProfile.brandName}
                                            className="w-10 h-10 rounded-full"
                                        />
                                    )}
                                    <div>
                                        <div className="font-medium text-white">{selectedProfile.brandName}</div>
                                        <div className="text-sm text-gray-400">{selectedProfile.industry}</div>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 line-clamp-2">
                                    {selectedProfile.brandDescription}
                                </p>
                            </div>
                        )}

                        {/* Day Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                                Seleccionar Días de Publicación
                            </label>
                            <div className="grid grid-cols-7 gap-2">
                                {DAYS_OF_WEEK.map((day) => (
                                    <button
                                        key={day.value}
                                        onClick={() => handleDayToggle(day.value)}
                                        className={`p-3 rounded-lg border text-center transition-all ${
                                            selectedDays.includes(day.value)
                                                ? 'bg-primary border-primary text-white'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                                        }`}
                                    >
                                        <div className="text-xs font-medium">{day.short}</div>
                                        {selectedDays.includes(day.value) && (
                                            <Check className="w-3 h-3 mx-auto mt-1" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Estimation */}
                        <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                <span className="text-sm text-gray-300">Publicaciones estimadas:</span>
                            </div>
                            <span className="text-lg font-bold text-primary">
                                ~{getEstimatedPosts()} publicaciones
                            </span>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 p-6 border-t border-white/10">
                        <button
                            onClick={onClose}
                            disabled={isGenerating}
                            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !profileId || selectedDays.length === 0}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary-hover hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generar Estrategia
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
