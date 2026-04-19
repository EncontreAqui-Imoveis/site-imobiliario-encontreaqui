'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Home, ChevronRight, ArrowRight, MessageCircle, Edit, FileText, ScrollText } from 'lucide-react'
import {
    PropertyCard,
    PropertyGallery,
    PropertyInfo,
    PropertySidebar,
} from '@/components/property'
import { Property, formatPrice, getPromoSalePrice, getPromoRentPrice } from '@/types/property'
import { useUser } from '@/contexts/UserContext'
import { buildWhatsappLink } from '@/lib/contactLinks'
import { fetchEditableProperty } from '@/lib/propertiesEditorService'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://site-imobiliario-backend-production.up.railway.app'

interface PropertyDetailClientProps {
    propertyId: string
    initialProperty: Property | null
}

export default function PropertyDetailClient({ propertyId, initialProperty }: PropertyDetailClientProps) {
    const [property, setProperty] = useState(initialProperty)
    const [similarProperties, setSimilarProperties] = useState<Property[]>([])
    const [loadError, setLoadError] = useState<string | null>(null)
    const { session, loading: authLoading } = useUser()

    // Owner / broker detection
    const userId = session?.user?.id
    const isOwner =
        property != null &&
        userId != null &&
        ((property.brokerId != null && userId === property.brokerId) ||
            (property.ownerId != null && userId === property.ownerId))
    const statusLower = property?.status?.toLowerCase() || ''
    const hasPendingEditRequest = property?.hasPendingEditRequest === true
    const canEditProperty =
        isOwner && statusLower !== 'pending_approval' && !hasPendingEditRequest
    const negotiationId = property?.negotiationId ?? property?.negotiation?.id
    const negotiationStatus = String(property?.negotiation?.status ?? '').trim().toUpperCase()
    const canGenerateProposal =
        isOwner && statusLower === 'approved' && !negotiationId

    useEffect(() => {
        if (property || authLoading || !session) return
        let cancelled = false
        const loadOwnedProperty = async () => {
            try {
                const loadedProperty = await fetchEditableProperty(propertyId)
                if (!cancelled) {
                    setProperty(loadedProperty)
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
        if (authLoading || !session || !isOwner) return
        let cancelled = false

        const loadOwnerVersion = async () => {
            try {
                const loadedProperty = await fetchEditableProperty(propertyId)
                if (!cancelled) {
                    setProperty(loadedProperty)
                }
            } catch {
                // Mantém a versão já carregada quando a versão privada falhar.
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
            ? `Olá! Vi o imóvel "${property.title}" (Cód: ${property.code || property.id}) no Encontre Aqui e gostaria de mais informações.`
            : ''
    const whatsappLink = buildWhatsappLink(property?.brokerPhone, whatsappMessage)

    const proposalAction = (() => {
        if (!isOwner || !property) return null

        if (!negotiationId && canGenerateProposal) {
            return {
                title: 'Gerar proposta',
                description: 'Inicie a proposta deste imóvel seguindo o mesmo fluxo principal do app.',
                href: `/propostas/nova?propertyId=${property.id}`,
                tone: 'primary' as const,
                label: 'Gerar proposta',
            }
        }

        if (negotiationId && ['PENDING_PROPOSAL', 'PROPOSAL_DRAFT', 'PROPOSAL_SENT'].includes(negotiationStatus)) {
            return {
                title: 'Proposta em andamento',
                description: 'A proposta já foi iniciada. Continue enviando a versão assinada para análise.',
                href: `/propostas/${encodeURIComponent(negotiationId)}/upload-assinada`,
                tone: 'accent' as const,
                label: 'Enviar proposta assinada',
            }
        }

        if (negotiationId && ['DOCUMENTATION_PHASE', 'CONTRACT_DRAFTING', 'AWAITING_SIGNATURES'].includes(negotiationStatus)) {
            return {
                title: 'Proposta em revisão',
                description: 'Acompanhe o avanço da proposta e das próximas etapas até chegar aos contratos.',
                href: '/propostas',
                tone: 'neutral' as const,
                label: 'Acompanhar propostas',
            }
        }

        if (negotiationId && ['IN_NEGOTIATION', 'SOLD', 'RENTED'].includes(negotiationStatus)) {
            return {
                title: 'Proposta aprovada',
                description: 'A negociação avançou. Continue o processo no módulo de contratos.',
                href: '/contratos',
                tone: 'success' as const,
                label: 'Ir para contratos',
            }
        }

        return negotiationId
            ? {
                title: 'Acompanhar propostas',
                description: 'Use a trilha de propostas para seguir o status atual deste imóvel.',
                href: '/propostas',
                tone: 'neutral' as const,
                label: 'Ver propostas',
            }
            : null
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
    const userRole = (session?.user?.role ?? '').toLowerCase()
    const visitorProposalHref =
        session &&
        !isOwner &&
        (userRole === 'client' || userRole === 'broker') &&
        statusLower === 'approved' &&
        !negotiationId &&
        !blockVisitorProposalDueToDeal
            ? `/propostas/nova?propertyId=${property.id}`
            : null

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

    return (
        <main
            className="min-h-screen bg-gray-50 pt-16 lg:pt-20 pb-24 lg:pb-12"
            aria-label={`Detalhes do imóvel ${property.title}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Breadcrumbs */}
                <nav
                    aria-label="Breadcrumb"
                    className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-hidden"
                >
                    <Link href="/" className="hover:text-primary-600 transition-colors flex-shrink-0">
                        <Home className="w-4 h-4" />
                    </Link>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    <Link href="/imoveis" className="hover:text-primary-600 transition-colors flex-shrink-0">
                        Imóveis
                    </Link>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    <span className="text-gray-900 font-medium truncate">{property.title}</span>
                </nav>

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
                                    {statusLower === 'approved' ? 'Disponível' :
                                        statusLower === 'sold' ? 'Vendido' :
                                            statusLower === 'rented' ? 'Alugado' :
                                                statusLower === 'pending_approval' ? 'Aguardando' :
                                                    statusLower === 'rejected' ? 'Rejeitado' :
                                                        property.status}
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
                            {proposalAction && (
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

                            {/* View Proposals */}
                            <Link
                                href="/propostas"
                                className="flex flex-col items-center gap-2 px-4 py-5 hover:bg-gray-50 transition-colors text-center group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition-colors">
                                    <ScrollText className="w-5 h-5 text-indigo-600" />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 group-hover:text-indigo-700">Ver propostas</span>
                            </Link>

                            {/* View Contracts */}
                            <Link
                                href="/contratos"
                                className="flex flex-col items-center gap-2 px-4 py-5 hover:bg-gray-50 transition-colors text-center group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                                    <ScrollText className="w-5 h-5 text-slate-600" />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 group-hover:text-slate-700">Ver contratos</span>
                            </Link>
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
                                    {proposalAction && (
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
                            <PropertySidebar property={property} visitorProposalHref={visitorProposalHref} />
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
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-semibold rounded-xl transition-colors"
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
                className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
                role="region"
                aria-label="Ações rápidas do imóvel"
            >
                <div className="flex items-center gap-2 px-3 py-2 max-w-7xl mx-auto">
                    <div className="flex-1 min-w-0">
                        {mobileSaleLine && (
                            <>
                                <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">Venda</p>
                                {originalPrice && promoSale && (
                                    <p className="text-[10px] text-gray-400 line-through">{originalPrice}</p>
                                )}
                                <p className="text-sm font-bold leading-tight truncate text-primary-700">
                                    {mobileSaleLine}
                                </p>
                            </>
                        )}
                        {!mobileSaleLine && mobileRentLine && (
                            <>
                                <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">Aluguel</p>
                                <p className="text-sm font-bold leading-tight truncate text-primary-700">
                                    {mobileRentLine}
                                </p>
                            </>
                        )}
                        {!mobileSaleLine && !mobileRentLine && (
                            <>
                                <p className="text-[10px] text-gray-500 font-medium">Valor</p>
                                <p className="text-sm font-bold truncate text-primary-700">{displayPrice}</p>
                            </>
                        )}
                        {mobileSaleLine && mobileRentLine && (
                            <p className="text-[10px] text-gray-500 mt-0.5 truncate">Aluguel {mobileRentLine}</p>
                        )}
                    </div>

                    {isOwner && proposalAction && (
                        <Link
                            href={proposalAction.href}
                            className="flex items-center justify-center gap-1 px-2.5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm shrink-0"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline max-w-[5.5rem] truncate">{proposalAction.label}</span>
                        </Link>
                    )}

                    {!isOwner && visitorProposalHref && (
                        <Link
                            href={visitorProposalHref}
                            className="flex items-center justify-center gap-1 px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm shrink-0"
                            aria-label="Gerar proposta para este imóvel"
                        >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span>Proposta</span>
                        </Link>
                    )}

                    {!isOwner && whatsappLink && (
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1 px-2.5 py-2 bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm shrink-0"
                        >
                            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Contatar</span>
                        </a>
                    )}

                    {isOwner && (
                        <Link
                            href="/meus-imoveis"
                            className="flex items-center justify-center gap-1 px-2.5 py-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm shrink-0"
                        >
                            <ScrollText className="w-3.5 h-3.5" />
                            <span>Meus</span>
                        </Link>
                    )}
                </div>
            </div>
        </main>
    )
}
