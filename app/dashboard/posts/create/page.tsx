'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/lib/api.service';
import { Upload, Calendar, Clock, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';

export default function CreatePostPage() {
    const router = useRouter();
    const [caption, setCaption] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);

    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const data = await apiService.getInstagramAccounts();
                if (data && data.length > 0) {
                    setAccounts(data);
                    setSelectedAccountId(data[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch accounts:', error);
            }
        };
        fetchAccounts();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setMediaFiles(Array.from(e.target.files));
        }
    };

    const getPostType = (files: File[]): string => {
        if (files.length > 1) return 'carousel';
        if (files.length === 1) {
            return files[0].type.startsWith('video/') ? 'video' : 'image';
        }
        return 'image';
    };

    const handleSubmit = async () => {
        if (!selectedAccountId) {
            alert('Please connect an Instagram account first');
            return;
        }

        setLoading(true);
        try {
            // Upload media first
            const mediaUrls: string[] = [];
            for (const file of mediaFiles) {
                const formData = new FormData();
                formData.append('file', file);
                const uploadResult = await apiService.uploadMedia(formData);
                mediaUrls.push(uploadResult.url);
            }

            // Create post with backend DTO structure
            const postData = {
                title: caption.slice(0, 50) || 'New Post', // Backend requires title
                content: caption,
                type: getPostType(mediaFiles),
                mediaUrls,
                scheduledAt: scheduledDate && scheduledTime
                    ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
                    : new Date().toISOString(), // Default to now if not scheduled
                instagramAccountId: selectedAccountId,
                hashtags: caption.match(/#[a-z0-9_]+/gi)?.join(' ') || '',
            };

            console.log('Creating post with data:', postData);
            await apiService.createPost(postData);
            router.push('/dashboard/calendar');
        } catch (error: any) {
            console.error('Failed to create post:', error);
            alert(error.response?.data?.message || 'Failed to create post. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary">
                    Create Post
                </h1>
                <p className="text-gray-400 mt-1">Create and schedule your Instagram content</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Post Content */}
                <div className="space-y-6">
                    {/* Media Upload */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-primary" />
                            Media
                        </h3>

                        <label className="block cursor-pointer">
                            <input
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <div className="border-2 border-dashed border-white/20 hover:border-primary/50 rounded-lg p-8 text-center transition-all">
                                {mediaFiles.length > 0 ? (
                                    <div className="space-y-2">
                                        <p className="text-primary font-semibold">{mediaFiles.length} file(s) selected</p>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {mediaFiles.map((file, index) => (
                                                <div key={index} className="text-xs bg-primary/20 px-2 py-1 rounded">
                                                    {file.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                        <p className="text-gray-400">Click to upload images or videos</p>
                                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, MP4 up to 10MB</p>
                                    </>
                                )}
                            </div>
                        </label>
                    </div>

                    {/* Caption */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold mb-4">Caption</h3>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Write your caption here..."
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            maxLength={2200}
                        />
                        <p className="text-xs text-gray-400 mt-2">{caption.length} / 2200 characters</p>
                    </div>
                </div>

                {/* Right Column - Scheduling & Preview */}
                <div className="space-y-6">
                    {/* Scheduling */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Schedule
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-2 block">Date</label>
                                <Input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-2 block">Time</label>
                                <Input
                                    type="time"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                />
                            </div>
                        </div>

                        {scheduledDate && scheduledTime && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg"
                            >
                                <p className="text-sm text-primary">
                                    Scheduled for: {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                                </p>
                            </motion.div>
                        )}
                    </div>

                    {/* Preview */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold mb-4">Preview</h3>
                        <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-lg p-4 aspect-square flex items-center justify-center">
                            {mediaFiles.length > 0 ? (
                                <div className="text-center">
                                    {mediaFiles[0].type.startsWith('image/') ? (
                                        <ImageIcon className="w-12 h-12 mx-auto mb-2 text-primary" />
                                    ) : (
                                        <Video className="w-12 h-12 mx-auto mb-2 text-primary" />
                                    )}
                                    <p className="text-sm text-gray-400">Media preview</p>
                                </div>
                            ) : (
                                <p className="text-gray-400">Upload media to preview</p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || mediaFiles.length === 0}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3"
                        >
                            {loading ? 'Creating...' : scheduledDate ? 'Schedule Post' : 'Save as Draft'}
                        </Button>
                        <Button
                            onClick={() => router.back()}
                            variant="outline"
                            className="w-full"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
