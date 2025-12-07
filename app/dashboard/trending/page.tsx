'use client';

import { useState, useEffect } from 'react';
import apiService from '@/lib/api.service';
import { Flame, Hash, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TrendingPage() {
    const [topics, setTopics] = useState<any[]>([]);
    const [hashtags, setHashtags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary flex items-center gap-2">
                    <Flame className="w-8 h-8 text-primary" />
                    Trending
                </h1>
                <p className="text-gray-400 mt-1">Discover what&apos;s hot in your niche</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trending Hashtags */}
                <div className="glass-card p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Hash className="w-5 h-5 text-primary" />
                        Trending Hashtags
                    </h3>
                    <div className="space-y-3">
                        {['#socialmedia', '#marketing', '#digitalmarketing', '#contentcreator', '#instagram'].map((tag, index) => (
                            <motion.div
                                key={tag}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl font-bold text-gray-600">#{index + 1}</div>
                                    <div>
                                        <p className="font-semibold group-hover:text-primary transition-colors">{tag}</p>
                                        <p className="text-sm text-gray-400">{Math.floor(Math.random() * 900 + 100)}K posts</p>
                                    </div>
                                </div>
                                <div className="text-sm text-green-400">
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
                        {[
                            'Share behind-the-scenes content',
                            'User-generated content campaigns',
                            'Educational carousel posts',
                            'Product showcase reels',
                            'Customer testimonials'
                        ].map((idea, index) => (
                            <motion.div
                                key={idea}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 hover:border-primary/40 rounded-lg transition-all cursor-pointer"
                            >
                                <p className="font-medium">{idea}</p>
                                <p className="text-xs text-gray-400 mt-1">Trending in your industry</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Trending Topics */}
            <div className="glass-card p-6">
                <h3 className="text-xl font-semibold mb-4">Trending Topics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Social Media Strategy', 'Content Creation', 'Influencer Marketing'].map((topic) => (
                        <div key={topic} className="p-6 bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 rounded-xl hover:border-primary/50 transition-all cursor-pointer">
                            <h4 className="font-semibold mb-2">{topic}</h4>
                            <p className="text-sm text-gray-400 mb-3">
                                Popular among {Math.floor(Math.random() * 50 + 10)}K users
                            </p>
                            <div className="flex gap-2">
                                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Hot</span>
                                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Rising</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
