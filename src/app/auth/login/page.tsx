'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { login } from '@/lib/api/auth'
import { useUser } from '@/contexts/UserContext'
import type { ApiError } from '@/lib/api/client'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { refresh } = useUser()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const next = searchParams.get('next') || '/meus-imoveis'

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            await login({ email, password })
            await refresh()
            router.push(next)
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

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 to-slate-100">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8 space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Entrar na plataforma
                    </h1>
                    <p className="text-sm text-slate-600">
                        Acesse com sua conta para gerenciar imóveis, propostas e contratos.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                            E-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="voce@exemplo.com"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                            Senha
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                    >
                        {submitting ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

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

