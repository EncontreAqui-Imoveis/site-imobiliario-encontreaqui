'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import { resolveOperationalGateRoute } from '@/lib/auth/routeResolution'
import { getMyCommissions, getMyPerformanceReport, type CommissionSummary, type PerformanceReport } from '@/lib/api/broker'
import {
    BarChart3, DollarSign, TrendingUp, Building2, Loader2,
    ShoppingBag, RefreshCw, ChevronDown, ChevronUp, CalendarDays, Repeat
} from 'lucide-react'

function formatCurrency(val: number) {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function formatDate(dateStr?: string) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('pt-BR')
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    approved: { label: 'Disponíveis', color: 'text-slate-700', bg: 'bg-slate-100' },
    pending_approval: { label: 'Em análise', color: 'text-amber-700', bg: 'bg-amber-100' },
    pending: { label: 'Em análise', color: 'text-amber-700', bg: 'bg-amber-100' },
    rejected: { label: 'Rejeitados', color: 'text-red-700', bg: 'bg-red-100' },
    rented: { label: 'Alugados', color: 'text-blue-700', bg: 'bg-blue-100' },
    sold: { label: 'Vendidos', color: 'text-purple-700', bg: 'bg-purple-100' },
}

const RECURRENCE_LABELS: Record<string, string> = {
    weekly: 'Semanal',
    monthly: 'Mensal',
    yearly: 'Anual',
}

export default function RelatoriosPage() {
    const router = useRouter()
    const { session, loading: authLoading, isBroker } = useUser()

    const [report, setReport] = useState<PerformanceReport | null>(null)
    const [commissions, setCommissions] = useState<CommissionSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [expandedCommission, setExpandedCommission] = useState<number | null>(null)

    useEffect(() => {
        if (!authLoading && !session) {
            router.replace('/auth/login?next=/relatorios')
            return
        }
        const gateRoute = resolveOperationalGateRoute(session)
        if (!authLoading && gateRoute) {
            router.replace(gateRoute)
            return
        } else if (!authLoading && session && !isBroker) {
            router.replace('/onboarding/broker')
        }
    }, [authLoading, session, isBroker, router])

    useEffect(() => {
        if (session && isBroker) {
            loadData()
        }
    }, [session, isBroker])

    const loadData = async () => {
        setLoading(true)
        try {
            const [reportData, commData] = await Promise.allSettled([
                getMyPerformanceReport(),
                getMyCommissions(),
            ])
            if (reportData.status === 'fulfilled') setReport(reportData.value)
            if (commData.status === 'fulfilled') setCommissions(commData.value)
        } catch {
            setError('Erro ao carregar dados.')
        } finally {
            setLoading(false)
        }
    }

    if (authLoading || !session || !isBroker) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
                        <p className="text-sm text-slate-500">Performance e comissões</p>
                    </div>
                </div>
                {!loading && (
                    <button
                        onClick={loadData}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Atualizar
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
            ) : error ? (
                <div className="text-center py-20">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    {report && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <SummaryCard icon={DollarSign} label="Comissões" value={formatCurrency(report.totalCommissionEarned)} color="primary" />
                            <SummaryCard icon={TrendingUp} label="Vendas" value={String(report.totalSales)} color="primary" />
                            <SummaryCard icon={ShoppingBag} label="Aluguéis" value={String(report.totalRentals)} color="blue" />
                            <SummaryCard icon={Building2} label="Imóveis" value={String(report.totalPropertiesListed)} color="purple" />
                            <SummaryCard icon={RefreshCw} label="Negociações ativas" value={String(report.activeNegotiations)} color="blue" />
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <h2 className="text-sm font-semibold text-slate-800 mb-4">Ações rápidas</h2>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/meus-imoveis"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <Building2 className="w-4 h-4" />
                                Meus imóveis
                            </Link>
                            <Link
                                href="/documentos?tab=propostas"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                Propostas
                            </Link>
                            <Link
                                href="/documentos?tab=contratos"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <DollarSign className="w-4 h-4" />
                                Contratos
                            </Link>
                        </div>
                    </div>

                    {/* Status Breakdown */}
                    {report?.statusBreakdown && Object.keys(report.statusBreakdown).length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <h2 className="text-sm font-semibold text-slate-800 mb-4">Status dos imóveis</h2>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(report.statusBreakdown).map(([key, count]) => {
                                    const conf = STATUS_CONFIG[key] || { label: key, color: 'text-slate-700', bg: 'bg-slate-100' }
                                    return (
                                        <span
                                            key={key}
                                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${conf.bg} ${conf.color}`}
                                        >
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${conf.bg} ${conf.color} ring-2 ring-white`}>
                                                {count}
                                            </span>
                                            {conf.label}
                                        </span>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Monthly Breakdown */}
                    {report?.monthlyBreakdown && report.monthlyBreakdown.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <h2 className="text-sm font-semibold text-slate-800 mb-4">VGV Mensal</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="text-left py-2 text-xs font-medium text-slate-500">Mês</th>
                                            <th className="text-right py-2 text-xs font-medium text-slate-500">Vendas</th>
                                            <th className="text-right py-2 text-xs font-medium text-slate-500">Aluguéis</th>
                                            <th className="text-right py-2 text-xs font-medium text-slate-500">Comissões</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.monthlyBreakdown.map((row) => (
                                            <tr key={row.month} className="border-b border-slate-50">
                                                <td className="py-2.5 font-medium">{row.month}</td>
                                                <td className="text-right py-2.5">{row.sales}</td>
                                                <td className="text-right py-2.5">{row.rentals}</td>
                                                <td className="text-right py-2.5 font-semibold text-primary-600">
                                                    {formatCurrency(row.commissions)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Commission History — Detailed */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <h2 className="text-sm font-semibold text-slate-800 mb-4">Histórico de comissões</h2>
                        {commissions.length > 0 ? (
                            <div className="space-y-3">
                                {commissions.map((c, i) => {
                                    const isRent = c.dealType === 'rent' || c.dealType?.includes('alug')
                                    const dealLabel = isRent ? 'Aluguel' : 'Venda'
                                    const isRecurring = c.isRecurring || (c.recurrenceInterval && c.recurrenceInterval !== 'none')
                                    const recurrenceLabel = c.recurrenceInterval ? RECURRENCE_LABELS[c.recurrenceInterval] : null
                                    const expanded = expandedCommission === i
                                    const commRate = c.commissionRate ?? 0
                                    const cycles = c.commissionCycles ?? 0
                                    const totalByCycles = c.amount * cycles
                                    const resolvedTotal = (c.commissionAmountTotal ?? 0) > 0 ? c.commissionAmountTotal! : totalByCycles

                                    return (
                                        <div
                                            key={i}
                                            className="border border-slate-100 rounded-xl overflow-hidden hover:border-slate-200 transition-colors"
                                        >
                                            {/* Header Row */}
                                            <button
                                                onClick={() => setExpandedCommission(expanded ? null : i)}
                                                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/50 transition-colors"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 truncate">
                                                        {c.propertyTitle || `Negociação #${c.negotiationId}`}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isRent ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                                                            }`}>
                                                            {dealLabel}
                                                        </span>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.status === 'PAID' ? 'bg-slate-100 text-slate-700'
                                                            : c.status === 'CANCELLED' ? 'bg-red-50 text-red-700'
                                                                : 'bg-amber-50 text-amber-700'
                                                            }`}>
                                                            {c.status === 'PAID' ? 'Pago' : c.status === 'CANCELLED' ? 'Cancelado' : 'Pendente'}
                                                        </span>
                                                        {isRecurring && recurrenceLabel && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                                                <Repeat className="w-3 h-3" />
                                                                {recurrenceLabel}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-slate-400">
                                                            {c.role === 'CAPTURING' ? 'Captador' : 'Vendedor'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 ml-4">
                                                    <p className="text-sm font-bold text-primary-600 whitespace-nowrap">
                                                        {formatCurrency(c.amount)}
                                                    </p>
                                                    {expanded
                                                        ? <ChevronUp className="w-4 h-4 text-slate-400" />
                                                        : <ChevronDown className="w-4 h-4 text-slate-400" />
                                                    }
                                                </div>
                                            </button>

                                            {/* Expanded Details */}
                                            {expanded && (
                                                <div className="px-4 pb-4 pt-0 border-t border-slate-100 bg-slate-50/30">
                                                    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 pt-3 text-sm">
                                                        {(c.salePrice ?? 0) > 0 && (
                                                            <div>
                                                                <dt className="text-xs text-slate-400">Valor do negócio</dt>
                                                                <dd className="font-medium text-slate-800">{formatCurrency(c.salePrice!)}</dd>
                                                            </div>
                                                        )}
                                                        {commRate > 0 && (
                                                            <div>
                                                                <dt className="text-xs text-slate-400">Taxa de comissão</dt>
                                                                <dd className="font-medium text-slate-800">{commRate.toFixed(2)}%</dd>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <dt className="text-xs text-slate-400">Valor da comissão</dt>
                                                            <dd className="font-medium text-primary-600">{formatCurrency(c.amount)}</dd>
                                                        </div>
                                                        {cycles > 0 && (
                                                            <>
                                                                <div>
                                                                    <dt className="text-xs text-slate-400">Comissões realizadas</dt>
                                                                    <dd className="font-medium text-slate-800">{cycles}</dd>
                                                                </div>
                                                                <div>
                                                                    <dt className="text-xs text-slate-400">Total acumulado</dt>
                                                                    <dd className="font-bold text-slate-900">{formatCurrency(resolvedTotal)}</dd>
                                                                </div>
                                                            </>
                                                        )}
                                                        {(c.condominioValue ?? 0) > 0 && (
                                                            <div>
                                                                <dt className="text-xs text-slate-400">Condomínio</dt>
                                                                <dd className="font-medium text-slate-800">{formatCurrency(c.condominioValue!)}</dd>
                                                            </div>
                                                        )}
                                                        {c.saleDate && (
                                                            <div className="flex items-start gap-1">
                                                                <div>
                                                                    <dt className="text-xs text-slate-400">Data</dt>
                                                                    <dd className="font-medium text-slate-800 flex items-center gap-1">
                                                                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                                                                        {formatDate(c.saleDate)}
                                                                    </dd>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </dl>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">Nenhuma comissão registrada ainda.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ---------- Summary Card ---------- */
function SummaryCard({ icon: Icon, label, value, color }: {
    icon: typeof DollarSign
    label: string
    value: string
    color: string
}) {
    const colorMap: Record<string, string> = {
        primary: 'from-primary-500 to-primary-600',
        green: 'from-primary-500 to-primary-600',
        blue: 'from-blue-500 to-blue-600',
        purple: 'from-purple-500 to-purple-600',
    }
    return (
        <div className={`bg-gradient-to-br ${colorMap[color] || colorMap.primary} rounded-2xl p-5 text-white shadow-lg`}>
            <Icon className="w-7 h-7 mb-3 opacity-80" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm opacity-90 mt-1">{label}</p>
        </div>
    )
}
