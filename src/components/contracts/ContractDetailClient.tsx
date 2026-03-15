'use client'

import { useEffect, useState } from 'react'
import type {
    ContractDetail,
    ContractDocument,
    ContractSide,
    ContractDocumentType,
    Commission,
} from '@/types/contract'
import {
    deleteContractDocument,
    uploadContractDocument,
    buildNegotiationDocumentDownloadUrl,
    getNegotiationCommissions,
} from '@/lib/api/contracts'
import type { ApiError } from '@/lib/api/client'

interface Props {
    contract: ContractDetail
}

function shortId(value: string | null | undefined): string {
    const normalized = String(value ?? '').trim()
    return normalized ? `${normalized.slice(0, 8)}…` : '—'
}

function approvalBadge(status: ContractDetail['sellerApprovalStatus']) {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
    switch (status) {
        case 'APPROVED':
        case 'APPROVED_WITH_RES':
            return <span className={`${baseClasses} bg-slate-100 text-slate-700`}>Aprovado</span>
        case 'REJECTED':
            return <span className={`${baseClasses} bg-red-50 text-red-700`}>Rejeitado</span>
        default:
            return <span className={`${baseClasses} bg-slate-100 text-slate-700`}>Pendente</span>
    }
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
                // Falhas em carregar comissão não devem quebrar a tela.
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
            // Em um cenário real recarregaríamos os dados do contrato; por ora fazemos refresh leve.
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
                    Este lado já foi aprovado. Edição de documentos está bloqueada.
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

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm space-y-2">
                <h1 className="text-lg font-semibold text-slate-900">
                    Contrato #{shortId(contract.id)}
                </h1>
                <p className="text-xs text-slate-600">
                    Negociação {shortId(contract.negotiationId)} • Imóvel #{contract.propertyId}
                </p>
                <div className="flex flex-wrap gap-3 text-xs mt-2">
                    <div className="flex items-center gap-1">
                        <span className="text-slate-600">Vendedor:</span>
                        {approvalBadge(contract.sellerApprovalStatus)}
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-slate-600">Comprador:</span>
                        {approvalBadge(contract.buyerApprovalStatus)}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <section className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-800">
                            Documentos do vendedor
                        </h2>
                        {approvalBadge(contract.sellerApprovalStatus)}
                    </div>
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

                <section className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-800">
                            Documentos do comprador
                        </h2>
                        {approvalBadge(contract.buyerApprovalStatus)}
                    </div>
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
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    {error}
                </p>
            )}

            <section className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-800">
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
                        {commissions.map((c) => (
                            <li key={c.id} className="flex items-center justify-between gap-2">
                                <span>
                                    Broker #{c.brokerId} • {c.role === 'CAPTURING' ? 'Captador' : 'Vendedor'}
                                </span>
                                <span className="font-medium">
                                    R$ {c.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

