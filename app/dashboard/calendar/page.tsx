'use client';

import { useState, useEffect } from 'react';
import apiService from '@/lib/api.service';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { getImageUrl } from '@/lib/utils';
import { Calendar, Clock, Plus, Sparkles, AlertTriangle, Trash2, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import ContentStrategyModal from '@/components/ContentStrategyModal';
import ContentStrategyDetail from '@/components/ContentStrategyDetail';
import { useCallback } from 'react';

// Format badge colors
const FORMAT_COLORS: Record<string, string> = {
    carousel: 'bg-blue-500/30 border-blue-500/50',
    reel: 'bg-pink-500/30 border-pink-500/50',
    static_post: 'bg-green-500/30 border-green-500/50',
    story: 'bg-purple-500/30 border-purple-500/50',
    live: 'bg-red-500/30 border-red-500/50',
};

// Format icons mapping
const FORMAT_ICONS: Record<string, string> = {
    carousel: '📸',
    reel: '🎬',
    static_post: '🖼️',
    story: '📱'
};

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [posts, setPosts] = useState<any[]>([]);
    const [contentStrategies, setContentStrategies] = useState<any[]>([]);
    const { businessProfiles, selectedProfile, setSelectedProfile, loading: loadingProfiles } = useBusinessProfile();
    const [loading, setLoading] = useState(true);
    const [loadingStrategies, setLoadingStrategies] = useState(false);
    const [galleryOutputs, setGalleryOutputs] = useState<any[]>([]);

    // Modal states
    const [showStrategyModal, setShowStrategyModal] = useState(false);
    const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
    const [showStrategyDetail, setShowStrategyDetail] = useState(false);
    const [generatingStrategy, setGeneratingStrategy] = useState(false);

    // Delete state
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Expanded day state
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    const loadPosts = useCallback(async () => {
        if (selectedProfile === 'all') {
            setPosts([]);
            setLoading(false);
            return;
        }
        try {
            const data = await apiService.getPosts(selectedProfile);
            setPosts(data || []);
        } catch (error) {
            console.error('Failed to load posts:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedProfile]);

    const loadGalleryOutputs = useCallback(async () => {
        try {
            const profile = selectedProfile !== 'all'
                ? businessProfiles.find(p => p.instagramAccount?.id === selectedProfile)
                : null;
            const outputs = await apiService.listOutputs(profile?.id || undefined);
            setGalleryOutputs(Array.isArray(outputs) ? outputs : []);
        } catch (error) {
            console.error('Failed to load gallery outputs:', error);
            setGalleryOutputs([]);
        }
    }, [selectedProfile, businessProfiles]);

    const loadContentStrategies = useCallback(async () => {
        setLoadingStrategies(true);
        if (selectedProfile === 'all') {
            setContentStrategies([]);
            setLoadingStrategies(false);
            return;
        }
        try {
            const monthYear = format(currentDate, 'yyyy-MM');
            const profile = businessProfiles.find(p => p.instagramAccount?.id === selectedProfile);
            if (profile) {
                const data = await apiService.getContentStrategiesByMonth(monthYear, profile.id);
                setContentStrategies(data || []);
            } else {
                setContentStrategies([]);
            }
        } catch (error) {
            console.error('Failed to load content strategies:', error);
            setContentStrategies([]);
        } finally {
            setLoadingStrategies(false);
        }
    }, [selectedProfile, currentDate, businessProfiles]);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    useEffect(() => {
        if (businessProfiles.length > 0) {
            loadContentStrategies();
            loadGalleryOutputs();
        }
    }, [loadContentStrategies, loadGalleryOutputs, businessProfiles.length]);

    const handleGenerateStrategy = async (data: {
        businessProfileId: string;
        selectedDates: string[];
        monthYear: string;
        formatDistribution?: {
            reels: number;
            stories: number;
            carousels: number;
            staticPosts: number;
        };
        goal: string;
    }) => {
        setGeneratingStrategy(true);
        try {
            // Find the actual business profile ID
            const profile = businessProfiles.find(p => p.instagramAccount?.id === data.businessProfileId);
            if (!profile) throw new Error('Business profile not found');

            await apiService.generateContentStrategy({
                businessProfileId: profile.id,
                selectedDates: data.selectedDates,
                monthYear: data.monthYear,
                formatDistribution: data.formatDistribution,
                goal: data.goal,
            });

            // Set the selected profile to show the generated strategies
            setSelectedProfile(data.businessProfileId);

            // Manually load content strategies for this profile
            const monthYear = format(currentDate, 'yyyy-MM');
            const strategiesData = await apiService.getContentStrategiesByMonth(monthYear, profile.id);
            setContentStrategies(strategiesData || []);

            // Close modal is handled by the modal itself
        } catch (error) {
            console.error('Failed to generate strategy:', error);
            throw error; // Re-throw to let modal handle the error
        } finally {
            setGeneratingStrategy(false);
        }
    };

    const handleStrategyClick = (strategy: any) => {
        setSelectedStrategy(strategy);
        setShowStrategyDetail(true);
    };

    const handleDeletePost = async (e: React.MouseEvent, postId: string) => {
        e.stopPropagation();
        if (!window.confirm('¿Eliminar esta publicación programada?')) return;
        setDeletingId(postId);
        try {
            await apiService.deletePost(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (error) {
            console.error('Failed to delete post:', error);
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteStrategy = async (e: React.MouseEvent, strategyId: string) => {
        e.stopPropagation();
        if (!window.confirm('¿Eliminar este contenido de la estrategia IA?')) return;
        setDeletingId(strategyId);
        try {
            await apiService.deleteContentStrategy(strategyId);
            setContentStrategies(prev => prev.filter(s => s.id !== strategyId));
            // Clear selectedDay panel if it becomes empty after deletion
        } catch (error) {
            console.error('Failed to delete strategy:', error);
        } finally {
            setDeletingId(null);
        }
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getPostsForDay = (day: Date) => {
        return posts.filter(post =>
            post.scheduledAt && isSameDay(new Date(post.scheduledAt), day)
        );
    };

    const getStrategiesForDay = (day: Date) => {
        return contentStrategies.filter(strategy =>
            isSameDay(new Date(strategy.scheduledDate), day)
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary">
                        Calendario de Contenido
                    </h1>
                    <p className="text-gray-400 mt-1">Planifica y programa tus publicaciones</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowStrategyModal(true)}
                        className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2"
                    >
                        <Sparkles className="w-5 h-5" />
                        Estrategia IA
                    </button>
                    <Link
                        href="/dashboard/posts/create"
                        className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all shadow-lg shadow-primary/25 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Crear Contenido
                    </Link>
                </div>
            </div>

            {/* Calendar Header */}
            <div className="glass-card p-6 relative">
                {selectedProfile === 'all' && (
                    <div className="absolute inset-0 z-10 rounded-xl flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm">
                        <AlertTriangle className="w-10 h-10 text-yellow-400" />
                        <p className="text-base font-semibold text-yellow-300 text-center px-8">
                            Para usar el calendario debes seleccionar un perfil de negocio.<br />
                            <span className="text-sm font-normal text-gray-300">Elige uno desde el selector en la parte superior.</span>
                        </p>
                    </div>
                )}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            Hoy
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                        <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
                            {day}
                        </div>
                    ))}

                    {monthDays.map((day, index) => {
                        const dayPosts = getPostsForDay(day);
                        const dayStrategies = getStrategiesForDay(day);
                        const today = isToday(day);
                        const totalItems = dayPosts.length + dayStrategies.length;

                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.01 }}
                                onClick={() => setSelectedDay(prev => prev && isSameDay(prev, day) ? null : day)}
                                className={`min-h-24 p-2 rounded-lg border transition-all cursor-pointer hover:border-primary/50 ${
                                    selectedDay && isSameDay(selectedDay, day)
                                        ? 'border-primary bg-primary/20 ring-1 ring-primary/40'
                                        : today
                                        ? 'border-primary bg-primary/10'
                                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                                }`}
                            >
                                <div className="text-sm font-semibold mb-1">
                                    {format(day, 'd')}
                                </div>
                                <div className="space-y-1">
                                    {/* AI Content Strategies */}
                                    {dayStrategies.slice(0, 2).map((strategy: any) => {
                                        const formatIcon = FORMAT_ICONS[strategy.format as keyof typeof FORMAT_ICONS] || '📝';
                                        return (
                                            <div
                                                key={strategy.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStrategyClick(strategy);
                                                }}
                                                className="group text-xs bg-gray-500/20 border border-gray-500/30 text-gray-400 rounded px-2 py-1 cursor-pointer hover:bg-gray-500/30 transition-colors"
                                                title={`${formatIcon} ${strategy.hook}`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <span className="text-sm flex-shrink-0">{formatIcon}</span>
                                                    <span className="truncate flex-1">
                                                        {strategy.hook?.substring(0, 12) || 'Contenido IA'}
                                                    </span>
                                                    <button
                                                        onClick={(e) => handleDeleteStrategy(e, strategy.id)}
                                                        disabled={deletingId === strategy.id}
                                                        className="hidden group-hover:flex items-center justify-center w-3 h-3 flex-shrink-0 text-red-400 hover:text-red-300 transition-colors"
                                                    >
                                                        <Trash2 className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {/* Regular Posts */}
                                    {dayPosts.slice(0, Math.max(0, 2 - dayStrategies.length)).map((post: any) => {
                                        const profile = businessProfiles.find(p => p.instagramAccount.id === post.instagramAccountId);
                                        const isScheduled = post.status === 'scheduled';
                                        const pillClass = isScheduled
                                            ? 'bg-green-500/20 border-green-500/40 text-green-200'
                                            : 'bg-gray-500/20 border-gray-500/30 text-gray-400';
                                        return (
                                            <div
                                                key={post.id}
                                                className={`group text-xs border rounded px-2 py-1 ${pillClass}`}
                                                title={`${profile?.brandName || 'Desconocido'}: ${post.content || post.title || 'Sin descripción'}`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {profile?.instagramAccount.profilePictureUrl && (
                                                        <img
                                                            src={profile.instagramAccount.profilePictureUrl}
                                                            alt={profile.brandName}
                                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                                        />
                                                    )}
                                                    <span className="truncate flex-1">
                                                        {(post.content || post.title)?.substring(0, 15) || 'Sin descripción'}
                                                    </span>
                                                    <button
                                                        onClick={(e) => handleDeletePost(e, post.id)}
                                                        disabled={deletingId === post.id}
                                                        className="hidden group-hover:flex items-center justify-center w-3 h-3 flex-shrink-0 text-red-400 hover:text-red-300 transition-colors"
                                                    >
                                                        <Trash2 className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {totalItems > 2 && (
                                        <div className="text-xs text-gray-400">
                                            +{totalItems - 2} más
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
                {/* Day expanded panel */}
                {selectedDay && (() => {
                    const dayPosts = getPostsForDay(selectedDay);
                    const dayStrategies = getStrategiesForDay(selectedDay);
                    const hasItems = dayPosts.length > 0 || dayStrategies.length > 0;
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 border border-white/10 rounded-xl bg-white/5 overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                                <span className="font-semibold text-sm">
                                    {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
                                </span>
                                <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-white transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {!hasItems ? (
                                <p className="text-sm text-gray-500 px-4 py-4">No hay contenido programado para este día.</p>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {dayStrategies.map((strategy: any) => {
                                        const formatIcon = FORMAT_ICONS[strategy.format as keyof typeof FORMAT_ICONS] || '📝';
                                        return (
                                            <div key={strategy.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
                                                <button
                                                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                                                    onClick={() => handleStrategyClick(strategy)}
                                                >
                                                    <span className="text-lg flex-shrink-0">{formatIcon}</span>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate text-purple-300">{strategy.hook || 'Contenido IA'}</p>
                                                        <p className="text-xs text-gray-500 capitalize">{strategy.format?.replace('_', ' ')} · Estrategia IA</p>
                                                    </div>
                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 ml-2" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteStrategy(e, strategy.id)}
                                                    disabled={deletingId === strategy.id}
                                                    className="ml-3 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50 flex-shrink-0"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {dayPosts.map((post: any) => {
                                        const profile = businessProfiles.find(p => p.instagramAccount.id === post.instagramAccountId);
                                        const isScheduled = post.status === 'scheduled';
                                        const statusDot = isScheduled
                                            ? 'bg-green-400'
                                            : 'bg-gray-500';
                                        const statusLabel = isScheduled ? 'Programado' : 'Borrador';
                                        return (
                                            <div key={post.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    {post.mediaUrls?.[0] ? (
                                                        <img src={getImageUrl(post.mediaUrls[0])} alt="" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-white/10 rounded-lg flex-shrink-0" />
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot}`} />
                                                            <span className={`text-xs font-medium ${isScheduled ? 'text-green-400' : 'text-gray-500'}`}>{statusLabel}</span>
                                                        </div>
                                                        <p className="text-sm font-medium truncate">{(post.content || post.title)?.substring(0, 50) || 'Sin descripción'}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {profile?.brandName} · {post.scheduledAt ? format(new Date(post.scheduledAt), 'HH:mm') : 'Borrador'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                                    <Link
                                                        href={`/dashboard/posts/${post.id}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-xs text-primary hover:text-primary-hover transition-colors"
                                                    >
                                                        Ver
                                                    </Link>
                                                    <button
                                                        onClick={(e) => handleDeletePost(e, post.id)}
                                                        disabled={deletingId === post.id}
                                                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    );
                })()}
            </div>
            <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Próximas Publicaciones
                        {selectedProfile !== 'all' && (
                            <span className="text-sm font-normal text-gray-400">
                                para {businessProfiles.find(p => p.instagramAccount.id === selectedProfile)?.brandName || 'Perfil Seleccionado'}
                            </span>
                        )}
                    </h3>
                    <div className="text-sm text-gray-400">
                        {posts.length} publicación{posts.length !== 1 ? 'es' : ''} en total
                    </div>
                </div>
                {loading ? (
                    <div className="text-center py-8 text-gray-400">Cargando...</div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        No hay publicaciones programadas aún. ¡Crea tu primera publicación!
                    </div>
                ) : (() => {
                    const upcomingPosts = posts
                        .filter((post: any) => {
                            // Only show future posts with status 'scheduled' or 'draft'
                            if (!post.scheduledAt) return false;
                            const scheduledTime = new Date(post.scheduledAt).getTime();
                            const now = Date.now();
                            return scheduledTime > now && (post.status === 'scheduled' || post.status === 'draft');
                        })
                        .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                        .slice(0, 5);

                    if (upcomingPosts.length === 0) {
                        return (
                            <div className="text-center py-8 text-gray-400">
                                No hay publicaciones próximas programadas. Todas fueron publicadas o están en el pasado.
                            </div>
                        );
                    }

                    return (
                        <div className="space-y-3">
                            {upcomingPosts.map((post: any) => {
                                const profile = businessProfiles.find(p => p.instagramAccount.id === post.instagramAccountId);
                                const isScheduled = post.status === 'scheduled';
                                return (
                                    <div key={post.id} className={`flex items-center justify-between p-4 rounded-lg transition-colors hover:bg-white/10 ${
                                        isScheduled ? 'bg-green-500/5 border border-green-500/20' : 'bg-white/5 border border-white/5'
                                    }`}>
                                        <div className="flex items-center gap-4">
                                            {post.mediaUrls?.[0] && (
                                                <img
                                                    src={getImageUrl(post.mediaUrls[0])}
                                                    alt="Post"
                                                    className="w-16 h-16 object-cover rounded-lg"
                                                />
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                                                        isScheduled
                                                            ? 'bg-green-500/15 border-green-500/30 text-green-400'
                                                            : 'bg-gray-500/15 border-gray-500/30 text-gray-400'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isScheduled ? 'bg-green-400' : 'bg-gray-500'}`} />
                                                        {isScheduled ? 'Programado' : 'Borrador'}
                                                    </span>
                                                    {profile && (
                                                        <>
                                                            {profile.instagramAccount.profilePictureUrl && (
                                                                <img
                                                                    src={profile.instagramAccount.profilePictureUrl}
                                                                    alt={profile.brandName}
                                                                    className="w-5 h-5 rounded-full"
                                                                />
                                                            )}
                                                            <span className="text-sm text-gray-400">
                                                                {profile.brandName} • @{profile.instagramAccount.username}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <p className="font-medium">{(post.content || post.title)?.substring(0, 50) || 'Sin descripción'}</p>
                                                <p className="text-sm text-gray-400">
                                                    {post.scheduledAt ? format(new Date(post.scheduledAt), 'PPp', { locale: es }) : 'Borrador'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Link
                                                href={`/dashboard/posts/${post.id}`}
                                                className="text-primary hover:text-primary-hover transition-colors text-sm"
                                            >
                                                Ver
                                            </Link>
                                            <button
                                                onClick={(e) => handleDeletePost(e, post.id)}
                                                disabled={deletingId === post.id}
                                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50"
                                                title="Eliminar publicación"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
            </div>

            {/* Content Strategy Modal */}
            <ContentStrategyModal
                isOpen={showStrategyModal}
                onClose={() => setShowStrategyModal(false)}
                onGenerate={handleGenerateStrategy}
                businessProfiles={businessProfiles}
                selectedProfileId={selectedProfile}
                currentMonth={currentDate}
            />

            {/* Content Strategy Detail Modal */}
            <ContentStrategyDetail
                strategy={selectedStrategy}
                isOpen={showStrategyDetail}
                onClose={() => {
                    setShowStrategyDetail(false);
                    setSelectedStrategy(null);
                }}
                onDelete={async (id) => {
                    await apiService.deleteContentStrategy(id);
                    setContentStrategies(prev => prev.filter(s => s.id !== id));
                    setShowStrategyDetail(false);
                    setSelectedStrategy(null);
                }}
                onConvertToPost={async (id) => {
                    await apiService.convertContentStrategyToPost(id);
                    await loadContentStrategies();
                }}
                galleryOutputs={galleryOutputs}
            />
        </div>
    );
}
