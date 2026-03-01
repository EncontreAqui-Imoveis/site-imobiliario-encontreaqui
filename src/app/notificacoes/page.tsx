'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import { getNotifications, markAsRead, markAllAsRead, type Notification } from '@/lib/api/notifications'
import { Bell, Building2, Users, FileText, CheckCheck, Loader2 } from 'lucide-react'

const entityIcons: Record<string, typeof Bell> = {
    property: Building2,
    negotiation: FileText,
    broker: Users,
    user: Users,
}

function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}min atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays < 7) return `${diffDays}d atrás`
    return date.toLocaleDateString('pt-BR')
}

export default function NotificacoesPage() {
    const router = useRouter()
    const { session, loading: authLoading } = useUser()

    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!authLoading && !session) {
            router.replace('/auth/login?next=/notificacoes')
        }
    }, [authLoading, session, router])

    useEffect(() => {
        if (session) {
            loadNotifications()
        }
    }, [session])

    const loadNotifications = async () => {
        setLoading(true)
        try {
            const data = await getNotifications()
            setNotifications(data)
        } catch {
            setError('Erro ao carregar notificações.')
        } finally {
            setLoading(false)
        }
    }

    const handleMarkRead = async (id: number) => {
        try {
            await markAsRead(id)
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            )
        } catch {
            // silent
        }
    }

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead()
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        } catch {
            // silent
        }
    }

    const unreadCount = notifications.filter(n => !n.isRead).length

    if (authLoading || !session) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pt-24">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                        <Bell className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Notificações</h1>
                        {unreadCount > 0 && (
                            <p className="text-sm text-slate-500">{unreadCount} não lidas</p>
                        )}
                    </div>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-2 text-sm text-primary-600 font-medium hover:text-primary-700"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Marcar todas como lidas
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
            ) : notifications.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                    <Bell className="w-16 h-16 mx-auto text-slate-200" />
                    <h2 className="text-lg font-semibold text-slate-700">Sem notificações</h2>
                    <p className="text-sm text-slate-500">Você será notificado sobre propostas, contratos e novidades.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notif) => {
                        const Icon = entityIcons[notif.relatedEntityType] || Bell
                        return (
                            <div
                                key={notif.id}
                                onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${notif.isRead
                                        ? 'bg-white border-slate-100'
                                        : 'bg-primary-50/30 border-primary-100 hover:bg-primary-50/50'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${notif.isRead ? 'bg-slate-100' : 'bg-primary-100'
                                    }`}>
                                    <Icon className={`w-5 h-5 ${notif.isRead ? 'text-slate-400' : 'text-primary-600'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    {notif.title && (
                                        <p className="text-sm font-semibold text-slate-900">{notif.title}</p>
                                    )}
                                    <p className="text-sm text-slate-600 line-clamp-2">{notif.message}</p>
                                    <p className="text-xs text-slate-400 mt-1">{formatDate(notif.createdAt)}</p>
                                </div>
                                {!notif.isRead && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
