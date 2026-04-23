'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { resolvePostAuthRoute } from '@/lib/auth/routeResolution'
import { updateProfile } from '@/lib/api/user'
import type { ApiError } from '@/lib/api/client'
import { UserCircle, CheckCircle } from 'lucide-react'
import { formatPhoneInput, normalizePhoneDigits } from '@/lib/phoneInput'

export default function OnboardingPage() {
    const router = useRouter()
    const { session, loading, refresh, isProfileComplete } = useUser()

    const [phone, setPhone] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!loading && !session) {
            router.replace('/auth/login?next=/onboarding')
            return
        }
        if (!loading && session?.user && !session.user.email_verified) {
            router.replace('/verificacao')
            return
        }
        if (!loading && session && isProfileComplete) {
            router.replace(resolvePostAuthRoute(session, '/meus-imoveis'))
        }
    }, [loading, session, router, isProfileComplete])

    // Pre-fill from existing user data
    useEffect(() => {
        if (session?.user) {
            const u = session.user
            setPhone(formatPhoneInput(u.phone || ''))
        }
    }, [session])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            await updateProfile({
                phone: normalizePhoneDigits(phone) || undefined,
            })
            await refresh()
            if (!session) {
                router.push('/meus-imoveis')
                return
            }
            const refreshedSession = {
                ...session,
                profileStatus: 'complete' as const,
                user: {
                    ...session.user,
                    phone: normalizePhoneDigits(phone) || session.user.phone,
                },
            }
            router.push(resolvePostAuthRoute(refreshedSession, '/meus-imoveis'))
        } catch (err) {
            const apiErr = err as ApiError
            setError(apiErr?.message || 'Erro ao salvar perfil.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading || !session) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p className="text-sm text-slate-600">Carregando seu perfil...</p>
            </div>
        )
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 to-slate-100">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8 space-y-6">
                <div className="space-y-2 text-center">
                    <div className="w-14 h-14 mx-auto bg-primary-50 rounded-full flex items-center justify-center">
                        {isProfileComplete ? (
                            <CheckCircle className="w-7 h-7 text-green-500" />
                        ) : (
                            <UserCircle className="w-7 h-7 text-primary-600" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {isProfileComplete ? 'Perfil completo!' : 'Complete seu perfil'}
                    </h1>
                    <p className="text-sm text-slate-600">
                        Olá, <strong>{session.user.name}</strong>! Confirme seu telefone
                        para poder gerar propostas e negociar imóveis.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={error ? 'onboarding-error' : undefined}>
                    {/* Telefone */}
                    <div className="space-y-1.5">
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                            Telefone *
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                            maxLength={15}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="(00) 00000-0000"
                        />
                    </div>

                    {error && (
                        <p id="onboarding-error" role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                    >
                        {submitting ? 'Salvando...' : 'Salvar e continuar'}
                    </button>
                </form>
            </div>
        </div>
    )
}
