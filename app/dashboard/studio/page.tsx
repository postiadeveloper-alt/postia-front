'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, Zap, Check, Sparkles, Download, ExternalLink, Loader2, X, Send, Settings2, Smartphone, Square, Film, Layers, FolderOpen, ChevronDown, ChevronRight, Tag } from 'lucide-react';
import apiService from '@/lib/api.service';
import FormatEditorModal, { FormatSettings } from '@/components/FormatEditorModal';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';

interface ImageAsset {
    id: string;
    userId: string;
    type: 'TEMPLATE' | 'CONTENT' | 'OUTPUT';
    originalName: string;
    gcsPath: string;
    publicUrl: string;
    createdAt: string;
    targetEmotion?: string;
}

type TemplateSource =
    | { kind: 'gcs'; asset: ImageAsset }
    | { kind: 'preview'; name: string; label: string; dataUrl: string };

export default function StudioPage() {
    const router = useRouter();
    const { selectedBusinessProfile, businessProfiles, selectedProfile } = useBusinessProfile();
    // Fall back to the first business profile when none is explicitly selected
    const activeBusinessProfile = selectedBusinessProfile || businessProfiles[0] || null;
    const businessProfileId = activeBusinessProfile?.id || undefined;
    const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');
    const [templates, setTemplates] = useState<ImageAsset[]>([]);
    const [contents, setContents] = useState<ImageAsset[]>([]);
    const [outputs, setOutputs] = useState<ImageAsset[]>([]);
    const [selectedTemplateSource, setSelectedTemplateSource] = useState<TemplateSource | null>(null);
    const [selectedContent, setSelectedContent] = useState<ImageAsset | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAIGenerating, setIsAIGenerating] = useState(false);
    const [selectedOutput, setSelectedOutput] = useState<ImageAsset | null>(null);
    const [viewingAsset, setViewingAsset] = useState<ImageAsset | null>(null);
    const [accountId, setAccountId] = useState<string | null>(null);
    const [showFormatEditor, setShowFormatEditor] = useState(false);
    const [templatePreviews, setTemplatePreviews] = useState<Array<{ name: string; label: string; dataUrl: string }>>([]);
    const [previewPrimary, setPreviewPrimary] = useState('#ee3ec9');
    const [previewSecondary, setPreviewSecondary] = useState('#9b2c82');
    const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
    const [reclassifying, setReclassifying] = useState(false);
    const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
    const [classifyModal, setClassifyModal] = useState<ImageAsset | null>(null);

    const handleCreatePost = (imageUrl: string) => {
        // Store the pre-uploaded image URL in sessionStorage for the create post page
        sessionStorage.setItem('studioMediaUrl', imageUrl);
        router.push('/dashboard/posts/create');
    };

    const handleReclassify = async (assetId: string, newEmotion: string) => {
        setReclassifying(true);
        try {
            await apiService.updateAssetEmotion(assetId, newEmotion);
            // Update local state so the gallery reorganises instantly
            setOutputs(prev => prev.map(o => o.id === assetId ? { ...o, targetEmotion: newEmotion } : o));
            setSelectedOutput(prev => prev && prev.id === assetId ? { ...prev, targetEmotion: newEmotion } : prev);
            setClassifyModal(prev => prev && prev.id === assetId ? { ...prev, targetEmotion: newEmotion } : prev);
        } catch (error) {
            console.error('Failed to reclassify asset:', error);
        }
        setReclassifying(false);
    };

    const toggleFolder = (key: string) => {
        setCollapsedFolders(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const loadLibrary = useCallback(async () => {
        try {
            const [t, c, o] = await Promise.all([
                apiService.listTemplates(businessProfileId),
                apiService.listContent(businessProfileId),
                apiService.listOutputs(businessProfileId)
            ]);
            setTemplates(Array.isArray(t) ? t : []);
            setContents(Array.isArray(c) ? c : []);
            setOutputs(Array.isArray(o) ? o : []);
        } catch (error) {
            console.error('Failed to load library:', error);
        }
    }, [businessProfileId]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const accounts = await apiService.getInstagramAccounts();
            if (accounts && accounts.length > 0) {
                // Use the account corresponding to selected business profile, or first
                if (activeBusinessProfile) {
                    const matchingAccount = accounts.find((a: any) => a.id === activeBusinessProfile.instagramAccount?.id);
                    setAccountId(matchingAccount?.id || accounts[0].id);
                } else {
                    setAccountId(accounts[0].id);
                }
            }
            await loadLibrary();
        } catch (error) {
            console.error('Failed to load data:', error);
        }
        setIsLoading(false);
    }, [loadLibrary, activeBusinessProfile]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Reset selections when business profile changes
    useEffect(() => {
        setSelectedTemplateSource(null);
        setSelectedContent(null);
        setSelectedOutput(null);
        setTemplatePreviews([]);
    }, [businessProfileId]);

    // Load template previews from brand colors when profile loads
    useEffect(() => {
        if (!activeBusinessProfile) return;
        const colors = activeBusinessProfile.brandColors;
        const p = Array.isArray(colors) && colors[0] ? colors[0] : '#ee3ec9';
        const s = Array.isArray(colors) && colors[1] ? colors[1] : '#9b2c82';
        setPreviewPrimary(p);
        setPreviewSecondary(s);
    }, [activeBusinessProfile]);

    const loadTemplatePreviews = async () => {
        setIsLoadingPreviews(true);
        try {
            const previews = await apiService.getTemplatesPreviews(previewPrimary, previewSecondary);
            setTemplatePreviews(previews);
        } catch (err) {
            console.error('Failed to load template previews:', err);
        }
        setIsLoadingPreviews(false);
    };

    const handleUpload = async (type: 'template' | 'content', file: File) => {
        try {
            if (type === 'template') {
                await apiService.uploadTemplate(file, businessProfileId);
            } else {
                await apiService.uploadContent(file, businessProfileId);
            }
            loadLibrary();
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    const handleGenerateTemplates = async () => {
        if (!accountId) return;
        setIsAIGenerating(true);
        try {
            await apiService.generateAITemplates(accountId, businessProfileId);
            await loadLibrary();
            await apiService.generateAITemplates(accountId, businessProfileId);
            await loadLibrary();
            alert('¡Plantillas de IA generadas exitosamente!');
        } catch (error) {
            console.error('AI Generation failed:', error);
            alert('Falló la generación de plantillas de IA. Asegúrate de tener configurados los colores de la marca en el Perfil de Negocio.');
        }
        setIsAIGenerating(false);
    };

    const handleGenerateClick = () => {
        if (!selectedTemplateSource || !selectedContent) return;
        setShowFormatEditor(true);
    };

    const handleGenerateWithFormat = async (settings: FormatSettings) => {
        if (!selectedTemplateSource || !selectedContent) return;

        setShowFormatEditor(false);
        setIsGenerating(true);
        try {
            let result: ImageAsset;

            if (selectedTemplateSource.kind === 'gcs') {
                // Standard flow: template is already in GCS
                console.log('[Studio] Generating (GCS flow):', { settings, templatePath: selectedTemplateSource.asset.gcsPath, contentPath: selectedContent.gcsPath });
                result = await apiService.generateImageWithFormat(
                    selectedTemplateSource.asset.gcsPath,
                    selectedContent.gcsPath,
                    settings,
                    businessProfileId,
                );
            } else {
                // Inline flow: template is a locally-generated preview (data URL → Blob)
                const blob = await fetch(selectedTemplateSource.dataUrl).then(r => r.blob());
                console.log('[Studio] Generating (inline flow):', { settings, blobSize: blob.size, contentPath: selectedContent.gcsPath });
                result = await apiService.generateImageWithFormatInline(
                    blob,
                    selectedContent.gcsPath,
                    settings,
                    businessProfileId,
                );
            }

            const updatedOutputs = await apiService.listOutputs(businessProfileId);
            setOutputs(Array.isArray(updatedOutputs) ? updatedOutputs : []);

            // If the generated image is a carousel, show the classification modal
            if (result.originalName?.startsWith('generated_carousel_')) {
                setClassifyModal(result);
            } else {
                setActiveTab('gallery');
                setViewingAsset(result);
            }
        } catch (error) {
            console.error('Generation failed:', error);
            alert('Error al generar el diseño. Por favor intenta de nuevo.');
        }
        setIsGenerating(false);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-8 rounded-2xl text-white">
                <h1 className="text-3xl font-bold mb-2">Estudio Creativo</h1>
                <p className="text-indigo-200">Combina tus plantillas con contenido para crear visuales impresionantes.</p>
                {activeBusinessProfile && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg text-sm">
                        <span className="text-indigo-300">Perfil activo:</span>
                        <span className="font-semibold">{activeBusinessProfile.brandName}</span>
                    </div>
                )}
            </div>

            {/* No profile selected warning */}
            {!activeBusinessProfile && businessProfiles.length > 1 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-yellow-400 text-xl">⚠️</span>
                    <p className="text-yellow-200 text-sm">
                        Selecciona un perfil de negocio en el menú lateral para ver su contenido exclusivo. Actualmente estás viendo contenido sin perfil asignado.
                    </p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('create')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${activeTab === 'create'
                        ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                >
                    <Sparkles className="w-5 h-5" />
                    Crear Nuevo
                </button>
                <button
                    onClick={() => setActiveTab('gallery')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${activeTab === 'gallery'
                        ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                >
                    <ImageIcon className="w-5 h-5" />
                    Galería ({outputs.length})
                </button>
            </div>

            {/* Create Tab */}
            {activeTab === 'create' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {!activeBusinessProfile ? (
                        <div className="glass-card p-8 rounded-xl text-center space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                                <Zap className="w-8 h-8 text-yellow-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-200">Seleccioná un Perfil de Negocio</h3>
                            <p className="text-gray-400 text-sm max-w-md mx-auto">
                                Para usar plantillas, subir contenido y generar diseños necesitás tener un perfil de negocio seleccionado.
                                Elegí uno desde el selector en la barra superior.
                            </p>
                        </div>
                    ) : (
                        <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Templates Section */}
                        <div className="glass-card p-6 rounded-xl space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-400" />
                                    Plantillas ({templates.length})
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleGenerateTemplates}
                                        disabled={isAIGenerating || !accountId}
                                        className="bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isAIGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        Generar con IA
                                    </button>
                                    <label className="cursor-pointer bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                        <Upload className="w-4 h-4 inline-block mr-2" />
                                        Subir Template
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => e.target.files?.[0] && handleUpload('template', e.target.files[0])}
                                        />
                                    </label>
                                </div>
                            </div>

                                {/* ── Quick Preview Gallery ── */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider">Vista previa rápida</span>
                                    <div className="flex items-center gap-2 ml-auto">
                                        <label className="flex flex-col items-center gap-0.5 cursor-pointer" title="Color principal">
                                            <input
                                                type="color"
                                                value={previewPrimary}
                                                onChange={e => setPreviewPrimary(e.target.value)}
                                                className="w-7 h-7 rounded border border-white/20 bg-transparent cursor-pointer p-0.5"
                                            />
                                            <span className="text-[9px] text-gray-600">Principal</span>
                                        </label>
                                        <label className="flex flex-col items-center gap-0.5 cursor-pointer" title="Color secundario">
                                            <input
                                                type="color"
                                                value={previewSecondary}
                                                onChange={e => setPreviewSecondary(e.target.value)}
                                                className="w-7 h-7 rounded border border-white/20 bg-transparent cursor-pointer p-0.5"
                                            />
                                            <span className="text-[9px] text-gray-600">Secundario</span>
                                        </label>
                                        <button
                                            onClick={loadTemplatePreviews}
                                            disabled={isLoadingPreviews}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-xs font-medium transition-colors disabled:opacity-50"
                                            title="Generar vistas previas con estos colores"
                                        >
                                            {isLoadingPreviews ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                            Generar
                                        </button>
                                    </div>
                                </div>

                                {templatePreviews.length === 0 ? (
                                    <button
                                        onClick={loadTemplatePreviews}
                                        disabled={isLoadingPreviews}
                                        className="w-full py-6 rounded-xl border border-dashed border-white/10 text-gray-500 text-sm hover:border-primary/40 hover:text-primary/70 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isLoadingPreviews ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        {isLoadingPreviews ? 'Generando plantillas…' : 'Click para generar 6 plantillas con tus colores'}
                                    </button>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {templatePreviews.map((preview) => {
                                            const isSelected = selectedTemplateSource?.kind === 'preview' && selectedTemplateSource.name === preview.name;
                                            return (
                                                <div
                                                    key={preview.name}
                                                    onClick={() => setSelectedTemplateSource({ kind: 'preview', ...preview })}
                                                    className={`relative aspect-[4/5] rounded-lg border-2 cursor-pointer overflow-hidden group bg-gray-900 transition-all ${
                                                        isSelected ? 'border-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]' : 'border-white/10 hover:border-white/30'
                                                    }`}
                                                >
                                                    <img src={preview.dataUrl} alt={preview.label} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-x-0 bottom-0 bg-black/70 py-1 px-1.5 text-[9px] text-center truncate text-gray-300">
                                                        {preview.label}
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute top-1.5 right-1.5 bg-primary text-white rounded-full p-0.5 shadow-lg">
                                                            <Check className="w-2.5 h-2.5" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* ── Saved GCS templates ── */}
                            {templates.length > 0 && (
                                <>
                                    <div className="flex items-center gap-2 pt-1">
                                        <div className="flex-1 border-t border-white/10" />
                                        <span className="text-xs text-gray-600 whitespace-nowrap">Tus plantillas guardadas</span>
                                        <div className="flex-1 border-t border-white/10" />
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
                                        {templates.map((t) => {
                                            const isSelected = selectedTemplateSource?.kind === 'gcs' && selectedTemplateSource.asset.id === t.id;
                                            return (
                                                <div
                                                    key={t.id}
                                                    onClick={() => setSelectedTemplateSource({ kind: 'gcs', asset: t })}
                                                    onDoubleClick={() => setViewingAsset(t)}
                                                    className={`relative aspect-[9/16] rounded-lg border-2 cursor-pointer overflow-hidden group bg-gray-900 ${
                                                        isSelected ? 'border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]' : 'border-white/10 hover:border-white/30'
                                                    }`}
                                                >
                                                    <img src={t.publicUrl} alt={t.originalName} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {t.originalName}
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 shadow-lg">
                                                            <Check className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Content Section */}
                        <div className="glass-card p-6 rounded-xl space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-blue-400" />
                                    Contenido ({contents.length})
                                </h2>
                                <label className="cursor-pointer bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                    <Upload className="w-4 h-4 inline-block mr-2" />
                                    Subir imagen
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleUpload('content', e.target.files[0])}
                                    />
                                </label>
                            </div>

                            {contents.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Aún no hay contenido. ¡Sube tu primera imagen!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
                                    {contents.map((c) => (
                                        <div
                                            key={c.id}
                                            onClick={() => setSelectedContent(c)}
                                            onDoubleClick={() => setViewingAsset(c)}
                                            className={`
                                                relative aspect-square rounded-lg border-2 cursor-pointer overflow-hidden group bg-gray-900
                                                ${selectedContent?.id === c.id ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-white/10 hover:border-white/30'}
                                            `}
                                        >
                                            <img
                                                src={c.publicUrl}
                                                alt={c.originalName}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                {c.originalName}
                                            </div>
                                            {selectedContent?.id === c.id && (
                                                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 shadow-lg">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action & Result */}
                    <div className="flex flex-col items-center justify-center space-y-6">
                        <button
                            onClick={handleGenerateClick}
                            disabled={!selectedTemplateSource || !selectedContent || isGenerating}
                            className={`
                                px-8 py-4 rounded-xl text-lg font-bold shadow-lg transition-all flex items-center gap-3
                                ${!selectedTemplateSource || !selectedContent
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-primary to-purple-600 hover:scale-105 hover:shadow-primary/50 text-white'
                                }
                            `}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creando Magia...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generar Diseño
                                </>
                            )}
                        </button>
                    </div>
                        </>
                    )}
                </motion.div>
            )}

            {/* Gallery Tab */}
            {activeTab === 'gallery' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {outputs.length === 0 ? (
                        <div className="glass-card p-12 rounded-xl text-center">
                            <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                            <h3 className="text-xl font-semibold text-gray-300 mb-2">Aún no hay diseños</h3>
                            <p className="text-gray-500 mb-6">Crea tu primer diseño combinando una plantilla con contenido.</p>
                            <button
                                onClick={() => setActiveTab('create')}
                                className="bg-gradient-to-r from-primary to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
                            >
                                Empezar a Crear
                            </button>
                        </div>
                    ) : (() => {
                        const FORMAT_SECTIONS = [
                            { key: 'story', label: 'Stories', icon: Smartphone, ratio: '9:16', aspect: 'aspect-[9/16]' },
                            { key: 'reel', label: 'Reels', icon: Film, ratio: '9:16', aspect: 'aspect-[9/16]' },
                            { key: 'post', label: 'Posts', icon: Square, ratio: '1:1', aspect: 'aspect-square' },
                            { key: 'carousel', label: 'Carruseles', icon: Layers, ratio: '4:5', aspect: 'aspect-[4/5]' },
                        ];

                        const getOutputFormat = (output: ImageAsset): string => {
                            const match = output.originalName.match(/^generated_(story|reel|post|carousel)_/);
                            return match ? match[1] : 'other';
                        };

                        const grouped = outputs.reduce<Record<string, ImageAsset[]>>((acc, output) => {
                            const fmt = getOutputFormat(output);
                            if (!acc[fmt]) acc[fmt] = [];
                            acc[fmt].push(output);
                            return acc;
                        }, {});

                        // Only show sections that have outputs
                        const sectionsWithData = FORMAT_SECTIONS.filter(s => grouped[s.key]?.length > 0);
                        const otherOutputs = grouped['other'] || [];

                        return (
                            <div className="space-y-10">
                                {sectionsWithData.map(section => {
                                    const SectionIcon = section.icon;
                                    const sectionOutputs = grouped[section.key] || [];

                                    // For carousels, group by targetEmotion in folder-style layout
                                    if (section.key === 'carousel') {
                                        const profileEmotions: string[] = activeBusinessProfile?.targetEmotions || [];
                                        const byEmotion = sectionOutputs.reduce<Record<string, ImageAsset[]>>((acc, output) => {
                                            const emotion = output.targetEmotion || 'Sin clasificar';
                                            if (!acc[emotion]) acc[emotion] = [];
                                            acc[emotion].push(output);
                                            return acc;
                                        }, {});
                                        // Show classified folders first (in profile order), then Sin clasificar last
                                        const orderedKeys = [
                                            ...profileEmotions.filter(e => byEmotion[e]),
                                            ...Object.keys(byEmotion).filter(k => k !== 'Sin clasificar' && !profileEmotions.includes(k)),
                                            ...(byEmotion['Sin clasificar'] ? ['Sin clasificar'] : []),
                                        ];

                                        return (
                                            <div key={section.key} className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20">
                                                        <SectionIcon className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-white">{section.label}</h3>
                                                        <p className="text-xs text-gray-500">{section.ratio} · {sectionOutputs.length} {sectionOutputs.length === 1 ? 'diseño' : 'diseños'} · {orderedKeys.length} {orderedKeys.length === 1 ? 'carpeta' : 'carpetas'}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    {orderedKeys.map(emotion => {
                                                        const isUnclassified = emotion === 'Sin clasificar';
                                                        const folderOutputs = byEmotion[emotion];
                                                        const isCollapsed = collapsedFolders[`carousel_${emotion}`];
                                                        return (
                                                            <div key={emotion} className={`rounded-xl border ${isUnclassified ? 'border-white/10 bg-white/[0.02]' : 'border-purple-500/20 bg-purple-500/[0.04]'} overflow-hidden`}>
                                                                {/* Folder header — clickable to collapse */}
                                                                <button
                                                                    onClick={() => toggleFolder(`carousel_${emotion}`)}
                                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                                                                >
                                                                    {isCollapsed
                                                                        ? <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                                        : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                                                                    <FolderOpen className={`w-5 h-5 flex-shrink-0 ${isUnclassified ? 'text-gray-500' : 'text-purple-400'}`} />
                                                                    <span className={`text-sm font-semibold ${isUnclassified ? 'text-gray-400' : 'text-purple-300'}`}>
                                                                        {emotion}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 ml-auto">
                                                                        {folderOutputs.length} {folderOutputs.length === 1 ? 'diseño' : 'diseños'}
                                                                    </span>
                                                                </button>
                                                                {/* Folder contents */}
                                                                {!isCollapsed && (
                                                                    <div className="px-4 pb-4">
                                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                                            {folderOutputs.map((output) => (
                                                                                <motion.div
                                                                                    key={output.id}
                                                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                                    whileHover={{ scale: 1.02 }}
                                                                                    onClick={() => setSelectedOutput(output)}
                                                                                    onDoubleClick={() => setViewingAsset(output)}
                                                                                    className={`relative ${section.aspect} rounded-xl overflow-hidden cursor-pointer border-2 border-white/10 hover:border-primary/50 transition-all shadow-lg group`}
                                                                                >
                                                                                    <img
                                                                                        src={output.publicUrl}
                                                                                        alt={output.originalName}
                                                                                        className="w-full h-full object-cover"
                                                                                    />
                                                                                    {/* Emotion badge on thumbnail */}
                                                                                    <div className="absolute top-2 left-2">
                                                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md ${
                                                                                            isUnclassified
                                                                                                ? 'bg-black/50 text-gray-400 border border-white/10'
                                                                                                : 'bg-purple-600/60 text-purple-100 border border-purple-400/30'
                                                                                        }`}>
                                                                                            <Tag className="w-2.5 h-2.5" />
                                                                                            {emotion}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                                                                            <p className="text-xs text-gray-300">{formatDate(output.createdAt)}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                </motion.div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={section.key} className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20">
                                                    <SectionIcon className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white">{section.label}</h3>
                                                    <p className="text-xs text-gray-500">{section.ratio} · {sectionOutputs.length} {sectionOutputs.length === 1 ? 'diseño' : 'diseños'}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                {sectionOutputs.map((output) => (
                                                    <motion.div
                                                        key={output.id}
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        whileHover={{ scale: 1.02 }}
                                                        onClick={() => setSelectedOutput(output)}
                                                        onDoubleClick={() => setViewingAsset(output)}
                                                        className={`relative ${section.aspect} rounded-xl overflow-hidden cursor-pointer border-2 border-white/10 hover:border-primary/50 transition-all shadow-lg group`}
                                                    >
                                                        <img
                                                            src={output.publicUrl}
                                                            alt={output.originalName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                                                <p className="text-xs text-gray-300">{formatDate(output.createdAt)}</p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {otherOutputs.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10">
                                                <ImageIcon className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">Otros</h3>
                                                <p className="text-xs text-gray-500">{otherOutputs.length} {otherOutputs.length === 1 ? 'diseño' : 'diseños'}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {otherOutputs.map((output) => (
                                                <motion.div
                                                    key={output.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    whileHover={{ scale: 1.02 }}
                                                    onClick={() => setSelectedOutput(output)}
                                                    onDoubleClick={() => setViewingAsset(output)}
                                                    className="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer border-2 border-white/10 hover:border-primary/50 transition-all shadow-lg group"
                                                >
                                                    <img
                                                        src={output.publicUrl}
                                                        alt={output.originalName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                                            <p className="text-xs text-gray-300">{formatDate(output.createdAt)}</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Output Preview Modal */}
                    {selectedOutput && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setSelectedOutput(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="glass-card p-4 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <img
                                    src={selectedOutput.publicUrl}
                                    alt={selectedOutput.originalName}
                                    className="w-full h-auto rounded-xl shadow-2xl"
                                />
                                <div className="mt-4 space-y-3">
                                    <p className="text-sm text-gray-400">Creado: {formatDate(selectedOutput.createdAt)}</p>
                                    {/* Reclassify emotion — shown for carousel outputs */}
                                    {selectedOutput.originalName.startsWith('generated_carousel_') && (() => {
                                        const profileEmotions: string[] = activeBusinessProfile?.targetEmotions || [];
                                        if (profileEmotions.length === 0) return null;
                                        return (
                                            <div className="space-y-2">
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Clasificar emoción</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {profileEmotions.map(emotion => {
                                                        const isActive = selectedOutput.targetEmotion === emotion;
                                                        return (
                                                            <button
                                                                key={emotion}
                                                                disabled={reclassifying}
                                                                onClick={() => handleReclassify(selectedOutput.id, emotion)}
                                                                className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${isActive
                                                                    ? 'bg-purple-500/30 text-purple-200 border-purple-500/60'
                                                                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-500/40'
                                                                    } ${reclassifying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                            >
                                                                {emotion}
                                                            </button>
                                                        );
                                                    })}
                                                    {/* Allow removing classification */}
                                                    {selectedOutput.targetEmotion && (
                                                        <button
                                                            disabled={reclassifying}
                                                            onClick={() => handleReclassify(selectedOutput.id, '')}
                                                            className={`px-3 py-1 rounded-full text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all ${reclassifying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                        >
                                                            ✕ Quitar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    <button
                                        onClick={() => handleCreatePost(selectedOutput.publicUrl)}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold transition-all hover:scale-105"
                                    >
                                        <Send className="w-4 h-4" />
                                        Crear Publicación
                                    </button>
                                    <div className="flex gap-3">
                                        <a
                                            href={selectedOutput.publicUrl}
                                            download={selectedOutput.originalName}
                                            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-purple-600 text-white py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
                                        >
                                            <Download className="w-4 h-4" />
                                            Descargar
                                        </a>
                                        <a
                                            href={selectedOutput.publicUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-semibold transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOutput(null)}
                                        className="w-full py-2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </motion.div>
            )}
            {/* Asset Preview Modal (Templates/Content) */}
            {viewingAsset && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setViewingAsset(null)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-card p-4 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-200">{viewingAsset.originalName}</h3>
                            <button onClick={() => setViewingAsset(null)} className="text-gray-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <img
                            src={viewingAsset.publicUrl}
                            alt={viewingAsset.originalName}
                            className="w-full h-auto rounded-xl shadow-2xl bg-gray-900"
                        />
                        <div className="mt-4 flex gap-3">
                            <a
                                href={viewingAsset.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Ver Imagen Completa
                            </a>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* AI Generation Loading Modal */}
            {isAIGenerating && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 text-center"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="glass-card p-8 rounded-3xl max-w-sm w-full space-y-6"
                    >
                        <div className="relative w-24 h-24 mx-auto">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-purple-500 border-l-transparent rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary">
                                Generando Plantillas
                            </h3>
                            <p className="text-gray-400 text-sm">
                                Nuestra IA está creando diseños de alta gama usando los colores y logo de tu marca...
                            </p>
                        </div>
                        <div className="flex justify-center gap-1">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                    className="w-2 h-2 bg-primary rounded-full"
                                />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Format Editor Modal */}
            {selectedTemplateSource && selectedContent && (
                <FormatEditorModal
                    isOpen={showFormatEditor}
                    onClose={() => setShowFormatEditor(false)}
                    onConfirm={handleGenerateWithFormat}
                    templateUrl={
                        selectedTemplateSource.kind === 'gcs'
                            ? selectedTemplateSource.asset.publicUrl
                            : selectedTemplateSource.dataUrl
                    }
                    contentUrl={selectedContent.publicUrl}
                    targetEmotions={activeBusinessProfile?.targetEmotions || []}
                />
            )}

            {/* Post-generation carousel classification modal */}
            {classifyModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => { setClassifyModal(null); setActiveTab('gallery'); }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-card p-6 rounded-2xl max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-purple-500/30 to-primary/30 flex items-center justify-center">
                                <Layers className="w-8 h-8 text-purple-300" />
                            </div>
                            <h3 className="text-xl font-bold text-white">¡Carrusel creado!</h3>
                            <p className="text-sm text-gray-400 mt-1">Clasifícalo en una carpeta de emoción para que la IA lo use según el intent del contenido.</p>
                        </div>

                        {/* Preview thumbnail */}
                        <div className="relative aspect-[4/5] rounded-xl overflow-hidden mb-5 border border-white/10">
                            <img src={classifyModal.publicUrl} alt="" className="w-full h-full object-cover" />
                            {classifyModal.targetEmotion && (
                                <div className="absolute top-2 left-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md bg-purple-600/60 text-purple-100 border border-purple-400/30">
                                        <Tag className="w-2.5 h-2.5" />
                                        {classifyModal.targetEmotion}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Emotion folder buttons */}
                        {(() => {
                            const profileEmotions: string[] = activeBusinessProfile?.targetEmotions || [];
                            if (profileEmotions.length === 0) return (
                                <p className="text-sm text-gray-500 text-center mb-4">No hay emociones configuradas en tu perfil de negocio. Puedes agregarlas desde la sección de Perfil.</p>
                            );
                            return (
                                <div className="space-y-2 mb-5">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Selecciona una carpeta</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {profileEmotions.map(emotion => {
                                            const isActive = classifyModal.targetEmotion === emotion;
                                            return (
                                                <button
                                                    key={emotion}
                                                    disabled={reclassifying}
                                                    onClick={() => handleReclassify(classifyModal.id, emotion)}
                                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                                        isActive
                                                            ? 'bg-purple-500/30 text-purple-200 border-purple-500/60 ring-1 ring-purple-500/40'
                                                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-purple-500/15 hover:text-purple-300 hover:border-purple-500/30'
                                                    } ${reclassifying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <FolderOpen className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-purple-300' : 'text-gray-500'}`} />
                                                    <span className="truncate">{emotion}</span>
                                                    {isActive && <Check className="w-3.5 h-3.5 ml-auto text-purple-300" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setClassifyModal(null); setActiveTab('gallery'); }}
                                className="flex-1 py-3 rounded-xl font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                {classifyModal.targetEmotion ? 'Listo' : 'Saltar'}
                            </button>
                            {classifyModal.targetEmotion && (
                                <button
                                    onClick={() => { setClassifyModal(null); setActiveTab('gallery'); }}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-primary text-white py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
                                >
                                    <Check className="w-4 h-4" />
                                    Ir a Galería
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}


