'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, ArrowLeft, MapPin, BadgeCheck, UserCircle } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useRegistration } from '@/contexts/RegistrationContext'

// Input formatter utilities (Single Responsibility)
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

// Brazilian states list
const STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

// Form step types (Interface Segregation)
type Step = 'personal' | 'address'
type UserType = 'client' | 'broker'

interface FormData {
    name: string
    email: string
    password: string
    phone: string
    creci: string
    street: string
    number: string
    complement: string
    bairro: string
    cep: string
    city: string
    state: string
}

export default function RegisterPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [step, setStep] = useState<Step>('personal')
    const [userType, setUserType] = useState<UserType>('client')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [noNumber, setNoNumber] = useState(false)

    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        password: '',
        phone: '',
        creci: '',
        street: '',
        number: '',
        complement: '',
        bairro: '',
        cep: '',
        city: '',
        state: '',
    })

    // Update form field (Open/Closed - extensible for new fields)
    const updateField = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Validate step 1 (personal info)
    const validatePersonalStep = async (): Promise<boolean> => {
        setError('')

        if (!formData.name.trim()) {
            setError('Nome é obrigatório.')
            return false
        }

        if (!formData.email.includes('@')) {
            setError('Email inválido.')
            return false
        }

        if (!draft?.googleData) {
            if (formData.password.length < 6) {
                setError('Senha deve ter no mínimo 6 caracteres.')
                return false
            }
        }

        const phoneDigits = onlyDigits(formData.phone)
        if (phoneDigits.length < 10) {
            setError('Telefone inválido.')
            return false
        }

        if (userType === 'broker') {
            const creciDigits = formData.creci.replace(/\D/g, '')
            if (creciDigits.length !== 4 && creciDigits.length !== 8) {
                setError('CRECI deve ter 4 ou 8 dígitos numéricos.')
                return false
            }
        }

        // Check if email already exists (Only for standard registration)
        if (!draft?.googleData) {
            try {
                const result = await authApi.checkEmailStatus(formData.email)
                if (result.data?.exists) {
                    setError('Este email já está cadastrado. Faça login.')
                    return false
                }
            } catch {
                // Continue if check fails
            }
        }

        return true
    }

    // Validate step 2 (address)
    const validateAddressStep = (): boolean => {
        setError('')

        if (!formData.street.trim()) {
            setError('Rua é obrigatória.')
            return false
        }

        if (!noNumber && !formData.number.trim()) {
            setError('Número é obrigatório.')
            return false
        }

        if (!formData.bairro.trim()) {
            setError('Bairro é obrigatório.')
            return false
        }

        const cepDigits = onlyDigits(formData.cep)
        if (cepDigits.length !== 8) {
            setError('CEP inválido.')
            return false
        }

        if (!formData.city.trim()) {
            setError('Cidade é obrigatória.')
            return false
        }

        if (!formData.state) {
            setError('Selecione o estado.')
            return false
        }

        return true
    }

    // Handle step 1 continue
    const handleContinue = async () => {
        setIsLoading(true)
        try {
            const isValid = await validatePersonalStep()
            if (isValid) {
                setStep('address')
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Handle final submit
    const { saveDraft, draft, isLoading: isDraftLoading } = useRegistration()

    // Hydrate form from draft
    useEffect(() => {
        if (!isDraftLoading && draft && draft.step === 'form' && draft.authData) {
            // Only hydrate if we haven't modified the form yet (or maybe we should just overwrite?)
            // For now, let's overwrite as it mimics "restoring session".
            setFormData(prev => ({
                ...prev,
                name: draft.authData.name || '',
                email: draft.authData.email || '',
                phone: draft.authData.phone ? draft.authData.phone.replace('+55', '') : '',
                street: draft.authData.street || '',
                number: draft.authData.number || '',
                complement: draft.authData.complement || '',
                bairro: draft.authData.bairro || '',
                city: draft.authData.city || '',
                state: draft.authData.state || '',
                cep: draft.authData.cep || '',
                creci: draft.authData.creci || '',
                // Password is NOT restored for security
            }))
            setUserType(draft.userType || 'client')

            // Restore step if valid
            if (draft.authData.name && draft.authData.email && draft.authData.phone) {
                // If we have address data, maybe go to step 2?
                // Let's stay on step 1 to be safe, user can click continue.
            }
        }
    }, [draft, isDraftLoading])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateAddressStep()) return

        setIsLoading(true)
        setError('')

        try {
            // Check if it's a Google Registration flow
            if (draft?.googleData) {
                // 1. Create account using Google Token WITHOUT role first
                // Pass undefined for profileType to avoid backend "Data truncated" error on status column
                const loginResult = await authApi.googleAuth(draft.googleData.idToken)

                if (loginResult.error) {
                    throw new Error(typeof loginResult.error === 'string' ? loginResult.error : 'Erro ao criar conta com Google')
                }

                const token = loginResult.data.token

                // We need to temporarily set the session to make authenticated requests
                localStorage.setItem('token', token)

                // 2. Hydrate Profile with full data AND Role
                const profileData = {
                    role: userType, // Set role here
                    phone: `+55${onlyDigits(formData.phone)}`,
                    street: formData.street,
                    number: noNumber ? '0' : formData.number,
                    complement: formData.complement,
                    bairro: formData.bairro,
                    city: formData.city,
                    state: formData.state,
                    cep: onlyDigits(formData.cep),
                    creci: userType === 'broker' ? formData.creci : undefined
                }

                const updateResult = await authApi.updateProfile(profileData)

                if (updateResult.error) {
                    console.error('Update profile error:', updateResult.error)
                }

                // 3. Update Checkpoint and Redirect to Phone Verification
                // We must NOT clear draft yet, as verification pages depend on it.
                // We need to save the phone number in the draft so the next page can use it.
                saveDraft({
                    step: 'phone_pending',
                    userType: userType,
                    authData: {
                        ...draft.authData, // keep existing google data if any
                        phone: `+55${onlyDigits(formData.phone)}`,
                        name: formData.name,
                        email: formData.email,
                        // Add address data just in case
                        street: formData.street,
                        number: noNumber ? '0' : formData.number,
                        complement: formData.complement,
                        bairro: formData.bairro,
                        city: formData.city,
                        state: formData.state,
                        cep: onlyDigits(formData.cep),
                        creci: userType === 'broker' ? formData.creci : '',
                        // Password is not needed for google auth
                        password: ''
                    },
                    googleData: draft.googleData
                })

                // Redirect to Phone Verification
                router.push('/cadastro/verificar-telefone')
                return
            }

            // Normal Registration Flow (Email/Password)
            // Save to registration draft context
            const authData = {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                phone: `+55${onlyDigits(formData.phone)}`,
                creci: userType === 'broker' ? formData.creci.trim() : '',
                street: formData.street.trim(),
                number: noNumber ? '0' : formData.number.trim(),
                complement: formData.complement.trim(),
                bairro: formData.bairro.trim(),
                cep: onlyDigits(formData.cep),
                city: formData.city.trim(),
                state: formData.state,
            }

            // Use the context's saveDraft function
            saveDraft({
                step: 'email_pending',
                userType: userType,
                authData: authData,
            })

            // Store password temporarily in sessionStorage for the verification flow
            sessionStorage.setItem('registration_password', formData.password)

            // Redirect to email verification
            router.push('/cadastro/verificar-email')
        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta. Tente novamente.')
        } finally {
            setIsLoading(false)
        }
    }


    // CEP auto-fill
    const handleCepChange = async (value: string) => {
        const formatted = formatCep(value)
        updateField('cep', formatted)

        const digits = onlyDigits(value)
        if (digits.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
                const data = await response.json()
                if (!data.erro) {
                    updateField('street', data.logradouro || '')
                    updateField('bairro', data.bairro || '')
                    updateField('city', data.localidade || '')
                    updateField('state', data.uf || '')
                }
            } catch {
                // Ignore CEP lookup errors
            }
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20">
            <div className="flex min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-5rem)] items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <Link href="/" className="flex items-center justify-center mb-8">
                        <Image
                            src="/logo2.svg"
                            alt="Encontre Aqui Imóveis"
                            width={280}
                            height={80}
                            className="h-20"
                            style={{ width: 'auto' }}
                        />
                    </Link>

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className={`w-3 h-3 rounded-full transition-colors ${step === 'personal' ? 'bg-accent-500' : 'bg-gray-300'}`} />
                        <div className={`w-8 h-0.5 ${step === 'address' ? 'bg-accent-500' : 'bg-gray-300'}`} />
                        <div className={`w-3 h-3 rounded-full transition-colors ${step === 'address' ? 'bg-accent-500' : 'bg-gray-300'}`} />
                    </div>

                    {/* Header */}
                    <div className="text-center mb-6">
                        {draft?.googleData?.photoURL && (
                            <div className="flex justify-center mb-4">
                                <Image
                                    src={draft.googleData.photoURL}
                                    alt="Sua foto"
                                    width={80}
                                    height={80}
                                    className="rounded-full border-4 border-white shadow-md"
                                />
                            </div>
                        )}

                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {step === 'personal'
                                ? (draft?.googleData ? `Olá, ${draft.googleData.displayName.split(' ')[0]}!` : 'Crie sua conta')
                                : 'Seu endereço'}
                        </h1>
                        <p className="text-gray-500">
                            {step === 'personal'
                                ? (draft?.googleData ? 'Confirme seus dados para finalizar o cadastro.' : 'Escolha seu perfil e preencha seus dados.')
                                : 'Preencha seu endereço para finalizar.'}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {step === 'personal' ? (
                        /* Step 1: Personal Info */
                        <div className="space-y-4">
                            {/* User Type Toggle */}
                            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setUserType('client')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${userType === 'client'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <UserCircle className="w-5 h-5" />
                                    Sou Cliente
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUserType('broker')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${userType === 'broker'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <BadgeCheck className="w-5 h-5" />
                                    Sou Corretor
                                </button>
                            </div>

                            {/* Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Nome completo
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => updateField('name', e.target.value)}
                                        placeholder="Seu nome"
                                        disabled={!!draft?.googleData}
                                        className={`w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${draft?.googleData ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateField('email', e.target.value)}
                                        placeholder="seu@email.com"
                                        disabled={!!draft?.googleData}
                                        className={`w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${draft?.googleData ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>

                            {/* Password - Hide for Google Users */}
                            {!draft?.googleData && (
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Senha
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) => updateField('password', e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                            className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-12 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Phone */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Telefone
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => updateField('phone', formatPhone(e.target.value))}
                                        placeholder="(64) 99999-9999"
                                        className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* CRECI (only for brokers) */}
                            {userType === 'broker' && (
                                <div>
                                    <label htmlFor="creci" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        CRECI
                                    </label>
                                    <div className="relative">
                                        <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="creci"
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={8}
                                            value={formData.creci}
                                            onChange={(e) => updateField('creci', e.target.value.replace(/\D/g, ''))}
                                            placeholder="4 ou 8 dígitos"
                                            className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">Apenas números (4 ou 8 dígitos)</p>
                                </div>
                            )}

                            {/* Continue Button */}
                            <button
                                type="button"
                                onClick={handleContinue}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-4 mt-2 bg-accent-500 hover:bg-accent-600 disabled:bg-accent-400 text-primary-900 font-semibold rounded-xl shadow-lg shadow-accent-500/25 transition-all"
                            >
                                {isLoading ? (
                                    <span className="w-5 h-5 border-2 border-primary-900/30 border-t-primary-900 rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Continuar
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-center text-gray-500 mt-2">
                                {draft?.googleData ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            localStorage.removeItem('registration_draft')
                                            router.push('/login')
                                        }}
                                        className="text-red-500 hover:text-red-700 underline"
                                    >
                                        Cancelar e usar outra conta
                                    </button>
                                ) : (
                                    'Você receberá um email para validar seu cadastro.'
                                )}
                            </p>
                        </div>
                    ) : (
                        /* Step 2: Address */
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* CEP */}
                            <div>
                                <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    CEP
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="cep"
                                        type="text"
                                        value={formData.cep}
                                        onChange={(e) => handleCepChange(e.target.value)}
                                        placeholder="00000-000"
                                        maxLength={9}
                                        className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Street */}
                            <div>
                                <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Rua
                                </label>
                                <input
                                    id="street"
                                    type="text"
                                    value={formData.street}
                                    onChange={(e) => updateField('street', e.target.value)}
                                    placeholder="Nome da rua"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Number + Complement */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label htmlFor="number" className="block text-sm font-medium text-gray-700">
                                            Número
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={noNumber}
                                                onChange={(e) => {
                                                    setNoNumber(e.target.checked)
                                                    if (e.target.checked) updateField('number', '')
                                                }}
                                                className="w-3.5 h-3.5 rounded border-gray-300 text-accent-500 focus:ring-accent-500"
                                            />
                                            <span className="text-xs text-gray-500">Sem número</span>
                                        </label>
                                    </div>
                                    <input
                                        id="number"
                                        type="text"
                                        value={formData.number}
                                        onChange={(e) => updateField('number', e.target.value.replace(/\D/g, ''))}
                                        placeholder="123"
                                        disabled={noNumber}
                                        className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${noNumber ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="complement" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Complemento
                                    </label>
                                    <input
                                        id="complement"
                                        type="text"
                                        value={formData.complement}
                                        onChange={(e) => updateField('complement', e.target.value)}
                                        placeholder="Apto, Bloco..."
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Bairro */}
                            <div>
                                <label htmlFor="bairro" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Bairro
                                </label>
                                <input
                                    id="bairro"
                                    type="text"
                                    value={formData.bairro}
                                    onChange={(e) => updateField('bairro', e.target.value)}
                                    placeholder="Nome do bairro"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* City + State */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Cidade
                                    </label>
                                    <input
                                        id="city"
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => updateField('city', e.target.value)}
                                        placeholder="Nome da cidade"
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Estado
                                    </label>
                                    <select
                                        id="state"
                                        value={formData.state}
                                        onChange={(e) => updateField('state', e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">UF</option>
                                        {STATES.map(state => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setStep('personal')}
                                    className="flex items-center justify-center gap-2 px-6 py-4 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Voltar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-accent-500 hover:bg-accent-600 disabled:bg-accent-400 text-primary-900 font-semibold rounded-xl shadow-lg shadow-accent-500/25 transition-all"
                                >
                                    {isLoading ? (
                                        <span className="w-5 h-5 border-2 border-primary-900/30 border-t-primary-900 rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Criar conta
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Login Link */}
                    <p className="mt-8 text-center text-gray-600">
                        Já tem uma conta?{' '}
                        <Link href="/login" className="text-accent-600 hover:text-accent-700 font-semibold">
                            Fazer login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
