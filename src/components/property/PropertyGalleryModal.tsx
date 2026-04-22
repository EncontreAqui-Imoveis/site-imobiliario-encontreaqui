'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import PhotoWatermark from '@/components/property/PhotoWatermark'

interface PropertyGalleryModalProps {
    images: string[]
    initialIndex?: number
    isOpen: boolean
    onClose: () => void
}

export default function PropertyGalleryModal({ images, initialIndex = 0, isOpen, onClose }: PropertyGalleryModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex)

    useEffect(() => {
        setCurrentIndex(initialIndex)
    }, [initialIndex])

    const goNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length)
    }, [images.length])

    const goPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    }, [images.length])

    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowRight') goNext()
            if (e.key === 'ArrowLeft') goPrev()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose, goNext, goPrev])

    if (!isOpen || images.length === 0) return null

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={onClose}>
            <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900 transition-colors hover:bg-white"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Counter */}
                <div className="absolute top-4 left-4 z-10 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-slate-900">
                    {currentIndex + 1} / {images.length}
                </div>

                {/* Image */}
                <div className="relative w-full h-full max-w-5xl max-h-[85vh] mx-4">
                    <Image
                        src={images[currentIndex]}
                        alt={`Foto ${currentIndex + 1}`}
                        fill
                        className="object-contain"
                        sizes="100vw"
                    />
                    <PhotoWatermark />
                </div>

                {/* Navigation */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={goPrev}
                            className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 transition-colors hover:bg-white"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={goNext}
                            className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 transition-colors hover:bg-white"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </>
                )}

                {/* Thumbnails */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto p-2">
                        {images.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={`w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${i === currentIndex ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-75'
                                    }`}
                            >
                                <Image src={img} alt="" width={64} height={48} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
