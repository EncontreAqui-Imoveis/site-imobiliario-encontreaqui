'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, Play, Grid } from 'lucide-react'
import FavoriteButton from '@/components/property/FavoriteButton'
import PhotoWatermark from '@/components/property/PhotoWatermark'

interface PropertyGalleryProps {
    images: string[]
    title: string
    videoUrl?: string
    propertyId?: number
}

export default function PropertyGallery({ images, title, videoUrl, propertyId }: PropertyGalleryProps) {
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
                        sizes="(max-width: 1280px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <PhotoWatermark />
                    {propertyId && (
                        <div className="absolute top-5 right-5 z-10 p-1">
                            <FavoriteButton propertyId={propertyId} size="md" />
                        </div>
                    )}
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
                        {/* Última miniatura: canto inferior direito do bloco partilha o botão «Ver todas as fotos» — marca no topo */}
                        <PhotoWatermark compact placement={idx === 3 ? 'top' : 'bottom'} />
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

            {/* Mobile/Tablet — fundo desfocado; sem `priority` duplicado (evita aviso de preload no Chrome) */}
            <div className="lg:hidden relative h-[40vh] overflow-hidden bg-slate-950 group">
                <div className="pointer-events-none absolute inset-0 scale-110" aria-hidden>
                    <Image
                        src={validImages[photoIndex]}
                        alt=""
                        fill
                        className="object-cover opacity-40 blur-2xl saturate-125"
                        sizes="100vw"
                    />
                </div>
                <Image
                    src={validImages[photoIndex]}
                    alt={`${title} - ${photoIndex + 1}`}
                    fill
                    className="relative z-[1] object-contain"
                    sizes="100vw"
                />

                <div className="absolute inset-0 z-[2] flex items-center justify-between p-2">
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

                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-20 bg-gradient-to-t from-black/75 to-transparent" aria-hidden />
                <div className="absolute bottom-4 right-4 z-[3] rounded-lg bg-black/65 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm ring-1 ring-white/10">
                    {photoIndex + 1} / {validImages.length}
                </div>
                <PhotoWatermark />
                {propertyId && (
                    <div className="absolute top-5 right-5 z-[3] p-1">
                        <FavoriteButton propertyId={propertyId} size="md" />
                    </div>
                )}
            </div>

            {/* "Show All" Button (Desktop) */}
            <button
                onClick={() => setIsOpen(true)}
                className="absolute bottom-4 right-4 hidden items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-gray-900 shadow-lg transition-transform active:scale-95 hover:bg-gray-50 lg:flex"
            >
                <Grid className="w-4 h-4" />
                Ver todas as fotos ({validImages.length})
            </button>

            {/* Lightbox Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[60] bg-black flex flex-col">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between p-4 text-white z-[61] bg-gradient-to-b from-black/80 to-transparent">
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
                                className="rounded-full p-2 transition-colors hover:bg-white/10"
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
                            className="absolute left-4 z-10 rounded-full bg-white/90 p-3 text-slate-900 transition-colors hover:bg-white"
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
                            />
                            <PhotoWatermark />
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                            className="absolute right-4 z-10 rounded-full bg-white/90 p-3 text-slate-900 transition-colors hover:bg-white"
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
                        className="absolute right-6 top-6 rounded-full bg-white/90 p-2 text-slate-900 transition-colors hover:bg-white"
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
