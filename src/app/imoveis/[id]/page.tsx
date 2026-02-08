'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
    Home, ChevronRight, MapPin, Bed, Bath, Car, Maximize,
    Wifi, Waves, Sun, Cpu, Wind, Sofa, Building2, Phone,
    Share2, Heart, CheckCircle, Calendar, Hash, Map,
    MessageCircle, ArrowRight, XCircle
} from 'lucide-react'
import PropertyGallery from '@/components/property/PropertyGallery'
import { formatPrice, Property } from '@/types/property'
import { useAuth } from '@/contexts/AuthContext'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6acc.up.railway.app'

// Status color mapping
const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendente' },
    approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Disponível' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejeitado' },
    sold: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Vendido' },
    rented: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Alugado' },
}

// Format date
function formatDate(date?: string): string {
    if (!date) return ''
    return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })
}

export default function PropertyDetailPage() {
    const params = useParams()
    const { isAuthenticated } = useAuth()
    const [property, setProperty] = useState<Property | null>(null)
    const [similarProperties, setSimilarProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isFavorite, setIsFavorite] = useState(false)

    useEffect(() => {
        async function fetchProperty() {
            try {
                const token = localStorage.getItem('token')
                const headers: HeadersInit = {}
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`
                }

                const response = await fetch(`${API_BASE_URL}/properties/${params.id}`, {
                    cache: 'no-store',
                    headers,
                })

                if (!response.ok) {
                    if (response.status === 404) {
                        setError('not_found')
                        return
                    }
                    throw new Error('Failed to fetch property')
                }

                const data = await response.json()
                const raw = data.data || data

                // Normalize mapping from snake_case if necessary
                const prop: Property = {
                    ...raw,
                    hasWifi: raw.hasWifi ?? raw.has_wifi,
                    temPiscina: raw.temPiscina ?? raw.tem_piscina,
                    temEnergiaSolar: raw.temEnergiaSolar ?? raw.tem_energia_solar,
                    temAutomacao: raw.temAutomacao ?? raw.tem_automacao,
                    temArCondicionado: raw.temArCondicionado ?? raw.tem_ar_condicionado,
                    ehMobiliada: raw.ehMobiliada ?? raw.eh_mobiliada ?? raw.is_furnished,
                    garageSpots: raw.garageSpots ?? raw.garage_spots,
                    valorCondominio: raw.valorCondominio ?? raw.valor_condominio,
                    valorIptu: raw.valorIptu ?? raw.valor_iptu,
                    areaConstruida: raw.areaConstruida ?? raw.area_construida,
                    areaTerreno: raw.areaTerreno ?? raw.area_terreno,
                    bedrooms: raw.bedrooms ?? raw.quartos,
                    bathrooms: raw.bathrooms ?? raw.banheiros,
                }

                setProperty(prop)

                // Fetch similar properties from same neighborhood
                if (prop.bairro) {
                    try {
                        const similarRes = await fetch(
                            `${API_BASE_URL}/properties?bairro=${encodeURIComponent(prop.bairro)}&limit=4&status=approved`
                        )
                        if (similarRes.ok) {
                            const similarData = await similarRes.json()
                            const rawSimilar = similarData.data || similarData
                            const allSimilar = Array.isArray(rawSimilar) ? rawSimilar : []

                            // Filter out current property and limit to 3
                            const filtered = allSimilar
                                .filter((p: any) => p.id !== prop.id)
                                .slice(0, 3)
                            setSimilarProperties(filtered)
                        }
                    } catch (err) {
                        console.error('Error fetching similar properties:', err)
                    }
                }
            } catch (err) {
                console.error('Error fetching property:', err)
                setError('error')
            } finally {
                setLoading(false)
            }
        }

        fetchProperty()
    }, [params.id])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        )
    }

    if (error === 'not_found' || !property) {
        notFound()
    }

    // Build amenities array
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

    const statusInfo = statusColors[property.status?.toLowerCase()] || statusColors.pending

    // WhatsApp handler
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
        const message = encodeURIComponent(`Olá! Tenho interesse no imóvel "${property.title}".`)
        window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank')
    }

    // Share handler
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
        <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20">
            {/* Gallery */}
            <PropertyGallery images={property.images} title={property.title} videoUrl={property.videoUrl} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link href="/" className="hover:text-primary-600 transition-colors">
                        <Home className="w-4 h-4" />
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link href="/imoveis" className="hover:text-primary-600 transition-colors">
                        Imóveis
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-gray-900 font-medium truncate max-w-xs">{property.title}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Header Section */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            {/* Status + Actions */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                                        {statusInfo.label}
                                    </span>
                                    <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                                        {property.type}
                                    </span>
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${property.purpose?.includes('Alug')
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-green-100 text-green-700'
                                        }`}>
                                        {property.purpose}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleShare}
                                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-full transition-colors"
                                        title="Compartilhar"
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setIsFavorite(!isFavorite)}
                                        className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:text-red-500 hover:bg-gray-100'}`}
                                        title="Favoritar"
                                    >
                                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                                {property.title}
                            </h1>

                            {/* Location - Strict Mode (City/Bairro only) */}
                            <div className="flex items-center gap-2 text-gray-900 mb-6">
                                <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0" />
                                <span className="text-lg font-medium">
                                    {property.bairro}
                                    {property.city && ` - ${property.city}`}
                                    {property.state && `/${property.state}`}
                                </span>
                            </div>

                            {/* Price Block */}
                            <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-xl p-5 mb-4">
                                {property.priceSale && property.priceSale > 0 && (
                                    <div className="flex items-baseline gap-3 mb-2">
                                        <span className="text-gray-600 text-sm font-medium">Venda:</span>
                                        <span className="text-3xl font-bold text-primary-600">
                                            {formatPrice(property.priceSale)}
                                        </span>
                                    </div>
                                )}
                                {property.priceRent && property.priceRent > 0 && (
                                    <div className="flex items-baseline gap-3 mb-2">
                                        <span className="text-gray-600 text-sm font-medium">Aluguel:</span>
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

                            {/* Additional costs */}
                            {((property.valorCondominio || 0) > 0 || (property.valorIptu || 0) > 0) && (
                                <div className="flex flex-wrap gap-3 text-sm">
                                    {property.valorCondominio && property.valorCondominio > 0 && (
                                        <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg">
                                            <Building2 className="w-4 h-4 text-gray-500" />
                                            Condomínio: {formatPrice(property.valorCondominio)}
                                        </span>
                                    )}
                                    {property.valorIptu && property.valorIptu > 0 && (
                                        <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            IPTU: {formatPrice(property.valorIptu)}/ano
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Published date */}
                            {property.createdAt && (
                                <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Publicado em {formatDate(property.createdAt)}
                                </div>
                            )}
                        </div>

                        {/* Key Stats Bar - Prominent Icons */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm group hover:border-primary-100 transition-colors">
                                <Bed className="w-8 h-8 text-primary-500 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-2xl font-bold text-gray-900">{property.bedrooms || 0}</span>
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Quartos</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm group hover:border-primary-100 transition-colors">
                                <Bath className="w-8 h-8 text-primary-500 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-2xl font-bold text-gray-900">{property.bathrooms || 0}</span>
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Banheiros</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm group hover:border-primary-100 transition-colors">
                                <Car className="w-8 h-8 text-primary-500 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-2xl font-bold text-gray-900">{property.garageSpots || 0}</span>
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Vagas</span>
                            </div>
                            {property.tipoLote && (
                                <div className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm group hover:border-primary-100 transition-colors">
                                    <Map className="w-8 h-8 text-primary-500 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-xl font-bold text-gray-900 text-center leading-tight">
                                        {property.tipoLote === 'inteiro' ? 'Lote Inteiro' : 'Meio Lote'}
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Tipo</span>
                                </div>
                            )}
                            <div className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm group hover:border-primary-100 transition-colors">
                                <Maximize className="w-8 h-8 text-primary-500 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-2xl font-bold text-gray-900">{property.areaConstruida || 0} m²</span>
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Área Útil</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm group hover:border-primary-100 transition-colors">
                                <Map className="w-8 h-8 text-primary-500 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-2xl font-bold text-gray-900">{property.areaTerreno || 0} m²</span>
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Área Total</span>
                            </div>
                        </div>

                        {/* Additional Info & Amenities */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Leisure & Comfort */}
                            {/* Leisure & Comfort */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Waves className="w-5 h-5 text-primary-500" />
                                    Lazer e Conforto
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {comfortAmenities.map((item, index) => (
                                        <div key={index} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${item.active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
                                            {item.active ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <item.icon className="w-4 h-4 flex-shrink-0" />
                                                    <span className="whitespace-nowrap text-xs">{item.label}</span>
                                                </div>
                                                <span className="text-[10px] uppercase font-bold">{item.active ? 'Tem' : 'Não tem'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Additional Characteristics */}
                            {(additionalInfo.length > 0) && (
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Hash className="w-5 h-5 text-primary-500" />
                                        Características Adicionais
                                    </h3>
                                    <div className="space-y-3">
                                        {additionalInfo.map((info, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <info.icon className="w-5 h-5 text-gray-400" />
                                                    <span className="text-gray-600 font-medium">{info.label}</span>
                                                </div>
                                                <span className="text-gray-900 font-bold">{info.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Description Section */}
                        {property.description && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Descrição</h2>
                                <div className="prose prose-gray max-w-none">
                                    <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                                        {property.description}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Video Section */}
                        {property.videoUrl && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Vídeo do Imóvel</h2>
                                <div className="aspect-video rounded-xl overflow-hidden bg-black">
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

                    {/* Sidebar - Contact */}
                    <aside className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {/* Contact Card */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Gostou do imóvel?</h3>
                                <p className="text-gray-600 text-sm mb-6">
                                    Entre em contato com o corretor responsável para tirar dúvidas ou agendar uma visita.
                                </p>

                                {/* Broker Info */}
                                {property.brokerName && (
                                    <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                                            {property.brokerName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{property.brokerName}</p>
                                            <p className="text-sm text-gray-500">Corretor responsável</p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleWhatsApp}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors mb-3"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    Conversar pelo WhatsApp
                                </button>

                                {property.brokerPhone && (
                                    <a
                                        href={`tel:${property.brokerPhone}`}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                                    >
                                        <Phone className="w-5 h-5" />
                                        Ligar para o corretor
                                    </a>
                                )}
                            </div>

                            {/* Property Code */}
                            {property.code && (
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <Hash className="w-5 h-5 text-gray-500" />
                                        <div>
                                            <span className="text-sm text-gray-500">Código do imóvel</span>
                                            <p className="font-bold text-gray-900">{property.code}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>

                {/* Similar Properties Section */}
                {similarProperties.length > 0 && property.bairro && (
                    <div className="mt-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Imóveis em {property.bairro}
                            </h2>
                            <Link
                                href={`/imoveis?bairro=${encodeURIComponent(property.bairro)}`}
                                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                            >
                                Ver todos
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {similarProperties.map((prop) => (
                                <Link
                                    key={prop.id}
                                    href={`/imoveis/${prop.id}`}
                                    className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all"
                                >
                                    <div className="relative aspect-video">
                                        {prop.images?.[0] ? (
                                            <Image
                                                src={prop.images[0]}
                                                alt={prop.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                <Home className="w-12 h-12 text-gray-300" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${prop.purpose?.includes('Alug')
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-green-100 text-green-700'
                                                }`}>
                                                {prop.purpose}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">
                                            {prop.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {prop.bairro} - {prop.city}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-bold text-primary-600">
                                                {formatPrice(prop.priceSale || prop.priceRent || prop.price)}
                                            </span>
                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                {prop.bedrooms && (
                                                    <span className="flex items-center gap-1">
                                                        <Bed className="w-4 h-4" /> {prop.bedrooms}
                                                    </span>
                                                )}
                                                {prop.bathrooms && (
                                                    <span className="flex items-center gap-1">
                                                        <Bath className="w-4 h-4" /> {prop.bathrooms}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Button to view all from neighborhood */}
                        <div className="mt-6 text-center">
                            <Link
                                href={`/imoveis?bairro=${encodeURIComponent(property.bairro)}`}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
                            >
                                Ver mais imóveis em {property.bairro}
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
