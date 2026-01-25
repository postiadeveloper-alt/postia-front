'use client';

import { useState, useMemo } from 'react';
import { X, Sparkles, Calendar, Check, Loader2, Film, Image, Layers, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval, 
    getDay,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    isToday,
    isBefore,
    startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';

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
    }) => Promise<void>;
}

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function ContentStrategyModal({
    isOpen,
    onClose,
    businessProfiles,
    selectedProfileId,
    currentMonth,
    onGenerate,
}: ContentStrategyModalProps) {
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [profileId, setProfileId] = useState(selectedProfileId !== 'all' ? selectedProfileId : '');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [displayMonth, setDisplayMonth] = useState(currentMonth);
    const [formatDistribution, setFormatDistribution] = useState<FormatDistribution>({
        reels: 1,
        stories: 0,
        carousels: 0,
        staticPosts: 0,
    });

    // Generate calendar days for the display month
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(displayMonth);
        const monthEnd = endOfMonth(displayMonth);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [displayMonth]);

    const totalFormats = formatDistribution.reels + formatDistribution.stories + 
                         formatDistribution.carousels + formatDistribution.staticPosts;
    // Total publications is just the sum of all formats (distributed across dates)
    const totalPublications = totalFormats;

    const handleDateToggle = (date: Date) => {
        // Don't allow selecting past dates
        if (isBefore(date, startOfDay(new Date()))) return;
        
        setSelectedDates(prev => {
            const isSelected = prev.some(d => isSameDay(d, date));
            if (isSelected) {
                return prev.filter(d => !isSameDay(d, date));
            } else {
                return [...prev, date].sort((a, b) => a.getTime() - b.getTime());
            }
        });
    };

    const handleSelectAllWeekday = (weekdayIndex: number) => {
        const monthStart = startOfMonth(displayMonth);
        const monthEnd = endOfMonth(displayMonth);
        const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const weekdayDates = allDays.filter(day => 
            getDay(day) === weekdayIndex && !isBefore(day, startOfDay(new Date()))
        );
        
        // Check if all weekday dates are already selected
        const allSelected = weekdayDates.every(date => 
            selectedDates.some(d => isSameDay(d, date))
        );
        
        if (allSelected) {
            // Deselect all
            setSelectedDates(prev => 
                prev.filter(d => !weekdayDates.some(wd => isSameDay(wd, d)))
            );
        } else {
            // Select all
            setSelectedDates(prev => {
                const newDates = [...prev];
                weekdayDates.forEach(date => {
                    if (!newDates.some(d => isSameDay(d, date))) {
                        newDates.push(date);
                    }
                });
                return newDates.sort((a, b) => a.getTime() - b.getTime());
            });
        }
    };

    const handleFormatChange = (formatKey: keyof FormatDistribution, delta: number) => {
        setFormatDistribution(prev => ({
            ...prev,
            [formatKey]: Math.max(0, prev[formatKey] + delta)
        }));
    };

    const handleGenerate = async () => {
        if (!profileId) {
            setError('Por favor selecciona un perfil de negocio');
            return;
        }
        if (selectedDates.length === 0) {
            setError('Por favor selecciona al menos una fecha');
            return;
        }
        if (totalFormats === 0) {
            setError('Por favor selecciona al menos un formato de contenido');
            return;
        }

        setError(null);
        setIsGenerating(true);

        try {
            await onGenerate({
                businessProfileId: profileId,
                selectedDates: selectedDates.map(d => format(d, 'yyyy-MM-dd')),
                monthYear: format(displayMonth, 'yyyy-MM'),
                formatDistribution,
            });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al generar la estrategia de contenido');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleClearSelection = () => {
        setSelectedDates([]);
    };

    const selectedProfile = businessProfiles.find(p => p.instagramAccount?.id === profileId);

    // Format controls component
    const FormatControl = ({ 
        label, 
        icon: Icon, 
        value, 
        formatKey,
        colorClass 
    }: { 
        label: string; 
        icon: any; 
        value: number; 
        formatKey: keyof FormatDistribution;
        colorClass: string;
    }) => (
        <div className="flex items-center justify-between p-2 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${colorClass}`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm text-gray-300">{label}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => handleFormatChange(formatKey, -1)}
                    disabled={value === 0}
                    className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    -
                </button>
                <span className="w-5 text-center font-medium text-white text-sm">{value}</span>
                <button
                    onClick={() => handleFormatChange(formatKey, 1)}
                    className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded text-white text-sm transition-colors"
                >
                    +
                </button>
            </div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl my-4 max-h-[90vh] flex flex-col"
                >
                    {/* Header - Fixed */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-primary to-purple-600 rounded-xl">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Estrategia de Contenido IA</h2>
                                <p className="text-xs text-gray-400">
                                    Selecciona fechas para generar contenido
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

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Business Profile Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Perfil de Negocio
                            </label>
                            <select
                                value={profileId}
                                onChange={(e) => setProfileId(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all [&>option]:bg-gray-800 [&>option]:text-white"
                            >
                                <option value="" className="bg-gray-800 text-white">Elige un perfil...</option>
                                {businessProfiles.map((profile) => (
                                    <option key={profile.id} value={profile.instagramAccount?.id} className="bg-gray-800 text-white">
                                        {profile.brandName} (@{profile.instagramAccount?.username})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selected Profile Preview - Compact */}
                        {selectedProfile && (
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3">
                                {selectedProfile.instagramAccount?.profilePictureUrl && (
                                    <img
                                        src={selectedProfile.instagramAccount.profilePictureUrl}
                                        alt={selectedProfile.brandName}
                                        className="w-8 h-8 rounded-full"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-white text-sm">{selectedProfile.brandName}</div>
                                    <div className="text-xs text-gray-400 truncate">{selectedProfile.industry}</div>
                                </div>
                            </div>
                        )}

                        {/* Calendar Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-300">
                                    Seleccionar Fechas
                                </label>
                                {selectedDates.length > 0 && (
                                    <button
                                        onClick={handleClearSelection}
                                        className="text-xs text-gray-400 hover:text-white transition-colors"
                                    >
                                        Limpiar selección
                                    </button>
                                )}
                            </div>
                            
                            {/* Month Navigation */}
                            <div className="flex items-center justify-between mb-3">
                                <button
                                    onClick={() => setDisplayMonth(prev => subMonths(prev, 1))}
                                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-400" />
                                </button>
                                <span className="text-sm font-medium text-white capitalize">
                                    {format(displayMonth, 'MMMM yyyy', { locale: es })}
                                </span>
                                <button
                                    onClick={() => setDisplayMonth(prev => addMonths(prev, 1))}
                                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>

                            {/* Weekday Headers - Clickable to select all */}
                            <div className="grid grid-cols-7 gap-1 mb-1">
                                {WEEKDAY_LABELS.map((label, index) => (
                                    <button
                                        key={label}
                                        onClick={() => handleSelectAllWeekday(index)}
                                        className="text-xs font-medium text-gray-500 hover:text-primary py-1 text-center transition-colors"
                                        title={`Seleccionar todos los ${label}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((day, index) => {
                                    const isCurrentMonth = isSameMonth(day, displayMonth);
                                    const isSelected = selectedDates.some(d => isSameDay(d, day));
                                    const isPast = isBefore(day, startOfDay(new Date()));
                                    const isDayToday = isToday(day);

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleDateToggle(day)}
                                            disabled={isPast || !isCurrentMonth}
                                            className={`
                                                aspect-square rounded-lg text-xs font-medium transition-all relative
                                                ${!isCurrentMonth 
                                                    ? 'text-gray-700 cursor-default' 
                                                    : isPast 
                                                        ? 'text-gray-600 cursor-not-allowed'
                                                        : isSelected 
                                                            ? 'bg-primary text-white' 
                                                            : 'text-gray-300 hover:bg-white/10'
                                                }
                                                ${isDayToday && isCurrentMonth ? 'ring-1 ring-primary/50' : ''}
                                            `}
                                        >
                                            {format(day, 'd')}
                                            {isSelected && (
                                                <Check className="w-2.5 h-2.5 absolute bottom-0.5 right-0.5" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <p className="text-xs text-gray-500 mt-2">
                                {selectedDates.length} {selectedDates.length === 1 ? 'fecha seleccionada' : 'fechas seleccionadas'}
                                {selectedDates.length > 0 && (
                                    <span className="text-gray-600"> • Click en día de semana para seleccionar todos</span>
                                )}
                            </p>
                        </div>

                        {/* Format Distribution - Compact 2x2 Grid */}
                        {selectedDates.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Distribución de Formatos
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Los formatos se distribuirán entre las {selectedDates.length} fechas seleccionadas
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <FormatControl 
                                        label="Reels" 
                                        icon={Film} 
                                        value={formatDistribution.reels} 
                                        formatKey="reels"
                                        colorClass="bg-pink-500/20"
                                    />
                                    <FormatControl 
                                        label="Stories" 
                                        icon={Clock} 
                                        value={formatDistribution.stories} 
                                        formatKey="stories"
                                        colorClass="bg-orange-500/20"
                                    />
                                    <FormatControl 
                                        label="Carruseles" 
                                        icon={Layers} 
                                        value={formatDistribution.carousels} 
                                        formatKey="carousels"
                                        colorClass="bg-blue-500/20"
                                    />
                                    <FormatControl 
                                        label="Posts" 
                                        icon={Image} 
                                        value={formatDistribution.staticPosts} 
                                        formatKey="staticPosts"
                                        colorClass="bg-green-500/20"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Estimation - Compact */}
                        <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span className="text-sm text-gray-300">Total:</span>
                            </div>
                            <div className="text-right">
                                <span className="text-base font-bold text-primary">
                                    {totalPublications} publicaciones
                                </span>
                                {totalFormats > 0 && selectedDates.length > 0 && (
                                    <p className="text-xs text-gray-500">
                                        Distribuidas en {selectedDates.length} fechas
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Footer - Fixed */}
                    <div className="flex gap-3 p-4 border-t border-white/10 shrink-0">
                        <button
                            onClick={onClose}
                            disabled={isGenerating}
                            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !profileId || selectedDates.length === 0 || totalFormats === 0}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary-hover hover:to-purple-700 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
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
