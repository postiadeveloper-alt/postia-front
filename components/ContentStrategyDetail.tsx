'use client';

import { X, Copy, Check, Sparkles, Target, MessageSquare, Hash, Eye, Palette, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

interface ContentStrategyDetailProps {
    strategy: any;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: (id: string, data: any) => Promise<void>;
    onConvertToPost?: (id: string) => Promise<void>;
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

export default function ContentStrategyDetail({
    strategy,
    isOpen,
    onClose,
    onUpdate,
    onConvertToPost,
}: ContentStrategyDetailProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    if (!isOpen || !strategy) return null;

    const handleCopy = async (text: string, field: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const formatInfo = FORMAT_LABELS[strategy.format] || { label: strategy.format, color: 'bg-gray-500' };
    const pillarInfo = PILLAR_COLORS[strategy.contentPillar] || { className: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: strategy.contentPillar };
    
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
                            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium transition-colors"
                        >
                            Cerrar
                        </button>
                        {onConvertToPost && (
                            <button
                                onClick={() => onConvertToPost(strategy.id)}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary-hover hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-primary/25"
                            >
                                Convertir a Publicación
                            </button>
                        )}
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
