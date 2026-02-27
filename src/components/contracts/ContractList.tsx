'use client'

import Link from 'next/link'
import type { ContractSummary } from '@/types/contract'

interface ContractListProps {
    contracts: ContractSummary[]
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
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm hover:border-primary-200 hover:shadow-md transition-all"
                >
                    <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-slate-900">
                            Contrato #{contract.id.slice(0, 8)}…
                        </p>
                        <p className="text-xs text-slate-600">
                            Negociação {contract.negotiationId.slice(0, 8)}… • Imóvel #{contract.propertyId}
                        </p>
                    </div>
                    <div className="text-right text-xs">
                        <p className="font-medium text-primary-700">
                            {statusLabel(contract.status)}
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    )
}

