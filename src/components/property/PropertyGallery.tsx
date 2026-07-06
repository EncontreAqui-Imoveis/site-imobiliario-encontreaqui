'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Grid } from 'lucide-react'
import FavoriteButton from '@/components/property/FavoriteButton'
import PhotoWatermark from '@/components/property/PhotoWatermark'
import PropertyGalleryModal from '@/components/property/PropertyGalleryModal'

interface PropertyGalleryProps {
    images: string[]
    title: string
    videoUrl?: string
    propertyId?: number
}

export default function PropertyGallery({ images, title, videoUrl, propertyId }: PropertyGalleryProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [photoIndex, setPhotoIndex] = useState(0)

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

    useEffect(() => {
        if (!isOpen) return
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [isOpen])

    return (
        <div className="relative">
            {videoUrl ? (
                <div className="space-y-2">
                    {/* Top: Premium Video Player */}
                    <div className="relative aspect-[16/9] lg:aspect-[21/9] w-full rounded-2xl overflow-hidden bg-black shadow-lg">
                        <video
                            controls
                            className="w-full h-full object-cover"
                            poster={validImages[0]}
                        >
                            <source src={videoUrl} type="video/mp4" />
                            Seu navegador não suporta vídeos.
                        </video>
                        {propertyId && (
                            <div className="absolute top-5 right-5 z-10 p-1">
                                <FavoriteButton propertyId={propertyId} size="md" />
                            </div>
                        )}
                    </div>

                    {/* Bottom: 4 Thumbnails (Grid 2x2, Card 2, Card 3, Card 4 with "+N fotos") */}
                    <div className="grid grid-cols-4 gap-2 h-[80px] sm:h-[120px] lg:h-[150px]">
                        {/* Thumbnail 1: 2x2 grid representing first 4 images */}
                        <div
                            className="relative rounded-xl overflow-hidden cursor-pointer grid grid-cols-2 grid-rows-2 gap-1 group h-full bg-slate-100 border border-gray-100"
                            onClick={() => openLightbox(0)}
                        >
                            {validImages.slice(0, 4).map((img, index) => (
                                <div key={index} className="relative w-full h-full">
                                    <Image
                                        src={img}
                                        alt={`${title} - Mini-foto ${index + 1}`}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="10vw"
                                    />
                                </div>
                            ))}
                            {Array.from({ length: Math.max(0, 4 - validImages.length) }).map((_, index) => (
                                <div key={`empty-${index}`} className="bg-gray-100 w-full h-full" />
                            ))}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>

                        {/* Thumbnail 2: Image 5 */}
                        {validImages.length > 4 ? (
                            <div
                                className="relative rounded-xl overflow-hidden cursor-pointer group h-full border border-gray-100"
                                onClick={() => openLightbox(4)}
                            >
                                <Image
                                    src={validImages[4]}
                                    alt={`${title} - Foto 5`}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    sizes="15vw"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </div>
                        ) : (
                            <div className="bg-gray-100 rounded-xl h-full flex items-center justify-center text-gray-300">
                                <Grid className="w-5 h-5" />
                            </div>
                        )}

                        {/* Thumbnail 3: Image 6 */}
                        {validImages.length > 5 ? (
                            <div
                                className="relative rounded-xl overflow-hidden cursor-pointer group h-full border border-gray-100"
                                onClick={() => openLightbox(5)}
                            >
                                <Image
                                    src={validImages[5]}
                                    alt={`${title} - Foto 6`}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    sizes="15vw"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </div>
                        ) : (
                            <div className="bg-gray-100 rounded-xl h-full flex items-center justify-center text-gray-300">
                                <Grid className="w-5 h-5" />
                            </div>
                        )}

                        {/* Thumbnail 4: Image 7 + overlay "+N fotos" */}
                        {validImages.length > 6 ? (
                            <div
                                className="relative rounded-xl overflow-hidden cursor-pointer group h-full border border-gray-100"
                                onClick={() => openLightbox(6)}
                            >
                                <Image
                                    src={validImages[6]}
                                    alt={`${title} - Foto 7`}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    sizes="15vw"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                {validImages.length > 7 && (
                                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center group-hover:bg-black/65 transition-colors">
                                        <span className="text-white font-bold text-xs sm:text-base flex items-center gap-1.5">
                                            <Grid className="w-4 h-4" />
                                            +{validImages.length - 7} fotos
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-gray-100 rounded-xl h-full flex items-center justify-center text-gray-300">
                                <Grid className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
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
                    </div>

                    {/* Mobile/Tablet — fundo desfocado; sem `priority` duplicado (evita aviso de preload no Chrome) */}
                    <div
                        className="lg:hidden relative h-[40vh] overflow-hidden bg-slate-950 group cursor-pointer"
                        onClick={() => openLightbox(photoIndex)}
                    >
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
                        onClick={() => openLightbox(0)}
                        className="absolute bottom-4 right-4 hidden items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-gray-900 shadow-lg transition-transform active:scale-95 hover:bg-gray-50 lg:flex"
                    >
                        <Grid className="w-4 h-4" />
                        Ver todas as fotos ({validImages.length})
                    </button>
                </>
            )}

            {/* Fullscreen Modal */}
            <PropertyGalleryModal
                images={validImages}
                initialIndex={photoIndex}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </div>
    )
}
