export const STATUS_MAP: Record<string, string> = {
    proposal_sent: 'Proposta enviada',
    in_analysis: 'Em análise',
    under_review: 'Em análise',
    documentation_phase: 'Em análise documental',
    contract_drafting: 'Contrato em preparação',
    awaiting_signatures: 'Aguardando assinatura',
    concluded: 'Negociação concluída',
    pending_approval: 'Em análise',
    pending_verification: 'Em análise',
    pending_documents: 'Documentos pendentes',
    approved: 'Disponível',
    disponivel: 'Disponível',
    rejected: 'Rejeitado',
    rejeitado: 'Rejeitado',
    recusado: 'Rejeitado',
    rented: 'Alugado',
    alugado: 'Alugado',
    aluguel: 'Alugado',
    sold: 'Vendido',
    vendido: 'Vendido',
    venda: 'Vendido',
    negociacao: 'Em negociação',
    negociando: 'Em negociação',
}

function normalize(value: string): string {
    return value.trim().toLowerCase()
}

export function formatUnit(count: number | null | undefined, singular: string, plural: string): string {
    const safeCount = Number.isFinite(count) ? Number(count) : 0
    return `${safeCount} ${safeCount === 1 ? singular : plural}`
}

export function friendlyStatusLabel(rawStatus: string): string {
    const label = STATUS_MAP[normalize(rawStatus)]
    return label ?? rawStatus
}

export function displayStatusLabel(status: string, purpose: string): string {
    const statusLabel = friendlyStatusLabel(status)
    if (statusLabel.toLowerCase().includes('dispon')) {
        const normalizedPurpose = normalize(purpose)
        const hasSale = normalizedPurpose.includes('vend')
        const hasRent = normalizedPurpose.includes('alug')
        if (hasSale && hasRent) return 'Venda e Aluguel'
        if (hasRent) return 'Aluguel'
        return 'Venda'
    }
    return statusLabel
}
