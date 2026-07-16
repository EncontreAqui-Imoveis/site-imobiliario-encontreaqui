'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    formatPrice,
    formatPromotionPeriodLabel,
    getPromoRentPrice,
    getPromoSalePrice,
    Property,
} from '@/types/property'
import { Info, Smartphone, Phone, FileText, Bed, Bath, Car, Maximize, Hammer } from 'lucide-react'
import WhatsAppIcon from '@/components/icons/WhatsAppIcon'
import { buildAppDeepLink, getStoreUrlClient } from '@/lib/appLinks'
import { buildPhoneLink, buildWhatsappLink } from '@/lib/contactLinks'
import { areaUnitLabel, normalizeAreaUnidade, squareMetersToAreaInput } from '@/lib/areaUnits'
import { formatUnit } from '@/lib/propertyLabels'

interface PropertySidebarProps {
    property: Property
    /** Logado (cliente/corretor) vendo imóvel de outro — iniciar proposta. */
    visitorProposalHref?: string | null
}

export default function PropertySidebar({ property, visitorProposalHref }: PropertySidebarProps) {
    const formatArea = (valueInM2?: number, unitRaw?: string | null) => {
        if (valueInM2 == null || valueInM2 <= 0) return ''
        const unit = normalizeAreaUnidade(unitRaw)
        const converted = squareMetersToAreaInput(valueInM2, unit)
        const asNumber = Number(converted)
        const formatted = Number.isFinite(asNumber)
            ? asNumber.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
            : converted
        return `${formatted} ${areaUnitLabel(unit)}`
    }

    const [storeUrl, setStoreUrl] = useState('https://play.google.com/store')
    const publicReference = property.public_code?.trim() || property.slug?.trim()
    const deepLink = buildAppDeepLink(publicReference)
    const promoSale = getPromoSalePrice(property)
    const promoRent = getPromoRentPrice(property)
    const promoPeriodLabel =
        promoSale != null || promoRent != null
            ? formatPromotionPeriodLabel(property.promotionStart, property.promotionEnd)
            : null

    useEffect(() => {
        setStoreUrl(getStoreUrlClient())
    }, [])

    const whatsappMessage =
        `Olá! Vi o imóvel "${property.title}"${publicReference ? ` (Referência: ${publicReference})` : ''} no Encontre Aqui Imóveis e gostaria de mais informações.`
    const whatsappLink = buildWhatsappLink('6430500118', whatsappMessage)!
    const phoneLink = buildPhoneLink(property.brokerPhone)

    return (
        <aside className="lg:col-span-1" aria-label="Resumo e ações do imóvel">
            <div className="sticky top-24 space-y-6">
                {/* Price Card */}
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-200/50">
                    <div className="space-y-4">
                        {/* Price */}
                        <div className="space-y-1">
                            {property.priceSale && property.priceSale > 0 && (
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold uppercase tracking-wide text-gray-500">Venda</span>
                                    {promoSale != null && (
                                        <span className="text-sm font-medium text-gray-400 line-through">
                                            {formatPrice(property.priceSale)}
                                        </span>
                                    )}
                                    <span className="text-3xl font-bold text-primary-600">
                                        {formatPrice(promoSale ?? property.priceSale)}
                                    </span>
                                </div>
                            )}
                            {property.priceRent && property.priceRent > 0 && (
                                <div className="mt-2 flex flex-col">
                                    <span className="text-sm font-semibold uppercase tracking-wide text-gray-500">Aluguel</span>
                                    {promoRent != null && (
                                        <span className="text-sm font-medium text-gray-400 line-through">
                                            {formatPrice(property.priceRent)}
                                        </span>
                                    )}
                                    <span className="text-3xl font-bold text-amber-600">
                                        {formatPrice(promoRent ?? property.priceRent)}
                                        <span className="text-lg font-normal text-gray-500">/mês</span>
                                    </span>
                                </div>
                            )}
                            {!property.priceSale && !property.priceRent && property.price > 0 && (
                                <span className="text-3xl font-bold text-primary-600">
                                    {formatPrice(property.price)}
                                </span>
                            )}
                            {promoPeriodLabel && (
                                <p className="text-[11px] font-medium text-amber-800">{promoPeriodLabel}</p>
                            )}
                        </div>

                        {/* Stats grid (as in Image 2) */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            {/* Col 1 */}
                            <div className="space-y-3">
                                {property.bedrooms != null && property.bedrooms > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100/60 min-h-[52px]">
                                        <Bed className="h-5 w-5 text-gray-500 shrink-0" />
                                        <span className="text-xs font-semibold text-gray-700">
                                            {formatUnit(property.bedrooms, 'Quarto', 'Quartos')}
                                        </span>
                                    </div>
                                )}
                                {property.garageSpots != null && property.garageSpots > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100/60 min-h-[52px]">
                                        <Car className="h-5 w-5 text-gray-500 shrink-0" />
                                        <span className="text-xs font-semibold text-gray-700">
                                            {formatUnit(property.garageSpots, 'Garagem', 'Garagens')}
                                        </span>
                                    </div>
                                )}
                                {property.areaTerreno != null && property.areaTerreno > 0 && (
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100/60 min-h-[52px]">
                                        <Maximize className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                                        <span className="text-xs font-semibold text-gray-750 leading-tight">
                                            Área do Terreno:
                                            <span className="block mt-0.5 font-bold text-gray-900">
                                                {formatArea(property.areaTerreno, property.areaTerrenoUnidade)}
                                            </span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Col 2 */}
                            <div className="space-y-3">
                                {property.bathrooms != null && property.bathrooms > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100/60 min-h-[52px]">
                                        <Bath className="h-5 w-5 text-gray-500 shrink-0" />
                                        <span className="text-xs font-semibold text-gray-700">
                                            {formatUnit(property.bathrooms, 'Banheiro', 'Banheiros')}
                                        </span>
                                    </div>
                                )}
                                {property.areaConstruida != null && property.areaConstruida > 0 && (
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100/60 min-h-[52px]">
                                        <Hammer className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                                        <span className="text-xs font-semibold text-gray-750 leading-tight">
                                            Área Construída:
                                            <span className="block mt-0.5 font-bold text-gray-900">
                                                {formatArea(property.areaConstruida, property.areaConstruidaUnidade)}
                                            </span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-4" role="region" aria-label="Ações do aplicativo">
                            {/* WhatsApp CTA — Primary (always visible, fallback to 6430500118) */}
                            <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Falar pelo WhatsApp sobre ${property.title}`}
                                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] py-4 text-sm font-bold text-white shadow-md shadow-emerald-950/15 transition-all hover:bg-[#20BD5A] hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <WhatsAppIcon className="h-5 w-5 shrink-0" />
                                Falar pelo WhatsApp
                            </a>

                            {/* Deep Link — hidden on desktop, visible only on mobile */}
                            <a
                                href={deepLink}
                                aria-label={`Ver ${property.title} no aplicativo`}
                                className="lg:hidden flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary-600 py-4 text-sm font-bold text-white shadow-md shadow-primary-500/10 transition-all hover:bg-primary-700 hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <Smartphone className="h-5 w-5 shrink-0" />
                                Ver no Aplicativo
                            </a>

                            {visitorProposalHref && (
                                <Link
                                    href={visitorProposalHref}
                                    aria-label={`Gerar proposta para o imóvel ${property.title}`}
                                    className="w-full flex items-center justify-center gap-2.5 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-950/15 hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    <FileText className="w-5 h-5" />
                                    Gerar proposta
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-600 leading-relaxed">
                            <span className="font-bold block mb-0.5 text-gray-800">Negocie com segurança</span>
                            Converse com nossos corretores oficiais e evite fraudes.
                        </p>
                    </div>
                    <div className="pt-4 flex items-center justify-between">
                        <span className="text-gray-700 font-semibold text-sm">Código do Imóvel</span>
                        <span className="rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 font-bold text-gray-900 shadow-sm text-sm tracking-wide">
                            {publicReference || 'Indisponível'}
                        </span>
                    </div>
                </div>

                {/* App Download — Subtle */}
                <div className="text-center" role="region" aria-label="Download do aplicativo">
                    <a
                        href={storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Baixar o aplicativo Encontre Aqui Imóveis"
                        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <Smartphone className="w-3.5 h-3.5" />
                        Baixar o app para acompanhar propostas e favoritos
                    </a>
                </div>
            </div>
        </aside>
    )
}
