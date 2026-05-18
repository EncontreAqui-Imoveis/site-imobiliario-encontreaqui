'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, FileText, Briefcase, File, RefreshCw, ArrowRight } from 'lucide-react'

import { useUser } from '@/contexts/UserContext'
import { resolveOperationalGateRoute } from '@/lib/auth/routeResolution'
import { fetchMyNegotiations } from '@/lib/negotiationsService'
import { getMyContracts } from '@/lib/api/contracts'
import { getStatusLabel, resolveProposalBucket, isProposalPreSignatureStatus, isProposalRefusedStatus } from '@/types/negotiation'
import type { NegotiationSummary } from '@/types/negotiation'
import type { ContractSummary } from '@/types/contract'

type DocumentTab = 'propostas' | 'contratos'

const TABS: Array<{ value: DocumentTab; label: string }> = [
    { value: 'propostas', label: 'Propostas' },
    { value: 'contratos', label: 'Contratos' },
]

export default function DocumentosPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { session, loading: authLoading } = useUser()
    const [proposals, setProposals] = useState<NegotiationSummary[]>([])
    const [contracts, setContracts] = useState<ContractSummary[]>([])
    const [loadingPropostas, setLoadingPropostas] = useState(false)
    const [loadingContratos, setLoadingContratos] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const tab = (searchParams.get('tab') as DocumentTab | null) || 'propostas'
    const activeTab: DocumentTab = tab === 'contratos' ? 'contratos' : 'propostas'

    useEffect(() => {
        if (!authLoading && !session) {
            router.replace(`/auth/login?next=/documentos?tab=${activeTab}`)
            return
        }
        const gateRoute = resolveOperationalGateRoute(session)
        if (!authLoading && gateRoute) {
            router.replace(gateRoute)
        }
    }, [authLoading, session, router, activeTab])

    useEffect(() => {
        if (!session) return

        let cancelled = false
        const loadProposals = async () => {
            setLoadingPropostas(true)
            setError(null)
            try {
                const data = await fetchMyNegotiations()
                if (!cancelled) {
                    setProposals(data)
                }
            } catch {
                if (!cancelled) {
                    setError('Não foi possível carregar propostas.')
                }
            } finally {
                if (!cancelled) {
                    setLoadingPropostas(false)
                }
            }
        }
        const loadContracts = async () => {
            setLoadingContratos(true)
            setError(null)
            try {
                const data = await getMyContracts()
                if (!cancelled) {
                    setContracts(data)
                }
            } catch {
                if (!cancelled) {
                    setError('Não foi possível carregar contratos.')
                }
            } finally {
                if (!cancelled) {
                    setLoadingContratos(false)
                }
            }
        }

        if (activeTab === 'propostas') {
            void loadProposals()
        } else {
            void loadContracts()
        }
        return () => {
            cancelled = true
        }
    }, [activeTab, session])

    const emptyTitle = useMemo(() => (activeTab === 'propostas' ? 'Nenhuma proposta encontrada' : 'Nenhum contrato encontrado'), [activeTab])
    const renderLoading = activeTab === 'propostas' ? loadingPropostas : loadingContratos
    const proposalsCount = proposals.length
    const contractsCount = contracts.length

    const friendlyProposalStatus = (status: string) => {
        const normalized = String(status ?? '').trim().toUpperCase()
        if (isProposalRefusedStatus(normalized)) return 'Recusada'
        if (isProposalPreSignatureStatus(normalized)) return 'Pendente de assinatura'
        return getStatusLabel(normalized as never)
    }

    const proposalActionLabel = (proposal: NegotiationSummary) => {
        const normalized = String(proposal.status ?? '').trim().toUpperCase()
        if (isProposalPreSignatureStatus(normalized)) return 'Enviar proposta assinada'
        if (isProposalRefusedStatus(normalized)) {
            return proposal.propertyId > 0 ? 'Iniciar novo ciclo' : 'Ver documentos'
        }
        return 'Ver contratos'
    }

    const proposalActionHref = (proposal: NegotiationSummary) => {
        const normalized = String(proposal.status ?? '').trim().toUpperCase()
        if (isProposalPreSignatureStatus(normalized)) {
            return `/propostas/${encodeURIComponent(proposal.id)}/upload-assinada`
        }
        if (isProposalRefusedStatus(normalized) && proposal.propertyId > 0) {
            return `/propostas/nova?propertyId=${proposal.propertyId}`
        }
        return '/documentos?tab=contratos'
    }

    if (authLoading || !session) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 pt-24 sm:px-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
                <p className="mt-1 text-sm text-slate-500">Acompanhe propostas e contratos no mesmo local.</p>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2">
                {TABS.map((item) => (
                    <Link
                        key={item.value}
                        href={`/documentos?tab=${item.value}`}
                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${activeTab === item.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                        {item.label}
                        <span className="ml-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {item.value === 'propostas' ? proposalsCount : contractsCount}
                        </span>
                    </Link>
                ))}
            </div>

            {error && (
                <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Tentar novamente
                    </button>
                </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                {renderLoading ? (
                    <div className="flex min-h-56 items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                    </div>
                ) : activeTab === 'propostas' ? (
                    proposals.length === 0 ? (
                        <div className="py-12 text-center">
                            <FileText className="mx-auto h-12 w-12 text-slate-300" />
                            <p className="mt-3 text-sm font-semibold text-slate-700">{emptyTitle}</p>
                            <p className="mt-1 text-xs text-slate-500">Acompanhe sua negociação enquanto ela avança para contratos.</p>
                            <Link href="/imoveis" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline">
                                Explorar imóveis <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    ) : (
                            <ul className="space-y-3">
                                {proposals.map((negotiation) => (
                                <li key={negotiation.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-slate-200">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900">{negotiation.propertyTitle}</p>
                                            <p className="mt-1 text-xs text-slate-600">
                                                {negotiation.propertyCity ? `${negotiation.propertyCity}${negotiation.propertyState ? ` - ${negotiation.propertyState}` : ''}` : 'Local não informado'}
                                            </p>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                                            {friendlyProposalStatus(negotiation.status)}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs text-slate-600">
                                        {isProposalPreSignatureStatus(negotiation.status)
                                            ? 'Aguardando assinatura do PDF.'
                                            : isProposalRefusedStatus(negotiation.status)
                                                ? 'Negociação recusada. Pode iniciar novo ciclo quando houver imóvel.'
                                                : 'Proposta assinada. Siga para contratos.'}
                                    </p>
                                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                        {negotiation.clientName && <span>Cliente: {negotiation.clientName}</span>}
                                        <span>{new Date(negotiation.createdAt).toLocaleDateString('pt-BR')}</span>
                                        {negotiation.proposalValidUntil && (
                                            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                                                Válida até {new Date(negotiation.proposalValidUntil).toLocaleDateString('pt-BR')}
                                            </span>
                                        )}
                                    </div>
                                    <Link
                                        href={proposalActionHref(negotiation)}
                                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:underline"
                                    >
                                        {proposalActionLabel(negotiation)} <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </li>
                                ))}
                            </ul>
                    )
                ) : contracts.length === 0 ? (
                    <div className="py-12 text-center">
                        <File className="mx-auto h-12 w-12 text-slate-300" />
                        <p className="mt-3 text-sm font-semibold text-slate-700">{emptyTitle}</p>
                        <p className="mt-1 text-xs text-slate-500">Quando houver contratos assinados, eles aparecem aqui.</p>
                        <Link href="/documentos?tab=propostas" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline">
                            Ir para propostas <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {contracts.map((contract) => (
                            <li key={contract.id} className="rounded-xl border border-slate-100 p-4 hover:border-slate-200">
                                <p className="text-sm font-semibold text-slate-900">{contract.propertyTitle || `Contrato #${contract.id}`}</p>
                                <p className="mt-1 text-xs text-slate-600">Status: {getStatusLabel(contract.status as never)}</p>
                                <p className="mt-1 text-xs text-slate-500">Negociação: {contract.negotiationId}</p>
                                <Link
                                    href={`/contratos/${encodeURIComponent(contract.id)}`}
                                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:underline"
                                >
                                    Abrir contrato <ArrowRight className="h-4 w-4" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
