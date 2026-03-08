'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ZoomIn, ZoomOut, Smartphone, Square, Film, Layers, Maximize, Grid3X3, ArrowRight, Type as TypeIcon, Move } from 'lucide-react';

interface FormatEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (settings: FormatSettings) => void;
    templateUrl: string;
    contentUrl: string;
    targetEmotions?: string[];
}

export interface FormatSettings {
    format: 'story' | 'reel' | 'post' | 'carousel';
    width: number;
    height: number;
    cropX: number;
    cropY: number;
    scale: number;
    // Text overlay
    overlayText?: string;
    overlayFont?: string;
    overlayColor?: string;
    overlaySize?: number;  // font-size in output pixels (e.g. 72)
    overlayX?: number;     // text center X in output pixels
    overlayY?: number;     // text center Y in output pixels
    // Emotion tag for carousel gallery grouping
    targetEmotion?: string;
}

const FONT_OPTIONS = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Playfair Display', label: 'Playfair Display' },
    { value: 'Oswald', label: 'Oswald' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Bebas Neue', label: 'Bebas Neue' },
    { value: 'Roboto Condensed', label: 'Roboto Condensed' },
    { value: 'Lora', label: 'Lora' },
    { value: 'Raleway', label: 'Raleway' },
];

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
    contentUrl,
    targetEmotions = [],
}: FormatEditorModalProps) {
    const [selectedFormat, setSelectedFormat] = useState<'story' | 'reel' | 'post' | 'carousel'>('post');
    const [selectedEmotion, setSelectedEmotion] = useState<string>('');
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [contentImageDimensions, setContentImageDimensions] = useState({ width: 0, height: 0 });
    const [showGrid, setShowGrid] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 400, height: 400 });

    // Text overlay state
    const [overlayText, setOverlayText] = useState('');
    const [overlayFont, setOverlayFont] = useState('Inter');
    const [overlayColor, setOverlayColor] = useState('#ffffff');
    const [overlaySize, setOverlaySize] = useState(72);
    const [showTextPanel, setShowTextPanel] = useState(false);

    // Text position in preview-pixel space (origin = top-left of container)
    const [textPos, setTextPos] = useState({ x: 0, y: 0 });
    const [isTextDragging, setIsTextDragging] = useState(false);
    const [textDragStart, setTextDragStart] = useState({ x: 0, y: 0 });
    const textRef = useRef<HTMLDivElement>(null);

    // Editing mode: 'image' = dragging moves the image, 'text' = dragging moves the text
    const [editMode, setEditMode] = useState<'image' | 'text'>('image');

    // Calculate preview container size based on format — fill the available preview area
    useEffect(() => {
        const format = FORMAT_DIMENSIONS[selectedFormat];
        const aspectRatio = format.width / format.height;
        const maxSize = 460; // max dimension for the preview

        let width, height;
        if (aspectRatio >= 1) {
            width = maxSize;
            height = maxSize / aspectRatio;
        } else {
            height = maxSize;
            width = maxSize * aspectRatio;
        }

        setContainerSize({ width, height });
    }, [selectedFormat]);

    // Load Google Fonts for text overlay preview
    useEffect(() => {
        const families = FONT_OPTIONS.map(f => f.value.replace(/ /g, '+')).join('&family=');
        const linkId = 'format-editor-google-fonts';
        if (!document.getElementById(linkId)) {
            const link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
            document.head.appendChild(link);
        }
    }, []);

    // Load content image dimensions
    useEffect(() => {
        const img = new window.Image();
        img.onload = () => {
            setContentImageDimensions({ width: img.width, height: img.height });
        };
        img.src = contentUrl;
    }, [contentUrl]);

    // Reset position when format changes, auto-fit scale
    useEffect(() => {
        setPosition({ x: 0, y: 0 });
        setScale(1);
        // Reset text to center-bottom of new format
        setTextPos({ x: containerSize.width / 2, y: containerSize.height * 0.85 });
    }, [selectedFormat, containerSize]);

    // Mouse drag handlers (image)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (editMode === 'text') return; // text mode uses its own handler
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
        if (isTextDragging) {
            setTextPos({
                x: e.clientX - textDragStart.x,
                y: e.clientY - textDragStart.y,
            });
        }
    }, [isDragging, dragStart, isTextDragging, textDragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsTextDragging(false);
    }, []);

    // Touch drag handlers (image)
    const handleTouchStart = (e: React.TouchEvent) => {
        if (editMode === 'text') return;
        const touch = e.touches[0];
        setIsDragging(true);
        setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    };

    const handleTouchMove = useCallback((e: TouchEvent) => {
        const touch = e.touches[0];
        if (isDragging) {
            setPosition({
                x: touch.clientX - dragStart.x,
                y: touch.clientY - dragStart.y
            });
        }
        if (isTextDragging) {
            setTextPos({
                x: touch.clientX - textDragStart.x,
                y: touch.clientY - textDragStart.y,
            });
        }
    }, [isDragging, dragStart, isTextDragging, textDragStart]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
        setIsTextDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging || isTextDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, isTextDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

    // Mouse wheel zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        setScale(prev => Math.min(Math.max(prev + delta, 0.5), 3));
    }, []);

    // Image display size: fill the crop frame so there are no gaps
    const getImageDisplaySize = useCallback(() => {
        if (contentImageDimensions.width === 0 || contentImageDimensions.height === 0) {
            return { width: containerSize.width, height: containerSize.height };
        }
        const imgAspect = contentImageDimensions.width / contentImageDimensions.height;
        const frameAspect = containerSize.width / containerSize.height;

        let width, height;
        if (imgAspect > frameAspect) {
            // Image is wider than frame — fit by height so it fills vertically
            height = containerSize.height;
            width = containerSize.height * imgAspect;
        } else {
            // Image is taller — fit by width so it fills horizontally
            width = containerSize.width;
            height = containerSize.width / imgAspect;
        }
        return { width, height };
    }, [contentImageDimensions, containerSize]);

    const imageDisplaySize = getImageDisplaySize();

    // Text drag handler (for the text overlay on the preview)
    const handleTextMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsTextDragging(true);
        setTextDragStart({ x: e.clientX - textPos.x, y: e.clientY - textPos.y });
    }, [textPos]);

    const handleTextTouchStart = useCallback((e: React.TouchEvent) => {
        e.stopPropagation();
        const touch = e.touches[0];
        setIsTextDragging(true);
        setTextDragStart({ x: touch.clientX - textPos.x, y: touch.clientY - textPos.y });
    }, [textPos]);

    const handleConfirm = () => {
        const format = FORMAT_DIMENSIONS[selectedFormat];
        const scaleRatio = format.width / containerSize.width;

        // position.x/y are in screen-pixel space (CSS translate is unaffected by scale),
        // so we only need scaleRatio to map preview-px → output-px. No /scale.
        const cropX = Math.round(-position.x * scaleRatio);
        const cropY = Math.round(-position.y * scaleRatio);

        console.log('[FormatEditor] Confirm:', {
            format: selectedFormat,
            containerSize,
            position,
            scale,
            scaleRatio,
            cropX,
            cropY,
        });

        onConfirm({
            format: selectedFormat,
            width: format.width,
            height: format.height,
            cropX,
            cropY,
            scale,
            // Text overlay (only if user typed something)
            ...(overlayText.trim() ? {
                overlayText: overlayText.trim(),
                overlayFont,
                overlayColor,
                overlaySize,
                overlayX: Math.round(textPos.x * scaleRatio),
                overlayY: Math.round(textPos.y * scaleRatio),
            } : {}),
            // Emotion tag for carousel images
            ...(selectedFormat === 'carousel' && selectedEmotion ? { targetEmotion: selectedEmotion } : {}),
        });
    };

    const handleFitToFrame = () => {
        setPosition({ x: 0, y: 0 });
        setScale(1);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-[#262626] rounded-xl overflow-hidden shadow-2xl w-full flex flex-col"
                    style={{ maxWidth: '820px', maxHeight: '92vh' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* IG-style header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-base font-semibold text-white">
                            Recortar
                        </h2>
                        <button
                            onClick={handleConfirm}
                            className="text-[#ee3ec9] hover:text-[#d635b4] font-semibold text-sm transition-colors flex items-center gap-1"
                        >
                            Generar
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
                        {/* Main preview area */}
                        <div className="flex-1 flex flex-col items-center bg-[#262626] relative min-h-0 overflow-hidden">
                            {/* Crop area */}
                            <div
                                className="relative flex items-center justify-center"
                                style={{
                                    width: '100%',
                                    maxWidth: containerSize.width + 40,
                                    padding: '20px',
                                }}
                            >
                                <div
                                    ref={containerRef}
                                    className={`relative overflow-hidden select-none bg-black ${editMode === 'text' ? 'cursor-default' : 'cursor-move'}`}
                                    style={{
                                        width: containerSize.width,
                                        height: containerSize.height,
                                        borderRadius: '2px',
                                    }}
                                    onMouseDown={handleMouseDown}
                                    onTouchStart={handleTouchStart}
                                    onWheel={handleWheel}
                                >
                                    {/* Content image — draggable & zoomable */}
                                    <div
                                        className="absolute pointer-events-none"
                                        style={{
                                            left: containerSize.width / 2,
                                            top: containerSize.height / 2,
                                            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
                                            transformOrigin: 'center center',
                                            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                                        }}
                                    >
                                        <img
                                            src={contentUrl}
                                            alt="Content"
                                            className="pointer-events-none max-w-none"
                                            style={{
                                                width: imageDisplaySize.width,
                                                height: imageDisplaySize.height,
                                            }}
                                            draggable={false}
                                        />
                                    </div>

                                    {/* Template overlay (inside frame only) */}
                                    <div
                                        className="absolute inset-0 pointer-events-none overflow-hidden"
                                        style={{ zIndex: 5 }}
                                    >
                                        <img
                                            src={templateUrl}
                                            alt="Template"
                                            className="w-full h-full object-cover"
                                            draggable={false}
                                        />
                                    </div>

                                    {/* Text overlay preview — draggable */}
                                    {overlayText.trim() && (
                                        <div
                                            ref={textRef}
                                            className={`absolute select-none ${editMode === 'text' ? 'cursor-grab' : 'pointer-events-none'} ${isTextDragging ? '!cursor-grabbing' : ''}`}
                                            style={{
                                                zIndex: 5,
                                                left: textPos.x,
                                                top: textPos.y,
                                                transform: 'translate(-50%, -50%)',
                                                maxWidth: '84%',
                                                transition: isTextDragging ? 'none' : 'left 0.1s ease-out, top 0.1s ease-out',
                                            }}
                                            onMouseDown={editMode === 'text' ? handleTextMouseDown : undefined}
                                            onTouchStart={editMode === 'text' ? handleTextTouchStart : undefined}
                                        >
                                            <p
                                                style={{
                                                    fontFamily: `'${overlayFont}', sans-serif`,
                                                    fontSize: `${overlaySize * (containerSize.width / FORMAT_DIMENSIONS[selectedFormat].width)}px`,
                                                    color: overlayColor,
                                                    textAlign: 'center',
                                                    lineHeight: 1.15,
                                                    wordBreak: 'break-word',
                                                    textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)',
                                                    margin: 0,
                                                    fontWeight: 700,
                                                    userSelect: 'none',
                                                }}
                                            >
                                                {overlayText}
                                            </p>
                                            {/* Selection ring when in text edit mode */}
                                            {editMode === 'text' && (
                                                <div className="absolute -inset-2 border border-dashed border-[#ee3ec9]/60 rounded pointer-events-none" />
                                            )}
                                        </div>
                                    )}

                                    {/* Rule of thirds grid overlay */}
                                    {showGrid && (
                                        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 6 }}>
                                            {/* Vertical lines */}
                                            <div className="absolute top-0 bottom-0" style={{ left: '33.33%', width: '1px', backgroundColor: 'rgba(255,255,255,0.25)' }} />
                                            <div className="absolute top-0 bottom-0" style={{ left: '66.66%', width: '1px', backgroundColor: 'rgba(255,255,255,0.25)' }} />
                                            {/* Horizontal lines */}
                                            <div className="absolute left-0 right-0" style={{ top: '33.33%', height: '1px', backgroundColor: 'rgba(255,255,255,0.25)' }} />
                                            <div className="absolute left-0 right-0" style={{ top: '66.66%', height: '1px', backgroundColor: 'rgba(255,255,255,0.25)' }} />
                                        </div>
                                    )}

                                    {/* Dragging highlight */}
                                    {(isDragging || isTextDragging) && (
                                        <div
                                            className="absolute inset-0 pointer-events-none"
                                            style={{
                                                border: `1.5px solid ${isTextDragging ? 'rgba(238,62,201,0.7)' : 'rgba(238,62,201,0.5)'}`,
                                                zIndex: 7,
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Bottom toolbar — format + zoom (IG style) */}
                            <div className="w-full px-4 py-3 flex items-center justify-between bg-[#262626] border-t border-white/5">
                                {/* Left: format selector */}
                                <div className="flex items-center gap-1">
                                    {Object.entries(FORMAT_DIMENSIONS).map(([key, value]) => {
                                        const Icon = value.icon;
                                        const isSelected = selectedFormat === key;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setSelectedFormat(key as typeof selectedFormat)}
                                                className={`
                                                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                                    ${isSelected
                                                        ? 'bg-white/15 text-white'
                                                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                                    }
                                                `}
                                                title={`${value.label} (${value.ratio})`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="hidden sm:inline">{value.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Right: tools */}
                                <div className="flex items-center gap-1">
                                    {/* Text mode toggle */}
                                    <button
                                        onClick={() => {
                                            const next = editMode === 'text' ? 'image' : 'text';
                                            setEditMode(next);
                                            if (next === 'text' && !showTextPanel) setShowTextPanel(true);
                                        }}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            editMode === 'text'
                                                ? 'bg-[#ee3ec9]/20 text-[#ee3ec9] border border-[#ee3ec9]/30'
                                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                                        }`}
                                        title={editMode === 'text' ? 'Modo Texto activo — arrastrá el texto' : 'Activar Modo Texto'}
                                    >
                                        <TypeIcon className="w-4 h-4" />
                                        <span className="hidden sm:inline">Texto</span>
                                    </button>
                                    <button
                                        onClick={() => setShowGrid(!showGrid)}
                                        className={`p-2 rounded-lg transition-colors ${showGrid ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                                        title="Cuadrícula"
                                    >
                                        <Grid3X3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleFitToFrame}
                                        className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
                                        title="Ajustar al marco"
                                    >
                                        <Maximize className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Zoom slider */}
                            <div className="w-full px-6 py-3 flex items-center gap-3 bg-[#262626]">
                                <ZoomOut className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <input
                                    type="range"
                                    min="50"
                                    max="300"
                                    value={Math.round(scale * 100)}
                                    onChange={(e) => setScale(Number(e.target.value) / 100)}
                                    className="ig-zoom-slider flex-1 h-1 rounded-full appearance-none cursor-pointer"
                                    style={{
                                        background: `linear-gradient(to right, #ee3ec9 0%, #ee3ec9 ${((scale - 0.5) / 2.5) * 100}%, rgba(255,255,255,0.15) ${((scale - 0.5) / 2.5) * 100}%, rgba(255,255,255,0.15) 100%)`,
                                    }}
                                />
                                <ZoomIn className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <span className="text-xs text-gray-500 w-10 text-right tabular-nums">
                                    {Math.round(scale * 100)}%
                                </span>
                            </div>
                        </div>

                        {/* Right sidebar — format + text overlay */}
                        <div className="w-full lg:w-64 bg-[#262626] border-t lg:border-t-0 lg:border-l border-white/10 p-4 space-y-4 overflow-y-auto flex-shrink-0">
                            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Formato</h3>
                            <div className="space-y-1.5">
                                {Object.entries(FORMAT_DIMENSIONS).map(([key, value]) => {
                                    const Icon = value.icon;
                                    const isSelected = selectedFormat === key;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedFormat(key as typeof selectedFormat)}
                                            className={`
                                                w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left
                                                ${isSelected
                                                    ? 'bg-[#ee3ec9]/15 border border-[#ee3ec9]/30'
                                                    : 'hover:bg-white/5 border border-transparent'
                                                }
                                            `}
                                        >
                                            <Icon className={`w-4 h-4 ${isSelected ? 'text-[#ee3ec9]' : 'text-gray-500'}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                                    {value.label}
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    {value.width}×{value.height} · {value.ratio}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <Check className="w-4 h-4 text-[#ee3ec9] flex-shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* ── Emoción Objetivo Section (carousel only) ── */}
                            {selectedFormat === 'carousel' && targetEmotions.length > 0 && (
                                <div className="border-t border-white/10 pt-4">
                                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">Emoción Objetivo</h3>
                                    <p className="text-xs text-gray-500 mb-3">Etiqueta esta imagen de carrusel con una emoción para organizarla en la galería.</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {targetEmotions.map((emotion) => (
                                            <button
                                                key={emotion}
                                                type="button"
                                                onClick={() => setSelectedEmotion(selectedEmotion === emotion ? '' : emotion)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                                                    selectedEmotion === emotion
                                                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-gray-300'
                                                }`}
                                            >
                                                {emotion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Text Overlay Section ── */}
                            <div className="border-t border-white/10 pt-4">
                                <button
                                    onClick={() => {
                                        const next = !showTextPanel;
                                        setShowTextPanel(next);
                                        if (next) setEditMode('text');
                                        else setEditMode('image');
                                    }}
                                    className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg transition-all ${
                                        showTextPanel
                                            ? 'bg-[#ee3ec9]/10 border border-[#ee3ec9]/20'
                                            : 'hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <TypeIcon className={`w-4 h-4 ${showTextPanel ? 'text-[#ee3ec9]' : 'text-gray-400'}`} />
                                        <span className={`text-sm font-semibold uppercase tracking-wider ${showTextPanel ? 'text-[#ee3ec9]' : 'text-gray-300'}`}>
                                            Texto
                                        </span>
                                        {overlayText.trim() && !showTextPanel && (
                                            <span className="text-[10px] bg-[#ee3ec9]/20 text-[#ee3ec9] px-1.5 py-0.5 rounded-full font-medium">
                                                activo
                                            </span>
                                        )}
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        showTextPanel ? 'border-[#ee3ec9] bg-[#ee3ec9]' : 'border-gray-600'
                                    }`}>
                                        {showTextPanel && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                </button>

                                {showTextPanel && (
                                    <div className="mt-3 space-y-3">
                                        {/* Text input */}
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">Contenido</label>
                                            <textarea
                                                value={overlayText}
                                                onChange={(e) => setOverlayText(e.target.value)}
                                                placeholder="Escribí tu texto..."
                                                rows={2}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#ee3ec9]/50 transition-colors"
                                            />
                                        </div>

                                        {/* Font selector */}
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">Fuente</label>
                                            <select
                                                value={overlayFont}
                                                onChange={(e) => setOverlayFont(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ee3ec9]/50 transition-colors appearance-none cursor-pointer"
                                                style={{ fontFamily: `'${overlayFont}', sans-serif` }}
                                            >
                                                {FONT_OPTIONS.map(f => (
                                                    <option key={f.value} value={f.value} style={{ fontFamily: `'${f.value}', sans-serif`, background: '#262626' }}>
                                                        {f.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Color + Size row */}
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-500 mb-1 block">Color</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={overlayColor}
                                                        onChange={(e) => setOverlayColor(e.target.value)}
                                                        className="w-8 h-8 rounded border border-white/10 cursor-pointer bg-transparent"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={overlayColor}
                                                        onChange={(e) => setOverlayColor(e.target.value)}
                                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-400 font-mono focus:outline-none focus:border-[#ee3ec9]/50"
                                                    />
                                                </div>
                                            </div>
                                            <div className="w-20">
                                                <label className="text-xs text-gray-500 mb-1 block">Tamaño</label>
                                                <input
                                                    type="number"
                                                    value={overlaySize}
                                                    onChange={(e) => setOverlaySize(Math.max(12, Math.min(200, Number(e.target.value))))}
                                                    min={12}
                                                    max={200}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-[#ee3ec9]/50"
                                                />
                                            </div>
                                        </div>

                                        {/* Font size slider */}
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">Tamaño: {overlaySize}px</label>
                                            <input
                                                type="range"
                                                min="20"
                                                max="180"
                                                value={overlaySize}
                                                onChange={(e) => setOverlaySize(Number(e.target.value))}
                                                className="ig-zoom-slider w-full h-1 rounded-full appearance-none cursor-pointer"
                                                style={{
                                                    background: `linear-gradient(to right, #ee3ec9 0%, #ee3ec9 ${((overlaySize - 20) / 160) * 100}%, rgba(255,255,255,0.15) ${((overlaySize - 20) / 160) * 100}%, rgba(255,255,255,0.15) 100%)`,
                                                }}
                                            />
                                        </div>

                                        {/* Drag hint */}
                                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/5 rounded-lg px-3 py-2">
                                            <Move className="w-3.5 h-3.5 text-[#ee3ec9]" />
                                            <span>Arrastrá el texto en la vista previa para posicionarlo</span>
                                        </div>

                                    </div>
                                )}
                            </div>

                            {/* Tips */}
                            <div className="rounded-lg bg-white/5 p-3 space-y-2">
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Arrastrá la imagen para reposicionarla.
                                </p>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Usá la rueda del mouse o el slider para hacer zoom.
                                </p>
                            </div>

                            {/* Confirm button */}
                            <button
                                onClick={handleConfirm}
                                className="w-full py-2.5 rounded-lg font-semibold text-white bg-[#ee3ec9] hover:bg-[#d635b4] transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <Check className="w-4 h-4" />
                                Confirmar y Generar
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
