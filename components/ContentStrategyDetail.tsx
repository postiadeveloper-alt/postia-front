'use client';

import { X, Copy, Check, Sparkles, Target, MessageSquare, Hash, Eye, Palette, FileText, Image as ImageIcon, AlertCircle, Trash2, Send, LayoutGrid, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface GalleryOutput {
    id: string;
    originalName: string;
    publicUrl: string;
    createdAt: string;
}

interface ContentStrategyDetailProps {
    strategy: any;
    isOpen: boolean;
    onClose: () => void;
    onDelete?: (id: string) => Promise<void>;
    onUpdate?: (id: string, data: any) => Promise<void>;
    onConvertToPost?: (id: string) => Promise<void>;
    galleryOutputs?: GalleryOutput[];
}

const FORMAT_LABELS: Record<string, { label: string; color: string }> = {
    carousel: { label: 'Carrusel', color: 'bg-blue-500' },
    reel: { label: 'Reel', color: 'bg-pink-500' },
    static_post: { label: 'Publicación Estática', color: 'bg-green-500' },
    story: { label: 'Historia', color: 'bg-purple-500' },
    live: { label: 'En Vivo', color: 'bg-red-500' },
};

const PILLAR_COLORS: Record<string, { className: string; label: string }> = {
    educational: { className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Educativo' },
    entertaining: { className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Entretenimiento' },
    inspiring: { className: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Inspiracional' },
    promotional: { className: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Promocional' },
};

// Map ContentStrategy format to gallery output filename prefix
const FORMAT_TO_GALLERY_KEY: Record<string, string> = {
    story: 'story',
    reel: 'reel',
    static_post: 'post',
    carousel: 'carousel',
};

const FORMAT_GALLERY_LABELS: Record<string, string> = {
    story: 'Stories',
    reel: 'Reels',
    static_post: 'Posts',
    carousel: 'Carruseles',
};

export default function ContentStrategyDetail({
    strategy,
    isOpen,
    onClose,
    onDelete,
    onUpdate,
    onConvertToPost,
    galleryOutputs = [],
}: ContentStrategyDetailProps) {
    const router = useRouter();
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [converting, setConverting] = useState(false);
    const [showGalleryPicker, setShowGalleryPicker] = useState(false);

    if (!isOpen || !strategy) return null;

    const handleDeleteClick = async () => {
        if (!onDelete) return;
        if (!window.confirm('¿Eliminar este contenido de la estrategia IA?')) return;
        setDeleting(true);
        try {
            await onDelete(strategy.id);
            onClose();
        } catch (error) {
            console.error('Failed to delete strategy:', error);
        } finally {
            setDeleting(false);
        }
    };

    const handleConvertClick = async () => {
        const FORMAT_TO_CONTENT_TYPE: Record<string, string> = {
            static_post: 'post',
            story: 'story',
            reel: 'reel',
            carousel: 'carousel',
        };

        // Build caption: hook + main content + hashtags
        const hashtagLine = strategy.hashtags?.length
            ? '\n\n' + strategy.hashtags.map((t: string) => `#${t.replace('#', '')}`).join(' ')
            : '';
        const caption = [strategy.hook, strategy.mainContent].filter(Boolean).join('\n\n') + hashtagLine;

        // Parse scheduled date/time
        const dateObj = strategy.scheduledDate ? new Date(strategy.scheduledDate) : null;
        const scheduledDate = dateObj ? dateObj.toISOString().split('T')[0] : '';
        const scheduledTime = '09:00';

        const draftData = {
            caption,
            scheduledDate,
            scheduledTime,
            contentType: FORMAT_TO_CONTENT_TYPE[strategy.format] || 'post',
            mediaUrl: previewImage || matchingOutputs[0]?.publicUrl || null,
        };

        sessionStorage.setItem('strategyDraft', JSON.stringify(draftData));
        onClose();
        router.push('/dashboard/posts/create');
    };

    const handleCopy = async (text: string, field: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const formatInfo = FORMAT_LABELS[strategy.format] || { label: strategy.format, color: 'bg-gray-500' };
    const pillarInfo = PILLAR_COLORS[strategy.contentPillar] || { className: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: strategy.contentPillar };

    // Filter gallery outputs that match this strategy's format
    const galleryKey = FORMAT_TO_GALLERY_KEY[strategy.format] || '';
    const matchingOutputs = galleryOutputs.filter((output) => {
        const match = output.originalName.match(/^generated_(story|reel|post|carousel)_/);
        return match ? match[1] === galleryKey : false;
    });
    const hasGalleryImages = matchingOutputs.length > 0;
    const formatGalleryLabel = FORMAT_GALLERY_LABELS[strategy.format] || strategy.format;
    
    const statusLabels: Record<string, string> = {
        draft: 'Borrador',
        approved: 'Aprobado',
        published: 'Publicado',
        rejected: 'Rechazado',
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${formatInfo.color}`}>
                                {formatInfo.label}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {format(new Date(strategy.scheduledDate), "EEEE, d 'de' MMMM", { locale: es })}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${pillarInfo.className}`}>
                                        {pillarInfo.label}
                                    </span>
                                    <span className="text-sm text-gray-400">
                                        Estado: {statusLabels[strategy.status] || strategy.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Gallery Image Preview Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-gray-400">
                                <ImageIcon className="w-5 h-5" />
                                <span className="font-medium">Vista Previa Visual</span>
                                <span className="text-sm text-gray-500">• Contenido de Galería para {formatGalleryLabel}</span>
                                {galleryOutputs.length > 0 && (
                                    <button
                                        onClick={() => setShowGalleryPicker(p => !p)}
                                        className="ml-auto flex items-center gap-1.5 px-3 py-1 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                                    >
                                        {showGalleryPicker ? (
                                            <><ChevronLeft className="w-3.5 h-3.5" /> Volver</>
                                        ) : (
                                            <><LayoutGrid className="w-3.5 h-3.5" /> Cambiar imagen</>
                                        )}
                                    </button>
                                )}
                            </div>

                            {showGalleryPicker ? (
                                <div className="space-y-2">
                                    <p className="text-xs text-gray-500">Selecciona cualquier imagen de tu galería para usarla como vista previa.</p>
                                    <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
                                        {galleryOutputs.map((output) => (
                                            <button
                                                key={output.id}
                                                onClick={() => { setPreviewImage(output.publicUrl); setShowGalleryPicker(false); }}
                                                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                                    (previewImage || matchingOutputs[0]?.publicUrl) === output.publicUrl
                                                        ? 'border-primary shadow-lg shadow-primary/30'
                                                        : 'border-white/10 hover:border-white/40'
                                                }`}
                                            >
                                                <img
                                                    src={output.publicUrl}
                                                    alt={output.originalName}
                                                    className="w-full h-full object-cover"
                                                />
                                                {(previewImage || matchingOutputs[0]?.publicUrl) === output.publicUrl && (
                                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                        <Check className="w-5 h-5 text-white drop-shadow" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : hasGalleryImages ? (
                                <div className="space-y-3">
                                    {/* Main preview */}
                                    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/20">
                                        <img
                                            src={previewImage || matchingOutputs[0].publicUrl}
                                            alt="Vista previa del contenido"
                                            className="w-full max-h-80 object-contain mx-auto"
                                        />
                                    </div>
                                    {/* Thumbnail strip if multiple images */}
                                    {matchingOutputs.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {matchingOutputs.slice(0, 6).map((output) => (
                                                <button
                                                    key={output.id}
                                                    onClick={() => setPreviewImage(output.publicUrl)}
                                                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                                        (previewImage || matchingOutputs[0].publicUrl) === output.publicUrl
                                                            ? 'border-primary shadow-lg shadow-primary/30'
                                                            : 'border-white/10 hover:border-white/30'
                                                    }`}
                                                >
                                                    <img
                                                        src={output.publicUrl}
                                                        alt={output.originalName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </button>
                                            ))}
                                            {matchingOutputs.length > 6 && (
                                                <Link
                                                    href="/dashboard/studio"
                                                    className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-white/10 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors text-xs text-gray-400"
                                                >
                                                    +{matchingOutputs.length - 6}
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500">
                                        {matchingOutputs.length} {matchingOutputs.length === 1 ? 'imagen disponible' : 'imágenes disponibles'} en la sección de {formatGalleryLabel}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-yellow-200 text-sm font-medium">
                                            No hay contenido visual para {formatGalleryLabel}
                                        </p>
                                        <p className="text-yellow-200/60 text-xs mt-1">
                                            No se encontraron imágenes generadas en la sección de {formatGalleryLabel} de tu Galería.
                                            Visitá el <Link href="/dashboard/studio" className="text-primary hover:underline">Estudio Creativo</Link> para crear contenido visual para este formato.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Hook Section */}
                        <Section
                            icon={<Sparkles className="w-5 h-5" />}
                            title="Gancho"
                            subtitle="Línea de apertura para captar atención"
                            content={strategy.hook}
                            onCopy={() => handleCopy(strategy.hook, 'hook')}
                            copied={copiedField === 'hook'}
                        />

                        {/* Main Content Section */}
                        <Section
                            icon={<FileText className="w-5 h-5" />}
                            title="Contenido Principal"
                            subtitle="Caption/script completo"
                            content={strategy.mainContent}
                            onCopy={() => handleCopy(strategy.mainContent, 'mainContent')}
                            copied={copiedField === 'mainContent'}
                            multiline
                        />

                        {/* Front Page Description */}
                        <Section
                            icon={<Eye className="w-5 h-5" />}
                            title="Descripción de Portada"
                            subtitle="Visual para imagen de portada"
                            content={strategy.frontPageDescription}
                            onCopy={() => handleCopy(strategy.frontPageDescription, 'frontPage')}
                            copied={copiedField === 'frontPage'}
                        />

                        {/* Call to Action */}
                        <Section
                            icon={<Target className="w-5 h-5" />}
                            title="Llamada a la Acción"
                            content={strategy.callToAction}
                            onCopy={() => handleCopy(strategy.callToAction, 'cta')}
                            copied={copiedField === 'cta'}
                        />

                        {/* Hashtags */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Hash className="w-5 h-5" />
                                <span className="font-medium">Hashtags</span>
                                <button
                                    onClick={() => handleCopy(strategy.hashtags?.join(' ') || '', 'hashtags')}
                                    className="ml-auto p-1 hover:bg-white/10 rounded transition-colors"
                                >
                                    {copiedField === 'hashtags' ? (
                                        <Check className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {strategy.hashtags?.map((tag: string, index: number) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 bg-primary/20 text-primary border border-primary/30 rounded text-sm"
                                    >
                                        #{tag.replace('#', '')}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Strategy Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <DetailCard
                                icon={<Target className="w-4 h-4" />}
                                title="Objetivo"
                                content={strategy.objective}
                            />
                            <DetailCard
                                icon={<MessageSquare className="w-4 h-4" />}
                                title="Emoción Objetivo"
                                content={strategy.targetEmotion}
                            />
                        </div>

                        {/* Visual Notes */}
                        <Section
                            icon={<Palette className="w-5 h-5" />}
                            title="Notas Visuales"
                            subtitle="Notas detalladas para crear visuales"
                            content={strategy.visualNotes}
                            onCopy={() => handleCopy(strategy.visualNotes, 'visualNotes')}
                            copied={copiedField === 'visualNotes'}
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 p-6 border-t border-white/10 flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium transition-colors"
                        >
                            Cerrar
                        </button>
                        <div className="flex-1" />
                        {onDelete && (
                            <button
                                onClick={handleDeleteClick}
                                disabled={deleting || converting}
                                className="flex items-center gap-2 px-5 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                {deleting ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        )}
                        {onConvertToPost || true ? (
                            <button
                                onClick={handleConvertClick}
                                disabled={deleting}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary-hover hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                                Programar Post
                            </button>
                        ) : null}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function Section({
    icon,
    title,
    subtitle,
    content,
    onCopy,
    copied,
    multiline = false,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    content: string;
    onCopy: () => void;
    copied: boolean;
    multiline?: boolean;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400">
                {icon}
                <span className="font-medium">{title}</span>
                {subtitle && <span className="text-sm text-gray-500">• {subtitle}</span>}
                <button
                    onClick={onCopy}
                    className="ml-auto p-1 hover:bg-white/10 rounded transition-colors"
                >
                    {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                    ) : (
                        <Copy className="w-4 h-4" />
                    )}
                </button>
            </div>
            <div className={`bg-white/5 border border-white/10 rounded-lg p-4 text-gray-200 ${multiline ? 'whitespace-pre-wrap' : ''}`}>
                {content || <span className="text-gray-500 italic">No especificado</span>}
            </div>
        </div>
    );
}

function DetailCard({
    icon,
    title,
    content,
}: {
    icon: React.ReactNode;
    title: string;
    content: string;
}) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                {icon}
                <span>{title}</span>
            </div>
            <p className="text-gray-200">{content || <span className="text-gray-500 italic">No especificado</span>}</p>
        </div>
    );
}
