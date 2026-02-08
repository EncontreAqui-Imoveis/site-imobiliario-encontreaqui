'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    BarChart3,
    Building2,
    DollarSign,
    TrendingUp,
    CheckCircle,
    Clock,
    XCircle,
    Home,
    Key,
    RefreshCw,
    Calendar,
    Percent,
    AlertCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { brokerApi } from '@/lib/api'

interface PerformanceReport {
    totalDeals: number
    totalSales: number
    totalRents: number
    totalCommission: number
    totalIptu: number
    totalProperties: number
    statusBreakdown: { [key: string]: number }
}

interface Commission {
    id: number
    title: string
    deal_type: string
    sale_price: number
    commission_rate: number
    commission_amount: number
    iptu_value: number
    condominio_value: number
    is_recurring: boolean
    commission_cycles: number
    recurrence_interval: string
    sale_date: string
    commission_cycles_total: number
    commission_amount_total: number
}

export default function ReportsPage() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading } = useAuth()
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [report, setReport] = useState<PerformanceReport | null>(null)
    const [commissions, setCommissions] = useState<Commission[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login?redirect=/relatorios')
        }
    }, [isLoading, isAuthenticated, router])

    useEffect(() => {
        if (user && user.role === 'broker') {
            fetchData()
        }
    }, [user])

    const fetchData = async (refresh = false) => {
        if (refresh) setRefreshing(true)
        else setLoading(true)
        setError(null)

        try {
            const token = localStorage.getItem('token')
            if (!token) throw new Error('Token não encontrado')

            const [reportRes, commissionsRes] = await Promise.all([
                brokerApi.getPerformanceReport(token),
                brokerApi.getCommissions(token)
            ])

            if (reportRes.data?.data) {
                setReport(reportRes.data.data)
            }
            if (commissionsRes.data?.data) {
                setCommissions(commissionsRes.data.data)
            }
        } catch (err) {
            console.error('Erro ao buscar relatórios:', err)
            setError('Erro ao carregar os relatórios. Tente novamente.')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR')
    }

    const getStatusLabel = (status: string) => {
        const labels: { [key: string]: { label: string; color: string; icon: any } } = {
            'approved': { label: 'Disponíveis', color: 'bg-green-100 text-green-700', icon: CheckCircle },
            'pending_approval': { label: 'Em Análise', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
            'rejected': { label: 'Rejeitados', color: 'bg-red-100 text-red-700', icon: XCircle },
            'rented': { label: 'Alugados', color: 'bg-blue-100 text-blue-700', icon: Key },
            'sold': { label: 'Vendidos', color: 'bg-purple-100 text-purple-700', icon: DollarSign }
        }
        return labels[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: Building2 }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!isAuthenticated) return null

    // Access control - only for brokers
    if (user?.role !== 'broker') {
        return (
            <div className="min-h-screen bg-gray-50 pt-20 pb-12">
                <div className="max-w-2xl mx-auto px-4 text-center py-20">
                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
                    <p className="text-gray-600 mb-6">
                        Esta página é exclusiva para corretores.
                        Se você é corretor, finalize seu cadastro para ter acesso aos relatórios.
                    </p>
                    <button
                        onClick={() => router.push('/perfil')}
                        className="px-6 py-3 bg-primary-900 hover:bg-primary-800 text-white font-semibold rounded-xl transition-colors"
                    >
                        Ir para o Perfil
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <BarChart3 className="w-7 h-7 text-primary-600" />
                            Relatórios
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Acompanhe sua performance e comissões</p>
                    </div>
                    <button
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                ) : (
                    <>
                        {/* Performance Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Total de Imóveis</p>
                                        <p className="text-2xl font-bold text-gray-900">{report?.totalProperties || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Negócios Fechados</p>
                                        <p className="text-2xl font-bold text-gray-900">{report?.totalDeals || 0}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {report?.totalSales || 0} vendas • {report?.totalRents || 0} aluguéis
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sm:col-span-2 lg:col-span-1">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
                                        <DollarSign className="w-6 h-6 text-accent-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Comissões Acumuladas</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatCurrency(report?.totalCommission || 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Breakdown */}
                        {report?.statusBreakdown && Object.keys(report.statusBreakdown).length > 0 && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-8">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Home className="w-5 h-5 text-gray-400" />
                                    Status dos Imóveis
                                </h2>
                                <div className="flex flex-wrap gap-3">
                                    {Object.entries(report.statusBreakdown).map(([status, count]) => {
                                        const { label, color, icon: Icon } = getStatusLabel(status)
                                        return (
                                            <div
                                                key={status}
                                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${color}`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="font-medium">{label}</span>
                                                <span className="font-bold">{count}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Commission History */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-gray-400" />
                                    Histórico de Comissões
                                </h2>
                            </div>

                            {commissions.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {commissions.map((commission) => (
                                        <div key={commission.id} className="p-5 hover:bg-gray-50 transition-colors">
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 mb-1">
                                                        {commission.title}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${commission.deal_type === 'sale'
                                                                ? 'bg-purple-100 text-purple-700'
                                                                : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {commission.deal_type === 'sale' ? (
                                                                <><DollarSign className="w-3 h-3" /> Venda</>
                                                            ) : (
                                                                <><Key className="w-3 h-3" /> Aluguel</>
                                                            )}
                                                        </span>
                                                        {commission.is_recurring && (
                                                            <span className="inline-flex items-center gap-1 text-green-600">
                                                                <RefreshCw className="w-3 h-3" />
                                                                Recorrente ({commission.recurrence_interval || 'mensal'})
                                                            </span>
                                                        )}
                                                        <span className="inline-flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(commission.sale_date)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6 text-sm">
                                                    <div>
                                                        <p className="text-gray-400 text-xs">Valor do Negócio</p>
                                                        <p className="font-semibold text-gray-900">
                                                            {formatCurrency(Number(commission.sale_price))}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-400 text-xs flex items-center gap-1">
                                                            <Percent className="w-3 h-3" /> Taxa
                                                        </p>
                                                        <p className="font-semibold text-gray-900">
                                                            {Number(commission.commission_rate).toFixed(1)}%
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-400 text-xs">Ciclos</p>
                                                        <p className="font-semibold text-gray-900">
                                                            {commission.commission_cycles_total}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-400 text-xs">Total Comissão</p>
                                                        <p className="font-bold text-green-600">
                                                            {formatCurrency(commission.commission_amount_total)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {(Number(commission.condominio_value) > 0 || Number(commission.iptu_value) > 0) && (
                                                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
                                                    {Number(commission.condominio_value) > 0 && (
                                                        <span>Condomínio: {formatCurrency(Number(commission.condominio_value))}</span>
                                                    )}
                                                    {Number(commission.iptu_value) > 0 && (
                                                        <span>IPTU: {formatCurrency(Number(commission.iptu_value))}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Nenhuma comissão registrada ainda.</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Feche seu primeiro negócio para ver o histórico aqui.
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
