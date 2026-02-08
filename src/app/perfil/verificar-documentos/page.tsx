'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
    Camera,
    Image as ImageIcon,
    X,
    Check,
    CheckCircle,
    ArrowLeft,
    ArrowRight,
    AlertCircle,
    Upload,
    User
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/lib/api'

// Steps configuration
const STEPS = [
    {
        id: 'creci-front',
        title: 'Dados do CRECI',
        description: 'Tire uma foto da frente do seu CRECI mostrando seus dados.',
        icon: '📄',
    },
    {
        id: 'creci-back',
        title: 'Verso do CRECI',
        description: 'Tire uma foto do verso do seu CRECI.',
        icon: '🔄',
    },
    {
        id: 'selfie',
        title: 'Selfie com Documento',
        description: 'Segure o CRECI próximo ao rosto, garantindo que ambos estejam nítidos.',
        icon: '🤳',
    },
]

export default function VerificarDocumentosPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()

    const [isLoading, setIsLoading] = useState(true)
    const [currentStep, setCurrentStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Images state
    const [images, setImages] = useState<{
        creciFront: File | null
        creciBack: File | null
        selfie: File | null
    }>({
        creciFront: null,
        creciBack: null,
        selfie: null,
    })

    // Preview URLs
    const [previews, setPreviews] = useState<{
        creciFront: string | null
        creciBack: string | null
        selfie: string | null
    }>({
        creciFront: null,
        creciBack: null,
        selfie: null,
    })

    // Input refs
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const galleryInputRef = useRef<HTMLInputElement>(null)

    // Get CRECI from URL params
    const creci = searchParams.get('creci') || ''

    // Check auth
    useEffect(() => {
        if (authLoading) return

        if (!isAuthenticated) {
            router.replace('/login?redirect=/perfil/verificar-documentos')
            return
        }

        setIsLoading(false)
    }, [authLoading, isAuthenticated, router])

    // Cleanup previews on unmount
    useEffect(() => {
        return () => {
            Object.values(previews).forEach(url => {
                if (url) URL.revokeObjectURL(url)
            })
        }
    }, [])

    // Get current image key based on step
    const getCurrentImageKey = (): keyof typeof images => {
        switch (currentStep) {
            case 0: return 'creciFront'
            case 1: return 'creciBack'
            case 2: return 'selfie'
            default: return 'creciFront'
        }
    }

    // Handle image selection
    const handleImageSelect = (file: File | null) => {
        if (!file) return

        const key = getCurrentImageKey()

        // Revoke old preview
        if (previews[key]) {
            URL.revokeObjectURL(previews[key]!)
        }

        // Create new preview
        const previewUrl = URL.createObjectURL(file)

        setImages(prev => ({ ...prev, [key]: file }))
        setPreviews(prev => ({ ...prev, [key]: previewUrl }))
        setError(null)
    }

    // Handle file input change
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleImageSelect(file)
        }
        // Reset input value to allow selecting same file
        e.target.value = ''
    }

    // Remove image
    const removeImage = () => {
        const key = getCurrentImageKey()

        if (previews[key]) {
            URL.revokeObjectURL(previews[key]!)
        }

        setImages(prev => ({ ...prev, [key]: null }))
        setPreviews(prev => ({ ...prev, [key]: null }))
    }

    // Check if current step has image
    const hasCurrentImage = () => {
        const key = getCurrentImageKey()
        return images[key] !== null
    }

    // Open camera
    const openCamera = () => {
        if (cameraInputRef.current) {
            cameraInputRef.current.click()
        }
    }

    // Open gallery
    const openGallery = () => {
        if (galleryInputRef.current) {
            galleryInputRef.current.click()
        }
    }

    // Navigate steps
    const goNext = () => {
        if (!hasCurrentImage()) {
            setError('Por favor, adicione a imagem antes de continuar.')
            return
        }

        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1)
            setError(null)
        } else {
            submitDocuments()
        }
    }

    const goBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
            setError(null)
        } else {
            router.back()
        }
    }

    // Submit documents
    const submitDocuments = async () => {
        if (!images.creciFront || !images.creciBack || !images.selfie) {
            setError('Por favor, envie todas as três imagens.')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            await authApi.uploadBrokerDocuments({
                creci,
                creciFront: images.creciFront,
                creciBack: images.creciBack,
                selfie: images.selfie,
            })

            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar documentos. Tente novamente.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Skip for later
    const skipForLater = () => {
        router.push('/perfil')
    }

    if (isLoading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center gradient-hero">
                <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    // Success state
    if (success) {
        return (
            <main className="min-h-screen gradient-hero flex items-center justify-center px-4 py-12 pt-24">
                <div className="relative z-10 w-full max-w-md">
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 text-center">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-400" />
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-3">
                            Documentos Enviados!
                        </h1>

                        <p className="text-white/70 mb-6">
                            Seus documentos foram enviados com sucesso. Nossa equipe irá analisar e você receberá uma notificação quando for aprovado.
                        </p>

                        <Link
                            href="/perfil"
                            className="w-full py-4 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl shadow-lg shadow-accent-500/25 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            Voltar ao Perfil
                        </Link>
                    </div>
                </div>
            </main>
        )
    }

    const currentPreview = previews[getCurrentImageKey()]

    return (
        <main className="min-h-screen gradient-hero flex items-center justify-center px-4 py-12 pt-24">
            {/* Hidden file inputs */}
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
            />
            <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-xl font-bold text-white mb-2">
                            Verificação de Corretor
                        </h1>
                        <p className="text-white/60 text-sm">
                            Envie as fotos do seu CRECI para verificação
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center mb-8">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                {/* Step circle */}
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${index < currentStep
                                            ? 'bg-green-500 text-white'
                                            : index === currentStep
                                                ? 'bg-accent-500 text-primary-900'
                                                : 'bg-white/20 text-white/50'
                                        }`}
                                >
                                    {index < currentStep ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        index + 1
                                    )}
                                </div>

                                {/* Connector line */}
                                {index < STEPS.length - 1 && (
                                    <div
                                        className={`w-8 sm:w-12 h-1 mx-1 rounded-full transition-colors ${index < currentStep
                                                ? 'bg-green-500'
                                                : 'bg-white/20'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Current Step Info */}
                    <div className="text-center mb-6">
                        <div className="text-4xl mb-3">{STEPS[currentStep].icon}</div>
                        <h2 className="text-lg font-semibold text-white mb-2">
                            {STEPS[currentStep].title}
                        </h2>
                        <p className="text-white/60 text-sm">
                            {STEPS[currentStep].description}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                            <p className="text-red-200 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Image Area */}
                    <div className="mb-6">
                        {currentPreview ? (
                            // Image Preview
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-accent-500">
                                <img
                                    src={currentPreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                                {/* Remove button */}
                                <button
                                    onClick={removeImage}
                                    className="absolute top-3 right-3 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                                {/* Success indicator */}
                                <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-green-500 rounded-full flex items-center gap-2">
                                    <Check className="w-4 h-4 text-white" />
                                    <span className="text-white text-sm font-medium">Imagem selecionada</span>
                                </div>
                            </div>
                        ) : (
                            // Upload Area
                            <div className="aspect-[4/3] rounded-2xl border-2 border-dashed border-white/30 bg-white/5 flex flex-col items-center justify-center gap-4">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                                    <Camera className="w-8 h-8 text-white/50" />
                                </div>
                                <p className="text-white/50 text-sm">
                                    Clique abaixo para adicionar
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Image Source Buttons */}
                    {!currentPreview && (
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                onClick={openCamera}
                                className="py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white flex items-center justify-center gap-2 transition-colors"
                            >
                                <Camera className="w-5 h-5" />
                                <span>Câmera</span>
                            </button>
                            <button
                                onClick={openGallery}
                                className="py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white flex items-center justify-center gap-2 transition-colors"
                            >
                                <ImageIcon className="w-5 h-5" />
                                <span>Galeria</span>
                            </button>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={goNext}
                            disabled={isSubmitting}
                            className="w-full py-4 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl shadow-lg shadow-accent-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-primary-900 border-t-transparent rounded-full animate-spin" />
                                    Enviando...
                                </>
                            ) : currentStep === STEPS.length - 1 ? (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Enviar para Análise
                                </>
                            ) : (
                                <>
                                    Continuar
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={goBack}
                                className="flex-1 py-3 border border-white/30 text-white hover:bg-white/10 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar
                            </button>

                            <button
                                onClick={skipForLater}
                                className="flex-1 py-3 text-white/60 hover:text-white transition-colors"
                            >
                                Enviar depois
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
