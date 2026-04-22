'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Property } from '@/types/property'
import { formatPrice } from '@/types/property'
import type { PaymentDetails } from '@/lib/api/negotiations'
import { createProposal } from '@/lib/api/negotiations'
import type { ApiError } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import { maskCpf } from '@/lib/privacy'
import { CurrencyInput } from '@/components/form/CurrencyInput'
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currencyInput'
import { useUser } from '@/contexts/UserContext'

interface ProposalWizardProps {
    property: Property
}

type Step = 1 | 2 | 3

export function ProposalWizard({ property }: ProposalWizardProps) {
    const router = useRouter()
    const { session, loading: authLoading } = useUser()
    const [step, setStep] = useState<Step>(1)
    const [clientName, setClientName] = useState('')
    const [clientCpf, setClientCpf] = useState('')

    const formatCpf = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 11)
        if (digits.length <= 3) return digits
        if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
        if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
    }

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 10)
    const [paymentDisplay, setPaymentDisplay] = useState<Record<keyof PaymentDetails, string>>({
        dinheiro: '',
        financiamento: '',
        permuta: '',
        outros: '',
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const propertyValue = useMemo(() => {
        return property.priceSale ?? property.price
    }, [property.priceSale, property.price])
    const userRole = String(session?.user?.role ?? '').trim().toLowerCase()
    const isClientUser = userRole === 'client'
    const isBrokerUser = userRole === 'broker'
    const isClientOwnListing = Boolean(
        isClientUser &&
        session?.user?.id != null &&
        (property.ownerId === session.user.id || property.brokerId === session.user.id)
    )

    const canGenerateProposal =
        Boolean(
            !authLoading &&
            session?.user?.id != null &&
            (isClientUser || isBrokerUser) &&
            property.status === 'approved' &&
            !isClientOwnListing
        )

    useEffect(() => {
        if (authLoading || canGenerateProposal) return
        router.replace(`/imoveis/${property.id}?proposalBlocked=1`)
    }, [authLoading, canGenerateProposal, property.id, router])

    const payment = useMemo<PaymentDetails>(
        () => ({
            dinheiro: parseCurrencyInput(paymentDisplay.dinheiro),
            financiamento: parseCurrencyInput(paymentDisplay.financiamento),
            permuta: parseCurrencyInput(paymentDisplay.permuta),
            outros: parseCurrencyInput(paymentDisplay.outros),
        }),
        [paymentDisplay],
    )

    const paymentTotal = useMemo(
        () => payment.dinheiro + payment.financiamento + payment.permuta + payment.outros,
        [payment],
    )

    const hasMathMismatch = Math.round(paymentTotal * 100) !== Math.round(propertyValue * 100)

    const canAdvanceFromStep1 = clientName.trim().length > 0 && clientCpf.trim().length >= 11
    const canAdvanceFromStep2 = !hasMathMismatch && propertyValue > 0

    const goNext = () => {
        if (step === 1 && canAdvanceFromStep1) setStep(2)
        if (step === 2 && canAdvanceFromStep2) setStep(3)
    }

    const goBack = () => {
        if (step === 2) setStep(1)
        if (step === 3) setStep(2)
    }

    const handleChangePayment = (field: keyof PaymentDetails, value: string) => {
        setPaymentDisplay((prev) => ({ ...prev, [field]: formatCurrencyInput(value) }))
    }

    const handleSubmit = async () => {
        setSubmitting(true)
        setError(null)

        try {
            const response = await createProposal({
                propertyId: property.id,
                clientName: clientName.trim() || undefined,
                clientCpf: clientCpf.replace(/\D/g, '').trim() || undefined,
                payment,
            })

            const negotiationId = response.negotiation.id
            router.push(`/propostas/${encodeURIComponent(negotiationId)}/upload-assinada`)
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr) {
                if (apiErr.status === 400 || apiErr.status === 409) {
                    setError(apiErr.message || 'Não foi possível gerar a proposta. Verifique os valores.')
                } else if (apiErr.status === 401 || apiErr.status === 403) {
                    setError('Sua sessão expirou ou você não tem permissão para gerar propostas.')
                } else {
                    setError('Ocorreu um erro ao gerar a proposta.')
                }
            } else {
                setError('Ocorreu um erro ao gerar a proposta.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        !canGenerateProposal ? (
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-6 md:p-8 space-y-4">
                <p className="text-sm text-slate-600">
                    Clientes e corretores podem gerar proposta em imóveis aprovados de terceiros.
                </p>
                <p className="text-sm text-slate-500">Redirecionando para o imóvel...</p>
            </div>
        ) : (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-6 md:p-8 space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900">
                    Gerar proposta para {property.title}
                </h1>
                <p className="text-sm text-slate-600">
                    Valor base do imóvel:&nbsp;
                    <span className="font-semibold">
                        {formatPrice(propertyValue)}
                    </span>
                    &nbsp;(somente leitura, definido pelo backend).
                </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-600" aria-label="Etapas da proposta">
                <span className={`px-2.5 py-1 rounded-full ${step === 1 ? 'bg-primary-600 text-white' : 'bg-slate-100'}`}>
                    1. Dados do cliente
                </span>
                <span className={`px-2.5 py-1 rounded-full ${step === 2 ? 'bg-primary-600 text-white' : 'bg-slate-100'}`}>
                    2. Condições de pagamento
                </span>
                <span className={`px-2.5 py-1 rounded-full ${step === 3 ? 'bg-primary-600 text-white' : 'bg-slate-100'}`}>
                    3. Revisão
                </span>
            </div>

            {step === 1 && (
                <section className="space-y-4" aria-labelledby="proposal-step-client">
                    <h2 id="proposal-step-client" className="text-sm font-semibold text-slate-800">
                        Informações do cliente
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-slate-700">
                                Nome completo
                            </label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                maxLength={120}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Nome do comprador"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-slate-700">
                                CPF
                            </label>
                            <input
                                type="text"
                                value={clientCpf}
                                onChange={(e) => setClientCpf(formatCpf(e.target.value))}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="000.000.000-00"
                                maxLength={14}
                            />
                        </div>
                    </div>
                </section>
            )}

            {step === 2 && (
                <section className="space-y-4" aria-labelledby="proposal-step-payment">
                    <h2 id="proposal-step-payment" className="text-sm font-semibold text-slate-800">
                        Condições de pagamento
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {([
                            ['dinheiro', 'Entrada / dinheiro'],
                            ['financiamento', 'Financiamento'],
                            ['permuta', 'Permuta'],
                            ['outros', 'Outros'],
                        ] as const).map(([field, label]) => (
                            <div key={field} className="space-y-1.5">
                                <label className="block text-xs font-medium text-slate-700">
                                    {label}
                                </label>
                                <CurrencyInput
                                    value={paymentDisplay[field]}
                                    onChange={(value) => handleChangePayment(field, value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="R$ 0,00"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="text-sm text-slate-700 space-y-1.5">
                        <p>
                            Soma das condições:&nbsp;
                            <span className="font-semibold">
                                {formatPrice(paymentTotal)}
                            </span>
                        </p>
                        <p>
                            Valor do imóvel:&nbsp;
                            <span className="font-semibold">
                                {formatPrice(propertyValue)}
                            </span>
                        </p>
                        {hasMathMismatch && (
                            <p role="status" aria-live="polite" className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mt-1">
                                A soma das condições precisa bater exatamente com o valor do imóvel antes de enviar.
                            </p>
                        )}
                    </div>
                </section>
            )}

            {step === 3 && (
                <section className="space-y-4" aria-labelledby="proposal-step-review">
                    <h2 id="proposal-step-review" className="text-sm font-semibold text-slate-800">
                        Revisão da proposta
                    </h2>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm space-y-1.5">
                        <p>
                            <span className="font-medium text-slate-700">Imóvel:</span>{' '}
                            {property.title} ({formatPrice(propertyValue)})
                        </p>
                        <p>
                            <span className="font-medium text-slate-700">Cliente:</span>{' '}
                            {clientName || '—'} {clientCpf && `(${maskCpf(clientCpf)})`}
                        </p>
                        <p>
                            <span className="font-medium text-slate-700">Pagamento:</span>{' '}
                            dinheiro {formatPrice(payment.dinheiro)} · financiamento {formatPrice(payment.financiamento)} · permuta {formatPrice(payment.permuta)} · outros {formatPrice(payment.outros)}
                        </p>
                        <p>
                            <span className="font-medium text-slate-700">Total:</span>{' '}
                            {formatPrice(paymentTotal)}
                        </p>
                        <p>
                            <span className="font-medium text-slate-700">Validade:</span>{' '}
                            10 dias (até {validUntil.toLocaleDateString('pt-BR')})
                        </p>
                    </div>
                </section>
            )}

            {error && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    {error}
                </p>
            )}

            <div className="flex justify-between items-center pt-2">
                <button
                    type="button"
                    onClick={goBack}
                    disabled={step === 1}
                    className="text-sm text-slate-600 hover:text-slate-800 disabled:text-slate-300"
                >
                    Voltar
                </button>
                <div className="flex gap-3">
                    {step < 3 && (
                        <button
                            type="button"
                            onClick={goNext}
                            disabled={(step === 1 && !canAdvanceFromStep1) || (step === 2 && !canAdvanceFromStep2)}
                            className="inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                        >
                            Avançar
                        </button>
                    )}
                    {step === 3 && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                        >
                            {submitting ? 'Gerando proposta...' : 'Gerar proposta'}
                        </button>
                    )}
                </div>
            </div>
        </div>
        )
    )
}

