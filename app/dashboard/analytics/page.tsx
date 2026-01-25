'use client';

import { useState, useEffect } from 'react';
import apiService from '@/lib/api.service';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { TrendingUp, BarChart3, Sparkles, Users, Image, AlertCircle, RefreshCw } from 'lucide-react';

interface AccountOverview {
    accountInfo: {
        id: string;
        username: string;
        name: string;
        profilePictureUrl: string;
        followersCount: number;
        followsCount: number;
        mediaCount: number;
    };
    stats: {
        totalReach: number;
        engagementRate: number;
        followersCount: number;
        postsThisMonth: number;
        reachChange: string;
        engagementChange: string;
        followersChange: string;
        postsChange: string;
    };
    topPosts: Array<{
        id: string;
        caption: string;
        mediaType: string;
        mediaUrl: string;
        timestamp: string;
        likeCount: number;
        commentsCount: number;
        engagementRate: number;
    }>;
    insightsAvailable: boolean;
}

export default function AnalyticsPage() {
    const { selectedProfile, selectedBusinessProfile, businessProfiles, loading: loadingProfiles } = useBusinessProfile();
    const [overview, setOverview] = useState<AccountOverview | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (selectedProfile && selectedProfile !== 'all') {
            loadAnalytics();
        } else {
            setOverview(null);
        }
    }, [selectedProfile]);

    const loadAnalytics = async () => {
        if (!selectedProfile || selectedProfile === 'all') return;
        
        setLoading(true);
        setError(null);
        
        try {
            const data = await apiService.getAccountOverview(selectedProfile);
            setOverview(data);
        } catch (err: any) {
            console.error('Failed to load analytics:', err);
            setError(err.response?.data?.message || 'Error al cargar las analíticas');
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    // Show message when no profile is selected
    if (selectedProfile === 'all' || !selectedProfile) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary">
                        Analíticas
                    </h1>
                    <p className="text-gray-400 mt-1">Rastrea tu rendimiento e ideas</p>
                </div>

                <div className="glass-card p-12 text-center">
                    <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Selecciona un Perfil de Negocio</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                        Para ver las analíticas, selecciona un perfil de negocio específico desde el selector en la barra superior.
                    </p>
                    {businessProfiles.length === 0 && !loadingProfiles && (
                        <p className="text-gray-500 mt-4 text-sm">
                            No tienes perfiles de negocio configurados. Conecta una cuenta de Instagram para comenzar.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary">
                        Analíticas
                    </h1>
                    <p className="text-gray-400 mt-1">
                        {selectedBusinessProfile ? (
                            <>Rendimiento de <span className="text-primary">@{selectedBusinessProfile.instagramAccount.username}</span></>
                        ) : (
                            'Rastrea tu rendimiento e ideas'
                        )}
                    </p>
                </div>
                <button
                    onClick={loadAnalytics}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {loading ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="glass-card p-6 animate-pulse">
                                <div className="h-8 w-8 bg-white/10 rounded mb-4"></div>
                                <div className="h-8 w-20 bg-white/10 rounded mb-2"></div>
                                <div className="h-4 w-24 bg-white/10 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : error ? (
                <div className="glass-card p-6 border-red-500/30">
                    <div className="flex items-center gap-3 text-red-400">
                        <AlertCircle className="w-6 h-6" />
                        <div>
                            <p className="font-semibold">Error al cargar analíticas</p>
                            <p className="text-sm text-gray-400">{error}</p>
                        </div>
                    </div>
                    <button
                        onClick={loadAnalytics}
                        className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            ) : overview ? (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="glass-card p-6 hover:border-primary/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <TrendingUp className="w-8 h-8 text-cyan-400" />
                                <span className="text-sm text-green-400 bg-green-400/10 px-2 py-1 rounded">
                                    {overview.stats.reachChange}
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold mb-1">{formatNumber(overview.stats.totalReach)}</h3>
                            <p className="text-sm text-gray-400">Alcance Total</p>
                        </div>

                        <div className="glass-card p-6 hover:border-primary/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <BarChart3 className="w-8 h-8 text-primary" />
                                <span className="text-sm text-green-400 bg-green-400/10 px-2 py-1 rounded">
                                    {overview.stats.engagementChange}
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold mb-1">{overview.stats.engagementRate}%</h3>
                            <p className="text-sm text-gray-400">Tasa de Interacción</p>
                        </div>

                        <div className="glass-card p-6 hover:border-primary/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <Users className="w-8 h-8 text-purple-400" />
                                <span className="text-sm text-green-400 bg-green-400/10 px-2 py-1 rounded">
                                    {overview.stats.followersChange}
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold mb-1">{formatNumber(overview.stats.followersCount)}</h3>
                            <p className="text-sm text-gray-400">Seguidores</p>
                        </div>

                        <div className="glass-card p-6 hover:border-primary/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <Image className="w-8 h-8 text-green-400" />
                                <span className="text-sm text-green-400 bg-green-400/10 px-2 py-1 rounded">
                                    {overview.stats.postsChange}
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold mb-1">{overview.stats.postsThisMonth}</h3>
                            <p className="text-sm text-gray-400">Publicaciones Este Mes</p>
                        </div>
                    </div>

                    {/* Account Info Card */}
                    <div className="glass-card p-6">
                        <h3 className="text-xl font-semibold mb-4">Información de la Cuenta</h3>
                        <div className="flex items-center gap-6">
                            {overview.accountInfo.profilePictureUrl ? (
                                <img
                                    src={overview.accountInfo.profilePictureUrl}
                                    alt={overview.accountInfo.username}
                                    className="w-20 h-20 rounded-full border-2 border-primary"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                    {overview.accountInfo.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1">
                                <h4 className="text-xl font-semibold">{overview.accountInfo.name || overview.accountInfo.username}</h4>
                                <p className="text-gray-400">@{overview.accountInfo.username}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-8 text-center">
                                <div>
                                    <p className="text-2xl font-bold">{formatNumber(overview.accountInfo.mediaCount)}</p>
                                    <p className="text-sm text-gray-400">Publicaciones</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{formatNumber(overview.accountInfo.followersCount)}</p>
                                    <p className="text-sm text-gray-400">Seguidores</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{formatNumber(overview.accountInfo.followsCount)}</p>
                                    <p className="text-sm text-gray-400">Siguiendo</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Posts */}
                    <div className="glass-card p-6">
                        <h3 className="text-xl font-semibold mb-4">Publicaciones con Mejor Rendimiento</h3>
                        {overview.topPosts.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No hay publicaciones disponibles para mostrar</p>
                                {!overview.insightsAvailable && (
                                    <p className="text-sm mt-2">Conecta tu cuenta de Instagram para ver más detalles</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {overview.topPosts.map((post) => (
                                    <div key={post.id} className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                        {post.mediaUrl ? (
                                            <img
                                                src={post.mediaUrl}
                                                alt="Post"
                                                className="w-16 h-16 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                                                <Image className="w-8 h-8 text-white/50" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">
                                                {post.caption || 'Sin descripción'}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {formatNumber(post.likeCount)} me gusta · {formatNumber(post.commentsCount)} comentarios
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-primary font-semibold">{post.engagementRate.toFixed(2)}%</p>
                                            <p className="text-xs text-gray-400">Interacción</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {!overview.insightsAvailable && (
                        <div className="glass-card p-4 border-yellow-500/30 bg-yellow-500/5">
                            <div className="flex items-center gap-3 text-yellow-400">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm">
                                    Algunas métricas son estimadas. Para obtener insights completos, asegúrate de que tu cuenta de Instagram sea una cuenta de negocios o creador.
                                </p>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="glass-card p-12 text-center">
                    <Sparkles className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No hay datos disponibles</h3>
                    <p className="text-gray-400">
                        Conecta tu cuenta de Instagram para ver analíticas detalladas
                    </p>
                </div>
            )}
        </div>
    );
}
