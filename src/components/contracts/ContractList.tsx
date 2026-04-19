'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import type { ContractSummary } from '@/types/contract'
import { getContractStatusMeta } from '@/lib/contractsUi'

interface ContractListProps {
    contracts: ContractSummary[]
}

export function ContractList({ contracts }: ContractListProps) {
    if (!contracts.length) {
        return (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 px-6 py-10 text-center text-sm text-slate-600 dark:text-slate-400">
                Nenhum contrato ainda. Quando uma negociação avançar, aparece aqui.
            </div>
        )
    }

    return (
        <ul className="space-y-2">
            {contracts.map((contract) => {
                const statusMeta = getContractStatusMeta(contract.status)
                const title = contract.propertyTitle?.trim() || 'Contrato'

                return (
                    <li key={contract.id}>
                        <Link
                            href={`/contratos/${encodeURIComponent(contract.id)}`}
                            className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 px-4 py-3.5 shadow-sm transition hover:border-primary-300 dark:hover:border-primary-700"
                        >
                            <div className="min-w-0 text-left">
                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    <span className={`inline-flex rounded-full px-2 py-0.5 font-medium ${statusMeta.chipClass}`}>
                                        {statusMeta.label}
                                    </span>
                                </p>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 group-hover:text-primary-500" aria-hidden />
                        </Link>
                    </li>
                )
            })}
        </ul>
    )
}
