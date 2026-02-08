'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Plus, Search, Filter, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { propertiesApi } from '@/lib/api'

export default function MyPropertiesPage() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading } = useAuth()
    const [properties, setProperties] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('all')

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login?redirect=/meus-imoveis')
        }
    }, [isLoading, isAuthenticated, router])

    useEffect(() => {
        if (user) {
            fetchProperties()
        }
    }, [user])

    const fetchProperties = async () => {
        if (!user) return
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            if (token) {
                const response = await propertiesApi.getByOwner(user.id, token)
                setProperties(Array.isArray(response.data) ? response.data : [])
            }
        } catch (error) {
            console.error('Error fetching properties:', error)
            setProperties([])
        } finally {
            setLoading(false)
        }
    }

    const filteredProperties = properties.filter(p => {
        if (statusFilter === 'all') return true
        return p.status === statusFilter
    })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending_approval':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Em Análise</span>
            case 'approved':
                return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Aprovado</span>
            case 'rejected':
                return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Rejeitado</span>
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">{status}</span>
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!isAuthenticated) return null

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Meus Imóveis</h1>
                        <p className="text-gray-500 text-sm mt-1">Gerencie seus anúncios</p>
                    </div>
                    <Link
                        href="/anuncie"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl transition-colors shadow-lg shadow-accent-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Anúncio
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Status:</span>
                    </div>
                    <div className="flex gap-2">
                        {[
                            { value: 'all', label: 'Todos' },
                            { value: 'pending_approval', label: 'Em Análise' },
                            { value: 'approved', label: 'Aprovados' },
                            { value: 'rejected', label: 'Rejeitados' },
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => setStatusFilter(option.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === option.value
                                    ? 'bg-primary-900 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Properties Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                ) : filteredProperties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProperties.map(property => (
                            <div key={property.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden group hover:shadow-lg transition-shadow">
                                {/* Image */}
                                <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                                    {property.images && property.images[0] ? (
                                        <img
                                            src={property.images[0]}
                                            alt={property.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Building2 className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        {getStatusBadge(property.status)}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{property.title}</h3>
                                    <p className="text-sm text-gray-500 mb-3 truncate">{property.address}, {property.city}</p>

                                    {property.price_sale && (
                                        <p className="text-lg font-bold text-green-600">
                                            {Number(property.price_sale).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                    )}
                                    {property.price_rent && (
                                        <p className="text-lg font-bold text-green-600">
                                            {Number(property.price_rent).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                                        </p>
                                    )}

                                    <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => router.push(`/meus-imoveis/${property.id}/editar`)}
                                            className="flex-1 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => router.push(`/imoveis/${property.id}`)}
                                            className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            Ver
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum imóvel encontrado</h3>
                        <p className="text-gray-500 mb-6">
                            {statusFilter === 'all'
                                ? 'Você ainda não anunciou nenhum imóvel.'
                                : 'Nenhum imóvel com este status.'}
                        </p>
                        <Link
                            href="/anuncie"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-900 hover:bg-primary-800 text-white font-semibold rounded-xl transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Anunciar Imóvel
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
