'use client'

import { useState } from 'react'
import { Property } from '@/types/property'
import { capitalizePropertyTitle } from '@/lib/propertyTitleDisplay'
import {
    MapPin,
    Wifi, Waves, Sun, Cpu, Wind, Sofa, Building2, type LucideIcon,
    Share2, CheckCircle,
    Phone, Globe, Mail,
    Droplet, ArrowUpDown, Dumbbell, Flame, PartyPopper, Trophy, ShieldCheck, PawPrint, Camera, Thermometer
} from 'lucide-react'
import { shareOrCopy } from '@/lib/webShare'
import { displayStatusLabel } from '@/lib/propertyLabels'
import { PROPERTY_CANONICAL_AMENITIES, PropertyAmenity } from '@/lib/propertyCreate'

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

const AMENITY_LABELS: Record<PropertyAmenity, string> = {
    'WI-FI': 'Wi-Fi',
    'PISCINA': 'Piscina',
    'ENERGIA SOLAR': 'Energia Solar',
    'AUTOMAÇÃO': 'Automação',
    'AR CONDICIONADO': 'Ar-condicionado',
    'POÇO ARTESIANO': 'Poço artesiano',
    'MOBILIADA': 'Mobiliada',
    'ELEVADOR': 'Elevador',
    'ACADEMIA': 'Academia',
    'CHURRASQUEIRA': 'Churrasqueira',
    'SALÃO DE FESTAS': 'Salão de festas',
    'QUADRA': 'Quadra',
    'CONDOMÍNIO FECHADO': 'Condomínio fechado',
    'ACEITA PETS': 'Aceita pets',
    'SISTEMA DE SEGURANÇA/CÂMERA': 'Sistema de segurança/câmera',
    'SAUNA': 'Sauna',
}

const AMENITY_CONFIGS: Record<PropertyAmenity, { icon: LucideIcon; label: string }> = {
    'WI-FI': { icon: Wifi, label: 'Wi-Fi' },
    'PISCINA': { icon: Waves, label: 'Piscina' },
    'ENERGIA SOLAR': { icon: Sun, label: 'Energia Solar' },
    'AUTOMAÇÃO': { icon: Cpu, label: 'Automação' },
    'AR CONDICIONADO': { icon: Wind, label: 'Ar-condicionado' },
    'MOBILIADA': { icon: Sofa, label: 'Mobiliada' },
    'POÇO ARTESIANO': { icon: Droplet, label: 'Poço artesiano' },
    'ELEVADOR': { icon: ArrowUpDown, label: 'Elevador' },
    'ACADEMIA': { icon: Dumbbell, label: 'Academia' },
    'CHURRASQUEIRA': { icon: Flame, label: 'Churrasqueira' },
    'SALÃO DE FESTAS': { icon: PartyPopper, label: 'Salão de festas' },
    'QUADRA': { icon: Trophy, label: 'Quadra' },
    'CONDOMÍNIO FECHADO': { icon: ShieldCheck, label: 'Condomínio fechado' },
    'ACEITA PETS': { icon: PawPrint, label: 'Aceita pets' },
    'SISTEMA DE SEGURANÇA/CÂMERA': { icon: Camera, label: 'Sistema de segurança/câmera' },
    'SAUNA': { icon: Thermometer, label: 'Sauna' },
}

function toSentenceCase(value: string): string {
    return value
        .toLowerCase()
        .split(' ')
        .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
        .join(' ')
}

function formatDate(date?: string): string {
    if (!date) return ''
    return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })
}

function getAmenityLabel(amenity: PropertyAmenity): string {
    return AMENITY_LABELS[amenity] ?? toSentenceCase(amenity)
}

export default function PropertyInfo({ property }: PropertyInfoProps) {
    const statusInfo = statusColors[property.status?.toLowerCase()] || statusColors.pending
    const statusLabel = displayStatusLabel(property.status, property.purpose)
    const isPurposeBadgeDuplicate = statusLabel.trim().toLowerCase() === (property.purpose ?? '').trim().toLowerCase()
    const [shareMessage, setShareMessage] = useState<string | null>(null)
    const selectedCanonicalAmenities = Array.from(
        new Set(
            [
                ...(Array.isArray(property.amenities) ? property.amenities : []),
                ...(property.ehMobiliada ? ['MOBILIADA'] : []),
                ...(property.hasWifi ? ['WI-FI'] : []),
                ...(property.temPiscina ? ['PISCINA'] : []),
                ...(property.temEnergiaSolar ? ['ENERGIA SOLAR'] : []),
                ...(property.temAutomacao ? ['AUTOMAÇÃO'] : []),
                ...(property.temArCondicionado ? ['AR CONDICIONADO'] : []),
            ]
                .map((amenity) => String(amenity).trim().toUpperCase())
                .filter((value): value is PropertyAmenity =>
                    PROPERTY_CANONICAL_AMENITIES.includes(value as PropertyAmenity) && value.length > 0,
                ),
        ),
    )

    // Build all active canonical and generic amenities
    const activeComfortAmenities = selectedCanonicalAmenities.map((amenity) => {
        const config = AMENITY_CONFIGS[amenity as PropertyAmenity]
        if (config) {
            return { icon: config.icon, label: amenity, active: true }
        }
        return { icon: CheckCircle, label: amenity, active: true }
    })
    const groupedGenericAmenities: string[] = []

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
                <div className="flex items-center gap-2 text-gray-800">
                    <MapPin className="h-5 w-5 shrink-0 text-primary-600" />
                    <span className="text-lg font-semibold sm:text-xl">
                        {property.bairro}
                        {property.city && ` • ${property.city}`}
                    </span>
                </div>
            </div>

            {/* Description Section */}
            {property.description && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[160px] space-y-4">
                    <div>
                        <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Sobre o imóvel</h2>
                        <div className="prose prose-gray max-w-none">
                            <p className="text-gray-600 whitespace-pre-line break-words [overflow-wrap:anywhere] leading-relaxed text-base">
                                {property.description}
                            </p>
                        </div>
                    </div>
                    {property.createdAt && (
                        <div className="pt-4 text-xs text-gray-400 font-semibold">
                            Publicado em {formatDate(property.createdAt)}
                        </div>
                    )}
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
                    Comodidades
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeComfortAmenities.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-xl transition-colors bg-primary-50/50 border border-primary-100">
                            <div className={`p-2 rounded-lg ${item.active ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-500'}`}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                                {getAmenityLabel(item.label as PropertyAmenity)}
                            </span>
                            <CheckCircle className="w-4 h-4 text-primary-500 ml-auto" />
                        </div>
                    ))}
                    {groupedGenericAmenities.map((amenity) => (
                        <div key={amenity} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <span className="text-sm font-medium text-gray-700">{amenity}</span>
                        </div>
                    ))}
                </div>
                {activeComfortAmenities.length === 0 && groupedGenericAmenities.length === 0 && (
                    <p className="mt-4 text-sm text-gray-500">Nenhuma outra comodidade informada.</p>
                )}
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
