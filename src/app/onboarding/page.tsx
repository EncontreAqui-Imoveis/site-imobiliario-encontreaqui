'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { resolvePostAuthRoute } from '@/lib/auth/routeResolution'
import { updateProfile } from '@/lib/api/user'
import type { ApiError } from '@/lib/api/client'
import { UserCircle, CheckCircle } from 'lucide-react'
import { formatPhoneInput, normalizePhoneDigits } from '@/lib/phoneInput'

const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

function formatCep(value: string) {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
}

export default function OnboardingPage() {
    const router = useRouter()
    const { session, loading, refresh, isProfileComplete } = useUser()

    const [phone, setPhone] = useState('')
    const [cep, setCep] = useState('')
    const [state, setState] = useState('')
    const [city, setCity] = useState('')
    const [bairro, setBairro] = useState('')
    const [street, setStreet] = useState('')
    const [number, setNumber] = useState('')
    const [semNumero, setSemNumero] = useState(false)
    const [complement, setComplement] = useState('')
    
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [cepLoading, setCepLoading] = useState(false)
    
    const lastCompletedCep = useRef('')
    const cepLookupTimeoutRef = useRef<number | null>(null)

    useEffect(() => {
        if (!loading && !session) {
            router.replace('/auth/login?next=/onboarding')
            return
        }
        const hasVerifiedContact =
            session?.user?.email_verified === true ||
            String(session?.user?.phone ?? '').trim().length > 0
        if (!loading && session?.user && !hasVerifiedContact) {
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
            setCep(formatCep(u.cep || ''))
            setState(u.state || '')
            setCity(u.city || '')
            setBairro(u.bairro || '')
            setStreet(u.street || '')
            setNumber(u.number || '')
            setComplement(u.complement || '')
        }
    }, [session])

    const handleCepLookup = async (cleanCep: string) => {
        if (cleanCep.length !== 8 || lastCompletedCep.current === cleanCep) return

        lastCompletedCep.current = cleanCep
        setCepLoading(true)
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
            const data = await res.json()
            if (!data.erro) {
                if (data.logradouro) setStreet(data.logradouro)
                if (data.bairro) setBairro(data.bairro)
                if (data.localidade) setCity(data.localidade)
                if (data.uf) setState(data.uf)
            }
        } catch {
            // Usuário ainda pode preencher manualmente.
        } finally {
            setCepLoading(false)
        }
    }

    useEffect(() => {
        const cleanCep = cep.replace(/\D/g, '')
        if (cepLookupTimeoutRef.current) {
            window.clearTimeout(cepLookupTimeoutRef.current)
            cepLookupTimeoutRef.current = null
        }

        if (cleanCep.length !== 8) {
            if (cep.length === 0) {
                lastCompletedCep.current = ''
            }
            return
        }
        if (lastCompletedCep.current === cleanCep) {
            return
        }

        cepLookupTimeoutRef.current = window.setTimeout(() => {
            void handleCepLookup(cleanCep)
        }, 260)

        return () => {
            if (cepLookupTimeoutRef.current) {
                window.clearTimeout(cepLookupTimeoutRef.current)
            }
        }
    }, [cep])

    const handleCepBlur = () => {
        const cleanCep = cep.replace(/\D/g, '')
        if (!cleanCep.length) return
        void handleCepLookup(cleanCep)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        if (!semNumero && !number.trim()) {
            setError('Informe o número do endereço ou marque "Sem número".')
            setSubmitting(false)
            return
        }

        try {
            await updateProfile({
                phone: normalizePhoneDigits(phone) || undefined,
                cep: cep.replace(/\D/g, ''),
                state,
                city,
                bairro,
                street,
                number: semNumero ? 'S/N' : number,
                complement,
                withoutNumber: semNumero,
            })
            await refresh()
            if (!session) {
                router.push('/meus-imoveis')
                return
            }
            
            // As we updated address too, we don't need to manually patch the profileStatus here
            // if we trust the refresh(), but let's be safe.
            const refreshedSession = {
                ...session,
                profileStatus: 'complete' as const,
                user: {
                    ...session.user,
                    phone: normalizePhoneDigits(phone) || session.user.phone,
                    cep: cep.replace(/\D/g, '') || session.user.cep,
                    state: state || session.user.state,
                    city: city || session.user.city,
                    bairro: bairro || session.user.bairro,
                    street: street || session.user.street,
                    number: semNumero ? 'S/N' : number || session.user.number,
                    complement: complement || session.user.complement,
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
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8 space-y-6">
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
                        Olá, <strong>{session.user.name}</strong>! Revise seus dados
                        para poder gerar propostas e negociar imóveis.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" aria-describedby={error ? 'onboarding-error' : undefined}>
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

                    <fieldset className="space-y-4 pt-4 border-t border-slate-100">
                        <legend className="text-sm font-semibold text-slate-800 pb-2">Endereço de Cadastro</legend>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label htmlFor="cep" className="block text-xs font-medium text-slate-600">CEP *</label>
                                <input
                                    id="cep"
                                    type="text"
                                    required
                                    value={cep}
                                    onChange={(e) => setCep(formatCep(e.target.value))}
                                    onBlur={handleCepBlur}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="00000-000"
                                />
                                {cepLoading && <p role="status" aria-live="polite" className="text-xs text-primary-500">Buscando CEP...</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="state" className="block text-xs font-medium text-slate-600">Estado *</label>
                                <select
                                    id="state"
                                    required
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">UF</option>
                                    {BRAZILIAN_STATES.map((uf) => (
                                        <option key={uf} value={uf}>{uf}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label htmlFor="city" className="block text-xs font-medium text-slate-600">Cidade *</label>
                                <input
                                    id="city"
                                    type="text"
                                    required
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    maxLength={25}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Sua cidade"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="bairro" className="block text-xs font-medium text-slate-600">Bairro *</label>
                                <input
                                    id="bairro"
                                    type="text"
                                    required
                                    value={bairro}
                                    onChange={(e) => setBairro(e.target.value)}
                                    maxLength={120}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Bairro"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="street" className="block text-xs font-medium text-slate-600">Rua *</label>
                            <input
                                id="street"
                                type="text"
                                required
                                value={street}
                                onChange={(e) => setStreet(e.target.value)}
                                maxLength={120}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Nome da rua"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label htmlFor="number" className="block text-xs font-medium text-slate-600">
                                    {semNumero ? 'Número (opcional)' : 'Número *'}
                                </label>
                                <input
                                    id="number"
                                    type="text"
                                    value={number}
                                    disabled={semNumero}
                                    onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 25))}
                                    maxLength={120}
                                    inputMode="numeric"
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-400"
                                    placeholder="Nº"
                                />
                                <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={semNumero}
                                        onChange={(e) => {
                                            setSemNumero(e.target.checked)
                                            if (e.target.checked) setNumber('')
                                        }}
                                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    Sem número
                                </label>
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="complement" className="block text-xs font-medium text-slate-600">Complemento</label>
                                <input
                                    id="complement"
                                    type="text"
                                    value={complement}
                                    onChange={(e) => setComplement(e.target.value)}
                                    maxLength={120}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Apto, bloco..."
                                />
                            </div>
                        </div>
                    </fieldset>

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
