'use client'

import Link from 'next/link'
import type { ContractSummary } from '@/types/contract'

interface ContractListProps {
    contracts: ContractSummary[]
}

function shortId(value: string | null | undefined): string {
    const normalized = String(value ?? '').trim()
    return normalized ? `${normalized.slice(0, 8)}…` : '—'
}

function statusLabel(status: ContractSummary['status']): string {
    switch (status) {
        case 'AWAITING_DOCS':
            return 'Aguardando documentos'
        case 'IN_DRAFT':
            return 'Em minuta'
        case 'AWAITING_SIGNATURES':
            return 'Aguardando assinaturas'
        case 'FINALIZED':
            return 'Finalizado'
        default:
            return status
    }
}

function statusChipClass(status: ContractSummary['status']): string {
    switch (status) {
        case 'AWAITING_DOCS':
            return 'bg-amber-50 text-amber-700'
        case 'IN_DRAFT':
            return 'bg-blue-50 text-blue-700'
        case 'AWAITING_SIGNATURES':
            return 'bg-violet-50 text-violet-700'
        case 'FINALIZED':
            return 'bg-slate-100 text-slate-700'
        default:
            return 'bg-slate-50 text-slate-700'
    }
}

export function ContractList({ contracts }: ContractListProps) {
    if (!contracts.length) {
        return (
            <p className="text-sm text-slate-600">
                Você ainda não possui contratos vinculados.
            </p>
        )
    }

    return (
        <div className="grid gap-4">
            {contracts.map((contract) => (
                <Link
                    key={contract.id}
                    href={`/contratos/${encodeURIComponent(contract.id)}`}
                    className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm transition-all hover:border-primary-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">
                            Contrato #{shortId(contract.id)}
                        </p>
                        <p className="text-xs text-slate-600">
                            Negociação {shortId(contract.negotiationId)} • Imóvel #{contract.propertyId}
                        </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusChipClass(contract.status)}`}>
                            {statusLabel(contract.status)}
                        </span>
                        <span className="text-xs font-medium text-primary-700">
                            Abrir contrato
                        </span>
                    </div>
                </Link>
            ))}
        </div>
    )
}

