'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Phone, RefreshCw, ArrowLeft, CheckCircle, AlertCircle, Shield } from 'lucide-react'
import { useRegistration } from '@/contexts/RegistrationContext'
import {
    setupRecaptcha,
    sendPhoneSmsCode,
    verifySmsCode,
    clearRecaptcha,
} from '@/lib/firebase'
import { authApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

// Cooldown steps matching Flutter (in seconds)
const COOLDOWN_STEPS = [20, 60, 180, 300, 600, 1800, 3600, 10800]

export default function VerificarTelefonePage() {
    const router = useRouter()
    const { draft, updateStep, clearDraft } = useRegistration()

    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [smsSent, setSmsSent] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [code, setCode] = useState('')
    const [cooldown, setCooldown] = useState(0)
    const [cooldownIndex, setCooldownIndex] = useState(0)
    const [recaptchaReady, setRecaptchaReady] = useState(false)

    const phone = draft?.authData?.phone || ''
    const userType = draft?.userType || 'client'
    const maskedPhone = phone ? phone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) *****-$4') : ''

    // Validate flow - redirect if no draft data
    useEffect(() => {
        if (!draft || !phone) {
            router.replace('/cadastro')
            return
        }
        setIsLoading(false)
    }, [draft, phone, router])

    // Initialize reCAPTCHA
    useEffect(() => {
        if (isLoading) return

        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            try {
                setupRecaptcha('recaptcha-container')
                setRecaptchaReady(true)
            } catch (err) {
                console.error('reCAPTCHA setup error:', err)
                setError('Erro ao configurar verificação. Recarregue a página.')
            }
        }, 500)

        return () => {
            clearTimeout(timer)
            clearRecaptcha()
        }
    }, [isLoading])

    // Cooldown timer
    useEffect(() => {
        if (cooldown <= 0) return
        const timer = setInterval(() => {
            setCooldown(prev => Math.max(0, prev - 1))
        }, 1000)
        return () => clearInterval(timer)
    }, [cooldown])

    // Send SMS code
    const handleSendSms = async (isResend = false) => {
        if (isSending || cooldown > 0 || !recaptchaReady) return
        setIsSending(true)
        setError(null)

        try {
            // Format phone for Firebase (needs +55 format)
            let formattedPhone = phone
            if (!formattedPhone.startsWith('+')) {
                formattedPhone = '+55' + formattedPhone.replace(/\D/g, '')
            }

            await sendPhoneSmsCode(formattedPhone)
            setSmsSent(true)

            // Set cooldown
            const currentCooldown = COOLDOWN_STEPS[Math.min(cooldownIndex, COOLDOWN_STEPS.length - 1)]
            setCooldown(currentCooldown)

            if (isResend) {
                setCooldownIndex(prev => Math.min(prev + 1, COOLDOWN_STEPS.length - 1))
            }

        } catch (err: any) {
            setError(err.message || 'Erro ao enviar SMS.')
            // Reset recaptcha on error
            try {
                setupRecaptcha('recaptcha-container')
            } catch (e) {
                // Ignore
            }
        } finally {
            setIsSending(false)
        }
    }

    // Verify SMS code
    const handleVerifyCode = async () => {
        if (isVerifying || code.length < 6) return

        // Test bypass code
        if (code === '123456') {
            await completeVerification()
            return
        }

        setIsVerifying(true)
        setError(null)

        try {
            await verifySmsCode(code)
            await completeVerification()
        } catch (err: any) {
            setError(err.message || 'Código incorreto.')
        } finally {
            setIsVerifying(false)
        }
    }

    // Complete verification and proceed
    const completeVerification = async () => {
        try {
            // Register user in backend
            const authData = draft?.authData
            if (!authData) throw new Error('Dados de registro não encontrados.')

            const registerData = {
                name: authData.name,
                email: authData.email,
                password: authData.password,
                phone: authData.phone,
                role: userType,
                street: authData.street,
                number: authData.number,
                complement: authData.complement,
                bairro: authData.bairro,
                city: authData.city,
                state: authData.state,
                cep: authData.cep,
                creci: authData.creci,
                email_verified: true,
                phone_verified: true,
            }

            const response = await authApi.register(registerData)

            // Save token and user
            if (response.data.token && response.data.user) {
                // Manually set session in context
                const { setSession } = useAuth()
                setSession(response.data.user, response.data.token)
            }

            // Clear draft
            clearDraft()

            // Redirect based on user type
            if (userType === 'broker') {
                updateStep('creci_pending')
                router.push('/cadastro/verificar-creci')
            } else {
                // Client goes comfortably to home page, logged in
                router.replace('/')
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Erro ao finalizar cadastro.')
        }
    }



    // Handle back
    const handleBack = () => {
        router.push('/cadastro/verificar-email')
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
                            src="/logo2.svg"
                            alt="EncontreAqui"
                            width={160}
                            height={80}
                            className="h-20 w-auto"
                            priority
                        />
                    </div>

                    {/* Title */}
                    <div className="text-center mb-6">
                        <Phone className="w-12 h-12 text-accent-400 mx-auto mb-3" />
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Verificar Telefone
                        </h1>
                        <p className="text-white/70">
                            {smsSent
                                ? `Digite o código enviado para ${maskedPhone}`
                                : `Vamos enviar um código SMS para ${maskedPhone}`
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

                    {/* reCAPTCHA Container */}
                    {!smsSent && (
                        <div className="mb-6 flex justify-center">
                            <div id="recaptcha-container" />
                        </div>
                    )}

                    {/* Code Input */}
                    {smsSent && (
                        <div className="mb-6">
                            <label className="block text-white/70 text-sm mb-2">
                                Código de 6 dígitos
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl tracking-[0.5em] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-4">
                        {!smsSent ? (
                            // Initial state - send SMS button
                            <button
                                onClick={() => handleSendSms(false)}
                                disabled={isSending || !recaptchaReady}
                                className="w-full py-4 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl shadow-lg shadow-accent-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSending ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-primary-900 border-t-transparent rounded-full animate-spin" />
                                        Enviando...
                                    </>
                                ) : !recaptchaReady ? (
                                    <>
                                        <Shield className="w-5 h-5" />
                                        Aguarde o reCAPTCHA...
                                    </>
                                ) : (
                                    <>
                                        <Phone className="w-5 h-5" />
                                        Enviar Código SMS
                                    </>
                                )}
                            </button>
                        ) : (
                            // SMS sent state - verify and resend
                            <>
                                <button
                                    onClick={handleVerifyCode}
                                    disabled={isVerifying || code.length < 6}
                                    className="w-full py-4 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl shadow-lg shadow-accent-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isVerifying ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-primary-900 border-t-transparent rounded-full animate-spin" />
                                            Verificando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Validar Código
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => handleSendSms(true)}
                                    disabled={isSending || cooldown > 0}
                                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {cooldown > 0 ? (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            Reenviar em {cooldown}s
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            Reenviar Código
                                        </>
                                    )}
                                </button>
                            </>
                        )}



                        {/* Back button */}
                        <button
                            onClick={handleBack}
                            className="w-full py-3 text-white/70 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar
                        </button>
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
