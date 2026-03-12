'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import { Edit, BadgeCheck, Building2, LogOut, Briefcase, BarChart3, Loader2, Bell, Settings } from 'lucide-react'

export default function PerfilPage() {
    const router = useRouter()
    const { session, loading, isBroker, logout } = useUser()

    useEffect(() => {
        if (!loading && !session) {
            router.replace('/auth/login?next=/perfil')
        }
    }, [loading, session, router])

    const handleLogout = async () => {
        await logout()
        router.push('/')
    }

    if (loading || !session) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        )
    }

    const user = session.user
    const brokerStatus = session.broker?.status ?? user.broker_status ?? null
    const brokerStatusLabel =
        brokerStatus === 'approved'
            ? 'Corretor aprovado'
            : brokerStatus === 'pending_verification'
                ? 'Corretor em análise'
                : brokerStatus === 'rejected'
                    ? 'Solicitação rejeitada'
                    : null

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pt-24">
            {/* Profile Header */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 mb-6">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
                        <p className="text-sm text-slate-500">{user.email}</p>
                        {user.phone && <p className="text-sm text-slate-500">{user.phone}</p>}
                        <div className="flex items-center gap-2 mt-2">
                            {isBroker && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700">
                                    <BadgeCheck className="w-3.5 h-3.5" />
                                    Corretor
                                </span>
                            )}
                            {brokerStatusLabel && (
                                <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                        brokerStatus === 'approved'
                                            ? 'bg-green-50 text-green-700'
                                            : brokerStatus === 'pending_verification'
                                                ? 'bg-amber-50 text-amber-700'
                                                : 'bg-red-50 text-red-700'
                                    }`}
                                >
                                    {brokerStatusLabel}
                                </span>
                            )}
                            {session.profileStatus === 'complete' ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                    Perfil completo
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                                    Perfil incompleto
                                </span>
                            )}
                            {user.email_verified ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                    E-mail verificado
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                                    E-mail pendente
                                </span>
                            )}
                        </div>
                    </div>
                    <Link
                        href="/perfil/editar"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-xl hover:bg-primary-50 transition-colors"
                    >
                        <Edit className="w-4 h-4" />
                        Editar
                    </Link>
                </div>

                {/* Address Info */}
                {(user.street || user.city) && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Endereço</p>
                        <p className="text-sm text-slate-600">
                            {[user.street, user.number, user.complement, user.bairro].filter(Boolean).join(', ')}
                        </p>
                        <p className="text-sm text-slate-600">
                            {[user.city, user.state].filter(Boolean).join(' — ')}
                            {user.cep && ` • CEP ${user.cep}`}
                        </p>
                    </div>
                )}
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 divide-y divide-slate-100">
                {!isBroker && (
                    <Link
                        href="/onboarding/broker"
                        className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors first:rounded-t-2xl"
                    >
                        <div className="w-10 h-10 bg-accent-50 rounded-xl flex items-center justify-center">
                            <BadgeCheck className="w-5 h-5 text-accent-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Quero ser corretor</p>
                            <p className="text-xs text-slate-500">Cadastre seu CRECI e documentos</p>
                        </div>
                    </Link>
                )}

                {isBroker && (
                    <>
                        <Link
                            href="/meus-imoveis"
                            className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                        >
                            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Meus Imóveis</p>
                                <p className="text-xs text-slate-500">Gerencie seus imóveis cadastrados</p>
                            </div>
                        </Link>
                        <Link
                            href="/relatorios"
                            className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                        >
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Relatórios</p>
                                <p className="text-xs text-slate-500">Performance e comissões</p>
                            </div>
                        </Link>
                    </>
                )}

                <Link
                    href="/notificacoes"
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                >
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                        <Bell className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900">Notificações</p>
                        <p className="text-xs text-slate-500">Propostas, contratos e novidades</p>
                    </div>
                </Link>

                <Link
                    href="/contratos"
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                >
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900">Contratos</p>
                        <p className="text-xs text-slate-500">Acompanhe seus contratos ativos</p>
                    </div>
                </Link>

                <Link
                    href="/configuracoes"
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                >
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                        <Settings className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900">Configurações</p>
                        <p className="text-xs text-slate-500">Preferências e ajustes</p>
                    </div>
                </Link>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 p-4 hover:bg-red-50 transition-colors w-full text-left last:rounded-b-2xl"
                >
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                        <LogOut className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-red-600">Sair</p>
                        <p className="text-xs text-slate-500">Encerrar sessão</p>
                    </div>
                </button>
            </div>
        </div>
    )
}
