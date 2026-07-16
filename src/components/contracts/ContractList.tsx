'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, ChevronRight } from 'lucide-react'

import type { ContractSummary } from '@/types/contract'
import { getContractStatusMeta } from '@/lib/contractsUi'

interface ContractListProps {
    contracts: ContractSummary[]
}

type ContractFilter = 'active' | 'finalized'

function isFinalized(contract: ContractSummary): boolean {
    return String(contract.status ?? '').trim().toUpperCase() === 'FINALIZED'
}

function formatDateTime(value: string | undefined): string {
    if (!value) return 'Data não disponível'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Data não disponível'
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(date)
}

function actionLabel(contract: ContractSummary): string {
    const progress = contract.documentProgress
    const side = contract.viewerSide === 'seller' || contract.viewerSide === 'buyer'
        ? contract.viewerSide
        : null
    const ownPending = side
        ? Number(progress?.[side].totals.pending ?? 0)
        : Number(progress?.seller.totals.pending ?? 0) + Number(progress?.buyer.totals.pending ?? 0)

    if (ownPending > 0) {
        return `Faltam ${ownPending} documento${ownPending === 1 ? '' : 's'} seu${ownPending === 1 ? '' : 's'}`
    }
    if (isFinalized(contract)) return 'Processo concluído'
    return 'Aguardando análise da imobiliária'
}

export function ContractList({ contracts }: ContractListProps) {
    const [filter, setFilter] = useState<ContractFilter>('active')
    const visibleContracts = useMemo(
        () => contracts.filter((contract) => filter === 'finalized' ? isFinalized(contract) : !isFinalized(contract)),
        [contracts, filter],
    )

    if (!contracts.length) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-700 shadow-sm">
                Nenhum contrato ainda. Quando uma negociação avançar, aparece aqui.
            </div>
        )
    }

    return (
        <section>
            <div className="mb-5 flex gap-5 border-b border-slate-200">
                <button
                    type="button"
                    onClick={() => setFilter('active')}
                    className={`border-b-2 px-1 pb-2 text-xs font-semibold transition ${filter === 'active' ? 'border-primary-500 text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    Em andamento
                </button>
                <button
                    type="button"
                    onClick={() => setFilter('finalized')}
                    className={`border-b-2 px-1 pb-2 text-xs font-semibold transition ${filter === 'finalized' ? 'border-primary-500 text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    Finalizados
                </button>
            </div>

            {visibleContracts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-600">
                    {filter === 'finalized' ? 'Nenhum processo finalizado ainda.' : 'Nenhum contrato em andamento.'}
                </div>
            ) : (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleContracts.map((contract) => {
                        const statusMeta = getContractStatusMeta(contract.status)
                        const title = contract.propertyTitle?.trim() || 'Contrato'
                        return (
                            <li key={contract.id}>
                                <Link
                                    href={`/meus-processos/contratos/${encodeURIComponent(contract.id)}`}
                                    className="group flex min-h-40 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
                                >
                                    <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta.chipClass}`}>
                                        {statusMeta.label}
                                    </span>
                                    <p className="mt-3 truncate text-base font-semibold text-slate-950">{title}</p>
                                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                                        <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                                        {formatDateTime(contract.updatedAt ?? contract.createdAt)}
                                    </p>
                                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
                                        <span className="font-medium text-slate-700">{actionLabel(contract)}</span>
                                        <span className="inline-flex items-center gap-1 font-semibold text-primary-700">
                                            Acompanhar <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                                        </span>
                                    </div>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}
