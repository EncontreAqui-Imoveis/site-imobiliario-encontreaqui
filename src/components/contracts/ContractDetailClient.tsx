'use client'

import { useEffect, useState } from 'react'

import type {
    ContractApprovalReason,
    ContractDetail,
    ContractDocument,
    ContractDocumentType,
    ContractSide,
} from '@/types/contract'
import {
    buildNegotiationDocumentDownloadUrl,
    deleteContractDocument,
    getContractById,
    setContractSignatureMethod,
    updateContractData,
    uploadContractDocument,
} from '@/lib/api/contracts'
import type { ApiError } from '@/lib/api/client'
import { CONTRACT_STATUS_FLOW, getApprovalStatusMeta, getContractStatusMeta } from '@/lib/contractsUi'
import { useUser } from '@/contexts/UserContext'

interface Props {
    contract: ContractDetail
}

type ContractFormState = {
    maritalStatus: string
    profession: string
    email: string
    phone: string
    bankDetails: string
    guaranteeType: string
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
    return docs.filter((doc) => doc.side === side && doc.documentType !== 'contrato_minuta')
}

function filterSharedDocs(docs: ContractDocument[]): ContractDocument[] {
    return docs.filter((doc) => !doc.side || doc.documentType === 'contrato_minuta')
}

const DOCUMENT_LABELS: Record<string, string> = {
    doc_identidade: 'Documento de identidade',
    comprovante_endereco: 'Comprovante de endereço',
    certidao_casamento_nascimento: 'Certidão de casamento/nascimento',
    certidao_inteiro_teor: 'Certidão de inteiro teor',
    certidao_onus_acoes: 'Certidão de ônus e ações',
    comprovante_renda: 'Comprovante de renda',
    contrato_minuta: 'Minuta do contrato',
    contrato_assinado: 'Contrato assinado',
    comprovante_pagamento: 'Comprovante de pagamento',
    boleto_vistoria: 'Boleto/Vistoria',
    cliente_cnh: 'CNH do cliente',
    cliente_identidade: 'Identidade (RG) do cliente',
    cliente_cpf: 'CPF do cliente',
    cliente_outros: 'Outros documentos do cliente',
}

const SALE_REQUIRED_DOCS: ContractDocumentType[] = [
    'doc_identidade',
    'comprovante_endereco',
    'certidao_casamento_nascimento',
    'certidao_inteiro_teor',
    'certidao_onus_acoes',
]

const RENT_REQUIRED_DOCS: ContractDocumentType[] = [
    'doc_identidade',
    'comprovante_endereco',
    'certidao_casamento_nascimento',
    'comprovante_renda',
]

const SIGNATURE_REQUIRED_DOCS: ContractDocumentType[] = [
    'contrato_assinado',
    'comprovante_pagamento',
]

function isRentalPurpose(purpose: string | null | undefined): boolean {
    const normalized = String(purpose ?? '').trim().toLowerCase()
    return normalized.includes('alug') || normalized.includes('rent')
}

function isSalePurpose(purpose: string | null | undefined): boolean {
    const normalized = String(purpose ?? '').trim().toLowerCase()
    return normalized.includes('venda') || normalized.includes('sale')
}

function requiredDocTypesForContract(contract: ContractDetail, awaitingSignatures = false): ContractDocumentType[] {
    if (awaitingSignatures) {
        return SIGNATURE_REQUIRED_DOCS
    }

    const isSale = isSalePurpose(contract.propertyPurpose)
    const isRent = isRentalPurpose(contract.propertyPurpose)

    if (isSale && isRent) {
        return Array.from(new Set([...SALE_REQUIRED_DOCS, ...RENT_REQUIRED_DOCS]))
    }

    if (isRent) {
        return RENT_REQUIRED_DOCS
    }

    return SALE_REQUIRED_DOCS
}

function buyerClientIdentityDocumentTypes(): ContractDocumentType[] {
    return ['cliente_cnh', 'cliente_identidade', 'cliente_cpf', 'cliente_outros']
}

function buyerRequiredDocTypesForContract(
    contract: ContractDetail,
    awaitingSignatures: boolean,
): ContractDocumentType[] {
    if (awaitingSignatures) {
        return requiredDocTypesForContract(contract, true)
    }
    return [...requiredDocTypesForContract(contract, false), ...buyerClientIdentityDocumentTypes()]
}

function documentLabel(documentType: ContractDocumentType | null | undefined): string {
    const raw = String(documentType ?? '').trim()
    if (raw.startsWith('cliente_outro_')) {
        return DOCUMENT_LABELS.cliente_outros
    }
    return DOCUMENT_LABELS[raw] ?? (raw.length > 0 ? raw : 'Documento')
}

function isLegacyBuyerOtherDocumentType(value: ContractDocumentType | string | null | undefined): boolean {
    return String(value ?? '').trim().startsWith('cliente_outro_')
}

function matchesDocumentType(
    documentType: ContractDocumentType | null | undefined,
    expected: ContractDocumentType,
): boolean {
    if (documentType === expected) return true
    if (expected === 'cliente_outros' && isLegacyBuyerOtherDocumentType(documentType)) {
        return true
    }
    return false
}

function findLatestDoc(
    docs: ContractDocument[],
    documentType: ContractDocumentType,
    side?: ContractSide,
): ContractDocument | null {
    const matched = docs.find((doc) => {
        if (!matchesDocumentType(doc.documentType, documentType)) return false
        if (side == null) return true
        return doc.side === side
    })
    return matched ?? null
}

function renderChecklistStatus(doc: ContractDocument | null) {
    return doc ? 'Enviado' : 'Pendente'
}

function resolveSignatureMethod(contract: ContractDetail): string | null {
    const raw = String(contract.workflowMetadata?.signatureMethod ?? '').trim().toLowerCase()
    return raw || null
}

const MARITAL_STATUS_OPTIONS = [
    'Solteiro(a)',
    'Casado(a)',
    'Divorciado(a)',
    'Viúvo(a)',
    'União Estável',
] as const

const RENT_GUARANTEE_OPTIONS = ['Fiador', 'Seguro Fiança', 'Caução'] as const

function toRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {}
}

function readContractInfoField(source: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
        const value = source[key]
        if (value != null && String(value).trim().length > 0) {
            return String(value).trim()
        }
    }
    return ''
}

function buildSellerFormState(contract: ContractDetail): ContractFormState {
    const source = toRecord(contract.sellerInfo)
    return {
        maritalStatus: readContractInfoField(source, ['estado_civil', 'estadoCivil']),
        profession: readContractInfoField(source, ['profissao']),
        email: readContractInfoField(source, ['email']),
        phone: readContractInfoField(source, ['telefone', 'phone']),
        bankDetails: readContractInfoField(source, ['dados_bancarios', 'dadosBancarios']),
        guaranteeType: '',
    }
}

function buildBuyerFormState(contract: ContractDetail): ContractFormState {
    const source = toRecord(contract.buyerInfo)
    return {
        maritalStatus: readContractInfoField(source, ['estado_civil', 'estadoCivil']),
        profession: readContractInfoField(source, ['profissao']),
        email: readContractInfoField(source, ['email']),
        phone: readContractInfoField(source, ['telefone', 'phone']),
        bankDetails: '',
        guaranteeType: readContractInfoField(source, ['garantia_locacao', 'garantiaLocacao']),
    }
}

export function ContractDetailClient({ contract }: Props) {
    const { session } = useUser()
    const [currentContract, setCurrentContract] = useState<ContractDetail>(contract)
    const [documents, setDocuments] = useState<ContractDocument[]>(contract.documents)
    const [uploadingSide, setUploadingSide] = useState<ContractSide | null>(null)
    const [uploadingType, setUploadingType] = useState<ContractDocumentType | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [refreshingContract, setRefreshingContract] = useState(false)
    const [settingSignatureMethod, setSettingSignatureMethod] = useState(false)
    const [sellerForm, setSellerForm] = useState<ContractFormState>(() => buildSellerFormState(contract))
    const [buyerForm, setBuyerForm] = useState<ContractFormState>(() => buildBuyerFormState(contract))
    const [savingSide, setSavingSide] = useState<ContractSide | null>(null)
    const [savingBrokerBundle, setSavingBrokerBundle] = useState(false)

    useEffect(() => {
        setCurrentContract(contract)
        setDocuments(contract.documents)
        setSellerForm(buildSellerFormState(contract))
        setBuyerForm(buildBuyerFormState(contract))
    }, [contract])

    const refreshContract = async () => {
        setRefreshingContract(true)
        try {
            const nextContract = await getContractById(currentContract.id)
            setCurrentContract(nextContract)
            setDocuments(nextContract.documents)
            setSellerForm(buildSellerFormState(nextContract))
            setBuyerForm(buildBuyerFormState(nextContract))
        } finally {
            setRefreshingContract(false)
        }
    }

    const handleUploadBatch = async (
        side: ContractSide | undefined,
        documentType: ContractDocumentType,
        files: File[],
    ) => {
        setError(null)
        setUploadingSide(side ?? null)
        setUploadingType(documentType)
        try {
            for (const file of files) {
                await uploadContractDocument({
                    contractId: currentContract.id,
                    side,
                    documentType,
                    file,
                })
            }
            await refreshContract()
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
            await deleteContractDocument(currentContract.id, doc.id)
            await refreshContract()
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr) {
                setError(apiErr.message || 'Não foi possível remover o documento.')
            } else {
                setError('Não foi possível remover o documento.')
            }
        }
    }

    const handleInPersonSignature = async () => {
        setError(null)
        setSettingSignatureMethod(true)
        try {
            await setContractSignatureMethod(currentContract.id, 'in_person')
            await refreshContract()
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr) {
                setError(apiErr.message || 'Não foi possível registrar a assinatura presencial.')
            } else {
                setError('Não foi possível registrar a assinatura presencial.')
            }
        } finally {
            setSettingSignatureMethod(false)
        }
    }

    const handleSaveDoubleEndedBroker = async () => {
        setError(null)
        setSavingBrokerBundle(true)
        try {
            const email = (session?.user?.email ?? '').trim()
            const phone = (session?.user?.phone ?? '').trim()
            const civil = sellerForm.maritalStatus.trim()
            const buyerInfo: Record<string, unknown> = {
                estado_civil: civil,
                profissao: 'Corretor',
                email,
                telefone: phone,
            }
            if (isRentalPurpose(currentContract.propertyPurpose)) {
                buyerInfo.garantia_locacao = buyerForm.guaranteeType.trim()
            }
            await updateContractData({
                contractId: currentContract.id,
                sellerInfo: {
                    estado_civil: civil,
                    profissao: 'Corretor',
                    email,
                    telefone: phone,
                    dados_bancarios: sellerForm.bankDetails.trim(),
                },
                buyerInfo,
            })
            await refreshContract()
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr) {
                setError(apiErr.message || 'Não foi possível salvar os dados do corretor.')
            } else {
                setError('Não foi possível salvar os dados do corretor.')
            }
        } finally {
            setSavingBrokerBundle(false)
        }
    }

    const handleSaveSide = async (side: ContractSide) => {
        setError(null)
        setSavingSide(side)
        try {
            if (side === 'seller') {
                await updateContractData({
                    contractId: currentContract.id,
                    sellerInfo: {
                        estado_civil: sellerForm.maritalStatus.trim(),
                        profissao: sellerForm.profession.trim(),
                        email: sellerForm.email.trim(),
                        telefone: sellerForm.phone.trim(),
                        dados_bancarios: sellerForm.bankDetails.trim(),
                    },
                })
            } else {
                const buyerInfo: Record<string, unknown> = {
                    estado_civil: buyerForm.maritalStatus.trim(),
                    profissao: buyerForm.profession.trim(),
                    email: buyerForm.email.trim(),
                    telefone: buyerForm.phone.trim(),
                }
                if (isRentalPurpose(currentContract.propertyPurpose)) {
                    buyerInfo.garantia_locacao = buyerForm.guaranteeType.trim()
                }
                await updateContractData({
                    contractId: currentContract.id,
                    buyerInfo,
                })
            }
            await refreshContract()
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr) {
                setError(apiErr.message || 'Não foi possível salvar os dados deste lado do contrato.')
            } else {
                setError('Não foi possível salvar os dados deste lado do contrato.')
            }
        } finally {
            setSavingSide(null)
        }
    }

    const renderUploadField = (
        side: ContractSide | undefined,
        documentType: ContractDocumentType,
        label: string,
    ) => {
        const locked =
            side == null ? false : isSideLocked(currentContract, side)
        if (locked) {
            return (
                <p className="text-xs text-slate-500">
                    Este lado já foi aprovado. O envio e a remoção de documentos ficam bloqueados.
                </p>
            )
        }

        const allowMultiple = documentType === 'cliente_outros'
        const isUploading =
            uploadingSide === (side ?? null) && uploadingType === documentType

        return (
            <label className="block text-xs text-primary-700 cursor-pointer">
                <span className="underline">
                    Enviar {label}
                </span>
                <input
                    type="file"
                    accept="application/pdf,image/*"
                    multiple={allowMultiple}
                    className="hidden"
                    onChange={(event) => {
                        const selectedFiles = Array.from(event.target.files ?? [])
                        if (selectedFiles.length > 0) {
                            void handleUploadBatch(side, documentType, selectedFiles)
                        }
                    }}
                    disabled={isUploading}
                />
            </label>
        )
    }

    const sharedDocs = filterSharedDocs(documents)
    const sellerDocs = filterDocsBySide(documents, 'seller')
    const buyerDocs = filterDocsBySide(documents, 'buyer')
    const statusMeta = getContractStatusMeta(currentContract.status)
    const sellerMeta = getApprovalStatusMeta(currentContract.sellerApprovalStatus)
    const buyerMeta = getApprovalStatusMeta(currentContract.buyerApprovalStatus)
    const currentStepIndex = CONTRACT_STATUS_FLOW.indexOf(currentContract.status)
    const sellerReason = approvalReasonText(currentContract.sellerApprovalReason)
    const buyerReason = approvalReasonText(currentContract.buyerApprovalReason)
    const sellerLocked = isSideLocked(currentContract, 'seller')
    const buyerLocked = isSideLocked(currentContract, 'buyer')
    const awaitingSig = currentContract.status === 'AWAITING_SIGNATURES'
    const sellerRequiredDocs = requiredDocTypesForContract(currentContract, awaitingSig)
    const buyerRequiredDocs = buyerRequiredDocTypesForContract(currentContract, awaitingSig)
    const draftDocument = findLatestDoc(sharedDocs, 'contrato_minuta')
    const signedContractDocument = findLatestDoc(sharedDocs, 'contrato_assinado')
    const signatureMethod = resolveSignatureMethod(currentContract)
    const hasAgencyReceivedSignedContract = Boolean(
        String(currentContract.workflowMetadata?.agencySignedContractReceivedAt ?? '').trim(),
    )
    const isAwaitingDocs = currentContract.status === 'AWAITING_DOCS'
    const isInDraft = currentContract.status === 'IN_DRAFT'
    const isAwaitingSignatures = currentContract.status === 'AWAITING_SIGNATURES'
    const currentUserId = Number(session?.user?.id ?? 0)
    const canEditSellerSide =
        isAwaitingDocs &&
        !sellerLocked &&
        Number.isFinite(currentUserId) &&
        currentUserId > 0 &&
        currentUserId === currentContract.capturingBrokerId
    const canEditBuyerSide =
        isAwaitingDocs &&
        !buyerLocked &&
        Number.isFinite(currentUserId) &&
        currentUserId > 0 &&
        currentUserId === currentContract.sellingBrokerId

    const isDoubleEndedBroker =
        Number.isFinite(currentUserId) &&
        currentUserId > 0 &&
        currentContract.capturingBrokerId === currentUserId &&
        currentContract.sellingBrokerId === currentUserId

    const renderPartyForm = (
        side: ContractSide,
        title: string,
        form: ContractFormState,
        setForm: (value: ContractFormState) => void,
        canEdit: boolean,
        locked: boolean,
        reason: string | null,
        approvalStatus: ContractDetail['sellerApprovalStatus'],
        compactBrokerMode: boolean,
    ) => (
        <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
                {approvalBadge(approvalStatus)}
            </div>
            {reason && (
                <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Observação da análise: {reason}
                </p>
            )}
            <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-xs text-slate-600">
                    <span>Estado civil</span>
                    <select
                        value={form.maritalStatus}
                        onChange={(event) => setForm({ ...form, maritalStatus: event.target.value })}
                        disabled={!canEdit}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50"
                    >
                        <option value="">Selecionar</option>
                        {MARITAL_STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </label>
                {!compactBrokerMode && (
                    <label className="space-y-1 text-xs text-slate-600">
                        <span>Profissão</span>
                        <input
                            value={form.profession}
                            onChange={(event) => setForm({ ...form, profession: event.target.value })}
                            disabled={!canEdit}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50"
                        />
                    </label>
                )}
                {!compactBrokerMode && (
                    <label className="space-y-1 text-xs text-slate-600">
                        <span>E-mail</span>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(event) => setForm({ ...form, email: event.target.value })}
                            disabled={!canEdit}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50"
                        />
                    </label>
                )}
                {!compactBrokerMode && (
                    <label className="space-y-1 text-xs text-slate-600">
                        <span>Telefone</span>
                        <input
                            value={form.phone}
                            onChange={(event) => setForm({ ...form, phone: event.target.value })}
                            disabled={!canEdit}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50"
                        />
                    </label>
                )}
                {side === 'seller' && !compactBrokerMode && (
                    <label className="space-y-1 text-xs text-slate-600 md:col-span-2">
                        <span>Dados bancários</span>
                        <textarea
                            rows={3}
                            value={form.bankDetails}
                            onChange={(event) => setForm({ ...form, bankDetails: event.target.value })}
                            disabled={!canEdit}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50"
                        ></textarea>
                    </label>
                )}
                {side === 'buyer' && isRentalPurpose(currentContract.propertyPurpose) && !compactBrokerMode && (
                    <label className="space-y-1 text-xs text-slate-600 md:col-span-2">
                        <span>Garantia de locação</span>
                        <select
                            value={form.guaranteeType}
                            onChange={(event) => setForm({ ...form, guaranteeType: event.target.value })}
                            disabled={!canEdit}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50"
                        >
                            <option value="">Selecionar</option>
                            {RENT_GUARANTEE_OPTIONS.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </label>
                )}
            </div>
            {locked ? (
                <p className="text-xs text-slate-500">
                    Este lado foi aprovado e os dados não podem mais ser alterados.
                </p>
            ) : canEdit ? (
                compactBrokerMode ? (
                    <p className="text-xs text-slate-500">
                        Use o bloco &quot;Dados bancários do corretor&quot; abaixo dos documentos para salvar com um único envio (e-mail e telefone vêm do cadastro).
                    </p>
                ) : (
                    <button
                        type="button"
                        onClick={() => void handleSaveSide(side)}
                        disabled={savingSide === side}
                        className="inline-flex items-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                    >
                        {savingSide === side ? 'Salvando...' : 'Salvar dados deste lado'}
                    </button>
                )
            ) : (
                <p className="text-xs text-slate-500">
                    Você pode acompanhar esses dados, mas não editar este lado do contrato.
                </p>
            )}
        </section>
    )

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm space-y-4" aria-labelledby="contract-header">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.chipClass}`}>
                                {statusMeta.label}
                            </span>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${sellerMeta.className}`}>
                                Vendedor: {sellerMeta.compactLabel}
                            </span>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${buyerMeta.className}`}>
                                Comprador: {buyerMeta.compactLabel}
                            </span>
                        </div>
                        <h1 id="contract-header" className="text-lg font-semibold text-slate-900">
                            {currentContract.propertyTitle?.trim() || `Contrato ${shortId(currentContract.id)}`}
                        </h1>
                        <p className="text-xs text-slate-600">
                            Contrato {shortId(currentContract.id)} • Negociação {shortId(currentContract.negotiationId)} • Imóvel #{currentContract.propertyId}
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
                            {approvalBadge(currentContract.sellerApprovalStatus)}
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
                            {approvalBadge(currentContract.buyerApprovalStatus)}
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

            {refreshingContract && (
                <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-900">
                    Atualizando o estado do contrato...
                </div>
            )}

            {isInDraft && (
                <section className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4 shadow-sm space-y-2">
                    <h2 className="text-sm font-semibold text-sky-900">Minuta em preparação</h2>
                    <p className="text-sm text-sky-800">
                        A administração está preparando a minuta. Assim que o PDF estiver disponível, ele aparecerá abaixo e o fluxo seguirá para assinaturas.
                    </p>
                </section>
            )}

            {isAwaitingSignatures && (
                <section className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-4 shadow-sm space-y-4">
                    <div className="space-y-1">
                        <h2 className="text-sm font-semibold text-violet-900">Assinaturas do contrato</h2>
                        <p className="text-sm text-violet-800">
                            Revise a minuta, escolha como a assinatura será entregue e acompanhe os documentos finais desta etapa.
                        </p>
                    </div>

                    {draftDocument ? (
                        <a
                            href={buildNegotiationDocumentDownloadUrl(draftDocument.negotiationId, draftDocument.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-primary-700 shadow-sm ring-1 ring-violet-100 hover:bg-violet-50"
                        >
                            Baixar minuta
                        </a>
                    ) : (
                        <p className="text-sm text-violet-800">
                            A minuta ainda não foi anexada pela administração.
                        </p>
                    )}

                    {signatureMethod === 'in_person' ? (
                        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            Assinatura presencial informada. {hasAgencyReceivedSignedContract
                                ? 'A imobiliária já registrou o recebimento do contrato assinado.'
                                : 'Leve o contrato assinado até a imobiliária para concluir esta etapa.'}
                        </div>
                    ) : signedContractDocument ? (
                        <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-900">
                            O contrato assinado já foi enviado online. Aguarde a conferência da administração.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                                <p className="font-semibold text-slate-900">Envio online</p>
                                <p className="mt-1">Envie o contrato assinado para continuar o fluxo digital.</p>
                                <div className="mt-3">{renderUploadField(undefined, 'contrato_assinado', 'contrato assinado')}</div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                                <p className="font-semibold text-slate-900">Entrega presencial</p>
                                <p className="mt-1">Se a assinatura acontecer presencialmente, registre isso para a administração.</p>
                                <button
                                    type="button"
                                    onClick={() => void handleInPersonSignature()}
                                    disabled={settingSignatureMethod}
                                    className="mt-3 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                                >
                                    {settingSignatureMethod ? 'Registrando...' : 'Assinar presencialmente'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-3 md:grid-cols-3">
                        {[ 'contrato_assinado', 'comprovante_pagamento', 'boleto_vistoria' ].map((documentType) => {
                            const normalizedType = documentType as ContractDocumentType
                            const currentDoc = findLatestDoc(sharedDocs, normalizedType)
                            const isOptional = normalizedType === 'boleto_vistoria'

                            return (
                                <div key={documentType} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                                    <p className="font-semibold text-slate-900">
                                        {documentLabel(normalizedType)} {isOptional ? '(opcional)' : ''}
                                    </p>
                                    <p className={`mt-1 text-xs ${currentDoc ? 'text-emerald-700' : 'text-slate-500'}`}>
                                        {renderChecklistStatus(currentDoc)}
                                    </p>
                                    <div className="mt-3">{renderUploadField(undefined, normalizedType, documentLabel(normalizedType))}</div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}

            {isAwaitingDocs && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {renderPartyForm(
                        'seller',
                        'Dados do vendedor',
                        sellerForm,
                        setSellerForm,
                        canEditSellerSide,
                        sellerLocked,
                        sellerReason,
                        currentContract.sellerApprovalStatus,
                        isDoubleEndedBroker,
                    )}
                    {renderPartyForm(
                        'buyer',
                        'Dados do comprador',
                        buyerForm,
                        setBuyerForm,
                        canEditBuyerSide,
                        buyerLocked,
                        buyerReason,
                        currentContract.buyerApprovalStatus,
                        isDoubleEndedBroker,
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {sharedDocs.length > 0 && (
                    <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-3 md:col-span-2" aria-labelledby="shared-documents">
                        <div className="flex items-center justify-between">
                            <h2 id="shared-documents" className="text-sm font-semibold text-slate-800">
                                Documentos do contrato
                            </h2>
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                Visualização
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Aqui ficam os documentos compartilhados do fluxo contratual, como a minuta e outros arquivos sem vínculo exclusivo com vendedor ou comprador.
                        </p>
                        <ul className="space-y-1.5 text-xs">
                            {sharedDocs.map((doc) => (
                                <li key={doc.id} className="flex items-center justify-between gap-2">
                                    <a
                                        href={buildNegotiationDocumentDownloadUrl(doc.negotiationId, doc.id)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-700 hover:text-primary-800 underline"
                                    >
                                        {doc.originalFileName || doc.documentType || 'Documento'}
                                    </a>
                                    <span className="text-[11px] text-slate-500">
                                        Somente leitura
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                {sharedDocs.length === 0 && currentContract.status === 'IN_DRAFT' && (
                    <section className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 shadow-sm space-y-2 md:col-span-2" aria-labelledby="shared-documents-empty">
                        <h2 id="shared-documents-empty" className="text-sm font-semibold text-amber-900">
                            Minuta do contrato
                        </h2>
                        <p className="text-sm text-amber-800">
                            A minuta ainda não foi anexada. Quando ela for adicionada, aparecerá aqui em visualização única para consulta.
                        </p>
                    </section>
                )}

                <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-3" aria-labelledby="seller-documents">
                    <div className="flex items-center justify-between">
                        <h2 id="seller-documents" className="text-sm font-semibold text-slate-800">
                            Documentos do vendedor
                        </h2>
                        {approvalBadge(currentContract.sellerApprovalStatus)}
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
                                {!isSideLocked(currentContract, 'seller') && isAwaitingDocs && (
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

                    {sellerLocked ? (
                        <p className="text-xs text-slate-500">
                            Leitura apenas: este lado já foi aprovado e não aceita novos envios.
                        </p>
                    ) : !isAwaitingDocs ? (
                        <p className="text-xs text-slate-500">
                            Esta etapa não aceita novos documentos deste lado. Use apenas os documentos compartilhados do contrato.
                        </p>
                    ) : (
                        <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Checklist deste lado
                            </p>
                            {sellerRequiredDocs.map((documentType) => {
                                const currentDoc = findLatestDoc(sellerDocs, documentType, 'seller')
                                return (
                                    <div key={`seller-${documentType}`} className="flex items-center justify-between gap-3 text-xs">
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-800">{documentLabel(documentType)}</p>
                                            <p className={currentDoc ? 'text-emerald-700' : 'text-slate-500'}>
                                                {renderChecklistStatus(currentDoc)}
                                            </p>
                                        </div>
                                        {renderUploadField('seller', documentType, documentLabel(documentType))}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-3" aria-labelledby="buyer-documents">
                    <div className="flex items-center justify-between">
                        <h2 id="buyer-documents" className="text-sm font-semibold text-slate-800">
                            Documentos do comprador
                        </h2>
                        {approvalBadge(currentContract.buyerApprovalStatus)}
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
                                {!isSideLocked(currentContract, 'buyer') && isAwaitingDocs && (
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

                    {buyerLocked ? (
                        <p className="text-xs text-slate-500">
                            Leitura apenas: este lado já foi aprovado e não aceita novos envios.
                        </p>
                    ) : !isAwaitingDocs ? (
                        <p className="text-xs text-slate-500">
                            Esta etapa não aceita novos documentos deste lado. Use apenas os documentos compartilhados do contrato.
                        </p>
                    ) : (
                        <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Checklist deste lado
                            </p>
                            {buyerRequiredDocs.map((documentType) => {
                                const currentDoc = findLatestDoc(buyerDocs, documentType, 'buyer')
                                return (
                                    <div key={`buyer-${documentType}`} className="flex items-center justify-between gap-3 text-xs">
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-800">{documentLabel(documentType)}</p>
                                            <p className={currentDoc ? 'text-emerald-700' : 'text-slate-500'}>
                                                {renderChecklistStatus(currentDoc)}
                                            </p>
                                        </div>
                                        {renderUploadField('buyer', documentType, documentLabel(documentType))}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </section>

                {isAwaitingDocs && isDoubleEndedBroker && (
                    <section
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-3 md:col-span-2"
                        aria-labelledby="broker-bank-unified"
                    >
                        <h2 id="broker-bank-unified" className="text-sm font-semibold text-slate-800">
                            Dados bancários do corretor
                        </h2>
                        <p className="text-xs text-slate-600">
                            Você é captador e vendedor nesta negociação. E-mail e telefone vêm do cadastro; informe os dados bancários abaixo.
                        </p>
                        <div className="grid gap-2 text-xs text-slate-800">
                            <p>
                                <span className="font-medium text-slate-500">E-mail (cadastro)</span>{' '}
                                {session?.user?.email?.trim() || '—'}
                            </p>
                            <p>
                                <span className="font-medium text-slate-500">Telefone (cadastro)</span>{' '}
                                {session?.user?.phone?.trim() || '—'}
                            </p>
                        </div>
                        <label className="space-y-1 text-xs text-slate-600">
                            <span>Dados bancários</span>
                            <textarea
                                rows={3}
                                value={sellerForm.bankDetails}
                                onChange={(event) =>
                                    setSellerForm({ ...sellerForm, bankDetails: event.target.value })
                                }
                                disabled={!canEditSellerSide}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50"
                            />
                        </label>
                        {isRentalPurpose(currentContract.propertyPurpose) && (
                            <label className="space-y-1 text-xs text-slate-600">
                                <span>Garantia de locação</span>
                                <select
                                    value={buyerForm.guaranteeType}
                                    onChange={(event) =>
                                        setBuyerForm({ ...buyerForm, guaranteeType: event.target.value })
                                    }
                                    disabled={!canEditBuyerSide}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50"
                                >
                                    <option value="">Selecionar</option>
                                    {RENT_GUARANTEE_OPTIONS.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </label>
                        )}
                        {(canEditSellerSide || canEditBuyerSide) ? (
                            <button
                                type="button"
                                onClick={() => void handleSaveDoubleEndedBroker()}
                                disabled={savingBrokerBundle}
                                className="inline-flex items-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                            >
                                {savingBrokerBundle ? 'Salvando...' : 'Salvar dados bancários do corretor'}
                            </button>
                        ) : (
                            <p className="text-xs text-slate-500">
                                Você não pode editar estes dados neste momento.
                            </p>
                        )}
                    </section>
                )}
            </div>

            {error && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    {error}
                </p>
            )}

        </div>
    )
}
