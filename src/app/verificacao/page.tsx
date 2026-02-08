'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Upload, Camera, X, Check, ChevronRight, Shield, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface UploadedImage {
    file: File
    preview: string
}

const STEPS = [
    {
        title: 'Frente do CRECI',
        description: 'Foto clara da frente do seu documento CRECI',
        icon: '📄',
    },
    {
        title: 'Verso do CRECI',
        description: 'Foto clara do verso do seu documento CRECI',
        icon: '📄',
    },
    {
        title: 'Selfie com Documento',
        description: 'Tire uma selfie segurando seu CRECI próximo ao rosto',
        icon: '🤳',
    },
]

export default function VerificationPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, isAuthenticated, isLoading } = useAuth()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [currentStep, setCurrentStep] = useState(0)
    const [images, setImages] = useState<(UploadedImage | null)[]>([null, null, null])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [token, setToken] = useState<string | null>(null)

    const creci = searchParams.get('creci') || ''

    useEffect(() => {
        const storedToken = localStorage.getItem('token')
        if (storedToken) {
            setToken(storedToken)
        }
    }, [])

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login?redirect=/verificacao')
        }
    }, [isLoading, isAuthenticated, router])

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Por favor, selecione uma imagem válida.')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('A imagem deve ter no máximo 5MB.')
            return
        }

        const preview = URL.createObjectURL(file)
        const newImages = [...images]
        newImages[currentStep] = { file, preview }
        setImages(newImages)
        setError(null)
    }

    const handleRemoveImage = (index: number) => {
        const newImages = [...images]
        if (newImages[index]?.preview) {
            URL.revokeObjectURL(newImages[index]!.preview)
        }
        newImages[index] = null
        setImages(newImages)
    }

    const handleNextStep = () => {
        if (!images[currentStep]) {
            setError('Por favor, adicione a imagem antes de continuar.')
            return
        }
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1)
            setError(null)
        }
    }

    const handlePreviousStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
            setError(null)
        }
    }

    const handleSubmit = async () => {
        // Validate all images
        if (images.some(img => !img)) {
            setError('Por favor, adicione todas as imagens necessárias.')
            return
        }

        if (!creci) {
            setError('CRECI não informado. Volte ao perfil e informe seu CRECI.')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            // Create form data
            const formData = new FormData()
            formData.append('creci', creci)
            formData.append('creci_front', images[0]!.file)
            formData.append('creci_back', images[1]!.file)
            formData.append('selfie', images[2]!.file)

            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6acc.up.railway.app'

            const response = await fetch(`${API_BASE_URL}/auth/broker-docs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            })

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                throw new Error(data.message || 'Erro ao enviar documentos')
            }

            setSuccess(true)

            // Redirect after success
            setTimeout(() => {
                router.push('/perfil')
            }, 3000)
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar documentos. Tente novamente.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        )
    }

    if (!isAuthenticated) return null

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Documentos Enviados!
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Seus documentos foram enviados com sucesso. Nossa equipe irá analisá-los e
                        você receberá uma notificação quando sua conta for verificada.
                    </p>
                    <Link
                        href="/perfil"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                    >
                        Voltar ao Perfil
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 pt-20 pb-12">
            <div className="max-w-2xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Verificação de Corretor
                    </h1>
                    <p className="text-white/70">
                        Envie as fotos do seu CRECI para verificar sua conta
                    </p>
                </div>

                {/* Progress */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {STEPS.map((step, index) => (
                        <div key={index} className="flex items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${index < currentStep
                                    ? 'bg-green-500 text-white'
                                    : index === currentStep
                                        ? 'bg-yellow-400 text-primary-900'
                                        : 'bg-white/20 text-white/50'
                                    }`}
                            >
                                {index < currentStep ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    index + 1
                                )}
                            </div>
                            {index < STEPS.length - 1 && (
                                <div
                                    className={`w-12 h-1 mx-1 rounded ${index < currentStep ? 'bg-green-500' : 'bg-white/20'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Current Step Card */}
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                    <div className="text-center mb-6">
                        <span className="text-4xl mb-4 block">{STEPS[currentStep].icon}</span>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {STEPS[currentStep].title}
                        </h2>
                        <p className="text-gray-600">
                            {STEPS[currentStep].description}
                        </p>
                    </div>

                    {/* Image Upload Area */}
                    <div className="mb-6">
                        {images[currentStep] ? (
                            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                                <img
                                    src={images[currentStep]!.preview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={() => handleRemoveImage(currentStep)}
                                    className="absolute top-3 right-3 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="absolute bottom-3 left-3 right-3 bg-green-500/90 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                    <Check className="w-4 h-4" />
                                    <span className="text-sm font-medium">Imagem selecionada</span>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full aspect-[4/3] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-4 hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer"
                            >
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Camera className="w-8 h-8 text-gray-400" />
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-900 font-medium">
                                        Clique para adicionar imagem
                                    </p>
                                    <p className="text-gray-500 text-sm mt-1">
                                        PNG, JPG até 5MB
                                    </p>
                                </div>
                            </button>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-4">
                        {currentStep > 0 && (
                            <button
                                onClick={handlePreviousStep}
                                className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Voltar
                            </button>
                        )}
                        {currentStep < STEPS.length - 1 ? (
                            <button
                                onClick={handleNextStep}
                                disabled={!images[currentStep]}
                                className="flex-1 py-3 px-6 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Continuar
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !images[currentStep]}
                                className="flex-1 py-3 px-6 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        Enviar para Análise
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Skip Option */}
                <div className="text-center mt-6">
                    <Link
                        href="/perfil"
                        className="text-white/70 hover:text-white text-sm transition-colors"
                    >
                        Enviar documentos depois
                    </Link>
                </div>
            </div>
        </div>
    )
}
