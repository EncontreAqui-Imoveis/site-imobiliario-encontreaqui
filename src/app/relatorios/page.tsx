'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { getMyCommissions, getMyPerformanceReport, type CommissionSummary, type PerformanceReport } from '@/lib/api/broker'
import { BarChart3, DollarSign, TrendingUp, Building2, Loader2 } from 'lucide-react'

function formatCurrency(val: number) {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export default function RelatoriosPage() {
    const router = useRouter()
    const { session, loading: authLoading, isBroker } = useUser()

    const [report, setReport] = useState<PerformanceReport | null>(null)
    const [commissions, setCommissions] = useState<CommissionSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!authLoading && !session) {
            router.replace('/auth/login?next=/relatorios')
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
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
                    <p className="text-sm text-slate-500">Performance e comissões</p>
                </div>
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                                    <DollarSign className="w-4 h-4" />
                                    Comissões
                                </div>
                                <p className="text-xl font-bold text-slate-900">
                                    {formatCurrency(report.totalCommissionEarned)}
                                </p>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                                    <TrendingUp className="w-4 h-4" />
                                    Vendas
                                </div>
                                <p className="text-xl font-bold text-slate-900">{report.totalSales}</p>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                                    <Building2 className="w-4 h-4" />
                                    Aluguéis
                                </div>
                                <p className="text-xl font-bold text-slate-900">{report.totalRentals}</p>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                                    <Building2 className="w-4 h-4" />
                                    Imóveis
                                </div>
                                <p className="text-xl font-bold text-slate-900">{report.totalPropertiesListed}</p>
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

                    {/* Recent Commissions */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <h2 className="text-sm font-semibold text-slate-800 mb-4">Comissões Recentes</h2>
                        {commissions.length > 0 ? (
                            <div className="space-y-2">
                                {commissions.map((c, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {c.propertyTitle || `Negociação #${c.negotiationId}`}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {c.role === 'CAPTURING' ? 'Captador' : 'Vendedor'} •{' '}
                                                <span className={`${c.status === 'PAID' ? 'text-green-600' : c.status === 'CANCELLED' ? 'text-red-600' : 'text-amber-600'}`}>
                                                    {c.status === 'PAID' ? 'Pago' : c.status === 'CANCELLED' ? 'Cancelado' : 'Pendente'}
                                                </span>
                                            </p>
                                        </div>
                                        <p className="text-sm font-bold text-primary-600">{formatCurrency(c.amount)}</p>
                                    </div>
                                ))}
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
