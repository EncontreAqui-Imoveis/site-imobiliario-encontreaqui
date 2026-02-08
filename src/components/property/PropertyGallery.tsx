'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, Maximize2, Play } from 'lucide-react'

interface PropertyGalleryProps {
    images: string[]
    title: string
    videoUrl?: string
}

export default function PropertyGallery({ images, title, videoUrl }: PropertyGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showVideo, setShowVideo] = useState(false)

    const hasMultipleImages = images.length > 1

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    }

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }

    if (!images.length) {
        return (
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">Sem imagens disponíveis</span>
            </div>
        )
    }

    return (
        <>
            {/* Main Gallery - Full width with image filling */}
            <div className="relative bg-gray-900 overflow-hidden">
                <div className="relative w-full h-[50vh] md:h-[60vh] lg:h-[70vh]">
                    {/* Blurred Background for Fill Effect */}
                    <div className="absolute inset-0">
                        <Image
                            src={images[currentIndex]}
                            alt="Background"
                            fill
                            sizes="100vw"
                            className="object-cover blur-3xl opacity-50 scale-110"
                            priority
                        />
                    </div>

                    {/* Main Image - Contained */}
                    <Image
                        src={images[currentIndex]}
                        alt={`${title} - Imagem ${currentIndex + 1}`}
                        fill
                        sizes="100vw"
                        className="object-contain z-10"
                        priority
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                    {/* Navigation Arrows */}
                    {hasMultipleImages && (
                        <>
                            <button
                                onClick={goToPrevious}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-20"
                                aria-label="Imagem anterior"
                            >
                                <ChevronLeft className="w-6 h-6 text-gray-800" />
                            </button>
                            <button
                                onClick={goToNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-20"
                                aria-label="Próxima imagem"
                            >
                                <ChevronRight className="w-6 h-6 text-gray-800" />
                            </button>
                        </>
                    )}

                    {/* Counter & Actions - Positioned at bottom */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-20">
                        {/* Counter */}
                        <div className="px-4 py-2 bg-black/60 backdrop-blur-sm rounded-lg text-white text-sm font-medium">
                            {currentIndex + 1} / {images.length}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {videoUrl && (
                                <button
                                    onClick={() => setShowVideo(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white rounded-lg text-gray-800 font-medium transition-all"
                                >
                                    <Play className="w-4 h-4" />
                                    Ver vídeo
                                </button>
                            )}
                            <button
                                onClick={() => setIsFullscreen(true)}
                                className="w-10 h-10 bg-white/90 hover:bg-white rounded-lg flex items-center justify-center transition-all"
                                aria-label="Tela cheia"
                            >
                                <Maximize2 className="w-5 h-5 text-gray-800" />
                            </button>
                        </div>
                    </div>

                    {/* Thumbnails Overlay - Inside image at bottom */}
                    {hasMultipleImages && (
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
                            <div className="flex gap-2 p-2 bg-black/40 backdrop-blur-sm rounded-xl">
                                {images.slice(0, 6).map((image, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all ${idx === currentIndex
                                            ? 'ring-2 ring-white shadow-lg scale-105'
                                            : 'opacity-70 hover:opacity-100'
                                            }`}
                                    >
                                        <Image
                                            src={image}
                                            alt={`Thumbnail ${idx + 1}`}
                                            fill
                                            sizes="64px"
                                            className="object-cover"
                                        />
                                    </button>
                                ))}
                                {images.length > 6 && (
                                    <button
                                        onClick={() => setIsFullscreen(true)}
                                        className="flex-shrink-0 w-16 h-12 rounded-lg bg-black/50 text-white text-sm font-medium flex items-center justify-center hover:bg-black/70 transition-all"
                                    >
                                        +{images.length - 6}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Fullscreen Modal */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 z-50 bg-black flex items-center justify-center"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsFullscreen(false)
                        }
                    }}
                >
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all z-10"
                        aria-label="Fechar"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>

                    <div
                        className="relative w-full h-full flex items-center justify-center p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setIsFullscreen(false)
                            }
                        }}
                    >
                        <Image
                            src={images[currentIndex]}
                            alt={`${title} - Imagem ${currentIndex + 1}`}
                            fill
                            sizes="100vw"
                            className="object-contain"
                        />
                    </div>

                    {hasMultipleImages && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
                                aria-label="Imagem anterior"
                            >
                                <ChevronLeft className="w-8 h-8 text-white" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
                                aria-label="Próxima imagem"
                            >
                                <ChevronRight className="w-8 h-8 text-white" />
                            </button>
                        </>
                    )}

                    {/* Fullscreen Thumbnails */}
                    {hasMultipleImages && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                            <div className="flex gap-2 p-2 bg-white/10 backdrop-blur-sm rounded-xl">
                                {images.map((image, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                                        className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all ${idx === currentIndex
                                            ? 'ring-2 ring-white'
                                            : 'opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <Image
                                            src={image}
                                            alt={`Thumbnail ${idx + 1}`}
                                            fill
                                            sizes="64px"
                                            className="object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Fullscreen Counter */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 rounded-lg text-white text-sm">
                        {currentIndex + 1} / {images.length}
                    </div>
                </div>
            )}

            {/* Video Modal */}
            {showVideo && videoUrl && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowVideo(false)
                        }
                    }}
                >
                    <button
                        onClick={() => setShowVideo(false)}
                        className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all z-10"
                        aria-label="Fechar vídeo"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>

                    <video
                        src={videoUrl}
                        controls
                        autoPlay
                        className="max-w-full max-h-full rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    )
}
