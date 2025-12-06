'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiService from '@/lib/api.service';
import { Calendar, Clock, Image as ImageIcon, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';

export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            loadPost();
        }
    }, [params.id]);

    const loadPost = async () => {
        try {
            const posts = await apiService.getPosts();
            const foundPost = posts.find((p: any) => p.id === params.id);
            setPost(foundPost || null);
        } catch (error) {
            console.error('Failed to load post:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        try {
            await apiService.publishPostNow(params.id as string);
            alert('Post published successfully!');
            router.push('/dashboard/calendar');
        } catch (error) {
            console.error('Failed to publish post:', error);
            alert('Failed to publish post.');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            await apiService.deletePost(params.id as string);
            router.push('/dashboard/calendar');
        } catch (error) {
            console.error('Failed to delete post:', error);
            alert('Failed to delete post.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading post...</p>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">Post not found</p>
                <Button onClick={() => router.back()} className="mt-4">
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Post Details</h1>
                    <p className="text-gray-400 mt-1">
                        Status: <span className={`font-semibold ${post.status === 'published' ? 'text-green-400' :
                            post.status === 'scheduled' ? 'text-primary' : 'text-gray-400'
                            }`}>
                            {post.status || 'draft'}
                        </span>
                    </p>
                </div>
                <div className="flex gap-2">
                    {post.status !== 'published' && (
                        <Button onClick={handlePublish} className="bg-green-500 hover:bg-green-600">
                            <Send className="w-4 h-4 mr-2" />
                            Publish Now
                        </Button>
                    )}
                    <Button onClick={handleDelete} variant="outline" className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Media Preview */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-primary" />
                        Media
                    </h3>
                    {post.mediaUrls && post.mediaUrls.length > 0 ? (
                        <div className="space-y-3">
                            {post.mediaUrls.map((url: string, index: number) => (
                                <img
                                    key={index}
                                    src={url}
                                    alt={`Post media ${index + 1}`}
                                    className="w-full rounded-lg"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/5 rounded-lg p-8 text-center text-gray-400">
                            No media
                        </div>
                    )}
                </div>

                {/* Post Info */}
                <div className="space-y-6">
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold mb-4">Caption</h3>
                        <p className="text-gray-300 whitespace-pre-wrap">
                            {post.caption || 'No caption'}
                        </p>
                    </div>

                    {post.scheduledAt && (
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                Scheduled Date
                            </h3>
                            <p className="text-gray-300">
                                {format(new Date(post.scheduledAt), 'PPpp')}
                            </p>
                        </div>
                    )}

                    {post.insights && (
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold mb-4">Insights</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-white/5 rounded-lg">
                                    <p className="text-2xl font-bold text-primary">{post.insights.likes || 0}</p>
                                    <p className="text-xs text-gray-400">Likes</p>
                                </div>
                                <div className="text-center p-3 bg-white/5 rounded-lg">
                                    <p className="text-2xl font-bold text-primary">{post.insights.comments || 0}</p>
                                    <p className="text-xs text-gray-400">Comments</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
