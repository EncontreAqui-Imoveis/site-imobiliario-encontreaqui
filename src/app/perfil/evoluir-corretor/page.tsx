'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, ArrowLeft, AlertCircle, CheckCircle, Camera, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/lib/api'

export default function EvoluirCorretorPage() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [creci, setCreci] = useState('')

    // Check auth and if user is already a broker
    useEffect(() => {
        if (authLoading) return

        if (!isAuthenticated) {
            router.replace('/login?redirect=/perfil/evoluir-corretor')
            return
        }

        if (user?.role === 'broker') {
            router.replace('/perfil')
            return
        }

        setIsLoading(false)
    }, [authLoading, isAuthenticated, user, router])

    // Handle CRECI input - only numbers
    const handleCreciChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '') // Remove non-digits
        setCreci(value)
    }

    // Submit upgrade request
    const handleSubmit = async (sendDocsNow: boolean) => {
        if (!creci.trim()) {
            setError('Informe o número do CRECI.')
            return
        }

        if (creci.length < 4) {
            setError('CRECI deve ter pelo menos 4 dígitos.')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            await authApi.requestBrokerUpgrade({ creci: creci.trim() })

            if (sendDocsNow) {
                // Redirect to document verification page
                router.push(`/perfil/verificar-documentos?creci=${creci.trim()}`)
            } else {
                setSuccess(true)
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Erro ao solicitar upgrade.')
        } finally {
            setIsSubmitting(false)
        }
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

                        {/* Success */}
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10 text-green-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">
                                Solicitação Enviada!
                            </h1>
                            <p className="text-white/70">
                                Sua solicitação para se tornar corretor foi enviada para análise.
                                Você receberá uma notificação quando for aprovado.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Link
                                href="/perfil/verificar-documentos"
                                className="w-full py-4 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl shadow-lg shadow-accent-500/25 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <Camera className="w-5 h-5" />
                                Enviar documentos agora
                            </Link>
                            <Link
                                href="/perfil"
                                className="w-full py-3 text-white/70 hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar para o Perfil
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen gradient-hero flex items-center justify-center px-4 py-12 pt-24">
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
                            Evoluir para Corretor
                        </h1>
                        <p className="text-white/70">
                            Como corretor, você poderá anunciar imóveis e ter acesso a ferramentas exclusivas.
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                        <h3 className="text-white/90 font-medium mb-3">Benefícios do corretor:</h3>
                        <ul className="space-y-2 text-white/70 text-sm">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                Anunciar imóveis ilimitados
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                Relatórios de visualização
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                Contato direto com interessados
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                Selo de corretor verificado
                            </li>
                        </ul>
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
                            inputMode="numeric"
                            value={creci}
                            onChange={handleCreciChange}
                            placeholder="Ex: 12345"
                            className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                        />
                        <p className="text-white/50 text-xs mt-2">
                            Apenas números (ex: 12345)
                        </p>
                    </div>

                    {/* Actions - Two Options */}
                    <div className="space-y-4">
                        <button
                            onClick={() => handleSubmit(true)}
                            disabled={isSubmitting || !creci.trim()}
                            className="w-full py-4 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl shadow-lg shadow-accent-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-primary-900 border-t-transparent rounded-full animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Camera className="w-5 h-5" />
                                    Enviar documentos agora
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={isSubmitting || !creci.trim()}
                            className="w-full py-3 border border-white/30 text-white hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <ArrowRight className="w-4 h-4" />
                            Enviar depois
                        </button>

                        {/* Back button */}
                        <Link
                            href="/perfil"
                            className="w-full py-3 text-white/70 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para o Perfil
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    )
}
