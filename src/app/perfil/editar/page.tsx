'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { resolvePendingAction } from '@/lib/auth/routeResolution'
import { updateProfile } from '@/lib/api/user'
import { savePendingPhoneUpdateDraft } from '@/lib/authSignupDraft'
import type { ApiError } from '@/lib/api/client'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatPhoneInput, normalizePhoneDigits } from '@/lib/phoneInput'

export default function EditarPerfilPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { session, loading: authLoading, refresh } = useUser()

    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (!authLoading && !session) {
            router.replace('/auth/login?next=/perfil/editar')
        }
    }, [authLoading, session, router])

    useEffect(() => {
        if (session?.user) {
            const u = session.user
            setName(u.name || '')
            setPhone(formatPhoneInput(u.phone || ''))
        }
    }, [session])

    useEffect(() => {
        if (searchParams.get('saved') === '1') {
            setSuccess(true)
            const timer = window.setTimeout(() => setSuccess(false), 3000)
            return () => window.clearTimeout(timer)
        }
        return undefined
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)
        setSuccess(false)

        try {
            if (!session) {
                router.replace('/auth/login?next=/perfil/editar')
                return
            }

            const payload = {
                name: name || undefined,
                phone: normalizePhoneDigits(phone) || undefined,
            }

            const originalPhone = normalizePhoneDigits(session.user.phone || '') || ''
            const nextPhone = normalizePhoneDigits(phone) || ''

            if (nextPhone && nextPhone !== originalPhone) {
                savePendingPhoneUpdateDraft({
                    phone: nextPhone,
                    payload,
                    updatedAt: new Date().toISOString(),
                })
                router.push(`/cadastro/verificar-telefone?mode=profile-update&phone=${encodeURIComponent(nextPhone)}`)
                return
            }

            await updateProfile(payload)
            await refresh()
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
            const apiErr = err as ApiError
            setError(apiErr?.message || 'Erro ao salvar alterações.')
        } finally {
            setSubmitting(false)
        }
    }

    if (authLoading || !session) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        )
    }

    const pendingAction = resolvePendingAction(session)

    return (
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 pt-24">
            <div className="flex items-center gap-3 mb-6">
                <Link href="/perfil" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Editar Perfil</h1>
            </div>

            {pendingAction && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p className="font-semibold">{pendingAction.title}</p>
                    <p className="mt-1">{pendingAction.description}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/50 space-y-4">
                <div className="space-y-1.5">
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nome</label>
                    <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={120}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Telefone</label>
                    <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(formatPhoneInput(e.target.value))} maxLength={15}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="(00) 00000-0000" />
                </div>

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
                )}
                {success && (
                    <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                        Perfil atualizado com sucesso!
                    </p>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                >
                    <Save className="w-4 h-4" />
                    {submitting ? 'Salvando...' : 'Salvar alterações'}
                </button>
            </form>
        </div>
    )
}
