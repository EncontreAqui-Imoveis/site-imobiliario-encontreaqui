'use client'

import { useRouter } from 'next/navigation'
import { Property, formatPrice } from '@/types/property'
import { Phone, Heart, Share2, Building2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface PropertyContactProps {
    property: Property
}

export default function PropertyContact({ property }: PropertyContactProps) {
    const router = useRouter()
    const { isAuthenticated, isFavorite, toggleFavorite } = useAuth()
    const isPropertyFavorite = isFavorite(property.id)

    const whatsappNumber = property.brokerPhone?.replace(/\D/g, '') || '5564993012696'
    const whatsappMessage = encodeURIComponent(
        `Olá! Vi o imóvel "${property.title}" no site e gostaria de mais informações.`
    )
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

    const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

    const handleFavorite = () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=/imoveis/${property.id}`)
            return
        }
        toggleFavorite(property.id)
    }

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: property.title,
                url: shareUrl,
            })
        } else {
            navigator.clipboard.writeText(shareUrl)
            // Could show a toast here
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Price Summary */}
            <div className="p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                <div className="text-white/80 text-sm mb-1">A partir de</div>
                <div className="text-3xl font-bold">
                    {formatPrice(property.priceSale || property.priceRent || property.price)}
                </div>
                {property.priceRent && property.priceRent > 0 && (
                    <div className="text-white/80 text-sm mt-1">/mês</div>
                )}
            </div>

            {/* Contact Section */}
            <div className="p-6 space-y-4">
                {/* Broker Info */}
                {property.brokerName && (
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                            <div className="font-semibold text-gray-900">{property.brokerName}</div>
                            <div className="text-sm text-gray-500">Corretor responsável</div>
                        </div>
                    </div>
                )}

                {/* WhatsApp Button */}
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200"
                >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Chamar no WhatsApp
                </a>

                {/* Phone Button */}
                {property.brokerPhone && (
                    <a
                        href={`tel:${property.brokerPhone}`}
                        className="flex items-center justify-center gap-2 w-full py-3 border-2 border-gray-200 hover:border-primary-500 text-gray-700 hover:text-primary-600 font-medium rounded-xl transition-all"
                    >
                        <Phone className="w-5 h-5" />
                        Ligar agora
                    </a>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={handleFavorite}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 font-medium rounded-xl transition-all ${isPropertyFavorite
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500'
                            }`}
                    >
                        <Heart className={`w-5 h-5 ${isPropertyFavorite ? 'fill-white' : ''}`} />
                        {isPropertyFavorite ? 'Favoritado' : 'Favoritar'}
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-primary-50 text-gray-600 hover:text-primary-600 font-medium rounded-xl transition-all"
                    >
                        <Share2 className="w-5 h-5" />
                        Compartilhar
                    </button>
                </div>
            </div>

            {/* Trust Badges */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        ✓ Anúncio verificado
                    </span>
                    <span className="flex items-center gap-1">
                        ✓ Corretor CRECI
                    </span>
                </div>
            </div>
        </div>
    )
}
