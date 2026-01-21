'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, Zap, Check, Sparkles, Download, ExternalLink, Loader2, X, Send } from 'lucide-react';
import apiService from '@/lib/api.service';

interface ImageAsset {
    id: string;
    userId: string;
    type: 'TEMPLATE' | 'CONTENT' | 'OUTPUT';
    originalName: string;
    gcsPath: string;
    publicUrl: string;
    createdAt: string;
}

export default function StudioPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');
    const [templates, setTemplates] = useState<ImageAsset[]>([]);
    const [contents, setContents] = useState<ImageAsset[]>([]);
    const [outputs, setOutputs] = useState<ImageAsset[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<ImageAsset | null>(null);
    const [selectedContent, setSelectedContent] = useState<ImageAsset | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAIGenerating, setIsAIGenerating] = useState(false);
    const [selectedOutput, setSelectedOutput] = useState<ImageAsset | null>(null);
    const [viewingAsset, setViewingAsset] = useState<ImageAsset | null>(null);
    const [accountId, setAccountId] = useState<string | null>(null);

    const handleCreatePost = (imageUrl: string) => {
        // Store the pre-uploaded image URL in sessionStorage for the create post page
        sessionStorage.setItem('studioMediaUrl', imageUrl);
        router.push('/dashboard/posts/create');
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const accounts = await apiService.getInstagramAccounts();
            if (accounts && accounts.length > 0) {
                setAccountId(accounts[0].id);
            }
            await loadLibrary();
        } catch (error) {
            console.error('Failed to load data:', error);
        }
        setIsLoading(false);
    };

    const loadLibrary = async () => {
        try {
            const [t, c, o] = await Promise.all([
                apiService.listTemplates(),
                apiService.listContent(),
                apiService.listOutputs()
            ]);
            setTemplates(Array.isArray(t) ? t : []);
            setContents(Array.isArray(c) ? c : []);
            setOutputs(Array.isArray(o) ? o : []);
        } catch (error) {
            console.error('Failed to load library:', error);
        }
    };

    const handleUpload = async (type: 'template' | 'content', file: File) => {
        try {
            if (type === 'template') {
                await apiService.uploadTemplate(file);
            } else {
                await apiService.uploadContent(file);
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
            await apiService.generateAITemplates(accountId);
            await loadLibrary();
            await apiService.generateAITemplates(accountId);
            await loadLibrary();
            alert('¡Plantillas de IA generadas exitosamente!');
        } catch (error) {
            console.error('AI Generation failed:', error);
            alert('Falló la generación de plantillas de IA. Asegúrate de tener configurados los colores de la marca en el Perfil de Negocio.');
        }
        setIsAIGenerating(false);
    };

    const handleGenerate = async () => {
        if (!selectedTemplate || !selectedContent) return;

        setIsGenerating(true);
        try {
            const result = await apiService.generateImage(selectedTemplate.gcsPath, selectedContent.gcsPath);
            // Refresh outputs list to include the new generation
            const updatedOutputs = await apiService.listOutputs();
            setOutputs(Array.isArray(updatedOutputs) ? updatedOutputs : []);

            // Redirect to gallery and show preview
            setActiveTab('gallery');
            setViewingAsset(result);
        } catch (error) {
            console.error('Generation failed:', error);
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
            </div>

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
                                        Subir Nuevo
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => e.target.files?.[0] && handleUpload('template', e.target.files[0])}
                                        />
                                    </label>
                                </div>
                            </div>

                            {templates.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Aún no hay plantillas. ¡Sube tu primera plantilla!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
                                    {templates.map((t) => (
                                        <div
                                            key={t.id}
                                            onClick={() => setSelectedTemplate(t)}
                                            onDoubleClick={() => setViewingAsset(t)}
                                            className={`
                                                relative aspect-[9/16] rounded-lg border-2 cursor-pointer overflow-hidden group bg-gray-900
                                                ${selectedTemplate?.id === t.id ? 'border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]' : 'border-white/10 hover:border-white/30'}
                                            `}
                                        >
                                            <img
                                                src={t.publicUrl}
                                                alt={t.originalName}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                {t.originalName}
                                            </div>
                                            {selectedTemplate?.id === t.id && (
                                                <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 shadow-lg">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
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
                                    Subir Nuevo
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
                            onClick={handleGenerate}
                            disabled={!selectedTemplate || !selectedContent || isGenerating}
                            className={`
                                px-8 py-4 rounded-xl text-lg font-bold shadow-lg transition-all flex items-center gap-3
                                ${!selectedTemplate || !selectedContent
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
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {outputs.map((output) => (
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
                    )}

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
        </div>
    );
}


