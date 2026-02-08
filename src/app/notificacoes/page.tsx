'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, Home, ChevronRight, Check, Trash2, Building2, MessageSquare, ShieldCheck, AlertCircle, User, Megaphone, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { notificationsApi } from '@/lib/api'

interface Notification {
    id: number
    message: string
    is_read: boolean
    created_at: string
    related_entity_type: string
    related_entity_id?: number
}

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'property':
            return <Building2 className="w-5 h-5 text-blue-500" />
        case 'broker':
            return <ShieldCheck className="w-5 h-5 text-purple-500" />
        case 'agency':
            return <Building2 className="w-5 h-5 text-gray-500" />
        case 'user':
            return <User className="w-5 h-5 text-gray-500" />
        case 'announcement':
            return <Megaphone className="w-5 h-5 text-orange-500" />
        case 'message':
            return <MessageSquare className="w-5 h-5 text-green-500" />
        default:
            return <Bell className="w-5 h-5 text-gray-500" />
    }
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `Há ${diffMins} min`
    if (diffHours < 24) return `Há ${diffHours}h`
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `Há ${diffDays} dias`

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function NotificationsPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [clearingAll, setClearingAll] = useState(false)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login?redirect=/notificacoes')
        }
    }, [isAuthenticated, isLoading, router])

    const fetchNotifications = async () => {
        setLoading(true)
        setError(null)
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                setError('Sessão expirada. Faça login novamente.')
                return
            }

            const response = await notificationsApi.getAll(token)

            if (response.error) {
                setError(response.error)
                return
            }

            // Handle different response formats
            let items: Notification[] = []
            const data = response.data

            if (Array.isArray(data)) {
                items = data
            } else if (data && typeof data === 'object') {
                if (Array.isArray((data as any).data)) {
                    items = (data as any).data
                } else if (Array.isArray((data as any).notifications)) {
                    items = (data as any).notifications
                }
            }

            setNotifications(items)
        } catch (err) {
            console.error('Error fetching notifications:', err)
            setError('Erro ao carregar notificações.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications()
        }
    }, [isAuthenticated])

    const markAsRead = async (id: number) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return

            const response = await notificationsApi.markAsRead(id, token)
            if (!response.error) {
                setNotifications(prev => prev.filter(n => n.id !== id))
            }
        } catch (err) {
            console.error('Error marking notification as read:', err)
        }
    }

    const markAllAsRead = async () => {
        if (clearingAll || notifications.length === 0) return

        setClearingAll(true)
        try {
            const token = localStorage.getItem('token')
            if (!token) return

            const response = await notificationsApi.markAllAsRead(token)
            if (!response.error) {
                setNotifications([])
            }
        } catch (err) {
            console.error('Error marking all as read:', err)
        } finally {
            setClearingAll(false)
        }
    }

    const unreadCount = notifications.filter(n => !n.is_read).length

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!isAuthenticated) return null

    return (
        <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <Link href="/" className="hover:text-primary-500 transition-colors">
                            <Home className="w-4 h-4" />
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 font-medium">Notificações</span>
                    </nav>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-lg relative">
                                <Bell className="w-6 h-6 text-white" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notificações</h1>
                                <p className="text-gray-500">
                                    {notifications.length > 0 ? `${notifications.length} notificação(ões)` : 'Nenhuma notificação'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchNotifications}
                                disabled={loading}
                                className="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Atualizar"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            {notifications.length > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    disabled={clearingAll}
                                    className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {clearingAll ? (
                                        <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    Limpar todas
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="text-center py-16">
                        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                ) : error ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar</h2>
                        <p className="text-gray-500 mb-4">{error}</p>
                        <button
                            onClick={fetchNotifications}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`bg-white rounded-xl border p-4 transition-all ${notification.is_read ? 'border-gray-100' : 'border-primary-200 bg-primary-50/30'}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.is_read ? 'bg-gray-100' : 'bg-white shadow'}`}>
                                        {getNotificationIcon(notification.related_entity_type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className={`${notification.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {formatDate(notification.created_at)}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                                                title="Marcar como lida"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {notification.related_entity_type === 'property' && notification.related_entity_id && (
                                            <Link
                                                href={`/imoveis/${notification.related_entity_id}`}
                                                className="inline-block mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
                                            >
                                                Ver imóvel →
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-10 h-10 text-gray-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma notificação</h2>
                        <p className="text-gray-500">Você não tem notificações no momento.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
