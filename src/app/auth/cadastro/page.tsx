'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { register } from '@/lib/api/auth'
import { useUser } from '@/contexts/UserContext'
import type { ApiError } from '@/lib/api/client'

export default function CadastroPage() {
    const router = useRouter()
    const { refresh } = useUser()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [phone, setPhone] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            await register({
                name,
                email,
                password,
                phone: phone || undefined,
                city: city || undefined,
                state: state || undefined,
            })
            await refresh()
            router.push('/onboarding')
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr) {
                if (apiErr.status === 409) {
                    setError('Já existe uma conta com este e-mail.')
                } else {
                    setError(apiErr.message || 'Não foi possível criar sua conta.')
                }
            } else {
                setError('Não foi possível criar sua conta.')
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
                        Criar conta
                    </h1>
                    <p className="text-sm text-slate-600">
                        Comece informando seus dados básicos. Você poderá completar o perfil em seguida.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                            Nome completo
                        </label>
                        <input
                            id="name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Seu nome"
                        />
                    </div>

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
                            autoComplete="new-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Mínimo 8 caracteres"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                                Telefone (opcional)
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="city" className="block text-sm font-medium text-slate-700">
                                Cidade (opcional)
                            </label>
                            <input
                                id="city"
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Sua cidade"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="state" className="block text-sm font-medium text-slate-700">
                                Estado (UF)
                            </label>
                            <input
                                id="state"
                                type="text"
                                maxLength={2}
                                value={state}
                                onChange={(e) => setState(e.target.value.toUpperCase())}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="GO"
                            />
                        </div>
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
                        {submitting ? 'Criando conta...' : 'Criar conta'}
                    </button>
                </form>

                <div className="text-center text-sm text-slate-600 space-y-1.5">
                    <p>
                        Já tem conta?{' '}
                        <Link
                            href="/auth/login"
                            className="font-semibold text-primary-600 hover:text-primary-700"
                        >
                            Entrar
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

