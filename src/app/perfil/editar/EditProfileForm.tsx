'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Phone, MapPin, Building2, Save, ArrowLeft, Loader2 } from 'lucide-react'

// Input formatters
const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`
}

const onlyDigits = (value: string) => value.replace(/\D/g, '')

const STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

export default function EditProfilePage() {
    const router = useRouter()
    const { user, updateProfile, isAuthenticated, isLoading: authLoading } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        street: '',
        number: '',
        complement: '',
        bairro: '',
        city: '',
        state: '',
        cep: '',
        creci: '',
    })

    // Load user data
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/perfil/editar')
            return
        }

        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone ? formatPhone(user.phone.replace('+55', '')) : '', // Assume formatPhone handles correctly or use raw
                street: user.street || '',
                number: user.number || '',
                complement: user.complement || '',
                bairro: user.bairro || '',
                city: user.city || '',
                state: user.state || '',
                cep: user.cep ? formatCep(user.cep) : '',
                creci: user.creci || '',
            })
        }
    }, [user, authLoading, isAuthenticated, router])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        let finalValue = value

        if (name === 'phone') finalValue = formatPhone(value)
        if (name === 'cep') finalValue = formatCep(value)

        setFormData(prev => ({ ...prev, [name]: finalValue }))
    }

    const validate = () => {
        if (!formData.phone || onlyDigits(formData.phone).length < 10) {
            setError('Telefone válido é obrigatório')
            return false
        }
        if (!formData.street || !formData.number || !formData.bairro || !formData.city || !formData.state || !formData.cep) {
            setError('Endereço completo é obrigatório')
            return false
        }
        if (user?.role === 'broker' && (!formData.creci || formData.creci.length < 4)) {
            setError('CRECI é obrigatório para corretores')
            return false
        }
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        setIsLoading(true)
        setError('')

        try {
            const profileData = {
                phone: `+55${onlyDigits(formData.phone)}`,
                street: formData.street,
                number: formData.number,
                complement: formData.complement,
                bairro: formData.bairro,
                city: formData.city,
                state: formData.state,
                cep: onlyDigits(formData.cep),
                creci: user?.role === 'broker' ? formData.creci : undefined
            }

            // Using direct API call if AuthContext doesn't expose updateProfile fully yet, 
            // but assuming context refreshes user state. 
            // Wait, useAuth from context might not have updateProfile exposed yet.
            // Checking AuthContext... it has updateProfile in API but maybe not in context interface?
            // Let's use api directly and then reload user? 
            // Better: update api.ts to include updateProfile (it does) and then reload session.

            // Use context method which updates local state
            const result = await updateProfile(profileData)

            if (!result.success) {
                throw new Error(result.error || 'Erro ao atualizar perfil')
            }

            // Redirect based on completion
            // If user needed to verify phone and now it is set, maybe go there?
            // For now, simpler redirect.
            if (profileData.phone && user?.phone !== profileData.phone) {
                router.push('/cadastro/verificar-telefone')
            } else {
                router.push('/')
            }

        } catch (err: any) {
            setError(err.message || 'Erro ao salvar alterações')
        } finally {
            setIsLoading(false)
        }
    }

    // Address lookup by CEP
    const handleBlurCep = async () => {
        const cep = onlyDigits(formData.cep)
        if (cep.length !== 8) return

        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
            const data = await res.json()
            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    street: data.logradouro,
                    bairro: data.bairro,
                    city: data.localidade,
                    state: data.uf
                }))
            }
        } catch (err) {
            console.error('Error fetching CEP:', err)
        }
    }

    if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Voltar
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Completar Cadastro</h1>
                        <p className="text-gray-500 mb-8">Precisamos de alguns dados adicionais para finalizar seu perfil.</p>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 flex items-center">
                                <span className="mr-2">⚠️</span> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Read-only fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={formData.name}
                                        disabled
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                                    <input
                                        id="email"
                                        type="text"
                                        value={formData.email}
                                        disabled
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-100 my-6"></div>

                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Phone className="w-5 h-5 text-gray-400" />
                                Contato
                            </h2>

                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">Telefone Celular</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="(00) 00000-0000"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <div className="border-t border-gray-100 my-6"></div>

                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                Endereço
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-1.5">CEP</label>
                                    <input
                                        id="cep"
                                        type="text"
                                        name="cep"
                                        value={formData.cep}
                                        onChange={handleChange}
                                        onBlur={handleBlurCep}
                                        placeholder="00000-000"
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
                                    <select
                                        id="state"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option value="">Selecione...</option>
                                        {STATES.map(uf => (
                                            <option key={uf} value={uf}>{uf}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">Cidade</label>
                                    <input
                                        id="city"
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1.5">Rua</label>
                                    <input
                                        id="street"
                                        type="text"
                                        name="street"
                                        value={formData.street}
                                        onChange={handleChange}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1.5">Número</label>
                                    <input
                                        id="number"
                                        type="text"
                                        name="number"
                                        value={formData.number}
                                        onChange={handleChange}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="complement" className="block text-sm font-medium text-gray-700 mb-1.5">Complemento</label>
                                    <input
                                        id="complement"
                                        type="text"
                                        name="complement"
                                        value={formData.complement}
                                        onChange={handleChange}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="bairro" className="block text-sm font-medium text-gray-700 mb-1.5">Bairro</label>
                                    <input
                                        id="bairro"
                                        type="text"
                                        name="bairro"
                                        value={formData.bairro}
                                        onChange={handleChange}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Broker Specific */}
                            {user?.role === 'broker' && (
                                <>
                                    <div className="border-t border-gray-100 my-6"></div>
                                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-gray-400" />
                                        Dados Profissionais
                                    </h2>
                                    <div>
                                        <label htmlFor="creci" className="block text-sm font-medium text-gray-700 mb-1.5">CRECI</label>
                                        <input
                                            id="creci"
                                            type="text"
                                            name="creci"
                                            value={formData.creci}
                                            onChange={handleChange}
                                            placeholder="00000-F"
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 bg-primary-900 hover:bg-primary-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-primary-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Salvar Alterações
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
