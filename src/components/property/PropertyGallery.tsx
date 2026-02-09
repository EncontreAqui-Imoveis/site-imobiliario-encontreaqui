'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, Maximize2, Play, Grid } from 'lucide-react'

interface PropertyGalleryProps {
    images: string[]
    title: string
    videoUrl?: string
}

export default function PropertyGallery({ images, title, videoUrl }: PropertyGalleryProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [photoIndex, setPhotoIndex] = useState(0)
    const [showVideo, setShowVideo] = useState(false)

    // Ensure we have valid images
    const validImages = images?.filter(Boolean) || []

    if (validImages.length === 0) {
        return (
            <div className="bg-gray-100 aspect-[16/9] lg:aspect-[21/9] flex items-center justify-center rounded-xl overflow-hidden">
                <div className="flex flex-col items-center text-gray-400">
                    <Grid className="w-12 h-12 mb-2" />
                    <span className="font-medium">Sem fotos disponíveis</span>
                </div>
            </div>
        )
    }

    const openLightbox = (index: number) => {
        setPhotoIndex(index)
        setIsOpen(true)
    }

    const nextPhoto = () => {
        setPhotoIndex((prev) => (prev + 1) % validImages.length)
    }

    const prevPhoto = () => {
        setPhotoIndex((prev) => (prev - 1 + validImages.length) % validImages.length)
    }

    return (
        <div className="relative">
            {/* Desktop Bento Grid */}
            <div className="hidden lg:grid grid-cols-4 grid-rows-2 gap-2 h-[500px] rounded-2xl overflow-hidden">
                {/* Main Image (Left, spans 2 rows, 2 cols) */}
                <div
                    className="col-span-2 row-span-2 relative cursor-pointer group"
                    onClick={() => openLightbox(0)}
                >
                    <Image
                        src={validImages[0]}
                        alt={`${title} - Principal`}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                        sizes="(max-width: 1280px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>

                {/* Secondary Images (Right, 2x2) */}
                {validImages.slice(1, 5).map((img, idx) => (
                    <div
                        key={idx}
                        className="relative cursor-pointer group overflow-hidden"
                        onClick={() => openLightbox(idx + 1)}
                    >
                        <Image
                            src={img}
                            alt={`${title} - ${idx + 2}`}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="25vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                        {/* Overlay for "Show More" on the last grid item if there are more images */}
                        {idx === 3 && validImages.length > 5 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                                <span className="text-white font-bold text-lg flex items-center gap-2">
                                    <Grid className="w-5 h-5" />
                                    +{validImages.length - 5}
                                </span>
                            </div>
                        )}
                    </div>
                ))}

                {/* Fallback if less than 5 images, fill empty slots with placeholders or adjust grid dynamically? 
                    For simplicity, we assume placeholders if needed or just let them be empty div if really few images. 
                    Better approach: specific layouts for 1, 2, 3, 4 images. 
                    For now, focusing on the 5+ case as it's the premium standard.
                */}
            </div>

            {/* Mobile/Tablet Carousel */}
            <div className="lg:hidden relative h-[40vh] bg-gray-900 group">
                <Image
                    src={validImages[photoIndex]}
                    alt={`${title} - ${photoIndex + 1}`}
                    fill
                    className="object-contain"
                    priority
                />

                <div className="absolute inset-0 flex items-center justify-between p-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                        className="p-2 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm transition-colors"
                        aria-label="Foto anterior"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                        className="p-2 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm transition-colors"
                        aria-label="Próxima foto"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-white text-xs font-semibold">
                    {photoIndex + 1} / {validImages.length}
                </div>
            </div>

            {/* "Show All" Button (Desktop) */}
            <button
                onClick={() => setIsOpen(true)}
                className="hidden lg:flex absolute bottom-4 right-4 items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg text-gray-900 font-semibold hover:bg-gray-50 transition-transform active:scale-95"
            >
                <Grid className="w-4 h-4" />
                Ver todas as fotos ({validImages.length})
            </button>

            {/* Lightbox Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between p-4 text-white z-50 bg-gradient-to-b from-black/80 to-transparent">
                        <span className="font-medium text-lg">{photoIndex + 1} / {validImages.length}</span>
                        <div className="flex items-center gap-4">
                            {videoUrl && (
                                <button
                                    onClick={() => setShowVideo(true)}
                                    className="flex items-center gap-2 hover:text-primary-400 transition-colors"
                                >
                                    <Play className="w-5 h-5" />
                                    Vídeo
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                aria-label="Fechar galeria"
                            >
                                <X className="w-8 h-8" />
                            </button>
                        </div>
                    </div>

                    {/* Main View */}
                    <div className="flex-1 relative flex items-center justify-center p-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                            className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                            aria-label="Foto anterior"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>

                        <div className="relative w-full h-full max-w-7xl mx-auto">
                            <Image
                                src={validImages[photoIndex]}
                                alt="Fullscreen view"
                                fill
                                className="object-contain"
                                quality={100}
                                priority
                            />
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                            className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                            aria-label="Próxima foto"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>
                    </div>

                    {/* Thumbnails Strip */}
                    <div className="h-24 bg-black/90 p-4 flex items-center gap-2 overflow-x-auto">
                        {validImages.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setPhotoIndex(idx)}
                                className={`relative w-20 h-16 flex-shrink-0 rounded-md overflow-hidden transition-all ${idx === photoIndex ? 'ring-2 ring-primary-500 opacity-100' : 'opacity-50 hover:opacity-80'
                                    }`}
                            >
                                <Image
                                    src={img}
                                    alt={`Thumbnail ${idx}`}
                                    fill
                                    className="object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Video Modal */}
            {showVideo && videoUrl && (
                <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4">
                    <button
                        onClick={() => setShowVideo(false)}
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        aria-label="Fechar vídeo"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
                        <video
                            controls
                            autoPlay
                            className="w-full h-full"
                            poster={validImages[0]}
                        >
                            <source src={videoUrl} type="video/mp4" />
                            Seu navegador não suporta vídeos.
                        </video>
                    </div>
                </div>
            )}
        </div>
    )
}
