'use client'

import Link from 'next/link'

import type { ContractSummary } from '@/types/contract'
import { getApprovalStatusMeta, getContractStatusMeta } from '@/lib/contractsUi'

interface ContractListProps {
    contracts: ContractSummary[]
}

function shortId(value: string | null | undefined): string {
    const normalized = String(value ?? '').trim()
    return normalized ? `${normalized.slice(0, 8)}…` : '—'
}

export function ContractList({ contracts }: ContractListProps) {
    if (!contracts.length) {
        return (
            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 text-sm text-slate-600 shadow-sm">
                Você ainda não possui contratos vinculados. Quando uma negociação avançar para o fluxo contratual, ela aparecerá aqui com a etapa atual e a próxima ação recomendada.
            </div>
        )
    }

    return (
        <div className="grid gap-4">
            {contracts.map((contract) => {
                const statusMeta = getContractStatusMeta(contract.status)
                const sellerMeta = getApprovalStatusMeta(contract.sellerApprovalStatus)
                const buyerMeta = getApprovalStatusMeta(contract.buyerApprovalStatus)

                return (
                    <Link
                        key={contract.id}
                        href={`/contratos/${encodeURIComponent(contract.id)}`}
                        className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
                    >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.chipClass}`}>
                                        {statusMeta.label}
                                    </span>
                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${sellerMeta.className}`}>
                                        Vendedor: {sellerMeta.label}
                                    </span>
                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${buyerMeta.className}`}>
                                        Comprador: {buyerMeta.label}
                                    </span>
                                </div>

                                <h2 className="text-base font-semibold text-slate-900">
                                    {contract.propertyTitle?.trim() || `Contrato ${shortId(contract.id)}`}
                                </h2>

                                <p className="text-xs text-slate-600">
                                    Contrato {shortId(contract.id)} • Negociação {shortId(contract.negotiationId)} • Imóvel #{contract.propertyId}
                                </p>

                                <p className="text-sm text-slate-700">
                                    {statusMeta.description}
                                </p>

                                <p className="text-xs font-medium text-primary-700">
                                    Próxima ação: {statusMeta.nextAction}
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center lg:justify-end">
                                <span className="text-xs font-medium text-primary-700">
                                    Abrir contrato
                                </span>
                            </div>
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}
