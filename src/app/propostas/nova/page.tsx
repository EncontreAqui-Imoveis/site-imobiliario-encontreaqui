'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import {
    createProposal,
    fetchProposalTargetProperty,
    searchApprovedBrokers,
    type ApprovedBrokerLookup,
} from '@/lib/negotiationsService'
import { Property, formatPrice } from '@/types/property'
import {
    ArrowLeft, ArrowRight, Loader2, FileText, User, CreditCard,
    DollarSign, Percent, Wand2, CheckCircle, AlertTriangle, Home, ChevronRight,
    Search, ShieldCheck
} from 'lucide-react'

/* ─── Types ─── */

type PaymentUnit = 'reais' | 'percent'

interface PaymentField {
    value: string
    unit: PaymentUnit
}

/* ─── Helpers ─── */

function parseLocalized(raw: string): number {
    let n = raw.replace(/[^\d,.\-]/g, '').trim()
    if (!n) return 0
    const lastComma = n.lastIndexOf(',')
    const lastDot = n.lastIndexOf('.')
    if (lastComma > lastDot) {
        n = n.replaceAll('.', '').replace(',', '.')
    } else if (lastDot > lastComma) {
        n = n.replaceAll(',', '')
    }
    return parseFloat(n) || 0
}

function toReais(field: PaymentField, propertyValue: number): number {
    const raw = parseLocalized(field.value)
    if (field.unit === 'percent') return (raw / 100) * propertyValue
    return raw
}

function toPercent(field: PaymentField, propertyValue: number): number {
    const raw = parseLocalized(field.value)
    if (field.unit === 'reais' && propertyValue > 0) return (raw / propertyValue) * 100
    return raw
}

function formatCPF(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/* ─── Component ─── */

export default function ProposalWizardPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const propertyId = searchParams.get('propertyId')
    const { session, loading: authLoading, isBroker } = useUser()

    /* ── State ── */
    const [property, setProperty] = useState<Property | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [step, setStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    // Step 1: Client data
    const [clientName, setClientName] = useState('')
    const [clientCpf, setClientCpf] = useState('')
    const [isSelfBroker, setIsSelfBroker] = useState(true)
    const [brokerSearch, setBrokerSearch] = useState('')
    const [brokerResults, setBrokerResults] = useState<ApprovedBrokerLookup[]>([])
    const [selectedBroker, setSelectedBroker] = useState<ApprovedBrokerLookup | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const searchTimer = useRef<NodeJS.Timeout | null>(null)

    // Step 2: Payment composition
    const [payments, setPayments] = useState<Record<string, PaymentField>>({
        dinheiro: { value: '', unit: 'reais' },
        permuta: { value: '', unit: 'reais' },
        financiamento: { value: '', unit: 'percent' },
        outros: { value: '', unit: 'reais' },
    })

    /* ── Auth guard ── */
    useEffect(() => {
        if (!authLoading && !session) {
            router.replace(`/auth/login?next=/propostas/nova?propertyId=${propertyId}`)
        }
    }, [authLoading, session, router, propertyId])

    /* ── Load property ── */
    useEffect(() => {
        const currentPropertyId = propertyId ?? ''
        if (!currentPropertyId) return
        async function load() {
            try {
                const loadedProperty = await fetchProposalTargetProperty(currentPropertyId)
                setProperty(loadedProperty)
            } catch {
                setLoadError('Não foi possível carregar o imóvel.')
            }
        }
        load()
    }, [propertyId])

    /* ── Broker search ── */
    const searchBrokers = useCallback(async (query: string) => {
        if (query.trim().length < 2) {
            setBrokerResults([])
            return
        }
        setIsSearching(true)
        try {
            const items = await searchApprovedBrokers(query)
            setBrokerResults(items)
        } catch {
            setBrokerResults([])
        } finally {
            setIsSearching(false)
        }
    }, [])

    function handleBrokerSearch(query: string) {
        setBrokerSearch(query)
        if (selectedBroker && query !== selectedBroker.name) setSelectedBroker(null)
        if (searchTimer.current) clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => searchBrokers(query), 300)
    }

    /* ── Payment math ── */
    const propertyValue = property
        ? (property.priceSale && property.priceSale > 0 ? property.priceSale
            : property.priceRent && property.priceRent > 0 ? property.priceRent
                : Math.max(property.price, 0))
        : 0

    const totalAllocated = Object.values(payments).reduce((sum, f) => sum + toReais(f, propertyValue), 0)
    const remaining = propertyValue - totalAllocated
    const isBalanced = Math.abs(remaining) < 0.01

    function updatePayment(key: string, value: string) {
        setPayments(prev => ({ ...prev, [key]: { ...prev[key], value } }))
    }

    function toggleUnit(key: string) {
        setPayments(prev => {
            const field = prev[key]
            const amountInReais = toReais(field, propertyValue)
            const newUnit: PaymentUnit = field.unit === 'reais' ? 'percent' : 'reais'
            let newValue = ''
            if (newUnit === 'percent' && propertyValue > 0) {
                newValue = ((amountInReais / propertyValue) * 100).toFixed(1).replace('.', ',')
            } else {
                newValue = amountInReais.toFixed(2).replace('.', ',')
            }
            return { ...prev, [key]: { value: newValue, unit: newUnit } }
        })
    }

    function autoFillRemaining(targetKey: string) {
        const otherTotal = Object.entries(payments)
            .filter(([k]) => k !== targetKey)
            .reduce((sum, [, f]) => sum + toReais(f, propertyValue), 0)
        const rem = Math.max(propertyValue - otherTotal, 0)
        const field = payments[targetKey]
        let newValue: string
        if (field.unit === 'percent' && propertyValue > 0) {
            newValue = ((rem / propertyValue) * 100).toFixed(1).replace('.', ',')
        } else {
            newValue = rem.toFixed(2).replace('.', ',')
        }
        setPayments(prev => ({ ...prev, [targetKey]: { ...prev[targetKey], value: newValue } }))
    }

    /* ── Validation ── */
    const cpfDigits = clientCpf.replace(/\D/g, '')
    const isStep1Valid = clientName.trim().length > 0 && cpfDigits.length === 11 && (isSelfBroker || selectedBroker !== null)
    const canSubmit = !isSubmitting && isStep1Valid && isBalanced

    /* ── Submit ── */
    async function handleSubmit() {
        if (!canSubmit || !property) return

        const confirmed = window.confirm(
            'Após gerar a proposta, ela não pode ser alterada. Tem certeza dos dados?'
        )
        if (!confirmed) return

        setIsSubmitting(true)
        setSubmitError(null)
        try {
            await createProposal({
                propertyId: property.id,
                clientName: clientName.trim(),
                clientCpf: cpfDigits,
                validadeDias: 10,
                ...((!isSelfBroker && selectedBroker) ? { sellerBrokerId: selectedBroker.id } : {}),
                pagamento: {
                    dinheiro: toReais(payments.dinheiro, propertyValue),
                    permuta: toReais(payments.permuta, propertyValue),
                    financiamento: toReais(payments.financiamento, propertyValue),
                    outros: toReais(payments.outros, propertyValue),
                },
            })
            router.push('/propostas?created=1')
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao gerar proposta.'
            setSubmitError(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    /* ── Navigation ── */
    function goNext() {
        if (step === 0 && isStep1Valid) setStep(1)
        if (step === 1 && canSubmit) handleSubmit()
    }

    function goBack() {
        if (step > 0) setStep(step - 1)
    }

    /* ── Render guards ── */
    if (authLoading || !session) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        )
    }

    if (!isBroker) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="text-center space-y-4 max-w-md">
                    <ShieldCheck className="w-16 h-16 mx-auto text-amber-400" />
                    <h1 className="text-xl font-bold text-gray-900">Acesso restrito a corretores</h1>
                    <p className="text-gray-500">Apenas corretores podem gerar propostas.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                        Voltar ao início
                    </Link>
                </div>
            </div>
        )
    }

    if (loadError || !propertyId) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="text-center space-y-4">
                    <AlertTriangle className="w-16 h-16 mx-auto text-red-400" />
                    <h1 className="text-xl font-bold text-gray-900">{loadError || 'Imóvel não especificado'}</h1>
                    <Link href="/meus-imoveis" className="text-primary-600 font-semibold hover:underline">Ir para meus imóveis</Link>
                </div>
            </div>
        )
    }

    if (!property) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="space-y-3 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
                    <p className="text-sm text-gray-500">Carregando imóvel...</p>
                </div>
            </div>
        )
    }

    /* ─── Render ─── */

    const paymentLabels: Record<string, { label: string; icon: typeof DollarSign }> = {
        dinheiro: { label: 'Dinheiro', icon: DollarSign },
        permuta: { label: 'Permuta', icon: CreditCard },
        financiamento: { label: 'Financiamento', icon: CreditCard },
        outros: { label: 'Outros', icon: CreditCard },
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link href="/" className="hover:text-primary-600 transition-colors"><Home className="w-4 h-4" /></Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link href={`/imoveis/${property.id}`} className="hover:text-primary-600 transition-colors truncate max-w-[200px]">{property.title}</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-gray-900 font-medium">Gerar Proposta</span>
                </nav>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-accent-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Gerar Proposta</h1>
                    </div>
                    <p className="text-sm text-gray-500">
                        {property.title} — {formatPrice(propertyValue)}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2 mb-8">
                    {[0, 1].map(i => (
                        <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-accent-500' : 'bg-gray-200'}`}
                        />
                    ))}
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    {step === 0 ? (
                        /* ═══ STEP 1: Client Data ═══ */
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                                <User className="w-5 h-5 text-primary-500" />
                                Dados do Cliente
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente *</label>
                                    <input
                                        type="text"
                                        value={clientName}
                                        onChange={e => setClientName(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Nome completo do comprador"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
                                    <input
                                        type="text"
                                        value={clientCpf}
                                        onChange={e => setClientCpf(formatCPF(e.target.value))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        placeholder="000.000.000-00"
                                        maxLength={14}
                                    />
                                    {clientCpf && cpfDigits.length !== 11 && (
                                        <p className="text-xs text-red-500 mt-1">Informe um CPF válido (11 dígitos).</p>
                                    )}
                                </div>
                            </div>

                            {/* Broker selection */}
                            <div className="pt-4 border-t border-gray-100">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isSelfBroker}
                                        onChange={e => {
                                            setIsSelfBroker(e.target.checked)
                                            if (e.target.checked) {
                                                setSelectedBroker(null)
                                                setBrokerSearch('')
                                                setBrokerResults([])
                                            }
                                        }}
                                        className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Eu sou o corretor vendedor</span>
                                </label>
                                <p className="text-xs text-gray-400 mt-2">
                                    Caso o corretor vendedor for diferente, ele precisa estar cadastrado e aprovado no sistema.
                                </p>

                                {!isSelfBroker && (
                                    <div className="mt-4 space-y-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={brokerSearch}
                                                onChange={e => handleBrokerSearch(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                                placeholder="Buscar por nome, email ou CRECI"
                                            />
                                        </div>

                                        {isSearching && (
                                            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary-500 rounded-full animate-pulse w-1/2" />
                                            </div>
                                        )}

                                        {selectedBroker && (
                                            <p className="text-sm font-semibold text-green-700 flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4" />
                                                Selecionado: {selectedBroker.name}
                                            </p>
                                        )}

                                        {brokerResults.length > 0 && !selectedBroker && (
                                            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                                                {brokerResults.map(broker => (
                                                    <button
                                                        key={broker.id}
                                                        onClick={() => {
                                                            setSelectedBroker(broker)
                                                            setBrokerSearch(broker.name)
                                                            setBrokerResults([])
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors"
                                                    >
                                                        <p className="text-sm font-semibold text-gray-900">{broker.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {[
                                                                broker.creci && `CRECI ${broker.creci}`,
                                                                broker.email,
                                                            ].filter(Boolean).join(' • ')}
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* ═══ STEP 2: Payment Composition ═══ */
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                                <CreditCard className="w-5 h-5 text-primary-500" />
                                Composição do Pagamento
                            </div>

                            {/* Summary */}
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Valor do Imóvel</span>
                                    <span className="font-bold text-gray-900">{formatPrice(propertyValue)}</span>
                                </div>
                                <div className={`flex justify-between text-sm ${isBalanced ? 'text-green-700' : remaining > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                    <span>Falta Alocar</span>
                                    <span className="font-bold">
                                        {formatPrice(Math.abs(remaining))}
                                        {remaining < -0.01 && ' (excedido)'}
                                    </span>
                                </div>
                                {isBalanced && (
                                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Pagamento balanceado
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-gray-400">
                                Após o PDF ser gerado, o cliente e o corretor devem assinar o documento e enviá-lo pelo sistema.
                            </p>

                            {/* Payment Fields */}
                            <div className="space-y-4">
                                {Object.entries(payments).map(([key, field]) => {
                                    const { label } = paymentLabels[key]
                                    const reaisAmount = toReais(field, propertyValue)
                                    const percentAmount = toPercent(field, propertyValue)
                                    const helper = field.unit === 'percent'
                                        ? `= ${formatPrice(reaisAmount)}`
                                        : `= ${percentAmount.toFixed(1)}%`

                                    return (
                                        <div key={key} className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-700">{label}</label>
                                            <div className="flex gap-2">
                                                <div className="flex-1 relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                                        {field.unit === 'reais' ? 'R$' : '%'}
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={field.value}
                                                        onChange={e => updatePayment(key, e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                                        placeholder="0,00"
                                                        inputMode="decimal"
                                                    />
                                                </div>

                                                {/* Unit toggle */}
                                                <button
                                                    onClick={() => toggleUnit(key)}
                                                    className="px-3 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1 text-sm font-medium text-gray-600"
                                                    title={field.unit === 'reais' ? 'Mudar para %' : 'Mudar para R$'}
                                                >
                                                    {field.unit === 'reais' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                                </button>

                                                {/* Auto-fill */}
                                                <button
                                                    onClick={() => autoFillRemaining(key)}
                                                    className="px-3 py-3 border border-gray-200 rounded-xl hover:bg-accent-50 hover:border-accent-200 transition-colors text-gray-500 hover:text-accent-600"
                                                    title="Preencher com restante"
                                                >
                                                    <Wand2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-400">{helper}</p>
                                        </div>
                                    )
                                })}
                            </div>

                            {submitError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700">{submitError}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="p-6 pt-0 flex gap-3">
                        {step > 0 && (
                            <button
                                onClick={goBack}
                                disabled={isSubmitting}
                                className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar
                            </button>
                        )}
                        <button
                            onClick={goNext}
                            disabled={step === 0 ? !isStep1Valid : !canSubmit}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:shadow-none ${step === 1
                                ? 'bg-accent-500 hover:bg-accent-600 text-primary-900 shadow-accent-500/25'
                                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/25'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Gerando...
                                </>
                            ) : step === 1 ? (
                                <>
                                    <FileText className="w-4 h-4" />
                                    Gerar Proposta
                                </>
                            ) : (
                                <>
                                    Próximo
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
