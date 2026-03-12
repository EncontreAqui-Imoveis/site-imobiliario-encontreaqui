'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { updateProfile } from '@/lib/api/user'
import type { ApiError } from '@/lib/api/client'
import { UserCircle, CheckCircle } from 'lucide-react'

const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function OnboardingPage() {
    const router = useRouter()
    const { session, loading, refresh, isProfileComplete } = useUser()

    const [phone, setPhone] = useState('')
    const [cep, setCep] = useState('')
    const [street, setStreet] = useState('')
    const [number, setNumber] = useState('')
    const [complement, setComplement] = useState('')
    const [bairro, setBairro] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [cepLoading, setCepLoading] = useState(false)

    useEffect(() => {
        if (!loading && !session) {
            router.replace('/auth/login?next=/onboarding')
        }
    }, [loading, session, router])

    // Pre-fill from existing user data
    useEffect(() => {
        if (session?.user) {
            const u = session.user
            setPhone(u.phone || '')
            setCep(u.cep || '')
            setStreet(u.street || '')
            setNumber(u.number || '')
            setComplement(u.complement || '')
            setBairro(u.bairro || '')
            setCity(u.city || '')
            setState(u.state || '')
        }
    }, [session])

    const handleCepBlur = async () => {
        const cleanCep = cep.replace(/\D/g, '')
        if (cleanCep.length !== 8) return

        setCepLoading(true)
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
            const data = await res.json()
            if (!data.erro) {
                setStreet(data.logradouro || street)
                setBairro(data.bairro || bairro)
                setCity(data.localidade || city)
                setState(data.uf || state)
            }
        } catch {
            // silently fail
        } finally {
            setCepLoading(false)
        }
    }

    const formatPhone = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 11)
        if (digits.length <= 2) return digits
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    }

    const formatCep = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 8)
        if (digits.length <= 5) return digits
        return `${digits.slice(0, 5)}-${digits.slice(5)}`
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            await updateProfile({
                phone: phone.replace(/\D/g, '') || undefined,
                cep: cep.replace(/\D/g, '') || undefined,
                street: street || undefined,
                number: number || undefined,
                complement: complement || undefined,
                bairro: bairro || undefined,
                city: city || undefined,
                state: state || undefined,
            })
            await refresh()
            router.push('/meus-imoveis')
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
                        Olá, <strong>{session.user.name}</strong>! Preencha seus dados de contato e endereço
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
                            onChange={(e) => setPhone(formatPhone(e.target.value))}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="(00) 00000-0000"
                        />
                    </div>

                    {/* Endereço */}
                    <fieldset className="space-y-3 pt-2">
                        <legend className="text-sm font-semibold text-slate-800">Endereço</legend>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label htmlFor="cep" className="block text-xs font-medium text-slate-600">CEP</label>
                                <input
                                    id="cep"
                                    type="text"
                                    value={cep}
                                    onChange={(e) => setCep(formatCep(e.target.value))}
                                    onBlur={handleCepBlur}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="00000-000"
                                />
                                {cepLoading && <p role="status" aria-live="polite" className="text-xs text-primary-500">Buscando CEP...</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="state" className="block text-xs font-medium text-slate-600">Estado</label>
                                <select
                                    id="state"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">UF</option>
                                    {BRAZILIAN_STATES.map(uf => (
                                        <option key={uf} value={uf}>{uf}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label htmlFor="city" className="block text-xs font-medium text-slate-600">Cidade</label>
                                <input
                                    id="city" type="text" value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Sua cidade"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="bairro" className="block text-xs font-medium text-slate-600">Bairro</label>
                                <input
                                    id="bairro" type="text" value={bairro}
                                    onChange={(e) => setBairro(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Bairro"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="street" className="block text-xs font-medium text-slate-600">Rua</label>
                            <input
                                id="street" type="text" value={street}
                                onChange={(e) => setStreet(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Nome da rua"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label htmlFor="number" className="block text-xs font-medium text-slate-600">Número</label>
                                <input
                                    id="number" type="text" value={number}
                                    onChange={(e) => setNumber(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Nº"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="complement" className="block text-xs font-medium text-slate-600">Complemento</label>
                                <input
                                    id="complement" type="text" value={complement}
                                    onChange={(e) => setComplement(e.target.value)}
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
