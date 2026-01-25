'use client';

import { useState, useEffect } from 'react';
import apiService from '@/lib/api.service';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import {
    Flame,
    Hash,
    Lightbulb,
    RefreshCw,
    Loader2,
    TrendingUp,
    Zap,
    Wrench,
    Sparkles,
    Play,
    Heart,
    MessageCircle,
    Share2,
    BookmarkPlus,
    ChevronRight,
    ExternalLink,
    ArrowUpRight,
    Cpu,
    Target,
    Star,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrendingKeyword {
    keyword: string;
    searchVolume: number;
    growthRate: number;
    category: 'term' | 'technique' | 'technology';
    description: string;
}

interface TrendingTechnique {
    name: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    engagementBoost: number;
    examples: string[];
    tips: string[];
}

interface TrendingTechnology {
    name: string;
    category: string;
    description: string;
    useCase: string;
    popularity: number;
    isNew: boolean;
}

interface InspiringPost {
    id: string;
    type: 'image' | 'video' | 'carousel' | 'reel';
    thumbnailUrl: string;
    caption: string;
    engagement: {
        likes: number;
        comments: number;
        shares: number;
    };
    author: {
        username: string;
        followers: number;
        verified: boolean;
    };
    tags: string[];
    whyItWorks: string;
    contentCategory: string;
}

type TabType = 'keywords' | 'techniques' | 'technologies' | 'inspiration';

export default function TrendingPage() {
    const { selectedProfile, selectedBusinessProfile, businessProfiles, loading: loadingProfiles } = useBusinessProfile();
    const [activeTab, setActiveTab] = useState<TabType>('keywords');
    const [keywords, setKeywords] = useState<TrendingKeyword[]>([]);
    const [techniques, setTechniques] = useState<TrendingTechnique[]>([]);
    const [technologies, setTechnologies] = useState<TrendingTechnology[]>([]);
    const [inspiringPosts, setInspiringPosts] = useState<InspiringPost[]>([]);
    const [hashtags, setHashtags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedTechnique, setExpandedTechnique] = useState<string | null>(null);
    const [selectedPost, setSelectedPost] = useState<InspiringPost | null>(null);

    const loadData = async (accId: string) => {
        try {
            const [keywordsData, techniquesData, technologiesData, postsData, hashtagsData] = await Promise.all([
                apiService.getTrendingKeywords(accId),
                apiService.getTrendingTechniques(accId),
                apiService.getTrendingTechnologies(accId),
                apiService.getInspiringPosts(accId),
                apiService.getTrendingHashtags(accId)
            ]);

            setKeywords(keywordsData);
            setTechniques(techniquesData);
            setTechnologies(technologiesData);
            setInspiringPosts(postsData);
            setHashtags(hashtagsData);
        } catch (error) {
            console.error('Error loading trending data:', error);
        }
    };

    useEffect(() => {
        if (selectedProfile && selectedProfile !== 'all') {
            setLoading(true);
            loadData(selectedProfile).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [selectedProfile]);

    const handleRefresh = async () => {
        if (!selectedProfile || selectedProfile === 'all') return;
        setRefreshing(true);
        await loadData(selectedProfile);
        setRefreshing(false);
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'term': return <Hash className="w-4 h-4" />;
            case 'technique': return <Target className="w-4 h-4" />;
            case 'technology': return <Cpu className="w-4 h-4" />;
            default: return <TrendingUp className="w-4 h-4" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'term': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'technique': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'technology': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'term': return 'Término';
            case 'technique': return 'Técnica';
            case 'technology': return 'Tecnología';
            default: return category;
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'bg-green-500/20 text-green-400';
            case 'intermediate': return 'bg-yellow-500/20 text-yellow-400';
            case 'advanced': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const getPostTypeIcon = (type: string) => {
        switch (type) {
            case 'reel':
            case 'video': return <Play className="w-4 h-4" />;
            case 'carousel': return <span className="text-xs font-bold">📷+</span>;
            default: return <span className="text-xs">📷</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Show message when no profile is selected
    if (selectedProfile === 'all' || !selectedProfile) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary flex items-center gap-3">
                        <Flame className="w-8 h-8 text-primary" />
                        Tendencias e Inspiración
                    </h1>
                    <p className="text-gray-400 mt-1">Descubre qué funciona en tu industria</p>
                </div>

                <div className="glass-card p-12 text-center">
                    <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Selecciona un Perfil de Negocio</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                        Para ver tendencias personalizadas, selecciona un perfil de negocio específico desde el selector en la barra superior.
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

    const tabs = [
        { id: 'keywords' as TabType, label: 'Términos', icon: TrendingUp, count: keywords.length },
        { id: 'techniques' as TabType, label: 'Técnicas', icon: Zap, count: techniques.length },
        { id: 'technologies' as TabType, label: 'Herramientas', icon: Wrench, count: technologies.length },
        { id: 'inspiration' as TabType, label: 'Inspiración', icon: Sparkles, count: inspiringPosts.length },
    ];

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary flex items-center gap-3">
                        <Flame className="w-8 h-8 text-primary" />
                        Tendencias e Inspiración
                    </h1>
                    <p className="text-gray-400 mt-1">
                        {selectedBusinessProfile ? (
                            <>Tendencias para <span className="text-primary">{selectedBusinessProfile.industry || 'tu industria'}</span></>
                        ) : (
                            'Descubre qué funciona en tu industria'
                        )}
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Actualizar</span>
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{keywords.length}</p>
                            <p className="text-xs text-gray-400">Términos en tendencia</p>
                        </div>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <Zap className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{techniques.length}</p>
                            <p className="text-xs text-gray-400">Técnicas efectivas</p>
                        </div>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Wrench className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{technologies.length}</p>
                            <p className="text-xs text-gray-400">Herramientas</p>
                        </div>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/20 rounded-lg">
                            <Sparkles className="w-5 h-5 text-pink-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{inspiringPosts.length}</p>
                            <p className="text-xs text-gray-400">Posts inspiradores</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Trending Hashtags Marquee */}
            {hashtags.length > 0 && (
                <div className="glass-card p-4 overflow-hidden">
                    <div className="flex items-center gap-3 mb-3">
                        <Hash className="w-5 h-5 text-primary" />
                        <span className="font-semibold">Hashtags en Tendencia</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {hashtags.slice(0, 10).map((tag: any, index: number) => (
                            <motion.div
                                key={tag.hashtag}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 rounded-full flex items-center gap-2 hover:border-primary/50 transition-all cursor-pointer"
                            >
                                <span className="font-medium">{tag.hashtag}</span>
                                <span className="text-xs text-gray-400">{formatNumber(tag.count)}</span>
                                {tag.trend === 'rising' && <ArrowUpRight className="w-3 h-3 text-green-400" />}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-primary text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'
                            }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'keywords' && (
                    <motion.div
                        key="keywords"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {keywords.map((keyword, index) => (
                                <motion.div
                                    key={keyword.keyword}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="glass-card p-5 hover:border-primary/30 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-1 rounded-full text-xs border flex items-center gap-1 ${getCategoryColor(keyword.category)}`}>
                                                    {getCategoryIcon(keyword.category)}
                                                    {getCategoryLabel(keyword.category)}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                                                {keyword.keyword}
                                            </h3>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-green-400">
                                                <ArrowUpRight className="w-4 h-4" />
                                                <span className="font-bold">+{keyword.growthRate}%</span>
                                            </div>
                                            <p className="text-xs text-gray-400">{formatNumber(keyword.searchVolume)} búsquedas/mes</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-400">{keyword.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'techniques' && (
                    <motion.div
                        key="techniques"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        {techniques.map((technique, index) => (
                            <motion.div
                                key={technique.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="glass-card overflow-hidden"
                            >
                                <div
                                    className="p-5 cursor-pointer hover:bg-white/5 transition-colors"
                                    onClick={() => setExpandedTechnique(expandedTechnique === technique.name ? null : technique.name)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold">{technique.name}</h3>
                                                <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(technique.difficulty)}`}>
                                                    {technique.difficulty === 'beginner' ? 'Fácil' : technique.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                                                </span>
                                            </div>
                                            <p className="text-gray-400 text-sm">{technique.description}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-green-400">
                                                    <TrendingUp className="w-4 h-4" />
                                                    <span className="font-bold">+{technique.engagementBoost}%</span>
                                                </div>
                                                <p className="text-xs text-gray-400">engagement</p>
                                            </div>
                                            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedTechnique === technique.name ? 'rotate-90' : ''}`} />
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {expandedTechnique === technique.name && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-white/10"
                                        >
                                            <div className="p-5 grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                        <Lightbulb className="w-4 h-4 text-yellow-400" />
                                                        Ejemplos de uso
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {technique.examples.map((example, i) => (
                                                            <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                                                <span className="text-primary mt-1">•</span>
                                                                {example}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                        Consejos
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {technique.tips.map((tip, i) => (
                                                            <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                                                <span className="text-green-400 mt-1">✓</span>
                                                                {tip}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'technologies' && (
                    <motion.div
                        key="technologies"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {technologies.map((tech, index) => (
                            <motion.div
                                key={tech.name}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="glass-card p-5 hover:border-primary/30 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                                            {tech.name}
                                        </h3>
                                        {tech.isNew && (
                                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                                ¡Nuevo!
                                            </span>
                                        )}
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" />
                                </div>
                                <span className="inline-block px-2 py-1 bg-white/10 text-gray-300 text-xs rounded mb-3">
                                    {tech.category}
                                </span>
                                <p className="text-sm text-gray-400 mb-3">{tech.description}</p>
                                <div className="pt-3 border-t border-white/10">
                                    <p className="text-xs text-gray-500 mb-2">¿Para qué sirve?</p>
                                    <p className="text-sm text-gray-300">{tech.useCase}</p>
                                </div>
                                <div className="mt-4">
                                    <p className="text-xs text-gray-500 mb-1">Popularidad</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                                                style={{ width: `${tech.popularity}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-400">{tech.popularity}%</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'inspiration' && (
                    <motion.div
                        key="inspiration"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {inspiringPosts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="glass-card overflow-hidden group cursor-pointer"
                                onClick={() => setSelectedPost(post)}
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-square bg-gray-800 overflow-hidden">
                                    <img
                                        src={post.thumbnailUrl}
                                        alt={post.caption}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full flex items-center gap-1 text-xs">
                                        {getPostTypeIcon(post.type)}
                                        <span className="capitalize">{post.type}</span>
                                    </div>
                                    <div className="absolute top-3 right-3 px-2 py-1 bg-primary/80 backdrop-blur-sm rounded-full text-xs font-medium">
                                        {post.contentCategory}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="flex items-center gap-1">
                                                <Heart className="w-4 h-4" />
                                                {formatNumber(post.engagement.likes)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageCircle className="w-4 h-4" />
                                                {formatNumber(post.engagement.comments)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Share2 className="w-4 h-4" />
                                                {formatNumber(post.engagement.shares)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-medium text-sm">@{post.author.username}</span>
                                        {post.author.verified && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                                        <span className="text-xs text-gray-500">{formatNumber(post.author.followers)} seg.</span>
                                    </div>
                                    <p className="text-sm text-gray-300 line-clamp-2 mb-3">{post.caption}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {post.tags.slice(0, 3).map((tag) => (
                                            <span key={tag} className="text-xs text-gray-400">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Post Detail Modal */}
            <AnimatePresence>
                {selectedPost && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedPost(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative aspect-video bg-gray-800">
                                <img
                                    src={selectedPost.thumbnailUrl}
                                    alt={selectedPost.caption}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">@{selectedPost.author.username}</span>
                                        {selectedPost.author.verified && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                                    </div>
                                    <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                                        {selectedPost.contentCategory}
                                    </span>
                                </div>

                                <p className="text-gray-300">{selectedPost.caption}</p>

                                <div className="flex items-center gap-6 py-4 border-y border-white/10">
                                    <span className="flex items-center gap-2">
                                        <Heart className="w-5 h-5 text-red-400" />
                                        <span className="font-semibold">{formatNumber(selectedPost.engagement.likes)}</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <MessageCircle className="w-5 h-5 text-blue-400" />
                                        <span className="font-semibold">{formatNumber(selectedPost.engagement.comments)}</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Share2 className="w-5 h-5 text-green-400" />
                                        <span className="font-semibold">{formatNumber(selectedPost.engagement.shares)}</span>
                                    </span>
                                </div>

                                <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-lg p-4">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <Star className="w-4 h-4 text-yellow-400" />
                                        Por qué funciona
                                    </h4>
                                    <p className="text-gray-300 text-sm">{selectedPost.whyItWorks}</p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {selectedPost.tags.map((tag) => (
                                        <span key={tag} className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setSelectedPost(null)}
                                    className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
