'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, FileText, FolderClock, Loader2 } from 'lucide-react'

import { useUser } from '@/contexts/UserContext'
import { resolveOperationalGateRoute } from '@/lib/auth/routeResolution'
import { getMyContracts } from '@/lib/api/contracts'
import { fetchMyNegotiations } from '@/lib/negotiationsService'
import { isProposalRefusedStatus } from '@/types/negotiation'
import { isCancelledContractStatus } from '@/lib/contractsUi'
import type { ContractSummary } from '@/types/contract'
import type { NegotiationSummary } from '@/types/negotiation'

function isFinalizedContract(contract: ContractSummary): boolean {
    return String(contract.status ?? '').trim().toUpperCase() === 'FINALIZED'
}

function contractPendingCount(contract: ContractSummary): number {
    const progress = contract.documentProgress
    if (!progress) return 0

    const side = contract.viewerSide === 'seller' || contract.viewerSide === 'buyer'
        ? progress[contract.viewerSide]
        : null
    if (side) return Math.max(0, Number(side.totals.pending ?? 0))

    return Math.max(0, Number(progress.seller.totals.pending ?? 0)) +
        Math.max(0, Number(progress.buyer.totals.pending ?? 0))
}

export function MyProcessesHub() {
    const router = useRouter()
    const { session, loading: authLoading } = useUser()
    const [proposals, setProposals] = useState<NegotiationSummary[]>([])
    const [contracts, setContracts] = useState<ContractSummary[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!authLoading && !session) {
            router.replace('/auth/login?next=/meus-processos')
            return
        }

        const gateRoute = resolveOperationalGateRoute(session)
        if (!authLoading && gateRoute) {
            router.replace(gateRoute)
        }
    }, [authLoading, router, session])

    useEffect(() => {
        if (!session) return
        let cancelled = false

        async function load() {
            setIsLoading(true)
            setError(null)
            try {
                const [nextProposals, nextContracts] = await Promise.all([
                    fetchMyNegotiations(),
                    getMyContracts(),
                ])
                if (!cancelled) {
                    setProposals(nextProposals)
                    setContracts(nextContracts)
                }
            } catch {
                if (!cancelled) {
                    setError('Não foi possível atualizar seus processos agora.')
                }
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }

        void load()
        return () => {
            cancelled = true
        }
    }, [session])

    const activeProposalCount = useMemo(
        () => proposals.filter((proposal) => !isProposalRefusedStatus(proposal.status)).length,
        [proposals],
    )
    const visibleContracts = useMemo(
        () => contracts.filter((contract) => !isCancelledContractStatus(contract.status)),
        [contracts],
    )
    const activeContracts = useMemo(
        () => visibleContracts.filter((contract) => !isFinalizedContract(contract)),
        [visibleContracts],
    )
    const finalizedContracts = useMemo(
        () => visibleContracts.filter(isFinalizedContract),
        [visibleContracts],
    )
    const pendingDocuments = useMemo(
        () => activeContracts.reduce((total, contract) => total + contractPendingCount(contract), 0),
        [activeContracts],
    )

    if (authLoading || !session) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <main className="mx-auto max-w-4xl px-4 pb-12 pt-24 sm:px-6">
            <header className="mb-6">
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Meus Processos</h1>
                <p className="mt-2 text-sm text-slate-600">Acompanhe suas propostas e contratos.</p>
            </header>

            {error ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            ) : isLoading ? (
                <div className="flex min-h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                </div>
            ) : (
                <div className="grid gap-4 rounded-3xl border border-primary-100 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5">
                    <Link
                        href="/meus-processos/propostas"
                        className="group flex min-h-40 flex-col items-start rounded-2xl border border-primary-100 bg-primary-50/40 p-5 transition hover:border-primary-300 hover:bg-primary-50"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                            <FileText className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-base font-semibold text-slate-950">Propostas</span>
                            <span className="mt-1 block text-sm text-slate-600">Negociações que ainda estão em análise ou aguardam uma ação sua.</span>
                            <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${activeProposalCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {activeProposalCount > 0 ? `${activeProposalCount} em andamento` : 'Nenhuma pendência'}
                            </span>
                        </span>
                        <ChevronRight className="mt-auto h-5 w-5 self-end text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-primary-700" aria-hidden />
                    </Link>

                    <Link
                        href="/meus-processos/contratos"
                        className="group flex min-h-40 flex-col items-start rounded-2xl border border-amber-100 bg-amber-50/40 p-5 transition hover:border-amber-300 hover:bg-amber-50"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                            <FolderClock className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-base font-semibold text-slate-950">Contratos</span>
                            <span className="mt-1 block text-sm text-slate-600">Documentos e dados cadastrais após a proposta ser aprovada.</span>
                            <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${pendingDocuments > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                                {pendingDocuments > 0 ? `${pendingDocuments} documento${pendingDocuments === 1 ? '' : 's'} pendente${pendingDocuments === 1 ? '' : 's'}` : `${activeContracts.length} em andamento`}
                            </span>
                        </span>
                        <ChevronRight className="mt-auto h-5 w-5 self-end text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-amber-800" aria-hidden />
                    </Link>
                </div>
            )}

            {!isLoading && !error && finalizedContracts.length > 0 && (
                <details className="mt-8 rounded-2xl border border-slate-200 bg-white px-5 py-4">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800">
                        Histórico de Processos ({finalizedContracts.length})
                    </summary>
                    <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                        {finalizedContracts.map((contract) => (
                            <li key={contract.id}>
                                <Link
                                    href={`/meus-processos/contratos/${encodeURIComponent(contract.id)}`}
                                    className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                                >
                                    <span className="truncate">{contract.propertyTitle?.trim() || 'Contrato finalizado'}</span>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </main>
    )
}
