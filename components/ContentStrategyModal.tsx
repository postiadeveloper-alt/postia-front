'use client';

import { useState, useMemo, useEffect } from 'react';
import { X, Sparkles, Calendar, Check, Loader2, Trash2, Plus, ArrowRight, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    format,
    eachDayOfInterval,
    getDay,
    isBefore,
    startOfDay,
    parseISO,
    isValid,
    addDays,
    isSameDay,
    startOfMonth
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface FormatDistribution {
    reels: number;
    stories: number;
    carousels: number;
    staticPosts: number;
}

interface ContentStrategyModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessProfiles: any[];
    selectedProfileId: string;
    currentMonth: Date;
    onGenerate: (data: {
        businessProfileId: string;
        selectedDates: string[];
        monthYear: string;
        formatDistribution: FormatDistribution;
        goal: string;
    }) => Promise<void>;
}

type ContentType = 'reels' | 'stories' | 'carousels' | 'staticPosts';

const CONTENT_TYPES: { value: ContentType; label: string; icon: string }[] = [
    { value: 'reels', label: 'Reel', icon: '🎬' },
    { value: 'stories', label: 'Story', icon: '📱' },
    { value: 'carousels', label: 'Carrusel', icon: '📸' },
    { value: 'staticPosts', label: 'Post', icon: '🖼️' },
];

const STRATEGY_GOALS = [
    'Reconocimiento de marca (Brand awareness)',
    'Alcance a nuevas audiencias',
    'Crecimiento de seguidores',
    'Engagement (interacción)',
    'Posicionamiento de marca',
    'Educación / contenido informativo',
    'Construcción de confianza y credibilidad',
    'Tráfico al sitio web / landing',
    'Generación de leads',
    'Ventas / conversiones',
    'Retención de clientes',
    'Construcción de comunidad',
    'Lanzamiento de productos o servicios',
    'Investigación de mercado / feedback',
    'Gestión de reputación',
    'Testeo y optimización de contenido',
    'Otro (Escribir mi propia meta)'
];

const WEEKDAYS = [
    { id: 1, label: 'L', name: 'Lunes' },
    { id: 2, label: 'M', name: 'Martes' },
    { id: 3, label: 'M', name: 'Miércoles' },
    { id: 4, label: 'J', name: 'Jueves' },
    { id: 5, label: 'V', name: 'Viernes' },
    { id: 6, label: 'S', name: 'Sábado' },
    { id: 0, label: 'D', name: 'Domingo' },
];

export default function ContentStrategyModal({
    isOpen,
    onClose,
    businessProfiles,
    selectedProfileId,
    currentMonth,
    onGenerate,
}: ContentStrategyModalProps) {
    // Basic Form State
    const [profileId, setProfileId] = useState(selectedProfileId !== 'all' ? selectedProfileId : '');
    const [goal, setGoal] = useState<string>(STRATEGY_GOALS[0]);
    const [customGoal, setCustomGoal] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 3, 5]); // Default Mon, Wed, Fri

    // Per-day content plan
    const [contentPlan, setContentPlan] = useState<Record<string, ContentType>>({});
    const [excludedDates, setExcludedDates] = useState<string[]>([]);

    // UI State
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize/Reset
    useEffect(() => {
        if (isOpen) {
            setProfileId(selectedProfileId !== 'all' ? selectedProfileId : '');
            // Default range: Today to +7 days
            const today = new Date();
            const nextWeek = addDays(today, 7);
            setStartDate(format(today, 'yyyy-MM-dd'));
            setEndDate(format(nextWeek, 'yyyy-MM-dd'));
            setExcludedDates([]);
            setContentPlan({});
            setGoal(STRATEGY_GOALS[0]);
            setCustomGoal('');
            setError(null);
        }
    }, [isOpen, selectedProfileId]);

    // Calculate valid dates based on Range + Recurrence
    const generatedDates = useMemo(() => {
        if (!startDate || !endDate) return [];

        const start = parseISO(startDate);
        const end = parseISO(endDate);

        if (!isValid(start) || !isValid(end) || isBefore(end, start)) return [];

        try {
            const days = eachDayOfInterval({ start, end });
            const today = startOfDay(new Date());

            return days.filter(day => {
                // Filter past dates (optional context: maybe they want to backfill? usually not for strategy generation)
                // Filter by weekday recurrence
                if (isBefore(day, today)) return false;
                return selectedWeekdays.includes(getDay(day));
            }).filter(day => {
                // Filter excluded dates
                return !excludedDates.includes(format(day, 'yyyy-MM-dd'));
            });
        } catch (e) {
            return [];
        }
    }, [startDate, endDate, selectedWeekdays, excludedDates]);

    // Derived: Final List of Items to Generate
    // Maps generatedDates to their selected type (or default)
    const itemsToGenerate = useMemo(() => {
        return generatedDates.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            return {
                date: date,
                dateStr: dateStr,
                type: contentPlan[dateStr] || 'reels' // Default type
            };
        });
    }, [generatedDates, contentPlan]);

    // Toggle Weekday
    const toggleWeekday = (dayId: number) => {
        setSelectedWeekdays(prev =>
            prev.includes(dayId)
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId]
        );
    };

    // Update Content Type for a Date
    const handleTypeChange = (dateStr: string, type: ContentType) => {
        setContentPlan(prev => ({
            ...prev,
            [dateStr]: type
        }));
    };

    // Remove a date from the list (add to excluded)
    const handleRemoveDate = (dateStr: string) => {
        setExcludedDates(prev => [...prev, dateStr]);
    };

    const handleGenerate = async () => {
        if (!profileId) {
            setError('Selecciona un perfil de negocio');
            return;
        }

        const finalGoal = goal === 'Otro (Escribir mi propia meta)' ? customGoal : goal;
        if (!finalGoal.trim()) {
            setError('Por favor define la meta de la estrategia');
            return;
        }

        if (itemsToGenerate.length === 0) {
            setError('No hay fechas seleccionadas para generar contenido');
            return;
        }

        setIsGenerating(true);
        setError(null);

        // Agreggate counts
        const distribution: FormatDistribution = {
            reels: 0,
            stories: 0,
            carousels: 0,
            staticPosts: 0
        };

        const selectedDateStrings: string[] = [];

        itemsToGenerate.forEach(item => {
            selectedDateStrings.push(item.dateStr);
            distribution[item.type]++;
        });

        const monthYear = startDate ? format(parseISO(startDate), 'yyyy-MM') : format(new Date(), 'yyyy-MM');

        try {
            await onGenerate({
                businessProfileId: profileId,
                selectedDates: selectedDateStrings,
                monthYear: monthYear,
                formatDistribution: distribution,
                goal: finalGoal
            });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al generar la estrategia');
        } finally {
            setIsGenerating(false);
        }
    };

    const selectedProfile = businessProfiles.find(p => p.instagramAccount?.id === profileId);

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
                    className="bg-[#0F1117] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#14161F]">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-tight">Estrategia de Contenido</h2>
                                <p className="text-xs text-gray-400 font-medium">Planifica tu calendario con IA</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                        {/* 1. Profile Selection */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">1</div>
                                Perfil de Negocio
                            </label>

                            <select
                                value={profileId}
                                onChange={(e) => setProfileId(e.target.value)}
                                className="w-full bg-[#1A1D26] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none appearance-none"
                            >
                                <option value="" className="bg-gray-900">Seleccionar perfil...</option>
                                {businessProfiles.map((p) => (
                                    <option key={p.id} value={p.instagramAccount?.id} className="bg-gray-900">
                                        {p.brandName} (@{p.instagramAccount?.username})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 1.5 Strategy Goal */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">*</div>
                                Meta de la Estrategia
                            </label>

                            <select
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                className="w-full bg-[#1A1D26] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none appearance-none"
                            >
                                {STRATEGY_GOALS.map((g) => (
                                    <option key={g} value={g} className="bg-gray-900">
                                        {g}
                                    </option>
                                ))}
                            </select>

                            {goal === 'Otro (Escribir mi propia meta)' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="pt-1"
                                >
                                    <Input
                                        placeholder="Escribe tu meta aquí..."
                                        value={customGoal}
                                        onChange={(e) => setCustomGoal(e.target.value)}
                                        className="bg-[#1A1D26] border-white/10"
                                    />
                                </motion.div>
                            )}
                        </div>

                        {/* 2. Date Range */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">2</div>
                                Rango de Fechas
                            </label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 space-y-1">
                                    <span className="text-[10px] text-gray-400 ml-1">Desde</span>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-[#1A1D26] border-white/10 h-11"
                                    />
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-600 mt-5" />
                                <div className="flex-1 space-y-1">
                                    <span className="text-[10px] text-gray-400 ml-1">Hasta</span>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-[#1A1D26] border-white/10 h-11"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Recurrence */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">3</div>
                                Días de Publicación
                            </label>
                            <div className="flex justify-between gap-1 p-1 bg-[#1A1D26] rounded-xl border border-white/5">
                                {WEEKDAYS.map((day) => {
                                    const isSelected = selectedWeekdays.includes(day.id);
                                    return (
                                        <button
                                            key={day.id}
                                            onClick={() => toggleWeekday(day.id)}
                                            className={`
                                                flex-1 aspect-square rounded-lg text-sm font-medium transition-all
                                                flex items-center justify-center
                                                ${isSelected
                                                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                                    : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                                }
                                            `}
                                            title={day.name}
                                        >
                                            {day.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 4. Live Preview */}
                        <div className="space-y-3 pt-2 border-t border-white/5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">4</div>
                                    Planificación ({itemsToGenerate.length})
                                </label>
                            </div>

                            {itemsToGenerate.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-white/5">
                                    <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Selecciona un rango y días para ver tu plan</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                                    {itemsToGenerate.map((item) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={item.dateStr}
                                            className="flex items-center gap-3 p-3 bg-[#1A1D26] border border-white/5 rounded-xl group hover:border-white/10 transition-colors"
                                        >
                                            <div className="text-center min-w-[3rem]">
                                                <div className="text-[10px] text-gray-500 uppercase">{format(item.date, 'EEE', { locale: es })}</div>
                                                <div className="text-lg font-bold text-white leading-none">{format(item.date, 'd')}</div>
                                            </div>

                                            <div className="h-8 w-px bg-white/10" />

                                            <div className="flex-1">
                                                <select
                                                    value={item.type}
                                                    onChange={(e) => handleTypeChange(item.dateStr, e.target.value as ContentType)}
                                                    className="w-full bg-black/20 text-white text-sm border-none rounded-lg py-1.5 px-2 focus:ring-1 focus:ring-indigo-500 cursor-pointer hover:bg-black/30 transition-colors"
                                                >
                                                    {CONTENT_TYPES.map(type => (
                                                        <option key={type.value} value={type.value} className="bg-gray-900">
                                                            {type.icon} {type.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <button
                                                onClick={() => handleRemoveDate(item.dateStr)}
                                                className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Eliminar fecha"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-white/5 bg-[#14161F] flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 text-gray-400 hover:text-white"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || itemsToGenerate.length === 0 || !profileId}
                            className="flex-[2] bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 border-none"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generar {itemsToGenerate.length} Posts
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
