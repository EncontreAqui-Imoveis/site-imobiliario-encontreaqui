'use client'

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    Camera,
    Check,
    Home,
    Info,
    Loader2,
    Save,
    UserRound,
    Video,
    X,
} from 'lucide-react'

import { ApiError } from '@/lib/api/client'
import { createProperty, requestSupportContact } from '@/lib/api/user'
import {
    clearDraft,
    isPropertyDraftStaleError,
    loadDraft,
    loadDraftMedia,
    saveDraft,
    saveDraftMedia,
} from '@/lib/drafts'
import {
    BRAZILIAN_STATES,
    buildCreatePropertyFormData,
    clampAreaInput,
    clampCountInput,
    CreatePropertyActor,
    CreatePropertyDraftData,
    PROPERTY_CANONICAL_AMENITIES,
    PropertyAmenity,
    digitsOnly,
    formatCepInput,
    isOptionalBairroPropertyType,
    MAX_PROPERTY_AREA,
    MAX_PROPERTY_COUNT,
    MAX_PROPERTY_PRICE,
    PROPERTY_PURPOSES,
    PROPERTY_TYPES,
    requiresLotFields,
    supportsRent,
    supportsSale,
} from '@/lib/propertyCreate'
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currencyInput'
import { formatPhoneInput } from '@/lib/phoneInput'
import { validateImageFile, validateVideoFile } from '@/lib/sanitize'
import { useUser } from '@/contexts/UserContext'
import { isApprovedBroker, isRestrictedBroker, resolveOperationalGateRoute } from '@/lib/auth/routeResolution'
import { CurrencyInput } from '@/components/form/CurrencyInput'
import { areaInputToSquareMeters, areaUnitLabel } from '@/lib/areaUnits'
import { getUploadSignature, uploadToCloudinaryBrowser } from '@/lib/api/cloudinaryUpload'
import { TEAM_CONTACT_PHONE } from '@/lib/contactLinks'

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6
type CepLookupResult = { logradouro: string; bairro: string; localidade: string; uf: string }

const STEPS = ['Dados principais', 'Localização', 'Áreas', 'Comodidades', 'Mídia', 'Revisão'] as const
const INPUT = 'w-full rounded-xl border border-slate-200 px-3 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500'
const LABEL = 'mb-1 block text-xs font-medium text-slate-600'
const REVIEW_CARD = 'min-w-0 rounded-xl border border-slate-200 bg-white p-4'
const REVIEW_SECTION_TITLE = 'text-base font-bold text-slate-900'
const REVIEW_LABEL = 'text-xs font-semibold uppercase tracking-[0.12em] text-slate-500'
const REVIEW_VALUE = 'mt-2 text-sm text-slate-800 whitespace-pre-wrap break-words [overflow-wrap:anywhere]'
const AREA_UNIT_OPTIONS: Array<{ value: CreatePropertyDraftData['areaConstruidaUnidade']; label: string }> = [
    { value: 'm2', label: 'm²' },
    { value: 'hectare', label: 'Hectare (ha)' },
    { value: 'alqueire', label: 'Alqueire' },
]
const INITIAL: CreatePropertyDraftData = {
    actorMode: null, propertyType: '', purpose: '', title: '', description: '', ownerName: '', ownerPhone: '',
    priceSale: '', priceRent: '', cep: '', semCep: false, state: 'GO', city: '', bairro: '', address: '', numero: '', complemento: '',
    quadra: '', lote: '', semNumero: false, semQuadra: false, semLote: false,
    bedrooms: '', bathrooms: '', garageSpots: '', amenities: [],
    areaConstruida: '', areaConstruidaUnidade: 'm2', areaTerreno: '', areaTerrenoUnidade: 'm2', hasWifi: false, temPiscina: false, temEnergiaSolar: false, temAutomacao: false,
    temArCondicionado: false, ehMobiliada: false,
}

function parseDraft(data: Record<string, unknown>): CreatePropertyDraftData {
    const parsed = {
        ...INITIAL,
        ...Object.fromEntries(Object.entries(INITIAL).map(([key, fallback]) => {
            const value = data[key]
            if (typeof fallback === 'boolean') return [key, Boolean(value)]
            if (Array.isArray(fallback)) {
                return [key, Array.isArray(value) ? value.filter((item) => String(item).trim().length > 0) : []]
            }
            return [key, String(value ?? fallback)]
        })),
        actorMode: data.actorMode === 'broker' || data.actorMode === 'client-owner' ? data.actorMode : null,
    }
    return {
        ...parsed,
        priceSale: formatCurrencyInput(parsed.priceSale),
        priceRent: formatCurrencyInput(parsed.priceRent),
    }
}

function validOwnerPhone(value: string) {
    const digits = digitsOnly(value)
    return digits.length === 0 || (digits.length >= 10 && digits.length <= 13)
}

type CountFieldKey = 'bedrooms' | 'bathrooms' | 'garageSpots'

function isValidCountFieldValue(value: string): boolean {
    if (!value.trim()) return true
    if (!/^\d+$/.test(value)) return false
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= MAX_PROPERTY_COUNT
}

function toSentenceCase(value: string): string {
    return value
        .toLowerCase()
        .split(' ')
        .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
        .join(' ')
}

const AMENITY_LABELS: Record<PropertyAmenity, string> = {
    'WI-FI': 'Wi-Fi',
    'PISCINA': 'Piscina',
    'ENERGIA SOLAR': 'Energia Solar',
    'AUTOMAÇÃO': 'Automação',
    'AR CONDICIONADO': 'Ar-condicionado',
    'POÇO ARTESIANO': 'Poço artesiano',
    'MOBILIADA': 'Mobiliada',
    'ELEVADOR': 'Elevador',
    'ACADEMIA': 'Academia',
    'CHURRASQUEIRA': 'Churrasqueira',
    'SALÃO DE FESTAS': 'Salão de festas',
    'QUADRA': 'Quadra',
    'CONDOMÍNIO FECHADO': 'Condomínio fechado',
    'ACEITA PETS': 'Aceita pets',
    'SISTEMA DE SEGURANÇA/CÂMERA': 'Sistema de segurança/câmera',
    'SAUNA': 'Sauna',
}

function getAmenityLabel(amenity: PropertyAmenity): string {
    return AMENITY_LABELS[amenity] ?? toSentenceCase(amenity)
}

function normalizeAmenitySelection(form: CreatePropertyDraftData): {
    hasWifi: boolean
    temPiscina: boolean
    temEnergiaSolar: boolean
    temAutomacao: boolean
    temArCondicionado: boolean
    ehMobiliada: boolean
} {
    const amenities = new Set(form.amenities)
    return {
        hasWifi: amenities.has('WI-FI') || form.hasWifi,
        temPiscina: amenities.has('PISCINA') || form.temPiscina,
        temEnergiaSolar: amenities.has('ENERGIA SOLAR') || form.temEnergiaSolar,
        temAutomacao: amenities.has('AUTOMAÇÃO') || form.temAutomacao,
        temArCondicionado: amenities.has('AR CONDICIONADO') || form.temArCondicionado,
        ehMobiliada: amenities.has('MOBILIADA') || form.ehMobiliada,
    }
}

function isDraftRecoverable(raw: ReturnType<typeof loadDraft>): boolean {
    if (!raw) return false
    const actorMode = String(raw.data?.actorMode ?? '').trim()
    if (actorMode !== 'broker' && actorMode !== 'client-owner') return false
    const step = Number(raw.currentStep)
    if (!Number.isInteger(step) || step < 1 || step > 6) return false
    return true
}

async function lookupCep(cep: string): Promise<CepLookupResult | null> {
    const clean = digitsOnly(cep)
    if (clean.length !== 8) return null
    try {
        const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
        if (!response.ok) return null
        const data = (await response.json()) as { erro?: boolean } & Partial<CepLookupResult>
        if (data.erro) return null
        return {
            logradouro: String(data.logradouro ?? '').trim(),
            bairro: String(data.bairro ?? '').trim(),
            localidade: String(data.localidade ?? '').trim(),
            uf: String(data.uf ?? '').trim().toUpperCase(),
        }
    } catch {
        return null
    }
}

async function fetchCitiesByState(uf: string): Promise<string[]> {
    if (uf.trim().length !== 2) return []
    try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
        if (!response.ok) return []
        const rows = (await response.json()) as Array<{ nome?: string }>
        return Array.from(new Set(rows.map((row) => String(row.nome ?? '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    } catch {
        return []
    }
}

export default function AnunciePage() {
    const router = useRouter()
    const { session, loading: authLoading } = useUser()
    const imageInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)
    const [actorMode, setActorMode] = useState<CreatePropertyActor | null>(null)
    const [showOwnershipQuestion, setShowOwnershipQuestion] = useState(false)
    const [showContactFlow, setShowContactFlow] = useState(false)
    const [showContactConfirmation, setShowContactConfirmation] = useState(false)
    const [showOtherOwnerWarning, setShowOtherOwnerWarning] = useState(false)
    const [contactRequested, setContactRequested] = useState(false)
    const [contactError, setContactError] = useState('')
    const [isSupportRequesting, setIsSupportRequesting] = useState(false)
    const [step, setStep] = useState<WizardStep>(1)
    const [form, setForm] = useState<CreatePropertyDraftData>(INITIAL)
    const [images, setImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [video, setVideo] = useState<File | null>(null)
    const [videoPreview, setVideoPreview] = useState<string | null>(null)
    const [cityOptions, setCityOptions] = useState<string[]>([])
    const [showDraftBanner, setShowDraftBanner] = useState(false)
    const [draftDecisionResolved, setDraftDecisionResolved] = useState(false)
    const [cepLoading, setCepLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [uploadStatus, setUploadStatus] = useState<string | null>(null)

    const isBrokerPendingOrRestricted = isRestrictedBroker(session)
    const isBrokerApproved = isApprovedBroker(session) && !isBrokerPendingOrRestricted
    const saleEnabled = useMemo(() => supportsSale(form.purpose), [form.purpose])
    const rentEnabled = useMemo(() => supportsRent(form.purpose), [form.purpose])
    const needsLotFields = useMemo(() => requiresLotFields(form.propertyType), [form.propertyType])
    const bairroOptional = useMemo(() => isOptionalBairroPropertyType(form.propertyType), [form.propertyType])
    const salePriceValue = useMemo(() => parseCurrencyInput(form.priceSale), [form.priceSale])
    const rentPriceValue = useMemo(() => parseCurrencyInput(form.priceRent), [form.priceRent])

    useEffect(() => {
        if (!authLoading && !session) router.replace('/auth/login?next=/anuncie')
        const gateRoute = resolveOperationalGateRoute(session)
        const skipBrokerOnboardingGate = isBrokerPendingOrRestricted && gateRoute === '/onboarding/broker'
        const skipAllBrokerGatesOnAnnounce =
            isBrokerPendingOrRestricted && session?.user.role === 'broker'
        if (!authLoading && gateRoute && !skipBrokerOnboardingGate && !skipAllBrokerGatesOnAnnounce) {
            router.replace(gateRoute)
            return
        }
    }, [authLoading, session, isBrokerPendingOrRestricted, router])

    useEffect(() => {
        setDraftDecisionResolved(false)
        const draft = loadDraft()
        if (draft && isDraftRecoverable(draft)) {
            setShowDraftBanner(true)
        } else {
            if (draft && !isDraftRecoverable(draft)) {
                clearDraft()
            }
            setDraftDecisionResolved(true)
        }
    }, [])

    useEffect(() => {
        if (!actorMode || !draftDecisionResolved) return
        saveDraft(step, {
            ...form,
            actorMode,
            mediaImageCount: images.length,
            mediaVideoSelected: Boolean(video),
        })
    }, [actorMode, draftDecisionResolved, form, images.length, step, video])

    useEffect(() => {
        if (!actorMode || !draftDecisionResolved) return
        void saveDraftMedia(images, video)
    }, [actorMode, draftDecisionResolved, images, video])

    useEffect(() => {
        let cancelled = false
        void fetchCitiesByState(form.state).then((cities) => {
            if (!cancelled) setCityOptions(cities)
        })
        return () => {
            cancelled = true
        }
    }, [form.state])

    useEffect(() => () => {
        imagePreviews.forEach((preview) => URL.revokeObjectURL(preview))
        if (videoPreview) URL.revokeObjectURL(videoPreview)
    }, [imagePreviews, videoPreview])

    function updateField<K extends keyof CreatePropertyDraftData>(key: K, value: CreatePropertyDraftData[K]) {
        setForm((current) => ({ ...current, [key]: value }))
        setError(null)
    }

    function toggleCountFieldEmpty(key: CountFieldKey) {
        setForm((current) => {
            if (current[key].trim()) return { ...current, [key]: '' }
            return { ...current, [key]: '0' }
        })
        setError(null)
    }

    function toggleAmenity(amenity: PropertyAmenity, checked: boolean) {
        setForm((current) => {
            if (checked) {
                return {
                    ...current,
                    amenities: Array.from(new Set([...current.amenities, amenity])),
                }
            }
            return {
                ...current,
                amenities: current.amenities.filter((entry) => entry !== amenity),
            }
        })
        setError(null)
    }

    async function restoreDraft() {
        const draft = loadDraft()
        if (!draft) return

        setDraftDecisionResolved(false)
        const media = await loadDraftMedia()
        imagePreviews.forEach((preview) => URL.revokeObjectURL(preview))
        if (videoPreview) URL.revokeObjectURL(videoPreview)
        setForm(parseDraft(draft.data))
        const draftActorMode =
            draft.data.actorMode === 'broker' || draft.data.actorMode === 'client-owner'
                ? draft.data.actorMode
                : null
        if (draftActorMode === 'broker' && isBrokerPendingOrRestricted) {
            setDraftDecisionResolved(true)
            clearDraft()
            setShowOwnershipQuestion(false)
            setShowContactFlow(false)
            setShowOtherOwnerWarning(false)
            setError('Seu fluxo anterior foi de corretor e não pode continuar nesse acesso. Selecione novamente.')
            return
        }
        if (draftActorMode) {
            setActorMode(draftActorMode)
        }
        setShowContactFlow(false)
        setShowOtherOwnerWarning(false)
        setImages(media.images)
        setImagePreviews(media.images.map((file) => URL.createObjectURL(file)))
        setVideo(media.video)
        setVideoPreview(media.video ? URL.createObjectURL(media.video) : null)
        setStep(Math.min(Math.max(Number(draft.currentStep || 1), 1), 6) as WizardStep)
        setShowDraftBanner(false)
        const expectedImages = Number(draft.data.mediaImageCount ?? 0)
        const expectedVideo = draft.data.mediaVideoSelected === true
        if ((expectedImages > 0 && media.images.length === 0) || (expectedVideo && !media.video)) {
            setError('O formulário foi restaurado, mas as mídias deste rascunho precisam ser selecionadas novamente.')
        }
        setDraftDecisionResolved(true)
    }

    function fallbackToFreshFlow(draftErrorMessage?: string) {
        clearDraft()
        setShowDraftBanner(false)
        setDraftDecisionResolved(true)
        setShowOwnershipQuestion(false)
        setShowContactFlow(false)
        setShowContactConfirmation(false)
        setShowOtherOwnerWarning(false)
        if (draftErrorMessage) setError(draftErrorMessage)
    }

    function discardDraft() {
        clearDraft()
        setShowDraftBanner(false)
        setDraftDecisionResolved(true)
        setShowOwnershipQuestion(false)
        setShowContactFlow(false)
        setShowContactConfirmation(false)
        setShowOtherOwnerWarning(false)
    }

    function openClientOwnerFlow() {
        setActorMode(isBrokerApproved ? 'broker' : 'client-owner')
        setShowOwnershipQuestion(false)
        setShowContactFlow(false)
        setShowContactConfirmation(false)
        setShowOtherOwnerWarning(false)
        setContactRequested(false)
        setContactError('')
    }

    function openOtherOwnerFlow() {
        setShowOwnershipQuestion(false)
        setShowContactFlow(false)
        setShowOtherOwnerWarning(true)
        setShowContactConfirmation(false)
        setContactRequested(false)
        setContactError('')
    }

    function openContactFlow() {
        setShowOwnershipQuestion(false)
        setShowContactFlow(true)
        setShowContactConfirmation(true)
        setShowOtherOwnerWarning(false)
        setContactRequested(false)
        setContactError('')
    }

    function hideContactFlow() {
        setShowContactFlow(false)
        setShowContactConfirmation(false)
        setContactRequested(false)
        setContactError('')
        setIsSupportRequesting(false)
    }

    function hideOtherOwnerWarning() {
        setShowOtherOwnerWarning(false)
        setShowOwnershipQuestion(true)
        setContactError('')
    }

    function resolveSupportRequestErrorMessage(error: unknown): string {
        if (error instanceof ApiError) {
            if (error.status === 429) {
                return 'Estamos recebendo muitas solicitações no momento. Tente novamente em alguns minutos.'
            }
            return error.message || 'Não foi possível enviar sua solicitação de contato.'
        }
        return 'Não foi possível enviar sua solicitação de contato. Tente novamente.'
    }

    function resolveSubmitErrorMessage(submissionError: unknown): string {
        if (submissionError instanceof ApiError) {
            return submissionError.message || 'Erro ao cadastrar imóvel ou falha no upload.'
        }
        if (submissionError instanceof Error && submissionError.message.trim().length > 0) {
            return submissionError.message
        }
        return 'Erro ao cadastrar imóvel ou falha no upload.'
    }

    async function sendSupportRequest() {
        if (isSupportRequesting) return
        setIsSupportRequesting(true)
        setContactError('')
        setContactRequested(false)
        try {
            await requestSupportContact({
                source: 'anuncie',
                channel: 'web',
            })
            setContactRequested(true)
            setShowContactConfirmation(false)
        } catch (error) {
            setContactError(resolveSupportRequestErrorMessage(error))
        } finally {
            setIsSupportRequesting(false)
        }
    }

    async function handleCepBlur() {
        if (form.semCep) return
        const result = await lookupCep(form.cep)
        if (!result) return
        setCepLoading(true)
        setForm((current) => ({
            ...current,
            cep: formatCepInput(form.cep),
            address: result.logradouro || current.address,
            bairro: result.bairro || current.bairro,
            city: result.localidade || current.city,
            state: result.uf || current.state,
        }))
        setCepLoading(false)
    }

    function handleImagesSelected(event: ChangeEvent<HTMLInputElement>) {
        const files = event.target.files
        if (!files) return
        const nextFiles: File[] = []
        const nextPreviews: string[] = []
        for (let index = 0; index < files.length && images.length + nextFiles.length < 20; index += 1) {
            const file = files[index]
            const validation = validateImageFile(file)
            if (!validation.valid) {
                setError(validation.error ?? 'Arquivo de imagem inválido.')
                continue
            }
            nextFiles.push(file)
            nextPreviews.push(URL.createObjectURL(file))
        }
        if (files.length + images.length > 20) {
            setError('Você pode enviar no máximo 20 imagens.')
        }
        if (nextFiles.length) {
            setImages((current) => [...current, ...nextFiles])
            setImagePreviews((current) => [...current, ...nextPreviews])
        }
        event.target.value = ''
    }

    function removeImage(index: number) {
        URL.revokeObjectURL(imagePreviews[index])
        setImages((current) => current.filter((_, currentIndex) => currentIndex !== index))
        setImagePreviews((current) => current.filter((_, currentIndex) => currentIndex !== index))
    }

    function handleVideoSelected(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return
        const validation = validateVideoFile(file)
        if (!validation.valid) {
            setError(validation.error ?? 'Arquivo de vídeo inválido.')
            event.target.value = ''
            return
        }
        if (videoPreview) URL.revokeObjectURL(videoPreview)
        setVideo(file)
        setVideoPreview(URL.createObjectURL(file))
        event.target.value = ''
    }

    function removeVideo() {
        if (videoPreview) URL.revokeObjectURL(videoPreview)
        setVideo(null)
        setVideoPreview(null)
    }

    function canAdvance() {
        switch (step) {
            case 1:
                return Boolean(
                    form.propertyType &&
                        form.purpose &&
                        form.title.trim() &&
                        form.description.trim() &&
                        validOwnerPhone(form.ownerPhone) &&
                        form.description.trim().length <= 500 &&
                        (!saleEnabled || (salePriceValue > 0 && salePriceValue <= MAX_PROPERTY_PRICE)) &&
                        (!rentEnabled || (rentPriceValue > 0 && rentPriceValue <= MAX_PROPERTY_PRICE)),
                )
            case 2:
                return Boolean(
                    (form.semCep || digitsOnly(form.cep).length === 8) &&
                        form.address.trim() &&
                        (bairroOptional || form.bairro.trim()) &&
                        form.city.trim() &&
                        form.state.trim() &&
                        (form.semNumero || form.numero.trim()) &&
                        (!needsLotFields ||
                            ((form.semQuadra || form.quadra.trim()) && (form.semLote || form.lote.trim()))),
                )
            case 3:
                const areaConstruida = form.areaConstruida.trim().length > 0 ? Number(form.areaConstruida) : 0
                const areaTerreno = Number(form.areaTerreno)
                if (areaTerreno <= 0 || areaTerreno > MAX_PROPERTY_AREA) return false
                if (areaConstruida < 0 || areaConstruida > MAX_PROPERTY_AREA) return false
                if (areaConstruida > 0 && areaTerreno > 0 && areaConstruida > areaTerreno) return false
                return (
                    isValidCountFieldValue(form.bedrooms) &&
                    isValidCountFieldValue(form.bathrooms) &&
                    isValidCountFieldValue(form.garageSpots)
                )
            case 4:
                return true
            case 5:
                return images.length > 0
            default:
                return true
        }
    }

    async function handleSubmit() {
        if (!actorMode) return
        setSubmitting(true)
        setError(null)
        setUploadStatus('Obtendo autorização para upload...')

        const areaConstruida = Number(form.areaConstruida)
        const areaTerreno = Number(form.areaTerreno)
        const areaTerrenoM2 = areaInputToSquareMeters(areaTerreno, form.areaTerrenoUnidade)
        const areaConstruidaM2 = areaInputToSquareMeters(areaConstruida || 0, form.areaConstruidaUnidade)
        const areaConstruidaInformada = Number.isFinite(areaConstruida) && areaConstruida > 0
        if (!Number.isFinite(areaTerrenoM2) || areaTerrenoM2 <= 0) {
            setSubmitting(false)
            setUploadStatus(null)
            setError('Informe a área do terreno maior que zero.')
            return
        }
        if (areaConstruidaInformada && areaConstruidaM2 > areaTerrenoM2) {
            setSubmitting(false)
            setUploadStatus(null)
            setError('A área construída não pode ser maior que a área do terreno.')
            return
        }
        
        try {
            let finalImageUrls: string[] = []
            let finalVideoUrl: string | null = null

            if (images.length > 0 || video) {
                const signatureData = await getUploadSignature()
                
                if (images.length > 0) {
                    setUploadStatus('Enviando imagens (0%)...')
                    const uploadedImages = await Promise.all(
                        images.map(async (file) => {
                            const res = await uploadToCloudinaryBrowser(file, signatureData, (progress) => {
                                setUploadStatus(`Enviando imagens... ${progress}%`)
                            })
                            return res.url
                        })
                    )
                    finalImageUrls = uploadedImages
                }

                if (video) {
                    setUploadStatus('Enviando vídeo (0%)...')
                    const res = await uploadToCloudinaryBrowser(video, signatureData, (progress) => {
                        setUploadStatus(`Enviando vídeo... ${progress}%`)
                    })
                    finalVideoUrl = res.url
                }
            }

            setUploadStatus('Salvando anúncio...')
            
            const selectedAmenities = Array.from(new Set(form.amenities))
            const derivedFlags = normalizeAmenitySelection({ ...form, amenities: selectedAmenities })
            const formData = buildCreatePropertyFormData({
                ...form,
                amenities: selectedAmenities,
                ...derivedFlags,
                actorMode,
                images: finalImageUrls,
                video: finalVideoUrl
            })
            
            const result = await createProperty(formData, actorMode)
            clearDraft()
            router.push(`/meus-imoveis?created=${result.id}`)
        } catch (submissionError) {
            const apiError = submissionError as ApiError
            if (isPropertyDraftStaleError(apiError)) {
                const draftErrorMessage = 'Seu rascunho ficou inválido no servidor. O cadastro continuará em fluxo normal e será salvo novamente.'
                fallbackToFreshFlow(draftErrorMessage)
                return
            }
            setError(resolveSubmitErrorMessage(submissionError))
        } finally {
            setSubmitting(false)
            setUploadStatus(null)
        }
    }

    if (authLoading || !session) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            </div>
        )
    }

    if (!actorMode) {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-5xl flex-col gap-6 px-4 py-8 pt-24">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        {showOwnershipQuestion
                            ? 'Você é proprietário do imóvel?'
                            : showOtherOwnerWarning
                                ? 'Não, quero anunciar de outra pessoa'
                                : showContactFlow || showContactConfirmation || contactRequested || contactError
                                ? 'Entrar em contato com a equipe'
                                : 'Como você quer anunciar?'}
                    </h1>
                    {showOwnershipQuestion ? (
                        <p className="mt-2 max-w-2xl text-sm text-slate-600">Escolha como deseja continuar o anúncio.</p>
                    ) : (
                        <p className="mt-2 max-w-2xl text-sm text-slate-600">
                            {showContactFlow || showContactConfirmation || contactRequested || contactError || showOtherOwnerWarning
                                ? 'Use o fluxo abaixo para falar com nosso time.'
                                : 'Como você quer anunciar?'}
                        </p>
                    )}
                </div>

                {showContactConfirmation ? (
                    <div className="rounded-2xl border border-accent-200 bg-accent-50 p-6">
                        <p className="text-sm text-slate-700">
                            Deseja solicitar atendimento da equipe de suporte antes de continuar?
                        </p>
                        <p className="mt-2 text-sm text-slate-700">Telefone de suporte: {TEAM_CONTACT_PHONE}</p>
                        {contactError ? <p className="mt-2 text-sm text-red-700">{contactError}</p> : null}
                        <div className="mt-4 flex flex-wrap gap-3">
                            <button
                                type="button"
                                disabled={isSupportRequesting}
                                onClick={sendSupportRequest}
                                className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {isSupportRequesting ? 'Enviando...' : 'Confirmar'}
                            </button>
                            <button
                                type="button"
                                onClick={hideContactFlow}
                                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Não
                            </button>
                        </div>
                    </div>
                ) : null}

                {contactRequested && !showContactConfirmation ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                        <p className="text-sm text-emerald-700">
                            Solicitação enviada com sucesso. Nossa equipe vai entrar em contato.
                        </p>
                        <p className="mt-2 text-sm text-emerald-700">Telefone de suporte: {TEAM_CONTACT_PHONE}</p>
                        <button
                            type="button"
                            onClick={() => {
                                hideContactFlow()
                                setContactRequested(false)
                                setContactError('')
                            }}
                            className="mt-4 inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                            Fechar
                        </button>
                    </div>
                ) : null}

                {!showContactFlow ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {showOtherOwnerWarning ? (
                            <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                                <p className="text-sm text-slate-700">
                                    Não é possível anunciar imóvel de outra pessoa pelo site/app.
                                </p>
                                <p className="mt-2 text-sm text-slate-700">Esse fluxo só permite retornar para a pergunta anterior.</p>
                                <button
                                    type="button"
                                    onClick={hideOtherOwnerWarning}
                                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Voltar
                                </button>
                            </div>
                        ) : !showOwnershipQuestion ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setShowOwnershipQuestion(true)}
                                    className="rounded-2xl border border-primary-200 bg-white p-6 text-left shadow-sm hover:border-primary-400 hover:shadow-md"
                                >
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                                        <Home className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900">Anunciar você mesmo</h2>
                                    <p className="mt-2 text-sm text-slate-600">Envie seu imóvel como proprietário para análise.</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={openContactFlow}
                                    className="rounded-2xl border border-accent-200 bg-accent-50 p-6 text-left shadow-sm hover:border-accent-400 hover:shadow-md block"
                                >
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100 text-accent-700">
                                        <UserRound className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900">Entrar em contato com a equipe</h2>
                                    <p className="mt-2 text-sm text-slate-600">Fale com a equipe para orientação profissional.</p>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={openClientOwnerFlow}
                                    className="rounded-2xl border border-primary-200 bg-white p-6 text-left shadow-sm hover:border-primary-400 hover:shadow-md"
                                >
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                                        <Home className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900">Sim, sou proprietário</h2>
                                    <p className="mt-2 text-sm text-slate-600">Seu imóvel passará por análise antes da publicação.</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={openOtherOwnerFlow}
                                    className="rounded-2xl border border-accent-200 bg-accent-50 p-6 text-left shadow-sm hover:border-accent-400 hover:shadow-md"
                                >
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100 text-accent-700">
                                        <UserRound className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900">Não, quero anunciar de outra pessoa</h2>
                                    <p className="mt-2 text-sm text-slate-600">Anunciar em nome de terceiros não é permitido no app/site.</p>
                                </button>
                            </>
                        )}
                    </div>
                ) : null}

                {showOwnershipQuestion ? (
                    <button
                        type="button"
                        onClick={() => setShowOwnershipQuestion(false)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </button>
                ) : showContactFlow ? (
                    <button
                        type="button"
                        onClick={hideContactFlow}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </button>
                ) : null}
            </div>
        )
    }

    const stepTitle = STEPS[step - 1]
    return (
        <div className="mx-auto max-w-4xl px-4 py-8 pt-24 sm:px-6">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Cadastrar imóvel</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {actorMode === 'client-owner' ? 'Fluxo de cliente-proprietário' : 'Fluxo de corretor aprovado'}
                    </p>
                </div>
                <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </button>
            </div>

            {showDraftBanner && (
                <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                            <Info className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-amber-900">Rascunho encontrado</p>
                            <p className="text-xs text-amber-800">Você pode continuar seu cadastro de onde parou.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={discardDraft} className="rounded-xl px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100">Descartar</button>
                        <button type="button" onClick={restoreDraft} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">Continuar</button>
                    </div>
                </div>
            )}

            <div className="mb-8 flex items-center gap-1 overflow-x-auto pb-1">
                {STEPS.map((label, index) => {
                    const visualStep = index + 1
                    const completed = visualStep < step
                    const current = visualStep === step
                    return (
                        <div key={label} className="flex flex-shrink-0 items-center gap-2">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${completed ? 'bg-primary-600 text-white' : current ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {completed ? <Check className="h-4 w-4" /> : visualStep}
                            </div>
                            <span className={`hidden text-xs font-medium sm:inline ${current ? 'text-primary-700' : 'text-slate-500'}`}>{label}</span>
                            {index < STEPS.length - 1 && <div className="mx-1 h-0.5 w-6 bg-slate-200" />}
                        </div>
                    )
                })}
            </div>

            <div className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/50">
                <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary-600" />
                    <h2 className="text-lg font-bold text-slate-900">{stepTitle}</h2>
                </div>

                {step === 1 && (
                    <>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div><label className={LABEL}>Tipo do imóvel *</label><select value={form.propertyType} onChange={(e) => updateField('propertyType', e.target.value)} className={INPUT}><option value="">Selecionar</option>{PROPERTY_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
                            <div><label className={LABEL}>Finalidade *</label><select value={form.purpose} onChange={(e) => updateField('purpose', e.target.value)} className={INPUT}><option value="">Selecionar</option>{PROPERTY_PURPOSES.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
                        </div>
                        <div><label className={LABEL}>Título *</label><input value={form.title} onChange={(e) => updateField('title', e.target.value)} maxLength={120} className={INPUT} /></div>
                        <div>
                            <label className={LABEL}>Descrição *</label>
                            <textarea value={form.description} onChange={(e) => updateField('description', e.target.value.slice(0, 500))} rows={4} maxLength={500} className={INPUT} />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div><label className={LABEL}>Nome do proprietário</label><input value={form.ownerName} onChange={(e) => updateField('ownerName', e.target.value)} maxLength={120} className={INPUT} /></div>
                            <div><label className={LABEL}>Telefone do proprietário</label><input value={form.ownerPhone} onChange={(e) => updateField('ownerPhone', formatPhoneInput(e.target.value))} maxLength={15} className={INPUT} placeholder="(00) 00000-0000" /></div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {saleEnabled && <div><label className={LABEL}>Preço de venda *</label><CurrencyInput value={form.priceSale} onChange={(value) => updateField('priceSale', value)} className={INPUT} placeholder="R$ 0,00" /></div>}
                            {rentEnabled && <div><label className={LABEL}>Preço de aluguel *</label><CurrencyInput value={form.priceRent} onChange={(value) => updateField('priceRent', value)} className={INPUT} placeholder="R$ 0,00" /></div>}
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className={LABEL}>{form.semCep ? 'CEP (opcional)' : 'CEP *'}</label>
                                <input
                                    value={form.cep}
                                    disabled={form.semCep}
                                    onChange={(e) => updateField('cep', formatCepInput(e.target.value))}
                                    onBlur={handleCepBlur}
                                    className={`${INPUT} disabled:bg-slate-50 disabled:text-slate-400`}
                                    placeholder="00000-000"
                                />
                                {cepLoading && <p className="mt-1 text-xs text-primary-500">Buscando CEP...</p>}
                                <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={form.semCep}
                                        onChange={(e) => {
                                            updateField('semCep', e.target.checked)
                                            if (e.target.checked) updateField('cep', '')
                                        }}
                                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    Sem CEP
                                </label>
                            </div>
                            <div><label className={LABEL}>Estado *</label><select value={form.state} onChange={(e) => updateField('state', e.target.value)} className={INPUT}>{BRAZILIAN_STATES.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div><label className={LABEL}>Cidade *</label><input list="city-options" value={form.city} onChange={(e) => updateField('city', e.target.value)} maxLength={120} className={INPUT} />{cityOptions.length > 0 && <datalist id="city-options">{cityOptions.map((city) => <option key={city} value={city} />)}</datalist>}</div>
                            <div><label className={LABEL}>{bairroOptional ? 'Bairro' : 'Bairro *'}</label><input value={form.bairro} onChange={(e) => updateField('bairro', e.target.value)} maxLength={120} className={INPUT} /></div>
                        </div>
                        <div><label className={LABEL}>Rua *</label><input value={form.address} onChange={(e) => updateField('address', e.target.value)} maxLength={120} className={INPUT} /></div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div><label className={LABEL}>{form.semNumero ? 'Número (opcional)' : 'Número *'}</label><input value={form.numero} disabled={form.semNumero} onChange={(e) => updateField('numero', digitsOnly(e.target.value).slice(0, 25))} maxLength={25} inputMode="numeric" className={`${INPUT} disabled:bg-slate-50 disabled:text-slate-400`} /><label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.semNumero} onChange={(e) => updateField('semNumero', e.target.checked)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />Sem número</label></div>
                            <div><label className={LABEL}>Complemento</label><input value={form.complemento} onChange={(e) => updateField('complemento', e.target.value)} maxLength={120} className={INPUT} /></div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div>
                                <label className={LABEL}>{needsLotFields && !form.semQuadra ? 'Quadra *' : 'Quadra'}</label>
                                <input value={form.quadra} disabled={form.semQuadra} onChange={(e) => updateField('quadra', e.target.value)} maxLength={25} className={`${INPUT} disabled:bg-slate-50 disabled:text-slate-500`} />
                                <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
                                    <input type="checkbox" checked={form.semQuadra} onChange={(e) => { updateField('semQuadra', e.target.checked); if (e.target.checked) updateField('quadra', '') }} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                    Sem quadra
                                </label>
                            </div>
                            <div>
                                <label className={LABEL}>{needsLotFields && !form.semLote ? 'Lote *' : 'Lote'}</label>
                                <input value={form.lote} disabled={form.semLote} onChange={(e) => updateField('lote', e.target.value)} maxLength={25} className={`${INPUT} disabled:bg-slate-50 disabled:text-slate-500`} />
                                <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
                                    <input type="checkbox" checked={form.semLote} onChange={(e) => { updateField('semLote', e.target.checked); if (e.target.checked) updateField('lote', '') }} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                    Sem lote
                                </label>
                            </div>
                        </div>
                    </>
                )}

                {step === 3 && (
                    <>
                        <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50/60 to-white p-4 sm:p-5">
                            <h3 className="text-sm font-semibold text-slate-900">Dimensões do imóvel</h3>
                            <p className="mt-1 text-xs text-slate-600">
                                Informe as áreas com a unidade correta. O sistema converte internamente para m².
                            </p>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={LABEL}>Área construída</label>
                                    <label className="mb-2 inline-flex items-center gap-2 text-xs text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={!form.areaConstruida.trim()}
                                            onChange={(event) => {
                                                if (event.target.checked) {
                                                    updateField('areaConstruida', '')
                                                }
                                            }}
                                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        Sem área construída
                                    </label>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                                        <input
                                            type="number"
                                            min="0"
                                            max={MAX_PROPERTY_AREA}
                                            step="0.01"
                                            disabled={!form.areaConstruida.trim()}
                                            value={form.areaConstruida}
                                            onChange={(e) => updateField('areaConstruida', clampAreaInput(e.target.value))}
                                            placeholder={form.areaConstruida.trim() ? undefined : 'Informe a área'}
                                            className={`${INPUT} min-w-0 flex-1 disabled:bg-slate-50 disabled:text-slate-400`}
                                        />
                                        <select value={form.areaConstruidaUnidade} onChange={(e) => updateField('areaConstruidaUnidade', e.target.value as CreatePropertyDraftData['areaConstruidaUnidade'])} className={`${INPUT} shrink-0 sm:w-44`}>
                                            {AREA_UNIT_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className={LABEL}>Área do terreno *</label>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                                        <input type="number" min="0" max={MAX_PROPERTY_AREA} step="0.01" value={form.areaTerreno} onChange={(e) => updateField('areaTerreno', clampAreaInput(e.target.value))} className={`${INPUT} min-w-0 flex-1`} />
                                        <select value={form.areaTerrenoUnidade} onChange={(e) => updateField('areaTerrenoUnidade', e.target.value as CreatePropertyDraftData['areaTerrenoUnidade'])} className={`${INPUT} shrink-0 sm:w-44`}>
                                            {AREA_UNIT_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                            <h3 className="text-sm font-semibold text-slate-900">Quartos, banheiros e vagas</h3>
                            <p className="mt-1 text-xs text-slate-600">
                                Marque “Sem ...” quando não se aplica ou informe a quantidade.
                            </p>
                            <div className="mt-4 grid gap-4 md:grid-cols-3">
                                <div className="rounded-xl border border-slate-200 bg-white p-3">
                                    <label className={LABEL}>Quartos</label>
                                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={!form.bedrooms.trim()}
                                            onChange={() => toggleCountFieldEmpty('bedrooms')}
                                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        Sem quartos
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={MAX_PROPERTY_COUNT}
                                        disabled={!form.bedrooms.trim()}
                                        value={form.bedrooms}
                                        onChange={(e) => updateField('bedrooms', clampCountInput(e.target.value))}
                                        className={`${INPUT} mt-2 disabled:bg-slate-50 disabled:text-slate-400`}
                                    />
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-3">
                                    <label className={LABEL}>Banheiros</label>
                                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={!form.bathrooms.trim()}
                                            onChange={() => toggleCountFieldEmpty('bathrooms')}
                                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        Sem banheiros
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={MAX_PROPERTY_COUNT}
                                        disabled={!form.bathrooms.trim()}
                                        value={form.bathrooms}
                                        onChange={(e) => updateField('bathrooms', clampCountInput(e.target.value))}
                                        className={`${INPUT} mt-2 disabled:bg-slate-50 disabled:text-slate-400`}
                                    />
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-3">
                                    <label className={LABEL}>Vagas</label>
                                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={!form.garageSpots.trim()}
                                            onChange={() => toggleCountFieldEmpty('garageSpots')}
                                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        Sem vagas
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={MAX_PROPERTY_COUNT}
                                        disabled={!form.garageSpots.trim()}
                                        value={form.garageSpots}
                                        onChange={(e) => updateField('garageSpots', clampCountInput(e.target.value))}
                                        className={`${INPUT} mt-2 disabled:bg-slate-50 disabled:text-slate-400`}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {step === 4 && (
                    <>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                            <p className={`${REVIEW_LABEL} text-xs uppercase tracking-[0.12em]`}>Comodidades</p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {PROPERTY_CANONICAL_AMENITIES.map((amenity) => (
                                    <label key={amenity} className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
                                        <input
                                            type="checkbox"
                                            checked={form.amenities.includes(amenity)}
                                            onChange={(event) => toggleAmenity(amenity, event.target.checked)}
                                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span>{getAmenityLabel(amenity)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {step === 5 && (
                    <>
                        <div role="button" tabIndex={0} onClick={() => imageInputRef.current?.click()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') imageInputRef.current?.click() }} className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center hover:border-primary-400 hover:bg-primary-50/30">
                            <Camera className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                            <p className="text-sm font-medium text-slate-700">Adicionar fotos do imóvel</p>
                            <p className="mt-1 text-xs text-slate-500">JPEG, PNG ou WebP • até 20 imagens • 10MB por arquivo</p>
                            <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImagesSelected} />
                        </div>
                        {imagePreviews.length > 0 && <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">{imagePreviews.map((preview, index) => <div key={preview} className="group relative aspect-square overflow-hidden rounded-xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview} alt={`Prévia ${index + 1}`} className="h-full w-full object-cover" />
                            <button type="button" onClick={() => removeImage(index)} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-white opacity-0 group-hover:opacity-100" aria-label={`Remover imagem ${index + 1}`}><X className="h-4 w-4" /></button>{index === 0 && <span className="absolute bottom-2 left-2 rounded-full bg-primary-700 px-2 py-0.5 text-[10px] font-bold text-white">Capa</span>}</div>)}</div>}
                        <div className="rounded-2xl border border-slate-200 p-5">
                            <div className="mb-3 flex items-center gap-2"><Video className="h-5 w-5 text-primary-600" /><h3 className="text-sm font-semibold text-slate-900">Vídeo opcional</h3></div>
                            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                <p className="font-medium text-slate-800">O vídeo não é obrigatório.</p>
                                <p className="mt-1">Use-o apenas se quiser dar mais contexto visual ao imóvel. O cadastro pode seguir normalmente só com as fotos.</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button type="button" onClick={() => videoInputRef.current?.click()} className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-100">{video ? 'Trocar vídeo' : 'Selecionar vídeo'}</button>
                                {video && <button type="button" onClick={removeVideo} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Remover vídeo</button>}
                            </div>
                            <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/3gpp" className="hidden" onChange={handleVideoSelected} />
                            {video && <div className="mt-4 space-y-3"><p className="text-sm font-medium text-slate-700">{video.name}</p>{videoPreview && <video controls className="w-full rounded-xl border border-slate-200 bg-black" src={videoPreview} />}</div>}
                        </div>
                    </>
                )}

                {step === 6 && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                        <div className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className={REVIEW_CARD}>
                                    <p className={REVIEW_SECTION_TITLE}>Fluxo</p>
                                    <p className={REVIEW_VALUE}>{actorMode === 'client-owner' ? 'Cliente-proprietário' : 'Corretor'}</p>
                                </div>
                                <div className={REVIEW_CARD}>
                                    <p className={REVIEW_SECTION_TITLE}>Tipo</p>
                                    <p className={REVIEW_VALUE}>{form.propertyType || '—'}</p>
                                </div>
                                <div className={REVIEW_CARD}>
                                    <p className={REVIEW_SECTION_TITLE}>Finalidade</p>
                                    <p className={REVIEW_VALUE}>{form.purpose || '—'}</p>
                                </div>
                            </div>

                            <div className={REVIEW_CARD}>
                                <p className={REVIEW_SECTION_TITLE}>Título</p>
                                <p className={`${REVIEW_VALUE} text-base font-medium text-slate-900`}>{form.title || '—'}</p>
                            </div>

                            <div className={REVIEW_CARD}>
                                <p className={REVIEW_SECTION_TITLE}>Descrição</p>
                                <p className={REVIEW_VALUE}>{form.description || '—'}</p>
                            </div>

                            <div className={REVIEW_CARD}>
                                <p className={REVIEW_SECTION_TITLE}>Localização</p>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    <div className="min-w-0">
                                        <p className={REVIEW_LABEL}>CEP</p>
                                        <p className={REVIEW_VALUE}>{form.semCep ? 'Sem CEP' : form.cep || '—'}</p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className={REVIEW_LABEL}>Estado</p>
                                        <p className={REVIEW_VALUE}>{form.state || '—'}</p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className={REVIEW_LABEL}>Cidade</p>
                                        <p className={REVIEW_VALUE}>{form.city || '—'}</p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className={REVIEW_LABEL}>Bairro</p>
                                        <p className={REVIEW_VALUE}>{form.bairro || (bairroOptional ? 'Não informado' : '—')}</p>
                                    </div>
                                    <div className="min-w-0 sm:col-span-2">
                                        <p className={REVIEW_LABEL}>Rua</p>
                                        <p className={REVIEW_VALUE}>{form.address || '—'}</p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className={REVIEW_LABEL}>Número</p>
                                        <p className={REVIEW_VALUE}>{form.semNumero ? 'Sem número' : form.numero || '—'}</p>
                                    </div>
                                    <div className="min-w-0 sm:col-span-2">
                                        <p className={REVIEW_LABEL}>Complemento</p>
                                        <p className={REVIEW_VALUE}>{form.complemento || '—'}</p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className={REVIEW_LABEL}>Quadra</p>
                                        <p className={REVIEW_VALUE}>{form.semQuadra ? 'Sem quadra' : form.quadra || '—'}</p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className={REVIEW_LABEL}>Lote</p>
                                        <p className={REVIEW_VALUE}>{form.semLote ? 'Sem lote' : form.lote || '—'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <div className={REVIEW_CARD}>
                                    <p className={REVIEW_SECTION_TITLE}>Áreas e dimensões</p>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                        <div className="min-w-0">
                                            <p className={REVIEW_LABEL}>Área construída</p>
                                            <p className={REVIEW_VALUE}>
                                                {form.areaConstruida ? `${form.areaConstruida} ${areaUnitLabel(form.areaConstruidaUnidade)}` : 'Sem área construída'}
                                            </p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className={REVIEW_LABEL}>Área do terreno</p>
                                            <p className={REVIEW_VALUE}>
                                                {form.areaTerreno || '—'} {areaUnitLabel(form.areaTerrenoUnidade)}
                                            </p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className={REVIEW_LABEL}>Quartos</p>
                                            <p className={REVIEW_VALUE}>{form.bedrooms || 'Sem quartos'}</p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className={REVIEW_LABEL}>Banheiros</p>
                                            <p className={REVIEW_VALUE}>{form.bathrooms || 'Sem banheiros'}</p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className={REVIEW_LABEL}>Garagens</p>
                                            <p className={REVIEW_VALUE}>{form.garageSpots || 'Sem vagas'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className={REVIEW_CARD}>
                                    <p className={REVIEW_SECTION_TITLE}>Condições comerciais</p>
                                    <div className="mt-3 space-y-3">
                                        {saleEnabled && (
                                            <div className="min-w-0">
                                                <p className={REVIEW_LABEL}>Venda</p>
                                                <p className={REVIEW_VALUE}>{form.priceSale || 'R$ 0,00'}</p>
                                            </div>
                                        )}
                                        {rentEnabled && (
                                            <div className="min-w-0">
                                                <p className={REVIEW_LABEL}>Aluguel</p>
                                                <p className={REVIEW_VALUE}>{form.priceRent || 'R$ 0,00'}</p>
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className={REVIEW_LABEL}>Comodidades</p>
                                            <p className={REVIEW_VALUE}>{[
                                                ...new Set([
                                                    ...form.amenities.map((amenity) => getAmenityLabel(amenity)),
                                                    form.hasWifi && 'Wi‑Fi',
                                                    form.temPiscina && 'Piscina',
                                                    form.temEnergiaSolar && 'Energia Solar',
                                                    form.temAutomacao && 'Automação',
                                                    form.temArCondicionado && 'Ar-condicionado',
                                                    form.ehMobiliada && 'Mobiliada',
                                                ].filter(Boolean) as string[]),
                                            ].join(', ') || 'Nenhuma selecionada'}</p>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="min-w-0">
                                                <p className={REVIEW_LABEL}>Imagens</p>
                                                <p className={REVIEW_VALUE}>{String(images.length)}</p>
                                            </div>
                                            <div className="min-w-0">
                                                <p className={REVIEW_LABEL}>Vídeo</p>
                                                <p className={REVIEW_VALUE}>{video ? 'Sim' : 'Não'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={REVIEW_CARD}>
                                <p className={REVIEW_SECTION_TITLE}>Mídia enviada</p>
                                <div className="mt-3 space-y-4">
                                    <div>
                                        <p className={REVIEW_LABEL}>Imagens</p>
                                        <p className={REVIEW_VALUE}>{String(images.length)}</p>
                                        {imagePreviews.length > 0 && (
                                            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                                {imagePreviews.map((preview, index) => (
                                                    <div key={`${images[index]?.name ?? 'image'}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={preview}
                                                            alt={`Imagem ${index + 1} do resumo`}
                                                            className="aspect-square h-full w-full object-cover"
                                                        />
                                                        <div className="border-t border-slate-200 bg-white px-3 py-2">
                                                            <p className="truncate text-xs text-slate-600">
                                                                {images[index]?.name ?? `Imagem ${index + 1}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {images.length > 0 && imagePreviews.length === 0 && (
                                            <p className="mt-3 text-xs text-slate-500">
                                                As imagens foram selecionadas, mas a pré-visualização local não está disponível nesta sessão.
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <p className={REVIEW_LABEL}>Vídeo</p>
                                        <p className={REVIEW_VALUE}>{video ? 'Incluído' : 'Não enviado'}</p>
                                        {videoPreview && (
                                            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-black">
                                                <video controls className="w-full" src={videoPreview} />
                                            </div>
                                        )}
                                        {video && !videoPreview && (
                                            <p className="mt-3 text-xs text-slate-500">
                                                O vídeo foi selecionado, mas a pré-visualização local não está disponível nesta sessão.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

                <div className="flex items-center justify-between pt-2">
                    <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1) as WizardStep)} disabled={step === 1} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:text-slate-300">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </button>
                    {step < 6 ? (
                        <button type="button" onClick={() => setStep((current) => Math.min(6, current + 1) as WizardStep)} disabled={!canAdvance()} className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:bg-primary-300">
                            Avançar
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <button type="button" onClick={handleSubmit} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:bg-primary-300">
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {submitting ? (uploadStatus || 'Cadastrando...') : 'Enviar para análise'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
