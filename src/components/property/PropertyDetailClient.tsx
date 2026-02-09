'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    Home, ChevronRight, MapPin, Bed, Bath, Car, Maximize,
    Waves, Building2, Phone,
    Share2, Heart, CheckCircle, Calendar, Hash, Map,
    MessageCircle, ArrowRight, XCircle
} from 'lucide-react'
import PropertyGallery from '@/components/property/PropertyGallery'
import PropertyInfo from '@/components/property/PropertyInfo'
import PropertySidebar from '@/components/property/PropertySidebar'
import PropertyCard from '@/components/property/PropertyCard'
import { formatPrice, Property } from '@/types/property'
import { useAuth } from '@/contexts/AuthContext'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://site-imobiliario-backend-production.up.railway.app'

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

interface PropertyDetailClientProps {
    initialProperty: Property
}

export default function PropertyDetailClient({ initialProperty }: PropertyDetailClientProps) {
    const { isAuthenticated } = useAuth()
    const [property, setProperty] = useState<Property>(initialProperty)
    const [similarProperties, setSimilarProperties] = useState<Property[]>([])
    const [isFavorite, setIsFavorite] = useState(false)

    useEffect(() => {
        // Fetch similar properties from same neighborhood
        if (property.bairro) {
            async function fetchSimilar() {
                try {
                    const similarRes = await fetch(
                        `${API_BASE_URL}/properties?bairro=${encodeURIComponent(property.bairro || '')}&limit=4&status=approved`
                    )
                    if (similarRes.ok) {
                        const similarData = await similarRes.json()
                        const rawSimilar = similarData.data || similarData
                        const allSimilar = Array.isArray(rawSimilar) ? rawSimilar : []

                        // Filter out current property and limit to 3
                        const filtered = allSimilar
                            .filter((p: any) => p.id !== property.id)
                            .slice(0, 3)
                        setSimilarProperties(filtered)
                    }
                } catch (err) {
                    console.error('Error fetching similar properties:', err)
                }
            }
            fetchSimilar()
        }
    }, [property.bairro, property.id])

    // Build amenities array (moved to PropertyInfo component mostly, but keeping logic if needed provided PropertyInfo handles it)
    // Actually PropertyInfo handles the logic internally or via props. 
    // We are passing 'property' to 'PropertyInfo', so we don't need to rebuild it here unless we need it for something else.

    // Build additional characteristics for display logic if needed outside components
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
        <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20 pb-12">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-hidden">
                    <Link href="/" className="hover:text-primary-600 transition-colors flex-shrink-0">
                        <Home className="w-4 h-4" />
                    </Link>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    <Link href="/imoveis" className="hover:text-primary-600 transition-colors flex-shrink-0">
                        Imóveis
                    </Link>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    <span className="text-gray-900 font-medium truncate">{property.title}</span>
                </nav>

                {/* Gallery (Width constrained to container) */}
                <div className="mb-8">
                    <PropertyGallery images={property.images} title={property.title} videoUrl={property.videoUrl} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content (Info) */}
                    <div className="lg:col-span-2">
                        <PropertyInfo property={property} />
                    </div>

                    {/* Sidebar (Sticky Action Card) */}
                    <div className="lg:col-span-1">
                        <PropertySidebar property={property} />
                    </div>
                </div>

                {/* Similar Properties Section */}
                {similarProperties.length > 0 && property.bairro && (
                    <div className="mt-16 pt-12 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
                                    Similares na região
                                </h2>
                                <p className="text-gray-500">
                                    Outras oportunidades em {property.bairro}
                                </p>
                            </div>
                            <Link
                                href={`/imoveis?bairro=${encodeURIComponent(property.bairro)}`}
                                className="hidden sm:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold transition-colors"
                            >
                                Ver todos
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {similarProperties.map((prop) => (
                                <PropertyCard key={prop.id} property={prop} />
                            ))}
                        </div>

                        <div className="mt-8 sm:hidden text-center">
                            <Link
                                href={`/imoveis?bairro=${encodeURIComponent(property.bairro)}`}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-semibold rounded-xl transition-colors"
                            >
                                Ver todos
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
