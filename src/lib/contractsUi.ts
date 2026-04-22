import type { ApprovalStatus, ContractStatus } from '@/types/contract'

export const CONTRACT_STATUS_FLOW: ContractStatus[] = [
    'AWAITING_DOCS',
    'IN_DRAFT',
    'AWAITING_SIGNATURES',
    'FINALIZED',
]

export function getContractStatusMeta(status: ContractStatus) {
    switch (status) {
        case 'AWAITING_DOCS':
            return {
                label: 'Aguardando documentos',
                chipClass: 'bg-amber-50 text-amber-700',
                description: 'As partes ainda precisam enviar e validar os documentos obrigatórios.',
                nextAction: 'Enviar e revisar os documentos pendentes.',
            }
        case 'IN_DRAFT':
            return {
                label: 'Em minuta',
                chipClass: 'bg-blue-50 text-blue-700',
                description: 'A documentação base está em andamento e a minuta contratual está sendo preparada.',
                nextAction: 'Acompanhar a confecção e a revisão da minuta.',
            }
        case 'AWAITING_SIGNATURES':
            return {
                label: 'Aguardando assinaturas',
                chipClass: 'bg-violet-50 text-violet-700',
                description: 'A minuta já foi consolidada e o contrato aguarda as assinaturas das partes.',
                nextAction: 'Coordenar as assinaturas e acompanhar eventuais pendências.',
            }
        case 'FINALIZED':
            return {
                label: 'Finalizado',
                chipClass: 'bg-slate-100 text-slate-700',
                description: 'O contrato foi concluído e o fluxo documental está encerrado.',
                nextAction: 'Consultar o histórico, os documentos finais e as comissões.',
            }
        default:
            return {
                label: status,
                chipClass: 'bg-slate-50 text-slate-700',
                description: 'Estado do contrato indisponível.',
                nextAction: 'Verificar o contrato.',
            }
    }
}

export function getApprovalStatusMeta(status: ApprovalStatus) {
    switch (status) {
        case 'APPROVED':
            return {
                label: 'Aprovado',
                compactLabel: 'Aprovado',
                className: 'bg-slate-100 text-slate-700',
                description: 'Este lado já concluiu a aprovação documental.',
            }
        case 'APPROVED_WITH_RES':
            return {
                label: 'Aprovado com ressalvas',
                compactLabel: 'Com ressalvas',
                className: 'bg-blue-50 text-blue-700',
                description: 'Este lado foi aprovado, mas ainda exige leitura atenta das observações registradas.',
            }
        case 'REJECTED':
            return {
                label: 'Rejeitado',
                compactLabel: 'Rejeitado',
                className: 'bg-red-50 text-red-700',
                description: 'Há pendências ou inconsistências que precisam ser resolvidas antes de avançar.',
            }
        default:
            return {
                label: 'Pendente',
                compactLabel: 'Pendente',
                className: 'bg-amber-50 text-amber-700',
                description: 'Este lado ainda não concluiu a avaliação documental.',
            }
    }
}
