'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, ArrowRight, AlertCircle, FileText } from 'lucide-react'
import { useRegistration } from '@/contexts/RegistrationContext'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/lib/api'

export default function VerificarCreciPage() {
    const router = useRouter()
    const { draft, updateStep, clearDraft } = useRegistration()
    const { user, isAuthenticated } = useAuth()

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [creci, setCreci] = useState('')

    // Check if coming from registration flow or from profile upgrade
    const isUpgradeFlow = !draft && isAuthenticated

    useEffect(() => {
        // If in registration flow, use draft CRECI
        if (draft?.authData?.creci) {
            setCreci(draft.authData.creci)
        }
        setIsLoading(false)
    }, [draft])

    // Submit CRECI
    const handleSubmit = async (sendDocsNow: boolean) => {
        if (!creci.trim()) {
            setError('Informe o CRECI.')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            if (isUpgradeFlow) {
                // Upgrade existing user to broker
                await authApi.requestBrokerUpgrade({ creci: creci.trim() })
            } else {
                // Update user CRECI in backend (already registered in phone step)
                const token = localStorage.getItem('token')
                if (token) {
                    await authApi.updateProfile({ creci: creci.trim() })
                }
            }

            // Clear draft and proceed
            clearDraft()
            updateStep('complete')

            if (sendDocsNow) {
                // TODO: Navigate to document upload page
                router.push('/cadastro/concluido?docs=pending')
            } else {
                router.push('/cadastro/concluido')
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Erro ao salvar CRECI.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center gradient-hero">
                <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <main className="min-h-screen gradient-hero flex items-center justify-center px-4 py-12">
            <div className="relative z-10 w-full max-w-md">
                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <Image
                            src="/logo.png"
                            alt="EncontreAqui"
                            width={80}
                            height={80}
                            className="h-20"
                            style={{ width: 'auto' }}
                        />
                    </div>

                    {/* Title */}
                    <div className="text-center mb-6">
                        <BadgeCheck className="w-12 h-12 text-accent-400 mx-auto mb-3" />
                        <h1 className="text-2xl font-bold text-white mb-2">
                            {isUpgradeFlow ? 'Evoluir para Corretor' : 'Informe seu CRECI'}
                        </h1>
                        <p className="text-white/70">
                            {isUpgradeFlow
                                ? 'Para anunciar imóveis, precisamos validar seu registro profissional.'
                                : 'Antes de finalizar, precisamos do seu registro profissional.'
                            }
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                            <p className="text-red-200 text-sm">{error}</p>
                        </div>
                    )}

                    {/* CRECI Input */}
                    <div className="mb-6">
                        <label className="block text-white/70 text-sm mb-2">
                            Número do CRECI
                        </label>
                        <input
                            type="text"
                            value={creci}
                            onChange={(e) => setCreci(e.target.value.toUpperCase())}
                            placeholder="Ex: 12345-F"
                            className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                        />
                        <p className="text-white/50 text-xs mt-2">
                            Formato: número + UF ou letra (ex: 12345-GO, 12345-F)
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                        <button
                            onClick={() => handleSubmit(true)}
                            disabled={isSubmitting || !creci.trim()}
                            className="w-full py-4 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl shadow-lg shadow-accent-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-primary-900 border-t-transparent rounded-full animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-5 h-5" />
                                    Enviar documentos agora
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={isSubmitting || !creci.trim()}
                            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <ArrowRight className="w-4 h-4" />
                            Enviar depois
                        </button>
                    </div>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-white/60 text-sm text-center">
                            Seu cadastro como corretor ficará pendente de aprovação até o envio dos documentos.
                        </p>
                    </div>
                </div>

                {/* Login link */}
                <p className="text-center mt-6 text-white/70">
                    Já tem uma conta?{' '}
                    <Link href="/login" className="text-accent-400 hover:text-accent-300 font-medium">
                        Fazer login
                    </Link>
                </p>
            </div>
        </main>
    )
}
