'use client'

import { useState, useEffect } from 'react'
import { formatPrice, Property } from '@/types/property'
import { Info, ShieldCheck, Smartphone, MessageCircle, Phone } from 'lucide-react'
import { buildAppDeepLink, getStoreUrlClient } from '@/lib/appLinks'
import Link from 'next/link'
import { buildPhoneLink, buildWhatsappLink } from '@/lib/contactLinks'

interface PropertySidebarProps {
    property: Property
}

export default function PropertySidebar({ property }: PropertySidebarProps) {
    const [storeUrl, setStoreUrl] = useState('https://play.google.com/store')

    useEffect(() => {
        setStoreUrl(getStoreUrlClient())
    }, [])

    const whatsappMessage =
        `Olá! Vi o imóvel "${property.title}" (Cód: ${property.code || property.id}) no Encontre Aqui Imóveis e gostaria de mais informações.`
    const whatsappLink = buildWhatsappLink(property.brokerPhone, whatsappMessage)
    const phoneLink = buildPhoneLink(property.brokerPhone)
    const deepLink = buildAppDeepLink(property.id)

    return (
        <aside className="lg:col-span-1" aria-label="Resumo e ações do imóvel">
            <div className="sticky top-24 space-y-6">
                {/* Price Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <div className="space-y-4">
                        {/* Price */}
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Valor do Imóvel</p>
                            {property.priceSale && property.priceSale > 0 && (
                                <div className="flex flex-col">
                                    <span className="text-3xl font-bold text-primary-600">
                                        {formatPrice(property.priceSale)}
                                    </span>
                                </div>
                            )}
                            {property.priceRent && property.priceRent > 0 && (
                                <div className="flex flex-col mt-2">
                                    <span className="text-sm text-gray-500">Aluguel</span>
                                    <span className="text-3xl font-bold text-amber-600">
                                        {formatPrice(property.priceRent)}
                                        <span className="text-lg font-normal text-gray-500">/mês</span>
                                    </span>
                                </div>
                            )}
                            {!property.priceSale && !property.priceRent && property.price > 0 && (
                                <span className="text-3xl font-bold text-primary-600">
                                    {formatPrice(property.price)}
                                </span>
                            )}
                        </div>

                        <hr className="border-gray-100" />

                        {/* Broker Info */}
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold text-lg shadow-inner">
                                {property.brokerName ? property.brokerName.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 leading-tight truncate">
                                    {property.brokerName || 'Corretor'}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-primary-600 font-medium">
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>Corretor Credenciado</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-2">
                            {/* WhatsApp CTA — Primary */}
                            {whatsappLink && (
                                <a
                                    href={whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Falar pelo WhatsApp sobre ${property.title}`}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary-700 hover:bg-primary-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-900/25 active:scale-[0.98]"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    Falar pelo WhatsApp
                                </a>
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
                                className="w-full relative overflow-hidden group flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-primary-200 hover:border-primary-300 hover:bg-primary-50 text-primary-700 font-bold rounded-xl transition-all"
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
                    {property.code && (
                        <div className="mt-4 pt-4 border-t border-primary-100 flex items-center justify-between text-sm">
                            <span className="text-primary-700 font-medium">Código do Imóvel</span>
                            <span className="font-bold text-primary-900 bg-white px-2 py-1 rounded-md border border-primary-100 shadow-sm">
                                {property.code}
                            </span>
                        </div>
                    )}
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
