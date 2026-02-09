'use client'

import { formatPrice, Property } from '@/types/property'
import { Phone, MessageCircle, Info, ShieldCheck } from 'lucide-react'

interface PropertySidebarProps {
    property: Property
}

export default function PropertySidebar({ property }: PropertySidebarProps) {
    const handleWhatsApp = () => {
        const phone = property.brokerPhone?.replace(/\D/g, '') || ''
        if (!phone) {
            alert('Contato do corretor não disponível')
            return
        }
        let formattedPhone = phone
        if (!formattedPhone.startsWith('55')) {
            formattedPhone = '55' + formattedPhone
        }
        const message = encodeURIComponent(`Olá! Tenho interesse no imóvel "${property.title}" (Cód: ${property.code || 'N/A'}).`)
        window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank')
    }

    return (
        <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">

                {/* Price Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <div className="space-y-4">
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
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold text-lg shadow-inner">
                                    {property.brokerName ? property.brokerName.charAt(0).toUpperCase() : 'C'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 leading-tight">
                                        {property.brokerName || 'Corretor'}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs text-primary-600 font-medium">
                                        <ShieldCheck className="w-3 h-3" />
                                        <span>Corretor Credenciado</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3 pt-2">
                            <button
                                onClick={handleWhatsApp}
                                className="w-full relative overflow-hidden group flex items-center justify-center gap-2 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/30 active:scale-[0.98]"
                            >
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <MessageCircle className="w-5 h-5" />
                                Conversar no WhatsApp
                            </button>

                            {property.brokerPhone && (
                                <a
                                    href={`tel:${property.brokerPhone}`}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-all"
                                >
                                    <Phone className="w-5 h-5" />
                                    Ligar Agora
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Important Info Card */}
                <div className="bg-primary-50 rounded-2xl p-6 border border-primary-100">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-primary-900 leading-relaxed">
                            <span className="font-bold block mb-1">Ficou interessado?</span>
                            Agende uma visita com o corretor responsável para conhecer todos os detalhes deste imóvel pessoalmente.
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
            </div>
        </aside>
    )
}
