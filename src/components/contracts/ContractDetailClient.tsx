'use client'

import { useEffect, useState } from 'react'

import type {
    ContractApprovalReason,
    ContractDetail,
    ContractDocument,
    ContractDocumentType,
    ContractSide,
    Commission,
} from '@/types/contract'
import {
    buildNegotiationDocumentDownloadUrl,
    deleteContractDocument,
    getNegotiationCommissions,
    uploadContractDocument,
} from '@/lib/api/contracts'
import type { ApiError } from '@/lib/api/client'
import { CONTRACT_STATUS_FLOW, getApprovalStatusMeta, getContractStatusMeta } from '@/lib/contractsUi'

interface Props {
    contract: ContractDetail
}

function shortId(value: string | null | undefined): string {
    const normalized = String(value ?? '').trim()
    return normalized ? `${normalized.slice(0, 8)}…` : '—'
}

function approvalBadge(status: ContractDetail['sellerApprovalStatus']) {
    const meta = getApprovalStatusMeta(status)
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.className}`}>{meta.label}</span>
}

function approvalReasonText(reason: ContractApprovalReason | null | undefined): string | null {
    if (!reason || typeof reason !== 'object') return null
    if (typeof reason.reason === 'string' && reason.reason.trim()) return reason.reason.trim()
    if (typeof reason.details === 'string' && reason.details.trim()) return reason.details.trim()
    return null
}

function isSideLocked(contract: ContractDetail, side: ContractSide): boolean {
    const status = side === 'seller' ? contract.sellerApprovalStatus : contract.buyerApprovalStatus
    return status === 'APPROVED' || status === 'APPROVED_WITH_RES'
}

function filterDocsBySide(docs: ContractDocument[], side: ContractSide): ContractDocument[] {
    return docs.filter((doc) => doc.side === side)
}

export function ContractDetailClient({ contract }: Props) {
    const [documents, setDocuments] = useState<ContractDocument[]>(contract.documents)
    const [uploadingSide, setUploadingSide] = useState<ContractSide | null>(null)
    const [uploadingType, setUploadingType] = useState<ContractDocumentType | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [commissions, setCommissions] = useState<Commission[] | null>(null)
    const [loadingCommissions, setLoadingCommissions] = useState(false)

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            setLoadingCommissions(true)
            try {
                const data = await getNegotiationCommissions(contract.negotiationId)
                if (!cancelled) {
                    setCommissions(data)
                }
            } catch {
                // Carregamento de comissão não deve derrubar a tela.
            } finally {
                if (!cancelled) {
                    setLoadingCommissions(false)
                }
            }
        }
        void load()
        return () => {
            cancelled = true
        }
    }, [contract.negotiationId])

    const handleUpload = async (side: ContractSide, documentType: ContractDocumentType, file: File) => {
        setError(null)
        setUploadingSide(side)
        setUploadingType(documentType)
        try {
            await uploadContractDocument({
                contractId: contract.id,
                side,
                documentType,
                file,
            })
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr) {
                if (apiErr.status === 403 || apiErr.status === 409) {
                    setError(apiErr.message || 'Operação não permitida para o estado atual do contrato.')
                } else {
                    setError('Não foi possível enviar o documento.')
                }
            } else {
                setError('Não foi possível enviar o documento.')
            }
        } finally {
            setUploadingSide(null)
            setUploadingType(null)
        }
    }

    const handleDelete = async (doc: ContractDocument) => {
        setError(null)
        try {
            await deleteContractDocument(contract.id, doc.id)
            setDocuments((current) => current.filter((d) => d.id !== doc.id))
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr) {
                setError(apiErr.message || 'Não foi possível remover o documento.')
            } else {
                setError('Não foi possível remover o documento.')
            }
        }
    }

    const renderUploadField = (side: ContractSide, documentType: ContractDocumentType, label: string) => {
        const locked = isSideLocked(contract, side)
        if (locked) {
            return (
                <p className="text-xs text-slate-500">
                    Este lado já foi aprovado. O envio e a remoção de documentos ficam bloqueados.
                </p>
            )
        }

        const isUploading = uploadingSide === side && uploadingType === documentType

        return (
            <label className="block text-xs text-primary-700 cursor-pointer">
                <span className="underline">
                    Enviar {label}
                </span>
                <input
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) {
                            void handleUpload(side, documentType, file)
                        }
                    }}
                    disabled={isUploading}
                />
            </label>
        )
    }

    const sellerDocs = filterDocsBySide(documents, 'seller')
    const buyerDocs = filterDocsBySide(documents, 'buyer')
    const statusMeta = getContractStatusMeta(contract.status)
    const sellerMeta = getApprovalStatusMeta(contract.sellerApprovalStatus)
    const buyerMeta = getApprovalStatusMeta(contract.buyerApprovalStatus)
    const currentStepIndex = CONTRACT_STATUS_FLOW.indexOf(contract.status)
    const sellerReason = approvalReasonText(contract.sellerApprovalReason)
    const buyerReason = approvalReasonText(contract.buyerApprovalReason)

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm space-y-4" aria-labelledby="contract-header">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.chipClass}`}>
                                {statusMeta.label}
                            </span>
                            {approvalBadge(contract.sellerApprovalStatus)}
                            {approvalBadge(contract.buyerApprovalStatus)}
                        </div>
                        <h1 id="contract-header" className="text-lg font-semibold text-slate-900">
                            {contract.propertyTitle?.trim() || `Contrato ${shortId(contract.id)}`}
                        </h1>
                        <p className="text-xs text-slate-600">
                            Contrato {shortId(contract.id)} • Negociação {shortId(contract.negotiationId)} • Imóvel #{contract.propertyId}
                        </p>
                    </div>
                    <div className="max-w-sm rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-900">
                        <p className="font-semibold">Próxima ação</p>
                        <p className="mt-1">{statusMeta.nextAction}</p>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
                    <p className="text-sm text-slate-700">{statusMeta.description}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                        {CONTRACT_STATUS_FLOW.map((status, index) => {
                            const stepMeta = getContractStatusMeta(status)
                            const isCurrent = index === currentStepIndex
                            const isCompleted = currentStepIndex >= index
                            return (
                                <div
                                    key={status}
                                    className={`rounded-xl border px-3 py-3 text-xs ${isCurrent
                                        ? 'border-primary-300 bg-white shadow-sm'
                                        : isCompleted
                                            ? 'border-slate-200 bg-white'
                                            : 'border-slate-100 bg-slate-100 text-slate-500'
                                        }`}
                                >
                                    <p className="font-semibold">{stepMeta.label}</p>
                                    <p className="mt-1 leading-relaxed">{stepMeta.description}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
                        <p className="text-sm font-semibold text-slate-900">Situação do vendedor</p>
                        <div className="mt-2 flex items-center gap-2">
                            {approvalBadge(contract.sellerApprovalStatus)}
                        </div>
                        <p className="mt-2 text-xs text-slate-600">{sellerMeta.description}</p>
                        {sellerReason && (
                            <p className="mt-2 text-xs text-slate-700">
                                Observação: {sellerReason}
                            </p>
                        )}
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
                        <p className="text-sm font-semibold text-slate-900">Situação do comprador</p>
                        <div className="mt-2 flex items-center gap-2">
                            {approvalBadge(contract.buyerApprovalStatus)}
                        </div>
                        <p className="mt-2 text-xs text-slate-600">{buyerMeta.description}</p>
                        {buyerReason && (
                            <p className="mt-2 text-xs text-slate-700">
                                Observação: {buyerReason}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <section className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm space-y-3" aria-labelledby="seller-documents">
                    <div className="flex items-center justify-between">
                        <h2 id="seller-documents" className="text-sm font-semibold text-slate-800">
                            Documentos do vendedor
                        </h2>
                        {approvalBadge(contract.sellerApprovalStatus)}
                    </div>
                    <p className="text-xs text-slate-500">
                        Envie e acompanhe os documentos do vendedor neste bloco. Quando este lado for aprovado, os envios ficam bloqueados para prevenir erro operacional.
                    </p>
                    <ul className="space-y-1.5 text-xs">
                        {sellerDocs.map((doc) => (
                            <li key={doc.id} className="flex items-center justify-between gap-2">
                                <a
                                    href={buildNegotiationDocumentDownloadUrl(doc.negotiationId, doc.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-700 hover:text-primary-800 underline"
                                >
                                    {doc.originalFileName || doc.documentType || 'Documento'}
                                </a>
                                {!isSideLocked(contract, 'seller') && (
                                    <button
                                        type="button"
                                        onClick={() => void handleDelete(doc)}
                                        className="text-[11px] text-red-600 hover:text-red-700"
                                    >
                                        Remover
                                    </button>
                                )}
                            </li>
                        ))}
                        {sellerDocs.length === 0 && (
                            <li className="text-slate-500">
                                Nenhum documento enviado ainda.
                            </li>
                        )}
                    </ul>

                    <div className="space-y-1 text-xs text-slate-700">
                        {renderUploadField('seller', 'doc_identidade', 'documento de identidade')}
                        {renderUploadField('seller', 'comprovante_endereco', 'comprovante de endereço')}
                        {renderUploadField('seller', 'certidao_casamento_nascimento', 'certidão casamento/nascimento')}
                        {renderUploadField('seller', 'certidao_onus_acoes', 'certidão de ônus e ações (Venda)')}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm space-y-3" aria-labelledby="buyer-documents">
                    <div className="flex items-center justify-between">
                        <h2 id="buyer-documents" className="text-sm font-semibold text-slate-800">
                            Documentos do comprador
                        </h2>
                        {approvalBadge(contract.buyerApprovalStatus)}
                    </div>
                    <p className="text-xs text-slate-500">
                        Envie e acompanhe os documentos do comprador neste bloco. A aprovação deste lado também determina o avanço do contrato.
                    </p>
                    <ul className="space-y-1.5 text-xs">
                        {buyerDocs.map((doc) => (
                            <li key={doc.id} className="flex items-center justify-between gap-2">
                                <a
                                    href={buildNegotiationDocumentDownloadUrl(doc.negotiationId, doc.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-700 hover:text-primary-800 underline"
                                >
                                    {doc.originalFileName || doc.documentType || 'Documento'}
                                </a>
                                {!isSideLocked(contract, 'buyer') && (
                                    <button
                                        type="button"
                                        onClick={() => void handleDelete(doc)}
                                        className="text-[11px] text-red-600 hover:text-red-700"
                                    >
                                        Remover
                                    </button>
                                )}
                            </li>
                        ))}
                        {buyerDocs.length === 0 && (
                            <li className="text-slate-500">
                                Nenhum documento enviado ainda.
                            </li>
                        )}
                    </ul>

                    <div className="space-y-1 text-xs text-slate-700">
                        {renderUploadField('buyer', 'doc_identidade', 'documento de identidade')}
                        {renderUploadField('buyer', 'comprovante_endereco', 'comprovante de endereço')}
                        {renderUploadField('buyer', 'comprovante_renda', 'comprovante de renda (Aluguel)')}
                        {renderUploadField('buyer', 'contrato_assinado', 'contrato assinado')}
                        {renderUploadField('buyer', 'comprovante_pagamento', 'comprovante de pagamento')}
                    </div>
                </section>
            </div>

            {error && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    {error}
                </p>
            )}

            <section className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm space-y-3" aria-labelledby="contract-commissions">
                <div className="flex items-center justify-between">
                    <h2 id="contract-commissions" className="text-sm font-semibold text-slate-800">
                        Comissões desta negociação
                    </h2>
                    {loadingCommissions && (
                        <span className="text-[11px] text-slate-500">
                            Carregando...
                        </span>
                    )}
                </div>
                {commissions && commissions.length > 0 ? (
                    <ul className="space-y-1.5 text-xs">
                        {commissions.map((commission) => (
                            <li key={commission.id} className="flex items-center justify-between gap-2">
                                <span>
                                    Broker #{commission.brokerId} • {commission.role === 'CAPTURING' ? 'Captador' : 'Vendedor'}
                                </span>
                                <span className="font-medium">
                                    R$ {commission.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-xs text-slate-500">
                        As informações de comissão ainda não estão disponíveis para este contrato.
                    </p>
                )}
            </section>
        </div>
    )
}
