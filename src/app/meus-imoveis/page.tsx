'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useUser } from '@/contexts/UserContext'
import { getMyProperties, type PropertySummary } from '@/lib/api/user'
import { Building2, Plus, Edit, Loader2, Eye, MapPin } from 'lucide-react'

function formatPrice(price: number) {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'approved':
            return { label: 'Aprovado', className: 'bg-green-50 text-green-700' }
        case 'pending_approval':
            return { label: 'Pendente', className: 'bg-amber-50 text-amber-700' }
        case 'rejected':
            return { label: 'Rejeitado', className: 'bg-red-50 text-red-700' }
        case 'sold':
            return { label: 'Vendido', className: 'bg-blue-50 text-blue-700' }
        case 'rented':
            return { label: 'Alugado', className: 'bg-blue-50 text-blue-700' }
        default:
            return { label: status, className: 'bg-slate-50 text-slate-700' }
    }
}

export default function MeusImoveisPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { session, loading: authLoading, isBroker } = useUser()
    const canCreateProperty = Boolean(session)
    const createdId = Number(searchParams.get('created') ?? 0)

    const [properties, setProperties] = useState<PropertySummary[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const createdProperty = useMemo(
        () => properties.find((property) => property.id === createdId),
        [properties, createdId],
    )

    useEffect(() => {
        if (!authLoading && !session) {
            router.replace('/auth/login?next=/meus-imoveis')
        }
    }, [authLoading, session, router])

    useEffect(() => {
        if (session) {
            loadProperties()
        }
    }, [session])

    const loadProperties = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await getMyProperties()
            setProperties(data)
        } catch {
            setError('Erro ao carregar imóveis.')
        } finally {
            setLoading(false)
        }
    }

    if (authLoading || !session) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Meus Imóveis</h1>
                        <p className="text-sm text-slate-500">{properties.length} imóveis cadastrados</p>
                    </div>
                </div>
                {canCreateProperty && (
                    <Link
                        href="/anuncie"
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-primary-500/20 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Imóvel
                    </Link>
                )}
            </div>

            {createdId > 0 && (
                <div className="mb-6 rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-900">
                    {createdProperty
                        ? `Imóvel "${createdProperty.title}" enviado com sucesso para análise.`
                        : 'Seu imóvel foi enviado para análise. Se ele ainda não aparecer abaixo, atualize a lista em alguns instantes.'}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
            ) : error ? (
                <div className="text-center py-20">
                    <p className="text-sm text-red-600">{error}</p>
                    <button onClick={loadProperties} className="mt-3 text-sm text-primary-600 font-medium hover:underline">
                        Tentar novamente
                    </button>
                </div>
            ) : properties.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                    <Building2 className="w-16 h-16 mx-auto text-slate-200" />
                    <h2 className="text-lg font-semibold text-slate-700">Nenhum imóvel cadastrado</h2>
                    <p className="text-sm text-slate-500">
                        {isBroker
                            ? 'Cadastre seu primeiro imóvel para começar a receber propostas.'
                            : 'Cadastre seu primeiro imóvel para enviá-lo para análise.'}
                    </p>
                    {canCreateProperty ? (
                        <Link
                            href="/anuncie"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Cadastrar imóvel
                        </Link>
                    ) : (
                        <Link
                            href="/onboarding/broker"
                            className="inline-flex items-center px-6 py-2.5 bg-accent-500 hover:bg-accent-600 text-primary-900 text-sm font-semibold rounded-xl transition-colors"
                        >
                            Quero ser corretor
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => {
                        const badge = getStatusBadge(property.status)
                        const isJustCreated = property.id === createdId
                        return (
                            <div key={property.id} className={`bg-white rounded-2xl shadow-md shadow-slate-200/50 border overflow-hidden hover:shadow-lg transition-shadow group ${isJustCreated ? 'border-primary-300 ring-2 ring-primary-100' : 'border-slate-100'}`}>
                                <div className="relative aspect-[4/3] bg-slate-100">
                                    {property.imageUrl ? (
                                        <Image
                                            src={property.imageUrl}
                                            alt={property.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <Building2 className="w-12 h-12 text-slate-300" />
                                        </div>
                                    )}
                                    <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                                        {badge.label}
                                    </span>
                                    {isJustCreated && (
                                        <span className="absolute top-3 right-3 rounded-full bg-primary-700 px-2.5 py-1 text-xs font-semibold text-white">
                                            Novo
                                        </span>
                                    )}
                                </div>
                                <div className="p-4 space-y-2">
                                    <h3 className="font-semibold text-slate-900 line-clamp-1">{property.title}</h3>
                                    <p className="flex items-center gap-1 text-xs text-slate-500">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {property.city}, {property.state}
                                    </p>
                                    <p className="text-lg font-bold text-primary-600">{formatPrice(property.price)}</p>
                                    <div className="flex items-center gap-2 pt-2">
                                        <Link
                                            href={`/imoveis/${property.id}`}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            Ver
                                        </Link>
                                        <Link
                                            href={`/meus-imoveis/${property.id}/editar`}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                            Editar
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
