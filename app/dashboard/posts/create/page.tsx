'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/lib/api.service';
import { Upload, Calendar, Clock, Image as ImageIcon, Video, Send, Layers, Smartphone, Film, Instagram } from 'lucide-react';
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
    const [contentType, setContentType] = useState<'post' | 'story' | 'carousel' | 'reel'>('post');

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
    }, []);

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
        if (files.length > 1) {
            // If user selected 'Post' but uploaded multiple, technically it's a carousel feed post.
            // But if they explicitly set 'Post', maybe we should just treat as 'image'/'video' (batch?) or 'carousel'?
            // Instagram Graph API 'CAROUSEL' is the way to do multiple items in feed.
            return 'carousel';
        }
        if (files.length === 1) {
            return files[0].type.startsWith('video/') ? 'video' : 'image';
        }
        // If we have a pre-uploaded media URL (from studio), default to image
        if (preUploadedMediaUrl) {
            return 'image';
        }
        return 'image';
    };

    const uploadMediaFiles = async (): Promise<string[]> => {
        // If we have a pre-uploaded media URL from Studio, use it directly
        if (preUploadedMediaUrl && mediaFiles.length === 0) {
            return [preUploadedMediaUrl];
        }

        const mediaUrls: string[] = [];
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
        // Allow pre-uploaded media from Studio
        if (mediaFiles.length === 0 && !preUploadedMediaUrl) {
            alert('Por favor, sube al menos un archivo multimedia');
            return false;
        }
        if (contentType === 'carousel' && mediaFiles.length < 2 && !preUploadedMediaUrl) {
            alert('El carrusel requiere al menos 2 archivos multimedia');
            return false;
        }
        if ((contentType === 'reel' || contentType === 'story') && mediaFiles.length > 1) {
            // Currently backend handles 1 item for Story/Reel creation via this flow
            // Although Story could be multiple, let's limit to 1 for simplicity unless backend loops
            alert(`La creación de ${contentType === 'story' ? 'Story' : 'Reel'} actualmente solo admite la carga de un solo archivo.`);
            return false;
        }
        if (contentType === 'reel' && mediaFiles.length > 0 && !mediaFiles[0].type.startsWith('video/')) {
            alert('Los Reels requieren un archivo de video');
            return false;
        }
        return true;
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

                        <label className="block cursor-pointer">
                            <input
                                type="file"
                                multiple={contentType === 'carousel' || contentType === 'post'}
                                accept={contentType === 'reel' ? "video/*" : "image/*,video/*"}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <div className="border-2 border-dashed border-white/20 hover:border-primary/50 rounded-lg p-8 text-center transition-all">
                                {preUploadedMediaUrl && mediaFiles.length === 0 ? (
                                    <div className="space-y-3">
                                        <img
                                            src={preUploadedMediaUrl}
                                            alt="Imagen del Studio"
                                            className="max-h-48 mx-auto rounded-lg shadow-lg"
                                        />
                                        <p className="text-green-400 font-semibold">Imagen del Studio seleccionada</p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setPreUploadedMediaUrl(null);
                                            }}
                                            className="text-xs text-gray-400 hover:text-red-400 underline"
                                        >
                                            Quitar y subir otra
                                        </button>
                                    </div>
                                ) : mediaFiles.length > 0 ? (
                                    <div className="space-y-2">
                                        <p className="text-primary font-semibold">{mediaFiles.length} archivo(s) seleccionado(s)</p>
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
                                        <p className="text-gray-400">Haz clic para subir {contentType === 'reel' ? 'video' : 'media'}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {contentType === 'reel' ? 'Solo MP4' : 'JPG, PNG, MP4'}
                                        </p>
                                    </>
                                )}
                            </div>
                        </label>
                    </div>

                    {/* Caption */}
                    {contentType !== 'story' && (
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold mb-4">Pie de Foto</h3>
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Escribe tu descripción aquí..."
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
                        <h3 className="text-lg font-semibold mb-4">Previsualización ({contentType === 'post' ? 'Post' : contentType === 'story' ? 'Historia' : contentType === 'carousel' ? 'Carrusel' : 'Reel'})</h3>
                        <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-lg p-4 aspect-square flex items-center justify-center relative overflow-hidden">
                            {mediaFiles.length > 0 ? (
                                <div className="text-center w-full h-full flex flex-col items-center justify-center">
                                    {mediaFiles[0].type.startsWith('image/') ? (
                                        <ImageIcon className="w-12 h-12 mx-auto mb-2 text-primary" />
                                    ) : (
                                        <Video className="w-12 h-12 mx-auto mb-2 text-primary" />
                                    )}
                                    <p className="text-sm text-gray-400">{mediaFiles[0].name}</p>
                                    {mediaFiles.length > 1 && (
                                        <div className="mt-2 text-xs bg-white/10 px-2 py-1 rounded-full">
                                            +{mediaFiles.length - 1} más
                                        </div>
                                    )}

                                    {/* Mock Phone Frame for Story/Reel */}
                                    {(contentType === 'story' || contentType === 'reel') && (
                                        <div className="absolute inset-0 border-4 border-white/10 rounded-xl pointer-events-none" />
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-400">Sube multimedia para previsualizar</p>
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
