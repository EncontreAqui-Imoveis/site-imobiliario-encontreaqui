'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { isGooglePendingAuthResult } from '@/lib/api/auth'
import { loginWithEmailHybrid } from '@/lib/auth/hybridEmailLogin'
import { loginWithGooglePopup } from '@/lib/auth/googleFlow'
import { resolvePostAuthRoute } from '@/lib/auth/routeResolution'
import SignupDraftNotice from '@/components/auth/SignupDraftNotice'
import { useUser } from '@/contexts/UserContext'
import { createSignupDraft, saveSignupDraft } from '@/lib/authSignupDraft'
import type { ApiError } from '@/lib/api/client'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { refresh } = useUser()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)

    const next = searchParams.get('next') || '/meus-imoveis'

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            const session = await loginWithEmailHybrid({ email, password })
            await refresh()
            router.push(resolvePostAuthRoute(session, next))
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr) {
                if (apiErr.status === 401) {
                    setError('Credenciais inválidas. Verifique seu e-mail e senha.')
                } else {
                    setError(apiErr.message || 'Não foi possível entrar. Tente novamente.')
                }
            } else {
                setError('Não foi possível entrar. Tente novamente.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleGoogleLogin = async () => {
        setGoogleLoading(true)
        setError(null)

        try {
            const result = await loginWithGooglePopup()
            if (isGooglePendingAuthResult(result)) {
                saveSignupDraft(
                    createSignupDraft({
                        source: 'google',
                        step: 'profile',
                        emailVerified: true,
                        data: {
                            email: result.pending.email,
                            name: result.pending.name,
                            googleIdToken: result.pending.googleIdToken,
                            googleUid: result.pending.googleUid,
                            state: 'GO',
                        },
                    }),
                )
                router.push('/auth/cadastro')
                return
            }
            await refresh()
            router.push(resolvePostAuthRoute(result, next))
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr && apiErr.status === 401) {
                setError('Não foi possível autenticar com Google. Tente novamente.')
            } else {
                setError('Erro ao conectar com o Google. Tente novamente.')
            }
        } finally {
            setGoogleLoading(false)
        }
    }

    const isLoading = submitting || googleLoading

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 pt-28 pb-16 sm:pt-32 bg-gradient-to-b from-slate-50/95 to-slate-100/95">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8 space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Entrar na plataforma
                    </h1>
                    <p className="text-sm text-slate-600">
                        Acesse com sua conta para gerenciar imóveis, propostas e contratos.
                    </p>
                </div>

                <SignupDraftNotice />

                <form onSubmit={handleSubmit} className="space-y-5" aria-describedby={error ? 'login-error' : undefined}>
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                            E-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            required
                            maxLength={120}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="voce@exemplo.com"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                Senha
                            </label>
                            <Link
                                href="/recuperar-senha"
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                            >
                                Esqueceu a senha?
                            </Link>
                        </div>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                maxLength={256}
                                aria-describedby="login-password-hint"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 pl-3 pr-11 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        <p id="login-password-hint" className="text-xs text-slate-500">
                            Use a senha cadastrada na sua conta.
                        </p>
                    </div>

                    {error && (
                        <p id="login-error" role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                    >
                        {submitting ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-3 text-slate-400">ou entre com Google</span>
                    </div>
                </div>

                {/* Google Sign-In Button */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {googleLoading ? 'Conectando...' : 'Entrar com Google'}
                </button>

                <div className="text-center text-sm text-slate-600 space-y-1.5">
                    <p>
                        Ainda não tem conta?{' '}
                        <Link
                            href="/auth/cadastro"
                            className="font-semibold text-primary-600 hover:text-primary-700"
                        >
                            Criar conta
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
