'use client'

import { useState } from 'react'
import { formatPrice, Property } from '@/types/property'
import { capitalizePropertyTitle } from '@/lib/propertyTitleDisplay'
import {
    MapPin, Bed, Bath, Car, Maximize,
    Wifi, Waves, Sun, Cpu, Wind, Sofa, Building2, type LucideIcon,
    Hash, Share2, CheckCircle,
    Map, Phone, Globe, Mail
} from 'lucide-react'
import { shareOrCopy } from '@/lib/webShare'
import { displayStatusLabel, formatUnit } from '@/lib/propertyLabels'
import { areaUnitLabel, normalizeAreaUnidade, squareMetersToAreaInput } from '@/lib/areaUnits'

interface PropertyInfoProps {
    property: Property
}

// Status color mapping
const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    approved: { bg: 'bg-slate-100', text: 'text-slate-700' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700' },
    sold: { bg: 'bg-blue-100', text: 'text-blue-700' },
    rented: { bg: 'bg-purple-100', text: 'text-purple-700' },
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
    const formatArea = (valueInM2?: number, unitRaw?: string | null) => {
        if (valueInM2 == null || valueInM2 <= 0) return '0 m²'
        const unit = normalizeAreaUnidade(unitRaw)
        const converted = squareMetersToAreaInput(valueInM2, unit)
        const asNumber = Number(converted)
        const formatted = Number.isFinite(asNumber)
            ? asNumber.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
            : converted
        return `${formatted} ${areaUnitLabel(unit)}`
    }
    const statusInfo = statusColors[property.status?.toLowerCase()] || statusColors.pending
    const statusLabel = displayStatusLabel(property.status, property.purpose)
    const isPurposeBadgeDuplicate = statusLabel.trim().toLowerCase() === (property.purpose ?? '').trim().toLowerCase()
    const [shareMessage, setShareMessage] = useState<string | null>(null)
    const genericAmenities = Array.from(new Set((property.amenities ?? []).map((amenity) => String(amenity).trim()).filter(Boolean)))

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
    ].filter(Boolean) as { icon: LucideIcon; label: string; value: string }[]

    const handleShare = async () => {
        const url = window.location.href
        const result = await shareOrCopy({
            title: property.title,
            text: `Confira o imóvel "${property.title}" no EncontreAquiImóveis`,
            url,
        })

        if (result.kind === 'copied') {
            setShareMessage('Link copiado para a área de transferência.')
            return
        }

        if (result.kind === 'unsupported') {
            setShareMessage('Não foi possível compartilhar este imóvel neste navegador.')
            return
        }

        setShareMessage('Compartilhamento iniciado com sucesso.')
    }

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                {/* Status + Actions */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                            {statusLabel}
                        </span>
                        <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wide rounded-full">
                            {property.type}
                        </span>
                        {!isPurposeBadgeDuplicate && (
                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full ${property.purpose?.includes('Alug')
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                                }`}>
                                {property.purpose}
                            </span>
                        )}
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
                    </div>
                </div>

                {shareMessage && (
                    <div
                        role="status"
                        aria-live="polite"
                        className="mb-4 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-900"
                    >
                        {shareMessage}
                    </div>
                )}

                {/* Title */}
                <h1 className="font-display mb-4 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
                    {capitalizePropertyTitle(property.title)}
                </h1>

                {/* Location */}
                <div className="mb-8 flex items-center gap-2 text-gray-800">
                    <MapPin className="h-5 w-5 shrink-0 text-primary-600" />
                    <span className="text-lg font-semibold sm:text-xl">
                        {property.bairro}
                        {property.city && ` • ${property.city}`}
                    </span>
                </div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-6 md:grid-cols-5">
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <Bed className="h-6 w-6 shrink-0 text-primary-600" />
                        <span className="text-xl font-bold text-gray-900">{property.bedrooms || 0}</span>
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-600">
                            {formatUnit(property.bedrooms || 0, 'Quarto', 'Quartos')}
                        </span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <Bath className="h-6 w-6 shrink-0 text-primary-600" />
                        <span className="text-xl font-bold text-gray-900">{property.bathrooms || 0}</span>
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-600">
                            {formatUnit(property.bathrooms || 0, 'Banheiro', 'Banheiros')}
                        </span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <Car className="h-6 w-6 shrink-0 text-primary-600" />
                        <span className="text-xl font-bold text-gray-900">{property.garageSpots || 0}</span>
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-600">
                            {formatUnit(property.garageSpots || 0, 'Garagem', 'Garagens')}
                        </span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-600">Suítes</span>
                        <span className="text-xl font-bold text-gray-900">{property.suites || 0}</span>
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-600">{formatUnit(property.suites || 0, 'Suíte', 'Suítes')}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <Maximize className="h-6 w-6 shrink-0 text-primary-600" />
                        <span className="text-xl font-bold text-gray-900">
                            {formatArea(property.areaTerreno, property.areaTerrenoUnidade)}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-600">Área do Terreno</span>
                    </div>
                </div>

                {/* Additional costs */}
                {((property.valorCondominio || 0) > 0) && (
                    <div className="mt-6 flex flex-wrap gap-4 pt-6 border-t border-gray-100">
                        {property.valorCondominio && property.valorCondominio > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span>Condomínio: <span className="font-semibold text-gray-900">{formatPrice(property.valorCondominio)}</span></span>
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
                        <p className="text-gray-600 whitespace-pre-line break-words [overflow-wrap:anywhere] leading-relaxed text-base">
                            {property.description}
                        </p>
                    </div>
                </div>
            )}

            {/* Detailed Location Section */}
            {(property.bairro || property.city) && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                    <h2 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Map className="w-5 h-5 text-primary-500" />
                        Localização
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {property.bairro && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <Building2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-500">Bairro</p>
                                    <p className="text-sm font-semibold text-gray-900">{property.bairro}</p>
                                </div>
                            </div>
                        )}
                        {property.city && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-500">Cidade</p>
                                    <p className="text-sm font-semibold text-gray-900">{property.city}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Agency Section */}
            {property.agencyName && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                    <h2 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary-500" />
                        Imobiliária Responsável
                    </h2>
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-7 h-7 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                            <h3 className="text-lg font-bold text-gray-900">{property.agencyName}</h3>
                            {property.agencyAddress && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span>{property.agencyAddress}</span>
                                </div>
                            )}
                            {property.agencyPhone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <a href={`tel:${property.agencyPhone}`} className="hover:text-primary-600 transition-colors">{property.agencyPhone}</a>
                                </div>
                            )}
                            {property.agencyEmail && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <a href={`mailto:${property.agencyEmail}`} className="hover:text-primary-600 transition-colors">{property.agencyEmail}</a>
                                </div>
                            )}
                            {property.agencyWebsite && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <a href={property.agencyWebsite.startsWith('http') ? property.agencyWebsite : `https://${property.agencyWebsite}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 transition-colors">{property.agencyWebsite}</a>
                                </div>
                            )}
                        </div>
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
                            {item.active && <CheckCircle className="w-4 h-4 text-primary-500 ml-auto" />}
                        </div>
                    ))}
                </div>
                {genericAmenities.length > 0 && (
                    <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <p className="text-sm font-medium text-gray-700">Outras comodidades</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {genericAmenities.map((amenity) => (
                                <span key={amenity} className="rounded-full bg-white border border-gray-200 px-3 py-1 text-sm text-gray-700">
                                    {amenity}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Extra Details (Lot Type, Total Area, etc) */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                <h2 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Hash className="w-5 h-5 text-primary-500" />
                    Detalhes Técnicos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <span className="text-gray-600">Área do Terreno</span>
                        <span className="font-bold text-gray-900">
                            {formatArea(property.areaTerreno, property.areaTerrenoUnidade)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <span className="text-gray-600">Área Construída</span>
                        <span className="font-bold text-gray-900">
                            {formatArea(property.areaConstruida, property.areaConstruidaUnidade)}
                        </span>
                    </div>
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
