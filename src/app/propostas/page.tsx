'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import { resolveOperationalGateRoute } from '@/lib/auth/routeResolution'
import { deleteProposal, downloadProposalDraft, fetchMyNegotiations } from '@/lib/negotiationsService'
import type { NegotiationSummary } from '@/types/negotiation'
import {
    getStatusColor,
    getStatusLabel,
    isProposalPreSignatureStatus,
    isProposalRefusedStatus,
    resolveProposalBucket,
} from '@/types/negotiation'
import { FileText, Loader2, Plus, Building2, Pencil, Trash2 } from 'lucide-react'

export default function PropostasPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { session, loading: authLoading } = useUser()

    const [negotiations, setNegotiations] = useState<NegotiationSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<'sent' | 'signed' | 'refused'>('sent')
    const [busyActionId, setBusyActionId] = useState<string | null>(null)

    const getFriendlyProposalStatusLabel = (status: string) => {
        const normalized = String(status ?? '').trim().toUpperCase()
        if (isProposalRefusedStatus(normalized)) return 'Recusada'
        if (isProposalPreSignatureStatus(normalized)) return 'Pendente de assinatura'
        return getStatusLabel(normalized as never)
    }

    const getFriendlyProposalStatusSummary = (status: string) => {
        const normalized = String(status ?? '').trim().toUpperCase()
        if (isProposalRefusedStatus(normalized)) return 'Novo ciclo liberado.'
        if (isProposalPreSignatureStatus(normalized)) return 'Aguardando assinatura.'
        if (normalized === 'PROPOSAL_SIGNED') return 'Assinada e aguardando verificação.'
        if (resolveProposalBucket(normalized) === 'signed') return 'Seguindo para contratos.'
        return 'Acompanhe o andamento por aqui.'
    }

    useEffect(() => {
        if (!authLoading && !session) {
            router.replace('/auth/login?next=/meus-processos/propostas')
            return
        }
        const gateRoute = resolveOperationalGateRoute(session)
        if (!authLoading && gateRoute) {
            router.replace(gateRoute)
        }
    }, [authLoading, session, router])

    useEffect(() => {
        if (session) {
            loadNegotiations()
        }
    }, [session])

    const loadNegotiations = async () => {
        setLoading(true)
        try {
            const data = await fetchMyNegotiations()
            setNegotiations(data)
        } catch {
            setError('Erro ao carregar negociações.')
        } finally {
            setLoading(false)
        }
    }

    const filtered = negotiations.filter(n => {
        const bucket = resolveProposalBucket(n.status)
        return bucket === filter
    })

    const statusSummary = {
        sent: negotiations.filter((n) => resolveProposalBucket(n.status) === 'sent').length,
        signed: negotiations.filter((n) => resolveProposalBucket(n.status) === 'signed').length,
        refused: negotiations.filter((n) => resolveProposalBucket(n.status) === 'refused').length,
    }

    const can = (negotiation: NegotiationSummary, capability: keyof NonNullable<NegotiationSummary['capabilities']>) =>
        negotiation.capabilities?.[capability] === true

    const contractIdFor = (negotiation: NegotiationSummary) => {
        const id = String(negotiation.contract?.id ?? '').trim()
        return id || null
    }

    const resolveNegotiationHref = (negotiation: NegotiationSummary) => {
        const contractId = contractIdFor(negotiation)
        if (can(negotiation, 'canOpenContract') && contractId) {
            return `/meus-processos/contratos/${encodeURIComponent(contractId)}`
        }
        if (can(negotiation, 'canUploadSignedProposal')) {
            return `/meus-processos/propostas/${encodeURIComponent(negotiation.id)}/upload-assinada`
        }
        return '/meus-processos/propostas'
    }

    const resolveActionLabel = (negotiation: NegotiationSummary) => {
        if (can(negotiation, 'canOpenContract') && contractIdFor(negotiation)) {
            return 'Abrir contrato'
        }
        if (can(negotiation, 'canUploadSignedProposal')) {
            return 'Enviar proposta assinada'
        }
        if (can(negotiation, 'canDownloadDraft')) {
            return 'Minuta disponível para download'
        }
        if (negotiation.status === 'PROPOSAL_SIGNED') {
            return 'Proposta assinada enviada'
        }
        return 'Acompanhe o andamento da proposta'
    }

    const canEditByStatus = (negotiation: NegotiationSummary) => can(negotiation, 'canEditProposal')
    const canDeleteByStatus = (negotiation: NegotiationSummary) => can(negotiation, 'canDeleteProposal')
    const handleEdit = (negotiation: NegotiationSummary) => {
        if (!canEditByStatus(negotiation) || negotiation.propertyId <= 0) {
            return
        }
        router.push(
            `/propostas/nova?propertyId=${negotiation.propertyId}&negotiationId=${encodeURIComponent(negotiation.id)}`,
        )
    }

    const handleDelete = async (negotiation: NegotiationSummary) => {
        if (!canDeleteByStatus(negotiation)) {
            return
        }
        const confirmed = window.confirm('Excluir esta proposta em envio? Esta ação não pode ser desfeita.')
        if (!confirmed) {
            return
        }
        setBusyActionId(negotiation.id)
        try {
            await deleteProposal(negotiation.id)
            await loadNegotiations()
        } catch {
            setError('Não foi possível excluir a proposta. Tente novamente.')
        } finally {
            setBusyActionId(null)
        }
    }

    const handleDownloadDraft = async (negotiation: NegotiationSummary) => {
        if (!can(negotiation, 'canDownloadDraft')) return
        setBusyActionId(negotiation.id)
        try {
            await downloadProposalDraft(negotiation.id)
        } catch {
            setError('Não foi possível baixar a minuta. Tente novamente.')
        } finally {
            setBusyActionId(null)
        }
    }

    const approvalLabel = (status?: string | null) => {
        const normalized = String(status ?? '').trim().toUpperCase()
        if (normalized === 'APPROVED' || normalized === 'APPROVED_WITH_RES') return 'aprovado'
        if (normalized === 'REJECTED') return 'rejeitado'
        if (normalized === 'PENDING') return 'pendente'
        return normalized ? normalized.toLowerCase() : null
    }

    const signedSuccess = searchParams.get('signed') === '1'

    if (authLoading || !session) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pt-24">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Minhas Propostas</h1>
                        <p className="text-sm text-slate-500">{negotiations.length} negociações</p>
                    </div>
                </div>
            </div>

            <div
                role="status"
                aria-live="polite"
                className="mb-6 rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-600 shadow-sm"
            >
                Acompanhe aqui o ciclo da proposta: envio, análise documental, minuta, assinaturas e contrato.
            </div>

            {signedSuccess && (
                <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900 shadow-sm">
                    Proposta assinada enviada com sucesso. Agora acompanhe a negociação por aqui até ela avançar para contratos.
                </div>
            )}

            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Enviadas</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{statusSummary.sent}</p>
                    <p className="mt-1 text-sm text-slate-600">Propostas aguardando assinatura ou revisão do fluxo.</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assinadas</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{statusSummary.signed}</p>
                    <p className="mt-1 text-sm text-slate-600">Propostas assinadas e em caminho para contratos.</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recusadas</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{statusSummary.refused}</p>
                    <p className="mt-1 text-sm text-slate-600">Negociações recusadas, prontas para novo ciclo.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {([
                    ['sent', 'Enviadas'],
                    ['signed', 'Assinadas'],
                    ['refused', 'Recusadas'],
                ] as const).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === key
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
            ) : error ? (
                <div className="text-center py-20">
                    <p role="alert" className="text-sm text-red-600">{error}</p>
                    <button onClick={loadNegotiations} className="mt-3 text-sm text-primary-600 font-medium hover:underline">
                        Tentar novamente
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                    <FileText className="w-16 h-16 mx-auto text-slate-200" />
                    <h2 className="text-lg font-semibold text-slate-700">
                        Nenhuma proposta neste filtro
                    </h2>
                    <p className="text-sm text-slate-500">
                        Explore imóveis e gere sua primeira proposta.
                    </p>
                    <Link
                        href="/imoveis"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Explorar imóveis
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((neg) => (
                        <Link
                            key={neg.id}
                            href={resolveNegotiationHref(neg)}
                            className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-slate-200 hover:shadow-md"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50">
                                    <Building2 className="h-6 w-6 text-primary-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="truncate text-sm font-semibold text-slate-900">
                                            {neg.propertyTitle || `Imóvel #${neg.propertyId}`}
                                        </h3>
                                        <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(neg.status)}`}>
                                            {getFriendlyProposalStatusLabel(neg.status)}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-600">
                                        {getFriendlyProposalStatusSummary(neg.status)}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                        {neg.clientName && <span>Cliente: {neg.clientName}</span>}
                                        <span>{new Date(neg.createdAt).toLocaleDateString('pt-BR')}</span>
                                        {neg.proposalValidUntil && (
                                            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                                                Válida até {new Date(neg.proposalValidUntil).toLocaleDateString('pt-BR')}
                                            </span>
                                        )}
                                    </div>
                                    {neg.contractStatus && (
                                        <div className="mt-2 text-xs font-medium text-violet-700">
                                            Etapa do contrato: {getStatusLabel(neg.contractStatus as never)}
                                            {approvalLabel(neg.buyerApprovalStatus) ? ` · docs comprador ${approvalLabel(neg.buyerApprovalStatus)}` : ''}
                                            {approvalLabel(neg.sellerApprovalStatus) ? ` · docs proprietário ${approvalLabel(neg.sellerApprovalStatus)}` : ''}
                                        </div>
                                    )}
                                    <p className="mt-2 text-xs font-semibold text-primary-700">
                                        {resolveActionLabel(neg)}
                                    </p>
                                </div>
                                <div
                                    className="flex flex-col items-end gap-2"
                                    onClick={(event) => {
                                        event.preventDefault()
                                        event.stopPropagation()
                                    }}
                                >
                                    <>
                                        {canEditByStatus(neg) && (
                                            <button
                                                type="button"
                                                disabled={busyActionId === neg.id}
                                                title="Editar proposta"
                                                onClick={() => handleEdit(neg)}
                                                aria-label="Editar proposta"
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                Editar
                                            </button>
                                        )}
                                        {canDeleteByStatus(neg) && (
                                            <button
                                                type="button"
                                                disabled={busyActionId === neg.id}
                                                title="Excluir proposta"
                                                onClick={() => void handleDelete(neg)}
                                                aria-label="Excluir proposta"
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Excluir
                                            </button>
                                        )}
                                        {can(neg, 'canDownloadDraft') && (
                                            <button
                                                type="button"
                                                disabled={busyActionId === neg.id}
                                                title="Baixar minuta"
                                                onClick={() => void handleDownloadDraft(neg)}
                                                aria-label="Baixar minuta"
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <FileText className="h-3.5 w-3.5" />
                                                Baixar minuta
                                            </button>
                                        )}
                                        {!canEditByStatus(neg) && !canDeleteByStatus(neg) && !can(neg, 'canDownloadDraft') && (
                                        <span className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500">
                                            Sem ações de edição
                                        </span>
                                        )}
                                    </>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
