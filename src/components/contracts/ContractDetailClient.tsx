'use client'

import { useEffect, useState } from 'react'

import type {
    ContractApprovalReason,
    ContractDetail,
    ContractDocument,
    ContractDocumentType,
    ContractSide,
    ContractDocumentCategory,
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

type RequirementApplicability = 'required' | 'optional' | 'not_applicable'

type RequirementRow = {
    category: ContractDocumentCategory
    applicability: RequirementApplicability
    required: boolean
    reasonCode: string
}

type ChecklistEntry = {
    documentType: ContractDocumentType
    side?: ContractSide
    documentCategory?: ContractDocumentCategory
    label: string
    optional?: boolean
    allowMultiple?: boolean
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
    doc_identidade: 'Documento pessoal',
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
    cliente_identidade: 'Identidade (RG/CNH) do cliente',
    cliente_outros: 'Outros documentos do cliente',
}

const OPTIONAL_DOC_TYPES = new Set<ContractDocumentType>(['cliente_outros'])

function isRentalPurpose(purpose: string | null | undefined): boolean {
    const normalized = String(purpose ?? '').trim().toLowerCase()
    return normalized.includes('alug') || normalized.includes('rent')
}

function documentLabel(documentType: ContractDocumentType | null | undefined): string {
    const raw = String(documentType ?? '').trim()
    if (raw.startsWith('cliente_outro_')) {
        return DOCUMENT_LABELS.cliente_outros
    }
    return DOCUMENT_LABELS[raw] ?? (raw.length > 0 ? raw : 'Documento')
}

const CATEGORY_LABELS: Record<ContractDocumentCategory, string> = {
    identidade: 'Identidade',
    comprovante_endereco: 'Comprovante de endereço',
    estado_civil: 'Estado civil',
    conjuge_documentos: 'Documento Pessoal (Cônjuge)',
    comprovante_renda: 'Comprovante de renda',
    dados_bancarios: 'Dados bancários',
    docs_imovel: 'Documentos do imóvel',
}

function stripDiacritics(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function resolveMaritalBucket(value: string | null | undefined) {
    const raw = stripDiacritics(String(value ?? '').trim().toLowerCase())
    if (!raw) return 'unknown'
    if (/(^|[^a-z0-9])solteir/.test(raw) || raw === 'solteiro' || raw === 'solteira') return 'single'
    if (raw.includes('uni') && raw.includes('estav')) return 'stable_union'
    if (raw.includes('casad') || raw.includes('matrim')) return 'married'
    if (raw.includes('divorci')) return 'divorced'
    if (raw.includes('viuv')) return 'widowed'
    return 'unknown'
}

function spouseApplicabilityForMarital(value: string | null | undefined): RequirementRow {
    const maritalBucket = resolveMaritalBucket(value)
    if (maritalBucket === 'married' || maritalBucket === 'stable_union') {
        return {
            category: 'conjuge_documentos',
            applicability: 'required',
            required: true,
            reasonCode: 'CONJUGE_REQUIRED_MARRIED_OR_STABLE',
        }
    }
    return {
        category: 'conjuge_documentos',
        applicability: 'not_applicable',
        required: false,
        reasonCode: 'CONJUGE_NA_MARITAL_SINGLE_OR_EQUIVALENT',
    }
}

function buildFallbackRequirementRows(
    side: ContractSide,
    maritalStatus: string | null | undefined,
): RequirementRow[] {
    const spouseRow = spouseApplicabilityForMarital(maritalStatus)
    if (side === 'seller') {
        return [
            { category: 'identidade', applicability: 'required', required: true, reasonCode: 'IDENTIDADE_REQUIRED' },
            { category: 'dados_bancarios', applicability: 'required', required: true, reasonCode: 'DADOS_BANCARIOS_REQUIRED' },
            { category: 'comprovante_endereco', applicability: 'required', required: true, reasonCode: 'ENDERECO_REQUIRED' },
            { category: 'estado_civil', applicability: 'required', required: true, reasonCode: 'ESTADO_CIVIL_REQUIRED' },
            spouseRow,
            { category: 'docs_imovel', applicability: 'required', required: true, reasonCode: 'DOCS_IMOVEL_REQUIRED' },
        ]
    }

    return [
        { category: 'identidade', applicability: 'required', required: true, reasonCode: 'IDENTIDADE_REQUIRED' },
        { category: 'comprovante_endereco', applicability: 'required', required: true, reasonCode: 'ENDERECO_REQUIRED' },
        { category: 'estado_civil', applicability: 'required', required: true, reasonCode: 'ESTADO_CIVIL_REQUIRED' },
        spouseRow,
        { category: 'comprovante_renda', applicability: 'required', required: true, reasonCode: 'COMPROVANTE_RENDA_REQUIRED' },
    ]
}

function effectiveRequirementRows(
    contract: ContractDetail,
    side: ContractSide,
    maritalStatus: string | null | undefined,
): RequirementRow[] {
    const sourceRows = contract.documentRequirements?.[side]
    const rows = sourceRows && sourceRows.length > 0
        ? sourceRows.map((row) => ({ ...row }))
        : buildFallbackRequirementRows(side, maritalStatus)

    return rows.map((row) => {
        if (row.category !== 'conjuge_documentos') return row
        return spouseApplicabilityForMarital(maritalStatus)
    })
}

function expandRequirementRows(
    side: ContractSide,
    rows: RequirementRow[],
): ChecklistEntry[] {
    const entries: ChecklistEntry[] = []
    for (const row of rows) {
        if (row.applicability === 'not_applicable') continue
        switch (row.category) {
            case 'docs_imovel':
                entries.push(
                    {
                        documentType: 'certidao_inteiro_teor',
                        side,
                        documentCategory: row.category,
                        label: documentLabel('certidao_inteiro_teor'),
                    },
                    {
                        documentType: 'certidao_onus_acoes',
                        side,
                        documentCategory: row.category,
                        label: documentLabel('certidao_onus_acoes'),
                    },
                )
                break
            case 'identidade':
                entries.push({
                    documentType: side === 'buyer' ? 'cliente_identidade' : 'doc_identidade',
                    side,
                    documentCategory: row.category,
                    label: side === 'buyer' ? documentLabel('cliente_identidade') : documentLabel('doc_identidade'),
                })
                break
            case 'dados_bancarios':
                entries.push({
                    documentType: 'outro',
                    side,
                    documentCategory: row.category,
                    label: CATEGORY_LABELS.dados_bancarios,
                })
                break
            case 'conjuge_documentos':
                entries.push({
                    documentType: 'outro',
                    side,
                    documentCategory: row.category,
                    label: CATEGORY_LABELS.conjuge_documentos,
                })
                break
            case 'comprovante_endereco':
                entries.push({
                    documentType: 'comprovante_endereco',
                    side,
                    documentCategory: row.category,
                    label: documentLabel('comprovante_endereco'),
                })
                break
            case 'estado_civil':
                entries.push({
                    documentType: 'certidao_casamento_nascimento',
                    side,
                    documentCategory: row.category,
                    label: documentLabel('certidao_casamento_nascimento'),
                })
                break
            case 'comprovante_renda':
                entries.push({
                    documentType: 'comprovante_renda',
                    side,
                    documentCategory: row.category,
                    label: documentLabel('comprovante_renda'),
                })
                break
        }
    }

    if (side === 'buyer') {
        entries.push({
            documentType: 'cliente_outros',
            side,
            label: documentLabel('cliente_outros'),
            optional: true,
            allowMultiple: true,
        })
    }

    return entries
}

function resolveCategoryByDocumentType(documentType: ContractDocumentType): ContractDocumentCategory {
    if (documentType === 'comprovante_endereco') return 'comprovante_endereco'
    if (documentType === 'certidao_casamento_nascimento') return 'estado_civil'
    if (documentType === 'comprovante_renda') return 'comprovante_renda'
    if (documentType === 'certidao_inteiro_teor' || documentType === 'certidao_onus_acoes') return 'docs_imovel'
    if (documentType === 'cliente_outros') return 'identidade'
    return 'identidade'
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
    entry: Pick<ChecklistEntry, 'documentType' | 'documentCategory' | 'side'>,
): ContractDocument | null {
    const matched = docs.find((doc) => {
        if (!matchesDocumentType(doc.documentType, entry.documentType)) return false
        if (entry.documentCategory) {
            const docCategory = String(doc.documentCategory ?? '').trim()
            if (docCategory !== entry.documentCategory) return false
        }
        if (entry.side == null) return true
        return doc.side === entry.side
    })
    return matched ?? null
}

function latestFileName(doc: ContractDocument | null): string | null {
    const fileName = String(doc?.originalFileName ?? '').trim()
    return fileName || null
}

function uploadedDocumentLabel(doc: ContractDocument): string {
    const documentType = String(doc.documentType ?? '').trim()
    if (isLegacyBuyerOtherDocumentType(documentType)) {
        return documentLabel('cliente_outros')
    }
    if (documentType === 'outro') {
        const category = String(doc.documentCategory ?? '').trim() as ContractDocumentCategory
        if (category && CATEGORY_LABELS[category]) {
            return CATEGORY_LABELS[category]
        }
    }
    return documentLabel(documentType as ContractDocumentType)
}

function renderChecklistStatus(doc: ContractDocument | null) {
    if (!doc) return 'Pendente'
    const status = String(doc.categoryStatus ?? '').trim().toUpperCase()
    if (status === 'PENDING') return 'Pendente'
    if (status === 'APPROVED') return 'Aprovado'
    if (status === 'APPROVED_WITH_RES') return 'Aprovado com ressalvas'
    if (status === 'REJECTED') return 'Rejeitado'
    if (status === 'NOT_APPLICABLE') return 'Não se aplica'
    return 'Pendente'
}

function renderChecklistHint(doc: ContractDocument | null): string | null {
    if (!doc) return null
    const status = String(doc.categoryStatus ?? '').trim().toUpperCase()
    const reason = String(doc.reviewReason ?? '').trim()
    if (status === 'REJECTED') {
        return reason || 'Ajuste o documento e reenviar nesta categoria.'
    }
    return null
}

function renderDocumentProgressStatus(status: string | null | undefined) {
    const normalized = String(status ?? '').trim().toUpperCase()
    if (normalized === 'PENDING') return 'Pendente'
    if (normalized === 'APPROVED') return 'Aprovado'
    if (normalized === 'APPROVED_WITH_RES') return 'Aprovado com ressalvas'
    if (normalized === 'REJECTED') return 'Rejeitado'
    if (normalized === 'NOT_APPLICABLE') return 'Não se aplica'
    return normalized || 'Pendente'
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
    const source = toRecord(contract.ownerInfo ?? contract.sellerInfo)
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
        bankDetails: readContractInfoField(source, ['dados_bancarios', 'dadosBancarios']),
        guaranteeType: readContractInfoField(source, ['garantia_locacao', 'garantiaLocacao']),
    }
}

export function ContractDetailClient({ contract }: Props) {
    const { session } = useUser()
    const [currentContract, setCurrentContract] = useState<ContractDetail>(contract)
    const [documents, setDocuments] = useState<ContractDocument[]>(contract.documents)
    const [uploadingKey, setUploadingKey] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [refreshingContract, setRefreshingContract] = useState(false)
    const [settingSignatureMethod, setSettingSignatureMethod] = useState(false)
    const [sellerForm, setSellerForm] = useState<ContractFormState>(() => buildSellerFormState(contract))
    const [buyerForm, setBuyerForm] = useState<ContractFormState>(() => buildBuyerFormState(contract))
    const [savingSide, setSavingSide] = useState<ContractSide | null>(null)
    const [editingSide, setEditingSide] = useState<ContractSide | null>(null)

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

    const buildUploadKey = (entry: Pick<ChecklistEntry, 'documentType' | 'documentCategory' | 'side'>) => {
        const category = entry.documentCategory ? `#${entry.documentCategory}` : ''
        const side = entry.side ? `${entry.side}::` : ''
        return `${side}${entry.documentType}${category}`
    }

    const buildSidePayload = (side: ContractSide): Record<string, unknown> => {
        if (side === 'seller') {
            return {
                estado_civil: sellerForm.maritalStatus.trim(),
                profissao: sellerForm.profession.trim(),
                email: sellerForm.email.trim(),
                telefone: sellerForm.phone.trim(),
                dados_bancarios: sellerForm.bankDetails.trim(),
            }
        }
        const buyerInfo: Record<string, unknown> = {
            estado_civil: buyerForm.maritalStatus.trim(),
            profissao: buyerForm.profession.trim(),
            email: buyerForm.email.trim(),
            telefone: buyerForm.phone.trim(),
            dados_bancarios: buyerForm.bankDetails.trim(),
        }
        if (isRentalPurpose(currentContract.propertyPurpose)) {
            buyerInfo.garantia_locacao = buyerForm.guaranteeType.trim()
        }
        return buyerInfo
    }

    const buildChangedSidePayload = (side: ContractSide): Record<string, unknown> => {
        const next = buildSidePayload(side)
        const persisted = side === 'seller'
            ? buildSellerFormState(currentContract)
            : buildBuyerFormState(currentContract)
        const persistedValues: Record<string, string> = {
            estado_civil: persisted.maritalStatus,
            profissao: persisted.profession,
            email: persisted.email,
            telefone: persisted.phone,
            dados_bancarios: persisted.bankDetails,
            garantia_locacao: persisted.guaranteeType,
        }

        return Object.fromEntries(
            Object.entries(next).filter(([key, value]) => String(value ?? '').trim() !== (persistedValues[key] ?? '').trim()),
        )
    }

    const currentSavedMaritalStatus = (side: ContractSide) => {
        const info = side === 'seller' ? toRecord(currentContract.sellerInfo) : toRecord(currentContract.buyerInfo)
        return readContractInfoField(info, ['estado_civil', 'estadoCivil'])
    }

    const persistSideBeforeUploadIfNeeded = async (entry: ChecklistEntry) => {
        if (!entry.side || entry.documentCategory !== 'conjuge_documentos') return
        const formValue = (entry.side === 'seller' ? sellerForm.maritalStatus : buyerForm.maritalStatus).trim()
        const persistedValue = currentSavedMaritalStatus(entry.side).trim()
        if (formValue === persistedValue) return

        await updateContractData({
            contractId: currentContract.id,
            side: entry.side,
            sellerInfo: entry.side === 'seller' ? buildChangedSidePayload('seller') : undefined,
            buyerInfo: entry.side === 'buyer' ? buildChangedSidePayload('buyer') : undefined,
        })
        await refreshContract()
    }

    const handleUploadBatch = async (
        entry: ChecklistEntry,
        files: File[],
    ) => {
        setError(null)
        setUploadingKey(buildUploadKey(entry))
        try {
            await persistSideBeforeUploadIfNeeded(entry)
            for (const file of files) {
                await uploadContractDocument({
                    contractId: currentContract.id,
                    side: entry.side,
                    documentType: entry.documentType,
                    documentCategory: entry.documentCategory ?? resolveCategoryByDocumentType(entry.documentType),
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
            setUploadingKey(null)
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

    const handleSaveSide = async (side: ContractSide) => {
        setError(null)
        setSavingSide(side)
        try {
            const patch = buildChangedSidePayload(side)
            if (Object.keys(patch).length === 0) {
                setEditingSide(null)
                return
            }
            if (side === 'seller') {
                await updateContractData({
                    contractId: currentContract.id,
                    side,
                    sellerInfo: patch,
                })
            } else {
                await updateContractData({
                    contractId: currentContract.id,
                    side,
                    buyerInfo: patch,
                })
            }
            await refreshContract()
            setEditingSide(null)
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

    const cancelEditingSide = (side: ContractSide) => {
        setError(null)
        if (side === 'seller') {
            setSellerForm(buildSellerFormState(currentContract))
        } else {
            setBuyerForm(buildBuyerFormState(currentContract))
        }
        setEditingSide(null)
    }

    const renderUploadField = (entry: ChecklistEntry, currentDoc: ContractDocument | null) => {
        const { side } = entry
        const locked =
            side == null ? false : isSideLocked(currentContract, side)
        if (locked) {
            return (
                <p className="text-xs text-slate-500">
                    Este lado já foi aprovado. O envio e a remoção de documentos ficam bloqueados.
                </p>
            )
        }

        const allowMultiple = entry.allowMultiple === true
        const isUploading = uploadingKey === buildUploadKey(entry)
        const ctaLabel = currentDoc ? 'Substituir' : 'Enviar'

        return (
            <label className="block text-xs text-primary-700 cursor-pointer">
                <span className="underline">{ctaLabel}</span>
                <input
                    type="file"
                    accept="application/pdf,image/*"
                    multiple={allowMultiple}
                    className="hidden"
                    onChange={(event) => {
                        const selectedFiles = Array.from(event.target.files ?? [])
                        if (selectedFiles.length > 0) {
                            void handleUploadBatch(entry, selectedFiles)
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
    const sellerRequiredDocs = awaitingSig
        ? []
        : expandRequirementRows(
            'seller',
            effectiveRequirementRows(currentContract, 'seller', sellerForm.maritalStatus),
        )
    const buyerRequiredDocs = awaitingSig
        ? []
        : expandRequirementRows(
            'buyer',
            effectiveRequirementRows(currentContract, 'buyer', buyerForm.maritalStatus),
        )
    const draftDocument = findLatestDoc(sharedDocs, { documentType: 'contrato_minuta' })
    const signedContractDocument = findLatestDoc(sharedDocs, { documentType: 'contrato_assinado' })
    const signatureMethod = resolveSignatureMethod(currentContract)
    const hasAgencyReceivedSignedContract = Boolean(
        String(currentContract.workflowMetadata?.agencySignedContractReceivedAt ?? '').trim(),
    )
    const isAwaitingDocs = currentContract.status === 'AWAITING_DOCS'
    const isInDraft = currentContract.status === 'IN_DRAFT'
    const isAwaitingSignatures = currentContract.status === 'AWAITING_SIGNATURES'
    const currentUserId = Number(session?.user?.id ?? 0)
    const isCaptadorViewer =
        Number.isFinite(currentUserId) &&
        currentUserId > 0 &&
        currentContract.capturingBrokerId === currentUserId
    const isOwnerViewer =
        Number.isFinite(currentUserId) &&
        currentUserId > 0 &&
        currentContract.ownerId === currentUserId
    const isBuyerViewer =
        Number.isFinite(currentUserId) &&
        currentUserId > 0 &&
        currentContract.buyerClientId === currentUserId
    const isResponsibleViewer =
        Number.isFinite(currentUserId) &&
        currentUserId > 0 &&
        Array.isArray(currentContract.responsibleUserIds) &&
        currentContract.responsibleUserIds.includes(currentUserId)
    const canEditSellerSide = (currentContract.capabilities?.canEditSeller ?? (
        isAwaitingDocs && (isCaptadorViewer || isOwnerViewer || isResponsibleViewer)
    )) && !sellerLocked
    const canEditBuyerSide = (currentContract.capabilities?.canEditBuyer ?? (
        isAwaitingDocs && (isCaptadorViewer || isBuyerViewer || isResponsibleViewer)
    )) && !buyerLocked

    const isSellerViewer =
        isCaptadorViewer || isOwnerViewer || isResponsibleViewer
    const isBuyerSideViewer =
        isBuyerViewer || isResponsibleViewer
    const viewerSide = (() => {
        if (currentContract.viewerSide === 'seller' || currentContract.viewerSide === 'buyer' || currentContract.viewerSide === 'both' || currentContract.viewerSide === 'none') {
            return currentContract.viewerSide
        }
        if (isResponsibleViewer) return 'both'
        if (isSellerViewer && isBuyerViewer) return 'both'
        if (isSellerViewer && isBuyerSideViewer) return 'both'
        if (isSellerViewer) return 'seller'
        if (isBuyerSideViewer) return 'buyer'
        return 'none'
    })()
    const canViewSellerDocuments = currentContract.capabilities?.canReadSeller ?? (viewerSide === 'seller' || viewerSide === 'both')
    const canViewBuyerDocuments = currentContract.capabilities?.canReadBuyer ?? (viewerSide === 'buyer' || viewerSide === 'both')
    const canViewDetailedDocuments = canViewSellerDocuments || canViewBuyerDocuments
    const participantSide = viewerSide === 'seller' || viewerSide === 'buyer' ? viewerSide : null
    const ownProgress = participantSide ? currentContract.documentProgress?.[participantSide] : null
    const counterpartSide = participantSide === 'seller' ? 'buyer' : participantSide === 'buyer' ? 'seller' : null
    const counterpartProgress = counterpartSide ? currentContract.documentProgress?.[counterpartSide] : null
    const ownDocumentsApproved = ownProgress != null && ownProgress.totals.pending === 0 && ownProgress.totals.rejected === 0
    const waitingForCounterparty = ownDocumentsApproved && Boolean(counterpartProgress) && (
        counterpartProgress!.totals.pending > 0 || counterpartProgress!.totals.rejected > 0
    )
    const nextActionMessage = waitingForCounterparty
        ? `Sua documentação está completa. Aguarde o ${counterpartSide === 'seller' ? 'vendedor' : 'comprador'} concluir a parte dele.`
        : isAwaitingDocs
            ? 'Preencha seus dados aos poucos e envie os documentos necessários para este contrato avançar.'
            : statusMeta.nextAction

    const renderPartyForm = (
        side: ContractSide,
        title: string,
        form: ContractFormState,
        setForm: (value: ContractFormState) => void,
        canEdit: boolean,
        locked: boolean,
        reason: string | null,
        approvalStatus: ContractDetail['sellerApprovalStatus'],
    ) => {
        const isEditing = editingSide === side
        const canChange = canEdit && isEditing
        return (
        <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
                <div className="flex items-center gap-2">
                    {approvalBadge(approvalStatus)}
                    {canEdit && !locked && !isEditing && (
                        <button
                            type="button"
                            onClick={() => setEditingSide(side)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
                        >
                            Editar dados
                        </button>
                    )}
                </div>
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
                        disabled={!canChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:border-slate-100 disabled:bg-white disabled:text-slate-700"
                    >
                        <option value="">Selecionar</option>
                        {MARITAL_STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </label>
                    <label className="space-y-1 text-xs text-slate-600">
                        <span>Profissão</span>
                        <input
                            value={form.profession}
                            onChange={(event) => setForm({ ...form, profession: event.target.value })}
                            disabled={!canChange}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:border-slate-100 disabled:bg-white disabled:text-slate-700"
                        />
                    </label>
                    <label className="space-y-1 text-xs text-slate-600">
                        <span>E-mail</span>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(event) => setForm({ ...form, email: event.target.value })}
                            disabled={!canChange}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:border-slate-100 disabled:bg-white disabled:text-slate-700"
                        />
                    </label>
                    <label className="space-y-1 text-xs text-slate-600">
                        <span>Telefone</span>
                        <input
                            value={form.phone}
                            onChange={(event) => setForm({ ...form, phone: event.target.value })}
                            disabled={!canChange}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:border-slate-100 disabled:bg-white disabled:text-slate-700"
                        />
                    </label>
                <label className="space-y-1 text-xs text-slate-600 md:col-span-2">
                        <span>Dados bancários</span>
                        <textarea
                            rows={3}
                            value={form.bankDetails}
                            onChange={(event) => setForm({ ...form, bankDetails: event.target.value })}
                            disabled={!canChange}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:border-slate-100 disabled:bg-white disabled:text-slate-700"
                        ></textarea>
                </label>
                {side === 'buyer' && isRentalPurpose(currentContract.propertyPurpose) && (
                    <label className="space-y-1 text-xs text-slate-600 md:col-span-2">
                        <span>Garantia de locação</span>
                        <select
                            value={form.guaranteeType}
                            onChange={(event) => setForm({ ...form, guaranteeType: event.target.value })}
                            disabled={!canChange}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:border-slate-100 disabled:bg-white disabled:text-slate-700"
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
            ) : canEdit && isEditing ? (
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => void handleSaveSide(side)}
                        disabled={savingSide === side}
                        className="inline-flex items-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                    >
                        {savingSide === side ? 'Salvando...' : 'Salvar dados deste lado'}
                    </button>
                    <button
                        type="button"
                        onClick={() => cancelEditingSide(side)}
                        className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                    >
                        Cancelar
                    </button>
                </div>
            ) : (
                <p className="text-xs text-slate-500">
                    Você pode acompanhar esses dados, mas não editar este lado do contrato.
                </p>
            )}
        </section>
        )
    }

    const renderCounterpartySummary = (side: ContractSide) => {
        const progress = currentContract.documentProgress?.[side]
        const sideLabel = side === 'seller' ? 'proprietário' : 'comprador'
        return (
            <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-800">
                    Pendências do {sideLabel}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                    Por política de privacidade, os arquivos do outro lado não ficam visíveis aqui. Você acompanha somente o status agregado.
                </p>
                <p className="mt-3 text-xs text-slate-700">
                    Pendentes: {progress?.totals.pending ?? 0} • Aprovadas: {progress?.totals.approved ?? 0} • Rejeitadas: {progress?.totals.rejected ?? 0}
                </p>
                <ul className="mt-3 space-y-1 text-xs text-slate-700">
                    {(progress?.categories ?? []).map((item) => (
                        <li key={`counterparty-${side}-${item.category}`} className="flex items-center justify-between gap-2">
                            <span>{CATEGORY_LABELS[item.category] ?? item.category}</span>
                            <span className="shrink-0 text-slate-600">{renderDocumentProgressStatus(item.status)}</span>
                        </li>
                    ))}
                </ul>
            </section>
        )
    }

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
                                Proprietário: {sellerMeta.compactLabel}
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
                    <div className="max-w-sm rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-950">
                        <p className="font-semibold">Como avançar</p>
                        <p className="mt-1 leading-relaxed">{nextActionMessage}</p>
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
                        <p className="text-sm font-semibold text-slate-900">Situação do proprietário</p>
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

                {currentContract.documentProgress && (
                    <div className="grid gap-4 md:grid-cols-2">
                        {(['seller', 'buyer'] as const).map((side) => {
                            const progress = currentContract.documentProgress?.[side]
                            const sideTitle = side === 'seller' ? 'Progresso proprietário/captador' : 'Progresso comprador'
                            return (
                                <div key={`progress-${side}`} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
                                    <p className="text-sm font-semibold text-slate-900">{sideTitle}</p>
                                    <p className="mt-1 text-xs text-slate-600">
                                        Pendentes: {progress?.totals.pending ?? 0} • Aprovadas: {progress?.totals.approved ?? 0} • Rejeitadas: {progress?.totals.rejected ?? 0}
                                    </p>
                                    <ul className="mt-3 space-y-1 text-xs text-slate-700">
                                        {(progress?.categories ?? []).map((item) => {
                                            const statusLabel = renderDocumentProgressStatus(item.status)
                                            return (
                                            <li key={`${side}-${item.category}`} className="flex items-center justify-between gap-2">
                                                <span>{CATEGORY_LABELS[item.category] ?? item.category}</span>
                                                <span className="shrink-0 text-slate-600">{statusLabel}</span>
                                            </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            )
                        })}
                    </div>
                )}
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
                                <div className="mt-3">{renderUploadField({ documentType: 'contrato_assinado', label: 'contrato assinado' }, signedContractDocument)}</div>
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
                            const currentDoc = findLatestDoc(sharedDocs, { documentType: normalizedType })
                            const isOptional = normalizedType === 'boleto_vistoria'

                            return (
                                <div key={documentType} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                                    <p className="font-semibold text-slate-900">
                                        {documentLabel(normalizedType)} {isOptional ? '(opcional)' : ''}
                                    </p>
                                    <p className={`mt-1 text-xs ${currentDoc ? 'text-emerald-700' : 'text-slate-500'}`}>
                                        {renderChecklistStatus(currentDoc)}
                                    </p>
                                    {latestFileName(currentDoc) && (
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            Último arquivo: {latestFileName(currentDoc)}
                                        </p>
                                    )}
                                    <div className="mt-3">{renderUploadField({ documentType: normalizedType, label: documentLabel(normalizedType) }, currentDoc)}</div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}

            {isAwaitingDocs && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {canViewSellerDocuments && renderPartyForm(
                        'seller',
                        'Dados do proprietário',
                        sellerForm,
                        setSellerForm,
                        canEditSellerSide,
                        sellerLocked,
                        sellerReason,
                        currentContract.sellerApprovalStatus,
                    )}
                    {canViewBuyerDocuments && renderPartyForm(
                        'buyer',
                        'Dados do comprador',
                        buyerForm,
                        setBuyerForm,
                        canEditBuyerSide,
                        buyerLocked,
                        buyerReason,
                        currentContract.buyerApprovalStatus,
                    )}
                    {!canViewSellerDocuments && renderCounterpartySummary('seller')}
                    {!canViewBuyerDocuments && renderCounterpartySummary('buyer')}
                </div>
            )}

            {canViewDetailedDocuments ? (
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
                            Aqui ficam os documentos compartilhados do fluxo contratual, como a minuta e outros arquivos sem vínculo exclusivo com proprietário ou comprador.
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
                                    {uploadedDocumentLabel(doc)}{doc.originalFileName ? ` - ${doc.originalFileName}` : ''}
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

                {canViewSellerDocuments && (
                <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-3" aria-labelledby="seller-documents">
                    <div className="flex items-center justify-between">
                        <h2 id="seller-documents" className="text-sm font-semibold text-slate-800">
                            Documentos do proprietário
                        </h2>
                        {approvalBadge(currentContract.sellerApprovalStatus)}
                    </div>
                    <p className="text-xs text-slate-500">
                        Envie e acompanhe os documentos do proprietário neste bloco. Quando este lado for aprovado, os envios ficam bloqueados para prevenir erro operacional.
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
                                    {doc.originalFileName || uploadedDocumentLabel(doc)}
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
                        <div className="space-y-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Checklist deste lado
                            </p>
                            {sellerRequiredDocs.map((entry) => {
                                const currentDoc = findLatestDoc(sellerDocs, entry)
                                return (
                                    <div key={`seller-${entry.documentType}-${entry.documentCategory ?? 'default'}`} className="flex items-center justify-between gap-3 text-xs">
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-800">{entry.label}</p>
                                            {latestFileName(currentDoc) && (
                                                <p className="mt-1 truncate text-[11px] text-slate-500" title={latestFileName(currentDoc) ?? undefined}>
                                                    {latestFileName(currentDoc)}
                                                </p>
                                            )}
                                            {renderChecklistHint(currentDoc) && (
                                                <p className="mt-1 text-[11px] text-amber-700">
                                                    {renderChecklistHint(currentDoc)}
                                                </p>
                                            )}
                                        </div>
                                        {renderUploadField(entry, currentDoc)}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </section>
                )}

                {canViewBuyerDocuments && (
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
                                    {uploadedDocumentLabel(doc)}{doc.originalFileName ? ` - ${doc.originalFileName}` : ''}
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
                        <div className="space-y-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Checklist deste lado
                            </p>
                            {buyerRequiredDocs.map((entry) => {
                                const currentDoc = findLatestDoc(buyerDocs, entry)
                                const isOptional = entry.optional === true || OPTIONAL_DOC_TYPES.has(entry.documentType)
                                return (
                                    <div key={`buyer-${entry.documentType}-${entry.documentCategory ?? 'default'}`} className="flex items-center justify-between gap-3 text-xs">
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-800">
                                                {entry.label} {isOptional ? '(opcional)' : ''}
                                            </p>
                                            {latestFileName(currentDoc) && (
                                                <p className="mt-1 truncate text-[11px] text-slate-500" title={latestFileName(currentDoc) ?? undefined}>
                                                    {latestFileName(currentDoc)}
                                                </p>
                                            )}
                                            {renderChecklistHint(currentDoc) && (
                                                <p className="mt-1 text-[11px] text-amber-700">
                                                    {renderChecklistHint(currentDoc)}
                                                </p>
                                            )}
                                        </div>
                                        {renderUploadField(entry, currentDoc)}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </section>
                )}

                {!isAwaitingDocs && !canViewSellerDocuments && renderCounterpartySummary('seller')}
                {!isAwaitingDocs && !canViewBuyerDocuments && renderCounterpartySummary('buyer')}

            </div>
            ) : (
                <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                    <p className="text-sm text-slate-700">
                        Você pode acompanhar apenas o status do contrato nesta etapa.
                    </p>
                </section>
            )}

            {error && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    {error}
                </p>
            )}

        </div>
    )
}
