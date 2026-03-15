'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Home, ChevronRight, ArrowRight, MessageCircle, Smartphone, Handshake, Edit, FileText, ScrollText } from 'lucide-react'
import {
    CloseDealDialog,
    PropertyCard,
    PropertyGallery,
    PropertyInfo,
    PropertySidebar,
} from '@/components/property'
import { Property, formatPrice, getPromoSalePrice, getPromoRentPrice } from '@/types/property'
import { buildAppDeepLink } from '@/lib/appLinks'
import { useUser } from '@/contexts/UserContext'
import { buildWhatsappLink } from '@/lib/contactLinks'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://site-imobiliario-backend-production.up.railway.app'

interface PropertyDetailClientProps {
    initialProperty: Property
}

export default function PropertyDetailClient({ initialProperty }: PropertyDetailClientProps) {
    const [property, setProperty] = useState(initialProperty)
    const [similarProperties, setSimilarProperties] = useState<Property[]>([])
    const [showCloseDeal, setShowCloseDeal] = useState(false)
    const { session, loading: authLoading } = useUser()

    // Owner / broker detection
    const userId = session?.user?.id
    const isOwner =
        userId != null &&
        ((property.brokerId != null && userId === property.brokerId) ||
            (property.ownerId != null && userId === property.ownerId))
    const statusLower = property.status?.toLowerCase() || ''
    const canEditProperty = isOwner && statusLower !== 'pending_approval'
    const canGenerateProposal = isOwner && statusLower === 'approved'
    const canCloseDeal = isOwner && (statusLower === 'approved' || statusLower === 'sold' || statusLower === 'rented')

    useEffect(() => {
        if (!property.bairro) return

        async function fetchSimilar() {
            try {
                const similarRes = await fetch(
                    `${API_BASE_URL}/properties?bairro=${encodeURIComponent(property.bairro || '')}&limit=4&status=approved`
                )

                if (!similarRes.ok) return

                const similarData = await similarRes.json()
                const rawSimilar = similarData.data || similarData
                const allSimilar = Array.isArray(rawSimilar) ? rawSimilar : []

                const filtered = allSimilar
                    .filter((p: Property) => p.id !== property.id)
                    .slice(0, 3)

                setSimilarProperties(filtered)
            } catch (err) {
                console.error('Error fetching similar properties:', err)
            }
        }

        fetchSimilar()
    }, [property.bairro, property.id])

    const whatsappMessage =
        `Olá! Vi o imóvel "${property.title}" (Cód: ${property.code || property.id}) no Encontre Aqui e gostaria de mais informações.`
    const whatsappLink = buildWhatsappLink(property.brokerPhone, whatsappMessage)
    const deepLink = buildAppDeepLink(property.id)

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

    function handleDealClosed(updatedStatus: string) {
        setProperty(prev => ({ ...prev, status: updatedStatus as Property['status'] }))
    }

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
                                    <span className="text-xs font-semibold text-slate-400">Em análise</span>
                                </div>
                            )}

                            {/* Generate Proposal */}
                            {canGenerateProposal && (
                                <Link
                                    href={`/propostas/nova?propertyId=${property.id}`}
                                    className="flex flex-col items-center gap-2 px-4 py-5 hover:bg-gray-50 transition-colors text-center group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-accent-100 group-hover:bg-accent-200 flex items-center justify-center transition-colors">
                                        <FileText className="w-5 h-5 text-accent-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700 group-hover:text-accent-700">Gerar proposta</span>
                                </Link>
                            )}

                            {/* Close / Update Deal */}
                            {canCloseDeal && (
                                <button
                                    onClick={() => setShowCloseDeal(true)}
                                    className="flex flex-col items-center gap-2 px-4 py-5 hover:bg-gray-50 transition-colors text-center group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
                                        <Handshake className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700 group-hover:text-amber-700">
                                        {statusLower === 'sold' || statusLower === 'rented' ? 'Atualizar negócio' : 'Fechar negócio'}
                                    </span>
                                </button>
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
                            <PropertySidebar property={property} />
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
                className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
                role="region"
                aria-label="Ações rápidas do imóvel"
            >
                <div className="flex items-center gap-3 px-4 py-3 max-w-7xl mx-auto">
                    {/* Price */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">
                            {property.priceSale ? 'Venda' : property.priceRent ? 'Aluguel' : 'Valor'}
                        </p>
                        {originalPrice && (
                            <p className="text-xs text-gray-400 line-through">{originalPrice}</p>
                        )}
                        <p className="text-lg font-bold truncate text-primary-700">
                            {displayPrice}
                        </p>
                    </div>

                    {/* Close Deal (owner only) */}
                    {canCloseDeal && (
                        <button
                            onClick={() => setShowCloseDeal(true)}
                            className="flex items-center gap-1.5 px-3 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors shadow-md"
                        >
                            <Handshake className="w-4 h-4" />
                        </button>
                    )}

                    {/* WhatsApp */}
                    {!isOwner && whatsappLink && (
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-3 bg-primary-700 hover:bg-primary-800 text-white font-bold rounded-xl text-sm transition-colors shadow-md"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Contatar
                        </a>
                    )}

                    {isOwner ? (
                        <Link
                            href="/meus-imoveis"
                            className="flex items-center gap-1.5 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md"
                        >
                            <ScrollText className="w-4 h-4" />
                            Meus imóveis
                        </Link>
                    ) : (
                        <a
                            href={deepLink}
                            className="flex items-center gap-1.5 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md"
                        >
                            <Smartphone className="w-4 h-4" />
                            App
                        </a>
                    )}
                </div>
            </div>

            {/* Close Deal Dialog */}
            <CloseDealDialog
                property={property}
                open={showCloseDeal}
                onClose={() => setShowCloseDeal(false)}
                onDealClosed={handleDealClosed}
            />
        </main>
    )
}
