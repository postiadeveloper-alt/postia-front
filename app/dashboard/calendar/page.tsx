'use client';

import { useState, useEffect } from 'react';
import apiService from '@/lib/api.service';
import { getImageUrl } from '@/lib/utils';
import { Calendar, Clock, Plus } from 'lucide-react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { motion } from 'framer-motion';

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            const data = await apiService.getPosts();
            setPosts(data || []);
        } catch (error) {
            console.error('Failed to load posts:', error);
        } finally {
            setLoading(false);
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary">
                        Content Calendar
                    </h1>
                    <p className="text-gray-400 mt-1">Plan and schedule your posts</p>
                </div>
                <Link
                    href="/dashboard/posts/create"
                    className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all shadow-lg shadow-primary/25 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create Post
                </Link>
            </div>

            {/* Calendar Header */}
            <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
                            {day}
                        </div>
                    ))}

                    {monthDays.map((day, index) => {
                        const dayPosts = getPostsForDay(day);
                        const today = isToday(day);

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
                                    {dayPosts.slice(0, 2).map((post: any) => (
                                        <div
                                            key={post.id}
                                            className="text-xs bg-primary/20 border border-primary/30 rounded px-2 py-1 truncate"
                                        >
                                            {(post.content || post.title)?.substring(0, 20) || 'No caption'}
                                        </div>
                                    ))}
                                    {dayPosts.length > 2 && (
                                        <div className="text-xs text-gray-400">
                                            +{dayPosts.length - 2} more
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
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Upcoming Posts
                </h3>
                {loading ? (
                    <div className="text-center py-8 text-gray-400">Loading...</div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        No posts scheduled yet. Create your first post!
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
                                No upcoming posts scheduled. All posts have been published or are in the past.
                            </div>
                        );
                    }

                    return (
                        <div className="space-y-3">
                            {upcomingPosts.map((post: any) => (
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
                                            <p className="font-medium">{(post.content || post.title)?.substring(0, 50) || 'No caption'}</p>
                                            <p className="text-sm text-gray-400">
                                                {post.scheduledAt ? format(new Date(post.scheduledAt), 'PPp') : 'Draft'}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/dashboard/posts/${post.id}`}
                                        className="text-primary hover:text-primary-hover transition-colors"
                                    >
                                        View
                                    </Link>
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
