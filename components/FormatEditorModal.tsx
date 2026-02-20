'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Move, ZoomIn, ZoomOut, RotateCcw, Smartphone, Square, RectangleVertical, Film, Layers, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface FormatEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (settings: FormatSettings) => void;
    templateUrl: string;
    contentUrl: string;
}

export interface FormatSettings {
    format: 'story' | 'reel' | 'post' | 'carousel';
    width: number;
    height: number;
    cropX: number;
    cropY: number;
    scale: number;
}

const FORMAT_DIMENSIONS = {
    story: { width: 1080, height: 1920, label: 'Story', icon: Smartphone, ratio: '9:16' },
    reel: { width: 1080, height: 1920, label: 'Reel', icon: Film, ratio: '9:16' },
    post: { width: 1080, height: 1080, label: 'Post', icon: Square, ratio: '1:1' },
    carousel: { width: 1080, height: 1350, label: 'Carrusel', icon: Layers, ratio: '4:5' }
};

export default function FormatEditorModal({
    isOpen,
    onClose,
    onConfirm,
    templateUrl,
    contentUrl
}: FormatEditorModalProps) {
    const [selectedFormat, setSelectedFormat] = useState<'story' | 'reel' | 'post' | 'carousel'>('story');
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [contentImageDimensions, setContentImageDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 300, height: 533 });

    // Calculate preview container size based on format
    useEffect(() => {
        if (!containerRef.current) return;

        const format = FORMAT_DIMENSIONS[selectedFormat];
        const aspectRatio = format.width / format.height;
        const maxHeight = 450;
        const maxWidth = 350;

        let width, height;
        if (aspectRatio > maxWidth / maxHeight) {
            width = maxWidth;
            height = maxWidth / aspectRatio;
        } else {
            height = maxHeight;
            width = maxHeight * aspectRatio;
        }

        setContainerSize({ width, height });
    }, [selectedFormat]);

    // Load content image dimensions
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            setContentImageDimensions({ width: img.width, height: img.height });
        };
        img.src = contentUrl;
    }, [contentUrl]);

    // Reset position when format changes
    useEffect(() => {
        setPosition({ x: 0, y: 0 });
        setScale(1);
    }, [selectedFormat]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.1, 3));
    };

    const handleZoomOut = () => {
        setScale(prev => Math.max(prev - 0.1, 0.3));
    };

    const handleReset = () => {
        setPosition({ x: 0, y: 0 });
        setScale(1);
    };

    const EXTEND_SCALE_STEP = 0.05;

    // Extend the image in a given direction:
    // Increases the scale and offsets position so the image grows outward from the arrow's edge,
    // revealing more content on that side of the frame.
    const handleExtend = (direction: 'up' | 'down' | 'left' | 'right') => {
        setScale(prev => {
            const newScale = Math.min(prev + EXTEND_SCALE_STEP, 3);
            const growth = newScale / prev;

            // Shift position so the growth appears anchored to the opposite edge
            setPosition(pos => {
                const dx = (imageDisplaySize.width * prev * (growth - 1));
                const dy = (imageDisplaySize.height * prev * (growth - 1));
                switch (direction) {
                    case 'up':    return { ...pos, y: pos.y - dy * 0.15 };
                    case 'down':  return { ...pos, y: pos.y + dy * 0.15 };
                    case 'left':  return { ...pos, x: pos.x - dx * 0.15 };
                    case 'right': return { ...pos, x: pos.x + dx * 0.15 };
                }
            });

            return newScale;
        });
    };

    // Display image at its natural aspect ratio, sized to fill the outer preview area
    // so the user sees the full unmodified image and drags to choose which part is in the frame
    const outerWidth = containerSize.width + 100;
    const outerHeight = containerSize.height + 100;

    const getImageNaturalDisplaySize = useCallback(() => {
        if (contentImageDimensions.width === 0 || contentImageDimensions.height === 0) {
            return { width: outerWidth, height: outerHeight };
        }
        const imgAspect = contentImageDimensions.width / contentImageDimensions.height;

        // Fit the full image inside the outer container, preserving aspect ratio
        let width, height;
        if (imgAspect > outerWidth / outerHeight) {
            // Image is wider → fit to outer width
            width = outerWidth;
            height = outerWidth / imgAspect;
        } else {
            // Image is taller → fit to outer height
            height = outerHeight;
            width = outerHeight * imgAspect;
        }
        return { width, height };
    }, [contentImageDimensions, outerWidth, outerHeight]);

    const imageDisplaySize = getImageNaturalDisplaySize();

    const handleConfirm = () => {
        const format = FORMAT_DIMENSIONS[selectedFormat];

        // Calculate crop values based on preview position
        // The position is in preview pixels, we need to map it to actual pixels
        const scaleRatio = format.width / containerSize.width;

        onConfirm({
            format: selectedFormat,
            width: format.width,
            height: format.height,
            cropX: Math.round(-position.x * scaleRatio / scale),
            cropY: Math.round(-position.y * scaleRatio / scale),
            scale
        });
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="glass-card p-6 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary">
                            Personalizar Diseño
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Selecciona el formato y ajusta la posición de la imagen
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Format Selection */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <RectangleVertical className="w-5 h-5 text-primary" />
                            Formato
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(FORMAT_DIMENSIONS).map(([key, value]) => {
                                const Icon = value.icon;
                                const isSelected = selectedFormat === key;

                                return (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedFormat(key as typeof selectedFormat)}
                                        className={`
                                            relative p-4 rounded-xl border-2 transition-all duration-300
                                            ${isSelected
                                                ? 'border-primary bg-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]'
                                                : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                                            }
                                        `}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <Icon className={`w-8 h-8 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                                            <span className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                                {value.label}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {value.width} × {value.height}
                                            </span>
                                            <span className="text-xs text-gray-600">
                                                {value.ratio}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Controls */}
                        <div className="space-y-3 pt-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Move className="w-5 h-5 text-blue-400" />
                                Ajustar Imagen
                            </h3>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleZoomOut}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-colors"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                    Alejar
                                </button>
                                <button
                                    onClick={handleZoomIn}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-colors"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                    Acercar
                                </button>
                            </div>

                            <button
                                onClick={handleReset}
                                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 py-2 rounded-xl font-medium transition-colors border border-white/10"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Restablecer Posición
                            </button>

                            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                <p className="text-xs text-gray-400 text-center">
                                    💡 Arrastra la imagen en la vista previa para reposicionarla
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Vista Previa</h3>

                        {/* Info about dragging */}
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                            <p className="text-xs text-blue-300 text-center">
                                🖼️ Arrastra para reposicionar · Usa las flechas para extender la imagen en esa dirección
                            </p>
                        </div>

                        <div className="flex justify-center">
                            {/* Outer container - clips at boundary but shows overflow around frame */}
                            <div
                                ref={containerRef}
                                className="relative overflow-hidden rounded-2xl bg-black/40 cursor-move select-none"
                                style={{
                                    width: containerSize.width + 100,
                                    height: containerSize.height + 100,
                                }}
                                onMouseDown={handleMouseDown}
                            >
                                {/* Content Image - Natural proportions, user drags to position */}
                                <div
                                    className="absolute pointer-events-none"
                                    style={{
                                        left: 50 + containerSize.width / 2,
                                        top: 50 + containerSize.height / 2,
                                        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
                                        transformOrigin: 'center center',
                                    }}
                                >
                                    <img
                                        src={contentUrl}
                                        alt="Content"
                                        className="pointer-events-none"
                                        style={{
                                            width: imageDisplaySize.width,
                                            height: imageDisplaySize.height,
                                        }}
                                        draggable={false}
                                    />
                                </div>

                                {/* Dark overlay with cutout for the frame area */}
                                <div
                                    className="absolute pointer-events-none"
                                    style={{
                                        left: 50,
                                        top: 50,
                                        width: containerSize.width,
                                        height: containerSize.height,
                                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                                        borderRadius: '0.75rem',
                                        zIndex: 10,
                                    }}
                                />

                                {/* Frame border */}
                                <div
                                    className="absolute pointer-events-none"
                                    style={{
                                        left: 50,
                                        top: 50,
                                        width: containerSize.width,
                                        height: containerSize.height,
                                        border: '2px solid rgba(255, 255, 255, 0.3)',
                                        borderRadius: '0.75rem',
                                        zIndex: 12,
                                    }}
                                />

                                {/* Template Image (Overlay - Fixed, inside frame only) */}
                                <div
                                    className="absolute pointer-events-none overflow-hidden"
                                    style={{
                                        left: 50,
                                        top: 50,
                                        width: containerSize.width,
                                        height: containerSize.height,
                                        borderRadius: '0.75rem',
                                        zIndex: 11,
                                    }}
                                >
                                    <img
                                        src={templateUrl}
                                        alt="Template"
                                        className="w-full h-full object-cover"
                                        draggable={false}
                                    />
                                </div>

                                {/* Drag indicator */}
                                {isDragging && (
                                    <div
                                        className="absolute pointer-events-none"
                                        style={{
                                            left: 50,
                                            top: 50,
                                            width: containerSize.width,
                                            height: containerSize.height,
                                            backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                                            border: '2px solid rgba(var(--primary-rgb), 0.5)',
                                            borderRadius: '0.75rem',
                                            zIndex: 13,
                                        }}
                                    />
                                )}

                                {/* Extend arrows — scale image outward from each edge */}
                                {/* Top arrow */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleExtend('up'); }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="absolute flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 group"
                                    style={{
                                        left: 50 + containerSize.width / 2 - 16,
                                        top: 50 - 36,
                                        width: 32,
                                        height: 28,
                                        zIndex: 20,
                                    }}
                                    title="Extender imagen hacia arriba"
                                >
                                    <ChevronUp className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                                </button>

                                {/* Bottom arrow */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleExtend('down'); }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="absolute flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 group"
                                    style={{
                                        left: 50 + containerSize.width / 2 - 16,
                                        top: 50 + containerSize.height + 8,
                                        width: 32,
                                        height: 28,
                                        zIndex: 20,
                                    }}
                                    title="Extender imagen hacia abajo"
                                >
                                    <ChevronDown className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                                </button>

                                {/* Left arrow */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleExtend('left'); }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="absolute flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 group"
                                    style={{
                                        left: 50 - 36,
                                        top: 50 + containerSize.height / 2 - 14,
                                        width: 28,
                                        height: 32,
                                        zIndex: 20,
                                    }}
                                    title="Extender imagen hacia la izquierda"
                                >
                                    <ChevronLeft className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                                </button>

                                {/* Right arrow */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleExtend('right'); }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="absolute flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 group"
                                    style={{
                                        left: 50 + containerSize.width + 8,
                                        top: 50 + containerSize.height / 2 - 14,
                                        width: 28,
                                        height: 32,
                                        zIndex: 20,
                                    }}
                                    title="Extender imagen hacia la derecha"
                                >
                                    <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                                </button>
                            </div>
                        </div>

                        {/* Scale indicator */}
                        <div className="text-center text-sm text-gray-400">
                            Escala: {Math.round(scale * 100)}%
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl font-semibold text-gray-300 bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2"
                    >
                        <Check className="w-5 h-5" />
                        Confirmar y Generar
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
