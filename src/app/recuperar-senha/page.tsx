'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

// Firebase REST API configuration
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

function RecoverPasswordForm() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const trimmedEmail = email.trim().toLowerCase()

        if (!trimmedEmail) {
            setErrorMessage('Por favor, informe seu email.')
            setStatus('error')
            return
        }

        setIsLoading(true)
        setStatus('idle')
        setErrorMessage('')

        try {
            // Check if user exists in our backend first
            const { authApi } = await import('@/lib/api')
            const checkResult = await authApi.checkEmailStatus(trimmedEmail)

            if (checkResult.error || !checkResult.data?.exists) {
                setErrorMessage('Este email não está cadastrado em nossa plataforma.')
                setStatus('error')
                setIsLoading(false)
                return
            }

            // Check if it's a Google-only account (no password)
            if (checkResult.data.hasFirebaseUid && !checkResult.data.hasPassword) {
                setErrorMessage('Esta conta foi criada com o Google e não possui senha. Use o login com Google.')
                setStatus('error')
                setIsLoading(false)
                return
            }

            // Send password reset email via Firebase REST API
            if (!FIREBASE_API_KEY) {
                // Fallback to backend API if no Firebase key
                await authApi.requestPasswordReset(trimmedEmail)
            } else {
                const response = await fetch(
                    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            requestType: 'PASSWORD_RESET',
                            email: trimmedEmail,
                        }),
                    }
                )

                if (!response.ok) {
                    const errorData = await response.json()
                    const errorCode = errorData.error?.message || 'UNKNOWN_ERROR'

                    if (errorCode === 'EMAIL_NOT_FOUND') {
                        setErrorMessage('Este email não está cadastrado.')
                    } else {
                        setErrorMessage('Erro ao enviar email de recuperação. Tente novamente.')
                    }
                    setStatus('error')
                    setIsLoading(false)
                    return
                }
            }

            setStatus('success')
        } catch (error) {
            console.error('Password reset error:', error)
            setErrorMessage('Erro ao enviar email de recuperação. Tente novamente.')
            setStatus('error')
        } finally {
            setIsLoading(false)
        }
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20 flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">Email Enviado!</h1>
                    <p className="text-gray-500 mb-8">
                        Enviamos um link de recuperação para <strong className="text-gray-700">{email}</strong>.
                        Verifique sua caixa de entrada e spam.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20">
            <div className="flex min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-5rem)] items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <Link href="/" className="flex items-center justify-center mb-8">
                        <Image
                            src="/logo2.svg"
                            alt="Encontre Aqui Imóveis"
                            width={280}
                            height={80}
                            className="h-20"
                            style={{ width: 'auto' }}
                        />
                    </Link>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Recuperar Senha
                        </h1>
                        <p className="text-gray-500">
                            Informe seu email e enviaremos um link para redefinir sua senha.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {status === 'error' && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-red-600 text-sm">{errorMessage}</p>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    required
                                    className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-accent-500 hover:bg-accent-600 disabled:bg-accent-400 text-primary-900 font-semibold rounded-xl shadow-lg shadow-accent-500/25 transition-all"
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-primary-900/30 border-t-primary-900 rounded-full animate-spin" />
                            ) : (
                                'Enviar Link de Recuperação'
                            )}
                        </button>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-8 text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 font-medium transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function RecoverPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <RecoverPasswordForm />
        </Suspense>
    )
}
