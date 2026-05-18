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
import { Info, Smartphone, Phone, FileText } from 'lucide-react'
import WhatsAppIcon from '@/components/icons/WhatsAppIcon'
import { buildAppDeepLink, getStoreUrlClient } from '@/lib/appLinks'
import { buildPhoneLink, buildWhatsappLink } from '@/lib/contactLinks'

interface PropertySidebarProps {
    property: Property
    /** Logado (cliente/corretor) vendo imóvel de outro — iniciar proposta. */
    visitorProposalHref?: string | null
}

export default function PropertySidebar({ property, visitorProposalHref }: PropertySidebarProps) {
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
    const whatsappLink = buildWhatsappLink(property.brokerPhone, whatsappMessage)
    const phoneLink = buildPhoneLink(property.brokerPhone)

    return (
        <aside className="lg:col-span-1" aria-label="Resumo e ações do imóvel">
            <div className="sticky top-24 space-y-6">
                {/* Price Card */}
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-200/50">
                    <div className="space-y-4">
                        {/* Price */}
                        <div className="space-y-1">
                            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Valor do Imóvel</p>
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

                        <hr className="border-gray-100" />

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-2">
                            {/* WhatsApp CTA — Primary */}
                            {whatsappLink && (
                                <a
                                    href={whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Falar pelo WhatsApp sobre ${property.title}`}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-4 font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-[#20BD5A] active:scale-[0.98]"
                                >
                                    <WhatsAppIcon className="h-5 w-5 shrink-0" />
                                    Falar pelo WhatsApp
                                </a>
                            )}

                            {visitorProposalHref && (
                                <Link
                                    href={visitorProposalHref}
                                    aria-label={`Gerar proposta para o imóvel ${property.title}`}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
                                >
                                    <FileText className="w-5 h-5" />
                                    Gerar proposta
                                </Link>
                            )}

                            {/* Phone CTA */}
                            {phoneLink && !whatsappLink && (
                                <a
                                    href={phoneLink}
                                    aria-label={`Ligar para o corretor responsável por ${property.title}`}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/30 active:scale-[0.98]"
                                >
                                    <Phone className="w-5 h-5" />
                                    Ligar para o Corretor
                                </a>
                            )}

                        <section aria-label="Ações do aplicativo" className="space-y-3">
                            {/* Deep Link — Tertiary */}
                            <a
                                href={deepLink}
                                aria-label={`Ver ${property.title} no aplicativo`}
                                className="relative w-full overflow-hidden rounded-xl border-2 border-primary-200 bg-white py-3.5 font-bold text-primary-700 transition-all hover:border-primary-300 hover:bg-primary-50 group flex items-center justify-center gap-2"
                            >
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-primary-100/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <Smartphone className="w-5 h-5" />
                                Ver no Aplicativo
                            </a>
                        </section>
                    </div>
                </div>
                </div>

                {/* Info Box */}
                <div className="bg-primary-50 rounded-2xl p-6 border border-primary-100">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-primary-900 leading-relaxed">
                            <span className="font-bold block mb-1">Negocie com segurança</span>
                            Converse com o corretor, faça propostas e acompanhe todo o processo diretamente no Encontre Aqui.
                        </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-primary-100 flex items-center justify-between text-sm">
                        <span className="text-primary-700 font-medium">Referência</span>
                        <span className="rounded-md border border-primary-100 bg-white px-2 py-1 font-bold text-primary-900 shadow-sm">
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
