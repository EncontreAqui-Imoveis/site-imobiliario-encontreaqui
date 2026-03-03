'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { register } from '@/lib/api/auth'
import { loginWithGooglePopup } from '@/lib/auth/googleFlow'
import { useUser } from '@/contexts/UserContext'
import type { ApiError } from '@/lib/api/client'

const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function CadastroPage() {
    const router = useRouter()
    const { refresh } = useUser()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [phone, setPhone] = useState('')
    const [cep, setCep] = useState('')
    const [street, setStreet] = useState('')
    const [number, setNumber] = useState('')
    const [complement, setComplement] = useState('')
    const [bairro, setBairro] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [cepLoading, setCepLoading] = useState(false)

    const handleCepBlur = async () => {
        const cleanCep = cep.replace(/\D/g, '')
        if (cleanCep.length !== 8) return

        setCepLoading(true)
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
            const data = await res.json()
            if (!data.erro) {
                setStreet(data.logradouro || '')
                setBairro(data.bairro || '')
                setCity(data.localidade || '')
                setState(data.uf || '')
            }
        } catch {
            // Silently fail - user can fill manually
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

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            await register({
                name,
                email,
                password,
                phone: phone.replace(/\D/g, '') || undefined,
                city: city || undefined,
                state: state || undefined,
                street: street || undefined,
                number: number || undefined,
                complement: complement || undefined,
                bairro: bairro || undefined,
                cep: cep.replace(/\D/g, '') || undefined,
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

    const handleGoogleRegister = async () => {
        setGoogleLoading(true)
        setError(null)

        try {
            await loginWithGooglePopup()
            await refresh()
            router.push('/onboarding')
        } catch {
            setError('Erro ao conectar com o Google. Tente novamente.')
        } finally {
            setGoogleLoading(false)
        }
    }

    const isLoading = submitting || googleLoading

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 to-slate-100">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8 space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Criar conta
                    </h1>
                    <p className="text-sm text-slate-600">
                        Comece informando seus dados básicos. Você poderá completar o perfil em seguida.
                    </p>
                </div>

                {/* Google Sign-Up */}
                <button
                    type="button"
                    onClick={handleGoogleRegister}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {googleLoading ? 'Conectando...' : 'Cadastrar com Google'}
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-3 text-slate-400">ou com e-mail</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nome e Email */}
                    <div className="space-y-1.5">
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                            Nome completo *
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
                            E-mail *
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
                            Senha *
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Mínimo 8 caracteres"
                        />
                    </div>

                    {/* Telefone */}
                    <div className="space-y-1.5">
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                            Telefone
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(formatPhone(e.target.value))}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="(00) 00000-0000"
                        />
                    </div>

                    {/* Endereço */}
                    <div className="space-y-3 pt-2">
                        <h3 className="text-sm font-semibold text-slate-800">Endereço</h3>
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
                                {cepLoading && <p className="text-xs text-primary-500">Buscando CEP...</p>}
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
                                    id="city"
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Sua cidade"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="bairro" className="block text-xs font-medium text-slate-600">Bairro</label>
                                <input
                                    id="bairro"
                                    type="text"
                                    value={bairro}
                                    onChange={(e) => setBairro(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Bairro"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="street" className="block text-xs font-medium text-slate-600">Rua</label>
                            <input
                                id="street"
                                type="text"
                                value={street}
                                onChange={(e) => setStreet(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Nome da rua"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label htmlFor="number" className="block text-xs font-medium text-slate-600">Número</label>
                                <input
                                    id="number"
                                    type="text"
                                    value={number}
                                    onChange={(e) => setNumber(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Nº"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="complement" className="block text-xs font-medium text-slate-600">Complemento</label>
                                <input
                                    id="complement"
                                    type="text"
                                    value={complement}
                                    onChange={(e) => setComplement(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Apto, bloco..."
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
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
