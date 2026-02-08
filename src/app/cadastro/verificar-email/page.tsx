'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, RefreshCw, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { useRegistration } from '@/contexts/RegistrationContext'
import {
    createFirebaseUser,
    sendVerificationEmail,
    refreshUserAndCheckEmailVerified,
    signInFirebaseUser,
    getCurrentUser,
} from '@/lib/firebase'

export default function VerificarEmailPage() {
    const router = useRouter()
    const { draft, updateStep, clearDraft } = useRegistration()

    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [isChecking, setIsChecking] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [cooldown, setCooldown] = useState(0)
    const [password, setPassword] = useState('')

    const email = draft?.authData?.email || ''
    const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : ''

    // Validate flow - redirect if no draft data
    useEffect(() => {
        // Get password from sessionStorage
        const storedPassword = sessionStorage.getItem('registration_password') || ''
        setPassword(storedPassword)

        if (!draft || !email) {
            router.replace('/cadastro')
            return
        }
        if (!storedPassword) {
            // No password, need to start over
            router.replace('/cadastro')
            return
        }
        setIsLoading(false)
    }, [draft, email, router])

    // Cooldown timer
    useEffect(() => {
        if (cooldown <= 0) return
        const timer = setInterval(() => {
            setCooldown(prev => Math.max(0, prev - 1))
        }, 1000)
        return () => clearInterval(timer)
    }, [cooldown])

    // Create Firebase account and send verification email
    const handleSendEmail = async () => {
        if (isSending || cooldown > 0) return
        setIsSending(true)
        setError(null)

        try {
            // Check if user already exists in Firebase
            let user = getCurrentUser()

            if (!user || user.email?.toLowerCase() !== email.toLowerCase()) {
                // Try to create the account first
                try {
                    await createFirebaseUser(email, password)
                    user = getCurrentUser()
                } catch (createError: any) {
                    // If account already exists, try to sign in
                    if (createError.message?.includes('já está cadastrado') ||
                        createError.code === 'auth/email-already-in-use') {
                        try {
                            await signInFirebaseUser(email, password)
                            user = getCurrentUser()
                        } catch (signInError: any) {
                            // If sign-in fails, password is wrong for existing account
                            if (signInError.message?.includes('Senha incorreta')) {
                                throw new Error('Este email já está cadastrado com outra senha. Use a opção "Esqueci minha senha" ou faça login.')
                            }
                            throw signInError
                        }
                    } else {
                        throw createError
                    }
                }
            }

            if (!user) {
                throw new Error('Erro ao criar conta. Tente novamente.')
            }

            // Check if already verified
            if (user.emailVerified) {
                updateStep('phone_pending')
                router.push('/cadastro/verificar-telefone')
                return
            }

            // Send verification email
            await sendVerificationEmail()
            setEmailSent(true)
            setCooldown(60)

        } catch (err: any) {
            setError(err.message || 'Erro ao enviar email.')
        } finally {
            setIsSending(false)
        }
    }

    // Check if email was verified
    const handleCheckVerification = async () => {
        if (isChecking) return
        setIsChecking(true)
        setError(null)

        try {
            const isVerified = await refreshUserAndCheckEmailVerified()

            if (isVerified) {
                updateStep('phone_pending')
                router.push('/cadastro/verificar-telefone')
            } else {
                setError('Email ainda não verificado. Clique no link enviado para seu email.')
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao verificar status.')
        } finally {
            setIsChecking(false)
        }
    }

    // Handle back/cancel
    const handleBack = () => {
        clearDraft()
        router.push('/cadastro')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center gradient-hero">
                <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <main className="min-h-screen gradient-hero flex items-center justify-center px-4 py-12 pt-32">
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
                        <Mail className="w-12 h-12 text-accent-400 mx-auto mb-3" />
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Verificar Email
                        </h1>
                        <p className="text-white/70">
                            {emailSent
                                ? `Enviamos um link de verificação para ${maskedEmail}`
                                : `Vamos enviar um link de verificação para ${maskedEmail}`
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

                    {/* Actions */}
                    <div className="space-y-4">
                        {!emailSent ? (
                            // Initial state - send email button
                            <button
                                onClick={handleSendEmail}
                                disabled={isSending}
                                className="w-full py-4 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl shadow-lg shadow-accent-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSending ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-primary-900 border-t-transparent rounded-full animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-5 h-5" />
                                        Enviar Email de Verificação
                                    </>
                                )}
                            </button>
                        ) : (
                            // Email sent state - check verification and resend
                            <>
                                <button
                                    onClick={handleCheckVerification}
                                    disabled={isChecking}
                                    className="w-full py-4 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl shadow-lg shadow-accent-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isChecking ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-primary-900 border-t-transparent rounded-full animate-spin" />
                                            Verificando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Já Verifiquei
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleSendEmail}
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
                                            Reenviar Email
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
                            Usar outro email
                        </button>
                    </div>

                    {/* Help text */}
                    <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-white/60 text-sm text-center">
                            Não recebeu o email? Verifique sua caixa de spam ou clique em "Reenviar Email".
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
