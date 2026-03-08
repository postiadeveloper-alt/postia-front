'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/lib/api.service';
import { Upload, Calendar, Clock, Image as ImageIcon, Video, Send, Layers, Smartphone, Film, Instagram, Sparkles, ChevronLeft, ChevronRight, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';

export default function CreatePostPage() {
    const router = useRouter();
    const [caption, setCaption] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [preUploadedMediaUrl, setPreUploadedMediaUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [postingNow, setPostingNow] = useState(false);
    const [generatingCaption, setGeneratingCaption] = useState(false);
    const [contentType, setContentType] = useState<'post' | 'story' | 'carousel' | 'reel'>('post');
    const [previews, setPreviews] = useState<string[]>([]);
    const [previewIndex, setPreviewIndex] = useState(0);

    // Remote Gallery State
    const [additionalRemoteUrls, setAdditionalRemoteUrls] = useState<string[]>([]);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [galleryImages, setGalleryImages] = useState<any[]>([]);
    const [loadingGallery, setLoadingGallery] = useState(false);

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

        // Check for pre-uploaded media from Studio
        const studioMediaUrl = sessionStorage.getItem('studioMediaUrl');
        if (studioMediaUrl) {
            setPreUploadedMediaUrl(studioMediaUrl);
            sessionStorage.removeItem('studioMediaUrl');
        }

        // Check for strategy draft pre-fill
        const strategyDraftRaw = sessionStorage.getItem('strategyDraft');
        if (strategyDraftRaw) {
            try {
                const draft = JSON.parse(strategyDraftRaw);
                if (draft.caption) setCaption(draft.caption);
                if (draft.scheduledDate) setScheduledDate(draft.scheduledDate);
                if (draft.scheduledTime) setScheduledTime(draft.scheduledTime);
                if (draft.contentType) setContentType(draft.contentType);
                // Support multiple media URLs for carousels
                if (draft.mediaUrls && Array.isArray(draft.mediaUrls) && draft.mediaUrls.length > 0) {
                    setPreUploadedMediaUrl(draft.mediaUrls[0]);
                    if (draft.mediaUrls.length > 1) {
                        setAdditionalRemoteUrls(draft.mediaUrls.slice(1));
                    }
                } else if (draft.mediaUrl) {
                    setPreUploadedMediaUrl(draft.mediaUrl);
                }
            } catch (e) {
                console.error('Failed to parse strategyDraft:', e);
            }
            sessionStorage.removeItem('strategyDraft');
        }
    }, []);

    useEffect(() => {
        if (mediaFiles.length === 0) {
            setPreviews([]);
            return;
        }

        const objectUrls = mediaFiles.map(file => URL.createObjectURL(file));
        setPreviews(objectUrls);

        // cleanup
        return () => objectUrls.forEach(url => URL.revokeObjectURL(url));
    }, [mediaFiles]);

    const fetchGalleryImages = async () => {
        setLoadingGallery(true);
        try {
            const outputs = await apiService.listOutputs();
            setGalleryImages(outputs || []);
        } catch (error) {
            console.error('Failed to load gallery:', error);
        } finally {
            setLoadingGallery(false);
        }
    };

    const getCombinedPreviews = () => {
        const p = [];
        if (preUploadedMediaUrl) p.push(preUploadedMediaUrl);
        p.push(...additionalRemoteUrls);
        return [...p, ...previews];
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            if (contentType === 'carousel') {
                setMediaFiles(prev => [...prev, ...newFiles]);
            } else {
                setMediaFiles(newFiles);
            }
        }
    };

    const getPostType = (files: File[]): string => {
        if (contentType === 'story') return 'story';
        if (contentType === 'reel') return 'reel';
        if (contentType === 'carousel') return 'carousel';

        // contentType === 'post'
        const totalMediaCount = files.length + (preUploadedMediaUrl ? 1 : 0) + additionalRemoteUrls.length;

        if (totalMediaCount > 1) {
            return 'carousel';
        }

        if (files.length === 1) {
            return files[0].type.startsWith('video/') ? 'video' : 'image';
        }

        return 'image';
    };

    const uploadMediaFiles = async (): Promise<string[]> => {
        const mediaUrls: string[] = [];

        // Always include pre-uploaded media first if it exists
        if (preUploadedMediaUrl) {
            mediaUrls.push(preUploadedMediaUrl);
        }

        // Add remote URLs from gallery
        mediaUrls.push(...additionalRemoteUrls);

        // Upload and add all other selected files
        for (const file of mediaFiles) {
            const formData = new FormData();
            formData.append('file', file);
            const uploadResult = await apiService.uploadMedia(formData);
            const url = uploadResult.data?.url || uploadResult.url;
            if (url) {
                mediaUrls.push(url);
            } else {
                console.error('Upload response missing URL:', uploadResult);
                throw new Error('Failed to get URL from upload response');
            }
        }
        return mediaUrls;
    };

    const validateForm = () => {
        if (!selectedAccountId) {
            alert('Por favor, conecta una cuenta de Instagram primero');
            return false;
        }
        const totalMedia = mediaFiles.length + (preUploadedMediaUrl ? 1 : 0) + additionalRemoteUrls.length;

        if (totalMedia === 0) {
            alert('Por favor, sube al menos un archivo multimedia');
            return false;
        }
        if (contentType === 'carousel' && totalMedia < 2) {
            alert('El carrusel requiere al menos 2 archivos multimedia');
            return false;
        }
        if ((contentType === 'reel' || contentType === 'story') && totalMedia > 1) {
            alert(`La creación de ${contentType === 'story' ? 'Story' : 'Reel'} actualmente solo admite un solo archivo.`);
            return false;
        }
        // Basic check for reel video type would be hard for remote URLs without metadata, skipping strict check for remote
        if (contentType === 'reel' && mediaFiles.length > 0 && !mediaFiles[0].type.startsWith('video/')) {
            alert('Los Reels requieren un archivo de video');
            return false;
        }
        return true;
    };

    const handleGenerateCaptionAI = async () => {
        if (!selectedAccountId) {
            alert('Por favor, selecciona una cuenta de Instagram primero');
            return;
        }

        const hasMedia = mediaFiles.length > 0 || preUploadedMediaUrl || additionalRemoteUrls.length > 0;
        if (!hasMedia) {
            alert('Por favor agrega una imagen para que la IA tenga contexto.');
            return;
        }

        setGeneratingCaption(true);
        try {
            // 1. Get Business Profile
            let businessProfileId = '';
            try {
                const profile = await apiService.getBusinessProfile(selectedAccountId);
                if (profile && profile.id) {
                    businessProfileId = profile.id;
                }
            } catch (error) {
                console.warn('Could not fetch business profile:', error);
            }

            if (!businessProfileId) {
                alert('No se encontró un perfil de negocio asociado a esta cuenta. Por favor configura tu perfil de negocio primero.');
                setGeneratingCaption(false);
                return;
            }

            // 2. Get Image URL (upload if necessary)
            let imageUrl = preUploadedMediaUrl || undefined;

            if (!imageUrl && mediaFiles.length > 0) {
                // Ensure it's an image
                const file = mediaFiles[0];
                if (file.type.startsWith('image/')) {
                    // Upload just this file to get a URL for AI analysis
                    const formData = new FormData();
                    formData.append('file', file);
                    const uploadResult = await apiService.uploadMedia(formData);
                    imageUrl = uploadResult.data?.url || uploadResult.url;
                }
            }

            // 3. Generate Caption
            const result = await apiService.generateCaption(businessProfileId, imageUrl);
            if (result && result.caption) {
                setCaption(result.caption);
            }

        } catch (error: any) {
            console.error('AI Generation failed:', error);
            alert('Error al generar la descripción: ' + (error.response?.data?.message || error.message));
        } finally {
            setGeneratingCaption(false);
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const mediaUrls = await uploadMediaFiles();

            const postData = {
                title: caption.slice(0, 50) || 'New Content',
                content: caption,
                type: getPostType(mediaFiles),
                mediaUrls,
                scheduledAt: scheduledDate && scheduledTime
                    ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
                    : new Date().toISOString(),
                instagramAccountId: selectedAccountId,
                hashtags: caption.match(/#[a-z0-9_]+/gi)?.join(' ') || '',
                status: scheduledDate && scheduledTime ? 'scheduled' : 'draft',
            };

            await apiService.createPost(postData);
            router.push('/dashboard/calendar');
        } catch (error: any) {
            console.error('Failed to create post:', error);
            alert(error.response?.data?.message || 'Error al crear la publicación. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handlePostNow = async () => {
        if (!validateForm()) return;

        setPostingNow(true);
        try {
            const mediaUrls = await uploadMediaFiles();

            const postData = {
                title: caption.slice(0, 50) || 'New Content',
                content: caption,
                type: getPostType(mediaFiles),
                mediaUrls,
                scheduledAt: new Date().toISOString(),
                instagramAccountId: selectedAccountId,
                hashtags: caption.match(/#[a-z0-9_]+/gi)?.join(' ') || '',
                status: 'draft',
            };

            const createdPost = await apiService.createPost(postData);
            await apiService.publishPostNow(createdPost.id);

            alert('🎉 ¡Contenido publicado exitosamente en Instagram!');
            router.push('/dashboard/calendar');
        } catch (error: any) {
            console.error('Failed to post now:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Error al publicar';
            alert(`❌ Falló la publicación: ${errorMessage}`);
        } finally {
            setPostingNow(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary">
                    Crear Contenido
                </h1>
                <p className="text-gray-400 mt-1">Crea y programa tus publicaciones, historias y reels de Instagram</p>
            </div>

            {/* Content Type Selector */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <ContentTypeCard
                    icon={ImageIcon}
                    label="Publicación"
                    description="Imagen/Video del Feed"
                    active={contentType === 'post'}
                    onClick={() => setContentType('post')}
                />
                <ContentTypeCard
                    icon={Smartphone}
                    label="Historia"
                    description="Historia de 24h"
                    active={contentType === 'story'}
                    onClick={() => setContentType('story')}
                />
                <ContentTypeCard
                    icon={Layers}
                    label="Carrusel"
                    description="Galería"
                    active={contentType === 'carousel'}
                    onClick={() => setContentType('carousel')}
                />
                <ContentTypeCard
                    icon={Film}
                    label="Reel"
                    description="Video Corto"
                    active={contentType === 'reel'}
                    onClick={() => setContentType('reel')}
                />
            </div>

            {/* Instagram Account Selector */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-pink-500" />
                    Publicar en Cuenta
                </h3>
                {accounts.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-gray-400 mb-3">No hay cuentas de Instagram conectadas</p>
                        <a
                            href="/dashboard/profile"
                            className="text-primary hover:underline text-sm"
                        >
                            Conectar una cuenta →
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {accounts.map((account) => (
                            <button
                                key={account.id}
                                onClick={() => setSelectedAccountId(account.id)}
                                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${selectedAccountId === account.id
                                    ? 'border-primary bg-primary/20'
                                    : 'border-white/10 bg-white/5 hover:border-white/30'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    <Instagram className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <p className={`font-semibold truncate ${selectedAccountId === account.id ? 'text-white' : 'text-gray-300'}`}>
                                        @{account.username}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {account.accountType || 'Business'}
                                    </p>
                                </div>
                                {selectedAccountId === account.id && (
                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Content */}
                <div className="space-y-6">
                    {/* Media Upload */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-primary" />
                            Multimedia {contentType === 'carousel' ? '(Múltiple)' : '(Individual)'}
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Local Upload Box */}
                            <label className="group relative border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 rounded-xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 aspect-video sm:aspect-square">
                                <input
                                    type="file"
                                    multiple={contentType === 'carousel' || contentType === 'post'}
                                    accept={contentType === 'reel' ? "video/*" : "image/*,video/*"}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Upload className="w-6 h-6 text-primary" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-white">Subir desde PC</p>
                                    <p className="text-[10px] text-gray-500 mt-1">{contentType === 'reel' ? 'Solo MP4' : 'JPG, PNG, MP4'}</p>
                                </div>
                            </label>

                            {/* Gallery Selection Box */}
                            <button
                                type="button"
                                onClick={() => { setShowGalleryModal(true); fetchGalleryImages(); }}
                                className="group border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 rounded-xl p-6 transition-all flex flex-col items-center justify-center gap-3 aspect-video sm:aspect-square"
                            >
                                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ImageIcon className="w-6 h-6 text-purple-400" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-white">Galería del Studio</p>
                                    <p className="text-[10px] text-gray-500 mt-1">Imágenes generadas</p>
                                </div>
                            </button>
                        </div>

                        {/* Selected Media Preview List */}
                        {(preUploadedMediaUrl || additionalRemoteUrls.length > 0 || mediaFiles.length > 0) && (
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                                        <Layers className="w-4 h-4" />
                                        Archivos seleccionados ({(preUploadedMediaUrl ? 1 : 0) + additionalRemoteUrls.length + mediaFiles.length})
                                    </h4>
                                    <button
                                        onClick={() => {
                                            setPreUploadedMediaUrl(null);
                                            setAdditionalRemoteUrls([]);
                                            setMediaFiles([]);
                                        }}
                                        className="text-[10px] text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                                    >
                                        <X className="w-3 h-3" /> Limpiar todo
                                    </button>
                                </div>

                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                    {/* Gallery Base */}
                                    {preUploadedMediaUrl && (
                                        <div className="relative group aspect-square rounded-lg overflow-hidden border border-primary/30">
                                            <img src={preUploadedMediaUrl} className="w-full h-full object-cover" alt="Base" />
                                            <button
                                                onClick={() => setPreUploadedMediaUrl(null)}
                                                className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[8px] text-white text-center py-0.5">ESTUDIO</div>
                                        </div>
                                    )}

                                    {/* Remote Gallery */}
                                    {additionalRemoteUrls.map((url, idx) => (
                                        <div key={`remote-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-purple-500/30">
                                            <img src={url} className="w-full h-full object-cover" alt="Remote" />
                                            <button
                                                onClick={() => setAdditionalRemoteUrls(prev => prev.filter((_, i) => i !== idx))}
                                                className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-purple-500/80 text-[8px] text-white text-center py-0.5">GALERÍA</div>
                                        </div>
                                    ))}

                                    {/* Local Files */}
                                    {mediaFiles.map((file, idx) => {
                                        // We use previews[idx] if it exists
                                        const previewUrl = previews[idx];
                                        return (
                                            <div key={`local-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10 bg-white/5">
                                                {previewUrl ? (
                                                    <img src={previewUrl} className="w-full h-full object-cover" alt="Local" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        {file.type.startsWith('video/') ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== idx))}
                                                    className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                                <div className="absolute bottom-0 left-0 right-0 bg-gray-800/80 text-[8px] text-white text-center py-0.5 truncate px-1">LOCAL</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>


                    {/* Caption */}
                    {contentType !== 'story' && (
                        <div className="glass-card p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Descripción del Post</h3>
                                <button
                                    onClick={handleGenerateCaptionAI}
                                    disabled={generatingCaption || (!preUploadedMediaUrl && mediaFiles.length === 0)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-purple-500/25"
                                >
                                    {generatingCaption ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Generando...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Crear con IA
                                        </>
                                    )}
                                </button>
                            </div>
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Escribe tu descripción aquí o usa IA para generarla..."
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                maxLength={2200}
                            />
                            <p className="text-xs text-gray-400 mt-2">{caption.length} / 2200 caracteres</p>
                        </div>
                    )}
                    {contentType === 'story' && (
                        <div className="glass-card p-4 bg-yellow-500/10 border-yellow-500/20">
                            <p className="text-sm text-yellow-200">
                                Nota: Las descripciones no son estrictamente compatibles con las Historias a través de la API.
                                Asegúrate de que tu contenido visual incluya cualquier texto necesario.
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Column - Scheduling & Preview */}
                <div className="space-y-6">
                    {/* Scheduling */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Programar
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-2 block">Fecha</label>
                                <Input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-2 block">Hora</label>
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
                                    Programado para: {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                                </p>
                            </motion.div>
                        )}
                    </div>

                    {/* Preview */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Previsualización
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({contentType === 'post' ? 'Post' : contentType === 'story' ? 'Historia' : contentType === 'carousel' ? 'Carrusel' : 'Reel'})
                            </span>
                        </h3>

                        <div className="space-y-4">
                            {/* Main Preview Container */}
                            <div className={`bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-lg overflow-hidden relative ${contentType === 'story' || contentType === 'reel' ? 'aspect-[9/16] max-w-[280px] mx-auto' : 'aspect-square'}`}>
                                {getCombinedPreviews().length > 0 ? (
                                    <div className="w-full h-full relative group">
                                        {/* Main Image */}
                                        <img
                                            src={getCombinedPreviews()[previewIndex]}
                                            alt={`Preview ${previewIndex}`}
                                            className="w-full h-full object-cover transition-all duration-300"
                                        />

                                        {/* Navigation Arrows for Carousel */}
                                        {getCombinedPreviews().length > 1 && (
                                            <>
                                                <button
                                                    onClick={() => setPreviewIndex((prev) => (prev === 0 ? getCombinedPreviews().length - 1 : prev - 1))}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <ChevronLeft className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setPreviewIndex((prev) => (prev === getCombinedPreviews().length - 1 ? 0 : prev + 1))}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>

                                                {/* Dots indicator */}
                                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                                    {getCombinedPreviews().map((_, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`w-1.5 h-1.5 rounded-full transition-all ${idx === previewIndex ? 'bg-white scale-125' : 'bg-white/40'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {/* Type badges */}
                                        <div className="absolute top-3 right-3 flex gap-2">
                                            {contentType === 'carousel' && (
                                                <div className="bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1 border border-white/20">
                                                    <Layers className="w-3 h-3" />
                                                    {getCombinedPreviews().length}
                                                </div>
                                            )}
                                            {contentType === 'reel' && (
                                                <div className="bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1 border border-white/20">
                                                    <Film className="w-3 h-3" />
                                                    REEL
                                                </div>
                                            )}
                                        </div>

                                        {/* Simulated Mobile UI for Story/Reel */}
                                        {(contentType === 'story' || contentType === 'reel') && (
                                            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[1.5px]">
                                                        <div className="w-full h-full rounded-full bg-black border border-black flex items-center justify-center">
                                                            <Instagram className="w-4 h-4 text-white" />
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-semibold text-white dropdown-shadow">Tu historia</span>
                                                </div>
                                                <div className="bg-white/20 backdrop-blur-md h-1 w-full rounded-full overflow-hidden">
                                                    <div className="bg-white h-full w-1/3" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-3">
                                        <ImageIcon className="w-12 h-12 opacity-20" />
                                        <p className="text-sm">Sube multimedia para previsualizar</p>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails list for Carousel */}
                            {getCombinedPreviews().length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
                                    {getCombinedPreviews().map((url, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setPreviewIndex(idx)}
                                            className={`relative flex-shrink-0 transition-all ${idx === previewIndex ? 'scale-105' : 'opacity-60 hover:opacity-100'}`}
                                        >
                                            <img
                                                src={url}
                                                className={`w-16 h-16 object-cover rounded-lg border-2 ${idx === previewIndex ? 'border-primary shadow-lg shadow-primary/20' : 'border-white/10'}`}
                                                alt={`Thumbnail ${idx}`}
                                            />
                                            {idx === 0 && preUploadedMediaUrl && (
                                                <div className="absolute -top-1 -right-1 bg-primary text-[8px] text-white px-1 rounded-full font-bold">G</div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || postingNow || (mediaFiles.length === 0 && !preUploadedMediaUrl)}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3"
                        >
                            {loading ? 'Creando...' : scheduledDate ? `Programar ${contentType === 'story' ? 'Historia' : contentType === 'reel' ? 'Reel' : 'Publicación'}` : 'Guardar como Borrador'}
                        </Button>

                        <Button
                            onClick={handlePostNow}
                            disabled={postingNow || loading || (mediaFiles.length === 0 && !preUploadedMediaUrl)}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 flex items-center justify-center gap-2"
                        >
                            {postingNow ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Publicando...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Publicar Ahora
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={() => router.back()}
                            variant="outline"
                            className="w-full"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
            {/* Gallery Selection Modal */}
            {showGalleryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1a1b26] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl"
                    >
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-primary" />
                                    Galería del Studio
                                </h2>
                                <p className="text-sm text-gray-400">Selecciona imágenes generadas para añadir a tu post</p>
                            </div>
                            <button onClick={() => setShowGalleryModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
                            {loadingGallery ? (
                                <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <p>Cargando galería...</p>
                                </div>
                            ) : galleryImages.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No se encontraron imágenes en la galería.</p>
                                    <p className="text-sm mt-1">Ve al Studio para generar contenido nuevo.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {galleryImages.map((img) => {
                                        const isSelected = additionalRemoteUrls.includes(img.publicUrl) || preUploadedMediaUrl === img.publicUrl;
                                        return (
                                            <button
                                                key={img.id}
                                                onClick={() => {
                                                    if (preUploadedMediaUrl === img.publicUrl) return; // Cannot toggle base image this way

                                                    setAdditionalRemoteUrls(prev => {
                                                        if (prev.includes(img.publicUrl)) {
                                                            return prev.filter(u => u !== img.publicUrl);
                                                        } else {
                                                            return [...prev, img.publicUrl];
                                                        }
                                                    });
                                                }}
                                                className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-white/30'
                                                    }`}
                                            >
                                                <img
                                                    src={img.publicUrl}
                                                    alt={img.originalName}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                    {isSelected ? (
                                                        <div className="bg-primary text-white rounded-full p-1.5 shadow-lg transform scale-100 transition-transform">
                                                            <Check className="w-5 h-5" />
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white/20 backdrop-blur text-white rounded-full p-2 hover:bg-white/30 transition-colors">
                                                            <div className="w-4 h-4 rounded-full border-2 border-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-white/10 bg-black/20 flex justify-between items-center">
                            <p className="text-sm text-gray-400">
                                {additionalRemoteUrls.length} seleccionadas
                            </p>
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => setShowGalleryModal(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={() => setShowGalleryModal(false)} className="bg-primary hover:bg-primary-hover text-white">
                                    Confirmar Selección
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function ContentTypeCard({ icon: Icon, label, description, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`p-4 rounded-xl border transition-all duration-200 text-left relative overflow-hidden group ${active
                ? 'bg-primary/20 border-primary text-white'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                }`}
        >
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br from-white to-transparent`} />
            <Icon className={`w-8 h-8 mb-3 ${active ? 'text-primary' : 'text-gray-500'}`} />
            <h3 className={`font-semibold ${active ? 'text-white' : 'text-gray-300'}`}>{label}</h3>
            <p className="text-xs opacity-70 mt-1">{description}</p>
        </button>
    );
}
