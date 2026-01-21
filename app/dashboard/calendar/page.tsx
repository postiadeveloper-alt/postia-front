'use client';

import { useState, useEffect } from 'react';
import apiService from '@/lib/api.service';
import { getImageUrl } from '@/lib/utils';
import { Calendar, Clock, Plus, Filter, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import ContentStrategyModal from '@/components/ContentStrategyModal';
import ContentStrategyDetail from '@/components/ContentStrategyDetail';

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
    const [businessProfiles, setBusinessProfiles] = useState<any[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [loadingProfiles, setLoadingProfiles] = useState(true);
    const [loadingStrategies, setLoadingStrategies] = useState(false);

    // Modal states
    const [showStrategyModal, setShowStrategyModal] = useState(false);
    const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
    const [showStrategyDetail, setShowStrategyDetail] = useState(false);
    const [generatingStrategy, setGeneratingStrategy] = useState(false);

    useEffect(() => {
        loadBusinessProfiles();
        loadPosts();
    }, []);

    useEffect(() => {
        loadPosts();
        loadContentStrategies();
    }, [selectedProfile, currentDate]);

    const loadBusinessProfiles = async () => {
        try {
            const data = await apiService.getBusinessProfiles();
            setBusinessProfiles(data || []);
        } catch (error) {
            console.error('Failed to load business profiles:', error);
        } finally {
            setLoadingProfiles(false);
        }
    };

    const loadPosts = async () => {
        try {
            const accountId = selectedProfile !== 'all' ? selectedProfile : undefined;
            const data = await apiService.getPosts(accountId);
            setPosts(data || []);
        } catch (error) {
            console.error('Failed to load posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadContentStrategies = async () => {
        if (selectedProfile === 'all') {
            setContentStrategies([]);
            return;
        }

        setLoadingStrategies(true);
        try {
            const monthYear = format(currentDate, 'yyyy-MM');
            // Find the business profile ID from the instagram account ID
            const profile = businessProfiles.find(p => p.instagramAccount?.id === selectedProfile);
            if (profile) {
                const data = await apiService.getContentStrategiesByMonth(monthYear, profile.id);
                setContentStrategies(data || []);
            }
        } catch (error) {
            console.error('Failed to load content strategies:', error);
            setContentStrategies([]);
        } finally {
            setLoadingStrategies(false);
        }
    };

    const handleGenerateStrategy = async (data: {
        businessProfileId: string;
        selectedDays: number[];
        monthYear: string;
    }) => {
        setGeneratingStrategy(true);
        try {
            // Find the actual business profile ID
            const profile = businessProfiles.find(p => p.instagramAccount?.id === data.businessProfileId);
            if (!profile) throw new Error('Business profile not found');

            await apiService.generateContentStrategy({
                businessProfileId: profile.id,
                selectedDays: data.selectedDays,
                monthYear: data.monthYear,
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

            {/* Business Profile Filter */}
            <div className="glass-card p-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-300">Filtrar por Perfil de Negocio:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedProfile('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedProfile === 'all'
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                        >
                            Todos los Perfiles
                        </button>
                        {businessProfiles.map((profile) => (
                            <button
                                key={profile.instagramAccount.id}
                                onClick={() => setSelectedProfile(profile.instagramAccount.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${selectedProfile === profile.instagramAccount.id
                                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                    }`}
                            >
                                {profile.instagramAccount.profilePictureUrl && (
                                    <img
                                        src={profile.instagramAccount.profilePictureUrl}
                                        alt={profile.brandName}
                                        className="w-5 h-5 rounded-full"
                                    />
                                )}
                                <span>{profile.brandName}</span>
                                <span className="text-xs opacity-75">@{profile.instagramAccount.username}</span>
                            </button>
                        ))}
                    </div>
                    {loadingProfiles && (
                        <div className="flex items-center gap-2 text-gray-400">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                            <span className="text-sm">Cargando perfiles...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Calendar Header */}
            <div className="glass-card p-6">
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
                                className={`min-h-24 p-2 rounded-lg border transition-all cursor-pointer hover:border-primary/50 ${today
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
                                                className="text-xs bg-purple-500/20 border border-purple-500/30 rounded px-2 py-1 truncate cursor-pointer hover:bg-purple-500/30 transition-colors"
                                                title={`${formatIcon} ${strategy.hook}`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                                    <span className="truncate">
                                                        {strategy.hook?.substring(0, 12) || 'Contenido IA'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {/* Regular Posts */}
                                    {dayPosts.slice(0, Math.max(0, 2 - dayStrategies.length)).map((post: any) => {
                                        const profile = businessProfiles.find(p => p.instagramAccount.id === post.instagramAccountId);
                                        return (
                                            <div
                                                key={post.id}
                                                className="text-xs bg-primary/20 border border-primary/30 rounded px-2 py-1 truncate"
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
                                                    <span className="truncate">
                                                        {(post.content || post.title)?.substring(0, 15) || 'Sin descripción'}
                                                    </span>
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
            </div>

            {/* Upcoming Posts */}
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
                                return (
                                    <div key={post.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
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
                                        <Link
                                            href={`/dashboard/posts/${post.id}`}
                                            className="text-primary hover:text-primary-hover transition-colors"
                                        >
                                            Ver
                                        </Link>
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
            />
        </div>
    );
}
