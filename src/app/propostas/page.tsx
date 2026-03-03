'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import { fetchMyNegotiations } from '@/lib/negotiationsService'
import type { NegotiationSummary } from '@/types/negotiation'
import { getStatusLabel, getStatusColor } from '@/types/negotiation'
import { FileText, Loader2, Plus, Building2 } from 'lucide-react'

export default function PropostasPage() {
    const router = useRouter()
    const { session, loading: authLoading } = useUser()

    const [negotiations, setNegotiations] = useState<NegotiationSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all')

    useEffect(() => {
        if (!authLoading && !session) {
            router.replace('/auth/login?next=/propostas')
        }
    }, [authLoading, session, router])

    useEffect(() => {
        if (session) {
            loadNegotiations()
        }
    }, [session])

    const loadNegotiations = async () => {
        setLoading(true)
        try {
            const data = await fetchMyNegotiations()
            setNegotiations(data)
        } catch {
            setError('Erro ao carregar negociações.')
        } finally {
            setLoading(false)
        }
    }

    const filtered = negotiations.filter(n => {
        if (filter === 'active') return !['SOLD', 'RENTED', 'CANCELLED', 'CONTRACT_FINALIZED'].includes(n.status)
        if (filter === 'completed') return ['SOLD', 'RENTED', 'CONTRACT_FINALIZED'].includes(n.status)
        if (filter === 'cancelled') return n.status === 'CANCELLED'
        return true
    })

    if (authLoading || !session) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pt-24">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Minhas Propostas</h1>
                        <p className="text-sm text-slate-500">{negotiations.length} negociações</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {([
                    ['all', 'Todas'],
                    ['active', 'Ativas'],
                    ['completed', 'Finalizadas'],
                    ['cancelled', 'Canceladas'],
                ] as const).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === key
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
            ) : error ? (
                <div className="text-center py-20">
                    <p className="text-sm text-red-600">{error}</p>
                    <button onClick={loadNegotiations} className="mt-3 text-sm text-primary-600 font-medium hover:underline">
                        Tentar novamente
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                    <FileText className="w-16 h-16 mx-auto text-slate-200" />
                    <h2 className="text-lg font-semibold text-slate-700">
                        {filter === 'all' ? 'Nenhuma proposta ainda' : 'Nenhuma proposta neste filtro'}
                    </h2>
                    <p className="text-sm text-slate-500">
                        Explore imóveis e gere sua primeira proposta.
                    </p>
                    <Link
                        href="/imoveis"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Explorar imóveis
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((neg) => (
                        <Link
                            key={neg.id}
                            href={neg.status === 'PENDING_PROPOSAL' || neg.status === 'PROPOSAL_SENT'
                                ? `/propostas/${neg.id}/upload-assinada`
                                : `/contratos`}
                            className="block bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-6 h-6 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                                            {neg.propertyTitle || `Imóvel #${neg.propertyId}`}
                                        </h3>
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(neg.status)}`}>
                                            {getStatusLabel(neg.status)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        {neg.clientName && <span>Cliente: {neg.clientName}</span>}
                                        <span>•</span>
                                        <span>{new Date(neg.createdAt).toLocaleDateString('pt-BR')}</span>
                                        {neg.proposalValidUntil && (
                                            <>
                                                <span>•</span>
                                                <span className="text-amber-600">
                                                    Válida até {new Date(neg.proposalValidUntil).toLocaleDateString('pt-BR')}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
