'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { User, Mail, Phone, Building2, Heart, LogOut, Settings, ShieldCheck, BadgeCheck, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function ProfilePage() {
    const router = useRouter()
    const { user, logout, isAuthenticated, isLoading } = useAuth()
    const [activeTab, setActiveTab] = useState('overview')
    const [userProperties, setUserProperties] = useState<any[]>([])
    const [loadingProperties, setLoadingProperties] = useState(false)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login?redirect=/perfil')
        }
    }, [isLoading, isAuthenticated, router])

    // Fetch properties when tab is active
    useEffect(() => {
        if (activeTab === 'properties' && user) {
            fetchProperties()
        }
    }, [activeTab, user])

    const fetchProperties = async () => {
        if (!user) return
        setLoadingProperties(true)
        try {
            const { propertiesApi } = await import('@/lib/api')
            const token = localStorage.getItem('token')
            if (token) {
                const response = await propertiesApi.getByOwner(user.id, token)
                // Ensure we always set an array
                setUserProperties(Array.isArray(response.data) ? response.data : [])
            }
        } catch (error) {
            console.error('Error fetching properties:', error)
            setUserProperties([]) // Reset to empty array on error
        } finally {
            setLoadingProperties(false)
        }
    }

    if (isLoading || !user) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const isBroker = user.role === 'broker' // Kept for badge logic only, but tab is open for all

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="h-32 bg-gradient-to-r from-primary-900 to-primary-800 relative">
                        {isBroker && (
                            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                Corretor Verificado
                            </div>
                        )}
                    </div>
                    <div className="px-8 pb-8">
                        <div className="relative flex justify-between items-end -mt-12 mb-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                                    {user.avatar ? (
                                        <Image
                                            src={user.avatar}
                                            alt={user.name}
                                            width={96}
                                            height={96}
                                            className="w-full h-full object-cover rounded-full bg-gray-100"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-primary-50 rounded-full flex items-center justify-center text-primary-500">
                                            <User className="w-10 h-10" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium text-sm"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sair
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white hover:bg-primary-800 rounded-xl transition-all font-medium text-sm shadow-lg shadow-primary-900/20">
                                    <Settings className="w-4 h-4" />
                                    Editar Perfil
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${isBroker
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {isBroker ? 'Corretor' : 'Cliente'}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                                <Mail className="w-4 h-4" /> {user.email}
                                {user.phone && (
                                    <>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                        <Phone className="w-4 h-4" /> {user.phone}
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="px-8 border-t border-gray-100 flex gap-6 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'overview' ? 'border-accent-500 text-primary-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Visão Geral
                        </button>
                        <button
                            onClick={() => setActiveTab('favorites')}
                            className={`py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'favorites' ? 'border-accent-500 text-primary-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Favoritos
                        </button>
                        <button
                            onClick={() => setActiveTab('properties')}
                            className={`py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'properties' ? 'border-accent-500 text-primary-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Meus Imóveis
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Section */}
                    <div className="md:col-span-2 space-y-6">
                        {activeTab === 'overview' && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Atalhos Rápidos</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Link href="/favoritos" className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                                        <div className="w-10 h-10 rounded-lg bg-red-100 text-red-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Heart className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-semibold text-gray-900">Meus Favoritos</h4>
                                        <p className="text-sm text-gray-500 mt-1">Veja os imóveis que você curtiu</p>
                                    </Link>

                                    <Link href="/anuncie" className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                                        <div className="w-10 h-10 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-semibold text-gray-900">Novo Anúncio</h4>
                                        <p className="text-sm text-gray-500 mt-1">Publique um novo imóvel</p>
                                    </Link>
                                </div>

                                {/* Upgrade to Broker - only for clients */}
                                {!isBroker && (
                                    <Link
                                        href="/perfil/evoluir-corretor"
                                        className="mt-4 flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary-900 to-primary-800 text-white hover:from-primary-800 hover:to-primary-700 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                                                <BadgeCheck className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-lg">Seja um Corretor</h4>
                                                <p className="text-white/70 text-sm">Anuncie imóveis e tenha o selo verificado</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </Link>
                                )}
                            </div>
                        )}

                        {activeTab === 'favorites' && (
                            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 mb-4">Acesse sua lista completa de favoritos.</p>
                                <Link href="/favoritos" className="inline-block px-6 py-2 bg-primary-50 text-primary-700 rounded-lg font-medium hover:bg-primary-100 transition-colors">
                                    Ver Favoritos
                                </Link>
                            </div>
                        )}

                        {activeTab === 'properties' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-gray-900">Meus Anúncios</h3>
                                    <Link href="/anuncie" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
                                        + Novo Anúncio
                                    </Link>
                                </div>

                                {loadingProperties ? (
                                    <div className="text-center py-12">
                                        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                    </div>
                                ) : userProperties.length > 0 ? (
                                    <div className="grid gap-4">
                                        {userProperties.map(property => (
                                            <div key={property.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4">
                                                <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden">
                                                    {property.images && property.images[0] ? (
                                                        <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <Building2 className="w-8 h-8" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {property.status === 'pending_approval' && (
                                                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                                            Em Análise
                                                        </span>
                                                    )}
                                                    {property.status === 'approved' && (
                                                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full mb-2">
                                                            Aprovado
                                                        </span>
                                                    )}
                                                    {property.status === 'rejected' && (
                                                        <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full mb-2">
                                                            Rejeitado
                                                        </span>
                                                    )}
                                                    <h4 className="font-semibold text-gray-900 truncate">{property.title}</h4>
                                                    <p className="text-sm text-gray-500 truncate">{property.address}, {property.city}</p>
                                                    <div className="mt-2 flex gap-2">
                                                        <button
                                                            onClick={() => router.push(`/anuncie?id=${property.id}`)}
                                                            className="text-xs font-medium text-primary-600 hover:text-primary-700"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button className="text-xs font-medium text-gray-400 hover:text-red-500">
                                                            Excluir
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 mb-4">Você ainda não anunciou nenhum imóvel.</p>
                                        <Link href="/anuncie" className="inline-block px-6 py-2 bg-primary-50 text-primary-700 rounded-lg font-medium hover:bg-primary-100 transition-colors">
                                            Anunciar Agora
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4">Estatísticas</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                                    <span className="text-gray-600">Imóveis Ativos</span>
                                    <span className="font-semibold text-gray-900">
                                        {userProperties.filter(p => p.status === 'approved').length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                                    <span className="text-gray-600">Em Análise</span>
                                    <span className="font-semibold text-gray-900">
                                        {userProperties.filter(p => p.status === 'pending').length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
