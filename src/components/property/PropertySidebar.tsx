'use client'

import { formatPrice, Property } from '@/types/property'
import { Info, ShieldCheck, Smartphone, Download } from 'lucide-react'
import { APP_LINKS, buildAppDeepLink } from '@/lib/appLinks'

interface PropertySidebarProps {
    property: Property
}

export default function PropertySidebar({ property }: PropertySidebarProps) {
    return (
        <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
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

                        <div className="space-y-3 pt-2">
                            <a
                                href={buildAppDeepLink(property.id)}
                                className="w-full relative overflow-hidden group flex items-center justify-center gap-2 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/30 active:scale-[0.98]"
                            >
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <Smartphone className="w-5 h-5" />
                                Abrir este imóvel no App
                            </a>

                            <a
                                href={APP_LINKS.androidStore}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 py-4 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-all"
                            >
                                <Download className="w-5 h-5" />
                                Baixar no Android
                            </a>

                            <a
                                href={APP_LINKS.iosStore}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 py-4 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-all"
                            >
                                <Download className="w-5 h-5" />
                                Baixar no iOS
                            </a>
                        </div>
                    </div>
                </div>

                <div className="bg-primary-50 rounded-2xl p-6 border border-primary-100">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-primary-900 leading-relaxed">
                            <span className="font-bold block mb-1">Próximo passo no app</span>
                            Favoritar, proposta e negociação são realizadas diretamente no aplicativo.
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
