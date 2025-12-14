'use client';

import { useState, useEffect } from 'react';
import apiService from '@/lib/api.service';
import { Flame, Hash, Lightbulb, RefreshCw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TrendingPage() {
    const [topics, setTopics] = useState<any[]>([]);
    const [hashtags, setHashtags] = useState<any[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [accountId, setAccountId] = useState<string | null>(null);

    const loadData = async (accId: string) => {
        try {
            const [topicsData, hashtagsData, suggestionsData] = await Promise.all([
                apiService.getTrendingTopics(accId),
                apiService.getTrendingHashtags(accId),
                apiService.getContentSuggestions(accId)
            ]);

            setTopics(topicsData);
            setHashtags(hashtagsData);
            setSuggestions(suggestionsData);
        } catch (error) {
            console.error('Error loading trending data:', error);
        }
    };

    const init = async () => {
        try {
            setLoading(true);
            const accounts = await apiService.getInstagramAccounts();
            if (accounts && accounts.length > 0) {
                const accId = accounts[0].id; // Use first account
                setAccountId(accId);
                await loadData(accId);
            }
        } catch (error) {
            console.error('Error initializing:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        init();
    }, []);

    const handleRefresh = async () => {
        if (!accountId) return;
        setRefreshing(true);
        await loadData(accountId);
        setRefreshing(false);
    };

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
                <Flame className="w-16 h-16 text-gray-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No Account Connected</h2>
                <p className="text-gray-400">Please connect an Instagram account in the Profile tab to see trending insights.</p>
            </div>
        );
    }

    // Flatten content ideas from suggestions or just use the first topic's ideas for the main list
    // Or display suggestions as a list of ideas.
    const allContentIdeas = suggestions.flatMap(s => s.contentIdeas).slice(0, 5);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary flex items-center gap-2">
                        <Flame className="w-8 h-8 text-primary" />
                        Trending
                    </h1>
                    <p className="text-gray-400 mt-1">Discover what&apos;s hot in your niche</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trending Hashtags */}
                <div className="glass-card p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Hash className="w-5 h-5 text-primary" />
                        Trending Hashtags
                    </h3>
                    <div className="space-y-3">
                        {hashtags.slice(0, 5).map((tag: any, index: number) => (
                            <motion.div
                                key={tag.hashtag}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl font-bold text-gray-600">#{index + 1}</div>
                                    <div>
                                        <p className="font-semibold group-hover:text-primary transition-colors">{tag.hashtag}</p>
                                        <p className="text-sm text-gray-400">{(tag.count / 1000000).toFixed(1)}M posts</p>
                                    </div>
                                </div>
                                <div className={`text-sm ${tag.trend === 'rising' ? 'text-green-400' : 'text-gray-400'}`}>
                                    <Flame className="w-5 h-5" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Content Suggestions */}
                <div className="glass-card p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-primary" />
                        Content Ideas
                    </h3>
                    <div className="space-y-3">
                        {allContentIdeas.length > 0 ? (
                            allContentIdeas.map((idea: string, index: number) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 hover:border-primary/40 rounded-lg transition-all cursor-pointer"
                                >
                                    <p className="font-medium">{idea}</p>
                                    <p className="text-xs text-gray-400 mt-1">Trending in your industry</p>
                                </motion.div>
                            ))
                        ) : (
                            <p className="text-gray-400">No suggestions available. Try updating your Business Profile.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Trending Topics */}
            <div className="glass-card p-6">
                <h3 className="text-xl font-semibold mb-4">Trending Topics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {topics.map((topic: any) => (
                        <div key={topic.topic} className="p-6 bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 rounded-xl hover:border-primary/50 transition-all cursor-pointer">
                            <h4 className="font-semibold mb-2">{topic.topic}</h4>
                            <p className="text-sm text-gray-300 mb-2">{topic.description}</p>
                            <p className="text-sm text-gray-400 mb-3">
                                Relevance: {topic.relevance}%
                            </p>
                            <div className="flex gap-2 flex-wrap">
                                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Hot</span>
                                {topic.hashtags && topic.hashtags.map((h: string) => (
                                    <span key={h} className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded">{h}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
