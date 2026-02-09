'use client'

import { formatPrice, Property } from '@/types/property'
import {
    MapPin, Bed, Bath, Car, Maximize,
    Wifi, Waves, Sun, Cpu, Wind, Sofa, Building2,
    Calendar, Hash, Map, Share2, Heart, CheckCircle, XCircle
} from 'lucide-react'
import { useState } from 'react'

interface PropertyInfoProps {
    property: Property
}

// Status color mapping
const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendente' },
    approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Disponível' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejeitado' },
    sold: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Vendido' },
    rented: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Alugado' },
}

function formatDate(date?: string): string {
    if (!date) return ''
    return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })
}

export default function PropertyInfo({ property }: PropertyInfoProps) {
    const [isFavorite, setIsFavorite] = useState(false)
    const statusInfo = statusColors[property.status?.toLowerCase()] || statusColors.pending

    // Build comfort amenities
    const comfortAmenities = [
        { icon: Wifi, label: 'Wi-Fi', active: property.hasWifi },
        { icon: Waves, label: 'Piscina', active: property.temPiscina },
        { icon: Sun, label: 'Energia Solar', active: property.temEnergiaSolar },
        { icon: Cpu, label: 'Automação', active: property.temAutomacao },
        { icon: Wind, label: 'Ar Condicionado', active: property.temArCondicionado },
        { icon: Sofa, label: 'Mobiliada', active: property.ehMobiliada },
    ]

    // Build additional characteristics
    const additionalInfo = [
        property.valorCondominio ? { icon: Building2, label: 'Condomínio', value: formatPrice(property.valorCondominio) } : null,
        property.valorIptu ? { icon: Hash, label: 'IPTU', value: formatPrice(property.valorIptu) } : null,
    ].filter(Boolean) as { icon: any; label: string; value: string }[]

    const handleShare = async () => {
        const url = window.location.href
        if (navigator.share) {
            try {
                await navigator.share({
                    title: property.title,
                    text: `Confira o imóvel "${property.title}" no EncontreAquiImóveis`,
                    url,
                })
            } catch (err) {
                console.log('Share cancelled')
            }
        } else {
            navigator.clipboard.writeText(url)
            alert('Link copiado!')
        }
    }

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                {/* Status + Actions */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                            {statusInfo.label}
                        </span>
                        <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wide rounded-full">
                            {property.type}
                        </span>
                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full ${property.purpose?.includes('Alug')
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                            }`}>
                            {property.purpose}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                            title="Compartilhar"
                            aria-label="Compartilhar imóvel"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'}`}
                            title="Favoritar"
                            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        >
                            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Title */}
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                    {property.title}
                </h1>

                {/* Location */}
                <div className="flex items-center gap-2 text-gray-600 mb-8">
                    <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    <span className="text-lg font-medium">
                        {property.bairro}
                        {property.city && ` • ${property.city}`}
                        {property.state && ` • ${property.state}`}
                    </span>
                </div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex flex-col items-center justify-center text-center">
                        <Bed className="w-6 h-6 text-primary-500 mb-2" />
                        <span className="text-xl font-bold text-gray-900">{property.bedrooms || 0}</span>
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Quartos</span>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center">
                        <Bath className="w-6 h-6 text-primary-500 mb-2" />
                        <span className="text-xl font-bold text-gray-900">{property.bathrooms || 0}</span>
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Banheiros</span>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center">
                        <Car className="w-6 h-6 text-primary-500 mb-2" />
                        <span className="text-xl font-bold text-gray-900">{property.garageSpots || 0}</span>
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Vagas</span>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center">
                        <Maximize className="w-6 h-6 text-primary-500 mb-2" />
                        <span className="text-xl font-bold text-gray-900">{property.areaConstruida || 0} m²</span>
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Área Útil</span>
                    </div>
                </div>

                {/* Additional costs */}
                {((property.valorCondominio || 0) > 0 || (property.valorIptu || 0) > 0) && (
                    <div className="mt-6 flex flex-wrap gap-4 pt-6 border-t border-gray-100">
                        {property.valorCondominio && property.valorCondominio > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span>Condomínio: <span className="font-semibold text-gray-900">{formatPrice(property.valorCondominio)}</span></span>
                            </div>
                        )}
                        {property.valorIptu && property.valorIptu > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>IPTU: <span className="font-semibold text-gray-900">{formatPrice(property.valorIptu)}</span>/ano</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Description Section */}
            {property.description && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                    <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Sobre o imóvel</h2>
                    <div className="prose prose-gray max-w-none">
                        <p className="text-gray-600 whitespace-pre-line leading-relaxed text-base">
                            {property.description}
                        </p>
                    </div>
                </div>
            )}

            {/* Amenities Section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                <h2 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Waves className="w-5 h-5 text-primary-500" />
                    Comodidades e Lazer
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {comfortAmenities.map((item, index) => (
                        <div key={index} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${item.active ? 'bg-primary-50/50 border border-primary-100' : 'bg-gray-50 border border-gray-100 opacity-60'}`}>
                            <div className={`p-2 rounded-lg ${item.active ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-500'}`}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className={`text-sm font-medium ${item.active ? 'text-gray-900' : 'text-gray-500'}`}>
                                {item.label}
                            </span>
                            {item.active && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Extra Details (Lot Type, Total Area, etc) */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                <h2 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Hash className="w-5 h-5 text-primary-500" />
                    Detalhes Técnicos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <span className="text-gray-600">Área Total</span>
                        <span className="font-bold text-gray-900">{property.areaTerreno || 0} m²</span>
                    </div>
                    {property.tipoLote && (
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <span className="text-gray-600">Tipo de Lote</span>
                            <span className="font-bold text-gray-900 capitalize">{property.tipoLote}</span>
                        </div>
                    )}
                    {(additionalInfo.length > 0) && additionalInfo.map((info, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <span className="text-gray-600">{info.label}</span>
                            <span className="font-bold text-gray-900">{info.value}</span>
                        </div>
                    ))}
                    {property.createdAt && (
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <span className="text-gray-600">Publicado em</span>
                            <span className="font-bold text-gray-900">{formatDate(property.createdAt)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Video Section */}
            {property.videoUrl && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                    <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Vídeo do Imóvel</h2>
                    <div className="aspect-video rounded-xl overflow-hidden bg-black relative group cursor-pointer">
                        <video
                            controls
                            className="w-full h-full"
                            poster={property.images?.[0]}
                        >
                            <source src={property.videoUrl} type="video/mp4" />
                            Seu navegador não suporta vídeos.
                        </video>
                    </div>
                </div>
            )}
        </div>
    )
}
