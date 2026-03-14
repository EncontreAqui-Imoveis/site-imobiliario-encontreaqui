'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { updateProfile } from '@/lib/api/user'
import type { ApiError } from '@/lib/api/client'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatPhoneInput, normalizePhoneDigits } from '@/lib/phoneInput'

const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function EditarPerfilPage() {
    const router = useRouter()
    const { session, loading: authLoading, refresh } = useUser()

    const [name, setName] = useState('')
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
    const [success, setSuccess] = useState(false)
    const [cepLoading, setCepLoading] = useState(false)

    useEffect(() => {
        if (!authLoading && !session) {
            router.replace('/auth/login?next=/perfil/editar')
        }
    }, [authLoading, session, router])

    useEffect(() => {
        if (session?.user) {
            const u = session.user
            setName(u.name || '')
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
        } catch { /* silent */ } finally { setCepLoading(false) }
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
        setSuccess(false)

        try {
            await updateProfile({
                name: name || undefined,
                phone: normalizePhoneDigits(phone) || undefined,
                cep: cep.replace(/\D/g, '') || undefined,
                street: street || undefined,
                number: number || undefined,
                complement: complement || undefined,
                bairro: bairro || undefined,
                city: city || undefined,
                state: state || undefined,
            })
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

    return (
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 pt-24">
            <div className="flex items-center gap-3 mb-6">
                <Link href="/perfil" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Editar Perfil</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 space-y-4">
                <div className="space-y-1.5">
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nome</label>
                    <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Telefone</label>
                    <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="+55 (00) 00000-0000" />
                </div>

                <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-semibold text-slate-800">Endereço</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label htmlFor="cep" className="block text-xs font-medium text-slate-600">CEP</label>
                            <input id="cep" type="text" value={cep} onChange={(e) => setCep(formatCep(e.target.value))} onBlur={handleCepBlur}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="00000-000" />
                            {cepLoading && <p className="text-xs text-primary-500">Buscando...</p>}
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="state" className="block text-xs font-medium text-slate-600">Estado</label>
                            <select id="state" value={state} onChange={(e) => setState(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option value="">UF</option>
                                {BRAZILIAN_STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label htmlFor="city" className="block text-xs font-medium text-slate-600">Cidade</label>
                            <input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="bairro" className="block text-xs font-medium text-slate-600">Bairro</label>
                            <input id="bairro" type="text" value={bairro} onChange={(e) => setBairro(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="street" className="block text-xs font-medium text-slate-600">Rua</label>
                        <input id="street" type="text" value={street} onChange={(e) => setStreet(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label htmlFor="number" className="block text-xs font-medium text-slate-600">Número</label>
                            <input id="number" type="text" value={number} onChange={(e) => setNumber(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="complement" className="block text-xs font-medium text-slate-600">Complemento</label>
                            <input id="complement" type="text" value={complement} onChange={(e) => setComplement(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                    </div>
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
