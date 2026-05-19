'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Home, ChevronRight, ChevronLeft, ArrowRight, Edit, FileText, ScrollText } from 'lucide-react'
import WhatsAppIcon from '@/components/icons/WhatsAppIcon'
import { capitalizePropertyTitle } from '@/lib/propertyTitleDisplay'
import {
    PropertyCard,
    PropertyGallery,
    PropertyInfo,
    PropertySidebar,
} from '@/components/property'
import { Property, formatPrice, getPromoSalePrice, getPromoRentPrice } from '@/types/property'
import { useUser } from '@/contexts/UserContext'
import { buildWhatsappLink } from '@/lib/contactLinks'
import { fetchPropertyById, normalizeProperty } from '@/lib/propertiesApi'
import { displayStatusLabel } from '@/lib/propertyLabels'
import { API_BASE_URL } from '@/lib/api/client'
import {
    isProposalPreSignatureStatus,
    isProposalRefusedStatus,
    resolveProposalBucket,
} from '@/types/negotiation'

interface PropertyDetailClientProps {
    propertyId: string
    initialProperty: Property | null
}

export default function PropertyDetailClient({ propertyId, initialProperty }: PropertyDetailClientProps) {
    const [property, setProperty] = useState(initialProperty)
    const [similarProperties, setSimilarProperties] = useState<Property[]>([])
    const [loadError, setLoadError] = useState<string | null>(null)
    const { session, loading: authLoading } = useUser()
    const userRole = (session?.user?.role ?? '').toLowerCase()

    // Owner / broker detection
    const userId = session?.user?.id
    const isOwner =
        property != null &&
        userId != null &&
        ((property.brokerId != null && userId === property.brokerId) ||
            (property.ownerId != null && userId === property.ownerId))
    const [ownerProposalStateLoading, setOwnerProposalStateLoading] = useState(
        Boolean(
            initialProperty != null &&
            session?.user?.id != null &&
            ((initialProperty.brokerId != null && session.user.id === initialProperty.brokerId) ||
                (initialProperty.ownerId != null && session.user.id === initialProperty.ownerId)),
        ),
    )
    const statusLower = property?.status?.toLowerCase() || ''
    const statusUpper = property?.status?.toUpperCase() || ''
    const hasPendingEditRequest = property?.hasPendingEditRequest === true
    const isInAnalysisStatus =
        statusUpper === 'IN_ANALYSIS' ||
        statusUpper === 'UNDER_REVIEW' ||
        statusUpper === 'PENDING_APPROVAL' ||
        statusLower === 'em análise'
    const canEditProperty =
        isOwner && statusLower !== 'pending_approval' && !hasPendingEditRequest
    const negotiationId = property?.negotiationId ?? property?.negotiation?.id
    const negotiationStatus = String(property?.negotiation?.status ?? '').trim().toUpperCase()
    const hasRefusedNegotiation = isProposalRefusedStatus(negotiationStatus)
    const isClientOwner = isOwner && userRole === 'client'
    const canGenerateProposal =
        isOwner &&
        !isClientOwner &&
        statusLower === 'approved' &&
        (!negotiationId || hasRefusedNegotiation) &&
        !isInAnalysisStatus

    useEffect(() => {
        if (property || authLoading || !session) return
        let cancelled = false
        const loadOwnedProperty = async () => {
            try {
                const loadedProperty = await fetchPropertyById(propertyId)
                if (!cancelled) {
                    setProperty(loadedProperty)
                    if (!loadedProperty) {
                        setLoadError('Imóvel não encontrado.')
                    }
                }
            } catch {
                if (!cancelled) {
                    setLoadError('Imóvel não encontrado.')
                }
            }
        }
        void loadOwnedProperty()
        return () => {
            cancelled = true
        }
    }, [authLoading, property, propertyId, session])

    useEffect(() => {
        if (authLoading || !session || !isOwner) {
            setOwnerProposalStateLoading(false)
            return
        }
        let cancelled = false
        setOwnerProposalStateLoading(true)

        const loadOwnerVersion = async () => {
            try {
                const loadedProperty = await fetchPropertyById(propertyId)
                if (!cancelled) {
                    setProperty(loadedProperty)
                }
            } catch {
                // Mantém a versão já carregada quando a versão privada falhar.
            } finally {
                if (!cancelled) {
                    setOwnerProposalStateLoading(false)
                }
            }
        }

        void loadOwnerVersion()
        return () => {
            cancelled = true
        }
    }, [authLoading, isOwner, propertyId, session])

    useEffect(() => {
        if (!property?.bairro) return
        const currentProperty = property

        async function fetchSimilar() {
            try {
                const similarRes = await fetch(
                    `${API_BASE_URL}/properties?bairro=${encodeURIComponent(currentProperty.bairro || '')}&limit=4&status=approved`
                )

                if (!similarRes.ok) return

                const similarData = await similarRes.json()
                const rawSimilar = similarData.data || similarData
                const allSimilar = Array.isArray(rawSimilar) ? rawSimilar : []

                const filtered = allSimilar
                    .map((item) => normalizeProperty(item))
                    .filter((item): item is Property => item !== null)
                    .filter((p: Property) => p.id !== currentProperty.id)
                    .slice(0, 3)

                setSimilarProperties(filtered)
            } catch (err) {
                console.error('Error fetching similar properties:', err)
            }
        }

        fetchSimilar()
    }, [property])

    const whatsappMessage =
        property
            ? `Olá! Vi o imóvel "${property.title}"${property.public_code || property.slug ? ` (Referência: ${property.public_code || property.slug})` : ''} no Encontre Aqui e gostaria de mais informações.`
            : ''
    const whatsappLink = buildWhatsappLink(property?.brokerPhone, whatsappMessage)

    const proposalAction = (() => {
        if (!isOwner || !property) return null
        if (isInAnalysisStatus) return null

        if (!negotiationId && canGenerateProposal) {
            return {
                title: 'Gerar proposta',
                description: 'Inicie a proposta deste imóvel seguindo o mesmo fluxo principal do app.',
                href: `/propostas/nova?propertyId=${property.id}`,
                tone: 'primary' as const,
                label: 'Gerar proposta',
            }
        }

        if (negotiationId && isProposalPreSignatureStatus(negotiationStatus)) {
            return {
                title: 'Proposta em andamento',
                description: 'A proposta já foi iniciada. Continue enviando a versão assinada para análise.',
                href: `/propostas/${encodeURIComponent(negotiationId)}/upload-assinada`,
                tone: 'accent' as const,
                label: 'Enviar proposta assinada',
            }
        }

        if (negotiationId && ['IN_NEGOTIATION', 'SOLD', 'RENTED'].includes(negotiationStatus)) {
            return {
                title: 'Proposta aprovada',
                description: 'A negociação avançou. Continue o processo no módulo de contratos.',
                href: '/documentos?tab=contratos',
                tone: 'success' as const,
                label: 'Ir para contratos',
            }
        }

        if (negotiationId && resolveProposalBucket(negotiationStatus) === 'signed') {
            return null
        }

        if (negotiationId && hasRefusedNegotiation) {
            return {
                title: 'Proposta recusada',
                description: 'A última proposta foi recusada. Você pode iniciar um novo ciclo para este imóvel.',
                href: `/propostas/nova?propertyId=${property.id}`,
                tone: 'primary' as const,
                label: 'Gerar nova proposta',
            }
        }

        return negotiationId
            ? {
                title: 'Acompanhar propostas',
                description: 'Use a trilha de propostas para acompanhar quando ele segue em análise ou vai para histórico.',
                href: '/documentos?tab=propostas',
                tone: 'neutral' as const,
                label: 'Ver propostas',
            }
            : null
    })()

    const signedProposalStatus = (() => {
        if (resolveProposalBucket(negotiationStatus) !== 'signed') return null
        return {
            title: 'Status da proposta',
            description: 'Proposta assinada e aguardando verificação.',
        }
    })()

    if (!property) {
        return (
            <main className="min-h-screen bg-gray-50 pt-16 lg:pt-20 pb-24 lg:pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
                    <div className="text-sm text-slate-600">
                        {loadError ?? (!authLoading && !session ? 'Imóvel não encontrado.' : 'Carregando imóvel...')}
                    </div>
                </div>
            </main>
        )
    }

    const blockVisitorProposalDueToDeal =
        statusLower === 'negociacao' ||
        (negotiationStatus === 'IN_NEGOTIATION' && statusLower === 'negociacao')
    const visitorProposalHref =
        session &&
        !isOwner &&
        (userRole === 'client' || userRole === 'broker' || userRole === 'auxiliary_administrative') &&
        statusLower === 'approved' &&
        (!negotiationId || hasRefusedNegotiation) &&
        !blockVisitorProposalDueToDeal
            ? `/propostas/nova?propertyId=${property.id}`
            : null

    const buyerContractStatusHint = (() => {
        if (isOwner || !negotiationStatus) return null
        if (negotiationStatus === 'DOCUMENTATION_PHASE') {
            return 'Aguardando análise dos moderadores.'
        }
        if (negotiationStatus === 'IN_NEGOTIATION') {
            return 'Negociação aprovada. Contrato aguardando documentos.'
        }
        if (negotiationStatus === 'CONTRACT_DRAFTING') {
            return 'Contrato em confecção de minuta.'
        }
        if (negotiationStatus === 'AWAITING_SIGNATURES') {
            return 'Contrato aguardando assinaturas.'
        }
        if (negotiationStatus === 'SOLD' || negotiationStatus === 'RENTED') {
            return 'Contrato finalizado.'
        }
        return null
    })()

    const promoSale = getPromoSalePrice(property)
    const promoRent = getPromoRentPrice(property)
    const promoPrice = promoSale ?? promoRent
    const displayPrice = promoPrice
        ? formatPrice(promoPrice)
        : property.priceSale
            ? formatPrice(property.priceSale)
            : property.priceRent
                ? `${formatPrice(property.priceRent)}/mês`
                : property.price > 0
                    ? formatPrice(property.price)
                    : 'Consulte'

    const originalPrice = promoPrice
        ? formatPrice(property.priceSale ?? property.priceRent ?? property.price)
        : null

    const mobileSaleLine =
        property.priceSale != null
            ? formatPrice(promoSale ?? property.priceSale)
            : null
    const mobileRentLine =
        property.priceRent != null
            ? `${formatPrice(promoRent ?? property.priceRent)}/mês`
            : null
    const ownerStatusLabel = displayStatusLabel(property.status, property.purpose)

    return (
        <main
            className="min-h-screen bg-gray-50 pt-16 lg:pt-20 pb-24 lg:pb-12"
            aria-label={`Detalhes do imóvel ${property.title}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Mobile: voltar | Desktop: breadcrumb completo */}
                <div className="mb-6 flex items-center gap-2">
                    <Link
                        href="/imoveis"
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-200/80 hover:text-primary-700 lg:hidden"
                        aria-label="Voltar aos imóveis"
                    >
                        <ChevronLeft className="h-6 w-6" aria-hidden />
                    </Link>
                    <nav
                        aria-label="Breadcrumb"
                        className="hidden min-w-0 flex-1 items-center gap-2 overflow-hidden text-sm text-gray-500 lg:flex"
                    >
                        <Link href="/" className="shrink-0 transition-colors hover:text-primary-600">
                            <Home className="h-4 w-4" />
                        </Link>
                        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                        <Link href="/imoveis" className="shrink-0 transition-colors hover:text-primary-600">
                            Imóveis
                        </Link>
                        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="truncate font-medium text-gray-900">{capitalizePropertyTitle(property.title)}</span>
                    </nav>
                </div>

                {/* Owner Actions Panel */}
                {isOwner && (
                    <section
                        aria-label="Painel do corretor"
                        className="mb-6 bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary-50 to-accent-50 px-5 py-4 border-b border-primary-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-primary-800">Painel do Corretor</p>
                                    <p className="text-xs text-primary-600 mt-0.5">
                                        Gerencie este imóvel
                                    </p>
                                </div>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusLower === 'approved' ? 'bg-slate-100 text-slate-700' :
                                    statusLower === 'sold' ? 'bg-blue-100 text-blue-700' :
                                        statusLower === 'rented' ? 'bg-purple-100 text-purple-700' :
                                            statusLower === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-100 text-gray-600'
                                    }`}>
                                    {ownerStatusLabel}
                                </span>
                            </div>
                        </div>

                        {/* Action Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-gray-100">
                            {/* Edit Property */}
                            {canEditProperty ? (
                                <Link
                                    href={`/meus-imoveis/${property.id}/editar`}
                                    className="flex flex-col items-center gap-2 px-4 py-5 hover:bg-gray-50 transition-colors text-center group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-primary-100 group-hover:bg-primary-200 flex items-center justify-center transition-colors">
                                        <Edit className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700 group-hover:text-primary-700">Editar imóvel</span>
                                </Link>
                            ) : (
                                <div className="flex flex-col items-center gap-2 px-4 py-5 text-center">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                        <Edit className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-400">
                                        {hasPendingEditRequest ? 'Edição pendente' : 'Em análise'}
                                    </span>
                                </div>
                            )}

                            {/* Proposal Flow */}
                            {ownerProposalStateLoading ? (
                                <div className="flex flex-col items-center gap-2 px-4 py-5 text-center">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center animate-pulse" />
                                    <span className="text-xs font-semibold text-slate-400">Carregando proposta</span>
                                </div>
                            ) : proposalAction && (
                                <Link
                                    href={proposalAction.href}
                                    className="flex flex-col items-center gap-2 px-4 py-5 hover:bg-gray-50 transition-colors text-center group"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                        proposalAction.tone === 'success'
                                            ? 'bg-emerald-100 group-hover:bg-emerald-200'
                                            : proposalAction.tone === 'accent'
                                                ? 'bg-accent-100 group-hover:bg-accent-200'
                                                : proposalAction.tone === 'primary'
                                                    ? 'bg-primary-100 group-hover:bg-primary-200'
                                                    : 'bg-indigo-100 group-hover:bg-indigo-200'
                                    }`}>
                                        <FileText className={`w-5 h-5 ${
                                            proposalAction.tone === 'success'
                                                ? 'text-emerald-700'
                                                : proposalAction.tone === 'accent'
                                                    ? 'text-accent-600'
                                                    : proposalAction.tone === 'primary'
                                                        ? 'text-primary-600'
                                                        : 'text-indigo-600'
                                        }`} />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700">
                                        {proposalAction.label}
                                    </span>
                                </Link>
                            )}

                            {!isInAnalysisStatus && (
                                <>
                                    {/* View Proposals */}
                                    <Link
                                        href="/documentos?tab=propostas"
                                        className="flex flex-col items-center gap-2 px-4 py-5 hover:bg-gray-50 transition-colors text-center group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition-colors">
                                            <ScrollText className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-700 group-hover:text-indigo-700">Ver propostas</span>
                                    </Link>

                                    {/* View Contracts */}
                                    <Link
                                        href="/documentos?tab=contratos"
                                        className="flex flex-col items-center gap-2 px-4 py-5 hover:bg-gray-50 transition-colors text-center group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                                            <ScrollText className="w-5 h-5 text-slate-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-700 group-hover:text-slate-700">Ver contratos</span>
                                    </Link>
                                </>
                            )}
                        </div>
                    </section>
                )}

                {/* Gallery */}
                <div className="mb-8">
                    <PropertyGallery images={property.images} title={property.title} videoUrl={property.videoUrl} propertyId={property.id} />
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <PropertyInfo property={property} />
                    </div>
                    <div className="lg:col-span-1">
                        {isOwner ? (
                            <aside className="space-y-6">
                                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-gray-200/50">
                                    <h2 className="text-lg font-bold text-slate-900">Visão do proprietário</h2>
                                    <p className="mt-2 text-sm text-slate-600">
                                        Você está vendo este imóvel como proprietário/captador.
                                    </p>
                                    {statusLower === 'pending_approval' && (
                                        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Este imóvel está em análise. Você pode ver os detalhes, mas ainda não pode editar nem gerar proposta.
                                        </div>
                                    )}
                                    {hasPendingEditRequest && (
                                        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                                            Já existe uma solicitação de edição pendente para este imóvel. O admin precisa aprová-la antes de um novo pedido.
                                        </div>
                                    )}
                                    {ownerProposalStateLoading ? (
                                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 animate-pulse">
                                            <div className="h-4 w-32 rounded bg-slate-200" />
                                            <div className="mt-3 h-3 w-full rounded bg-slate-200/80" />
                                            <div className="mt-2 h-10 w-full rounded-xl bg-slate-200/80" />
                                        </div>
                                    ) : proposalAction && (
                                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-sm font-bold text-slate-900">{proposalAction.title}</p>
                                            <p className="mt-1 text-sm text-slate-600">{proposalAction.description}</p>
                                            <Link
                                                href={proposalAction.href}
                                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700"
                                            >
                                                <FileText className="w-4 h-4" />
                                                {proposalAction.label}
                                            </Link>
                                        </div>
                                    )}
                                    {!ownerProposalStateLoading && signedProposalStatus && (
                                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-sm font-bold text-slate-900">{signedProposalStatus.title}</p>
                                            <p className="mt-1 text-sm text-slate-600">{signedProposalStatus.description}</p>
                                        </div>
                                    )}
                                    <div className="mt-4 space-y-3">
                                        <Link
                                            href="/meus-imoveis"
                                            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            <ScrollText className="w-4 h-4" />
                                            Voltar para meus imóveis
                                        </Link>
                                        {canEditProperty && (
                                            <Link
                                                href={`/meus-imoveis/${property.id}/editar`}
                                                className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700"
                                            >
                                                <Edit className="w-4 h-4" />
                                                Editar imóvel
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </aside>
                        ) : (
                            <aside className="space-y-6">
                                {buyerContractStatusHint && (
                                    <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-900">
                                        <strong>Status do contrato:</strong> {buyerContractStatusHint}
                                    </div>
                                )}
                                <PropertySidebar property={property} visitorProposalHref={visitorProposalHref} />
                            </aside>
                        )}
                    </div>
                </div>

                {/* Similar Properties */}
                {similarProperties.length > 0 && property.bairro && (
                    <div className="mt-16 pt-12 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
                                    Similares na região
                                </h2>
                                <p className="text-gray-500">
                                    Outras oportunidades em {property.bairro}
                                </p>
                            </div>
                            <Link
                                href={`/imoveis?bairro=${encodeURIComponent(property.bairro)}`}
                                className="hidden sm:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold transition-colors"
                            >
                                Ver todos
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {similarProperties.map((prop) => (
                                <PropertyCard key={prop.id} property={prop} />
                            ))}
                        </div>

                        <div className="mt-8 sm:hidden text-center">
                            <Link
                                href={`/imoveis?bairro=${encodeURIComponent(property.bairro)}`}
                                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-50"
                            >
                                Ver todos
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* ================== Mobile Sticky Bottom Bar ================== */}
            <div
                className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden"
                role="region"
                aria-label="Ações rápidas do imóvel"
            >
                <div className="mx-auto max-w-7xl space-y-2 px-3 py-2.5">
                    <div className="min-w-0">
                        {mobileSaleLine && (
                            <>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Venda</p>
                                {originalPrice && promoSale && (
                                    <p className="text-xs text-gray-400 line-through">{originalPrice}</p>
                                )}
                                <p className="truncate text-lg font-bold leading-tight text-primary-800">
                                    {mobileSaleLine}
                                </p>
                            </>
                        )}
                        {!mobileSaleLine && mobileRentLine && (
                            <>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Aluguel</p>
                                <p className="truncate text-lg font-bold leading-tight text-primary-800">
                                    {mobileRentLine}
                                </p>
                            </>
                        )}
                        {!mobileSaleLine && !mobileRentLine && (
                            <>
                                <p className="text-[10px] font-medium text-gray-500">Valor</p>
                                <p className="truncate text-lg font-bold text-primary-800">{displayPrice}</p>
                            </>
                        )}
                        {mobileSaleLine && mobileRentLine && (
                            <p className="mt-0.5 truncate text-xs text-gray-600">Aluguel {mobileRentLine}</p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-stretch justify-end gap-2">
                        {isOwner && !ownerProposalStateLoading && proposalAction && (
                            <Link
                                href={proposalAction.href}
                                className="inline-flex min-h-[44px] min-w-[44px] flex-1 items-center justify-center gap-1 rounded-xl bg-primary-600 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 sm:flex-initial"
                            >
                                <FileText className="h-4 w-4 shrink-0" />
                                <span className="hidden max-w-[6rem] truncate sm:inline">{proposalAction.label}</span>
                            </Link>
                        )}

                        {!isOwner && visitorProposalHref && (
                            <Link
                                href={visitorProposalHref}
                                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 sm:max-w-[11rem] sm:flex-initial"
                                aria-label="Gerar proposta para este imóvel"
                            >
                                <FileText className="h-4 w-4 shrink-0" />
                                <span>Proposta</span>
                            </Link>
                        )}

                        {!isOwner && whatsappLink && (
                            <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#20BD5A] sm:max-w-[11rem] sm:flex-initial"
                            >
                                <WhatsAppIcon className="h-4 w-4 shrink-0" />
                                <span>WhatsApp</span>
                            </a>
                        )}

                        {isOwner && (
                            <Link
                                href="/meus-imoveis"
                                aria-label="Meus imóveis"
                                className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded-xl bg-slate-700 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
                            >
                                <ScrollText className="h-4 w-4 shrink-0" />
                                <span>Meus</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
