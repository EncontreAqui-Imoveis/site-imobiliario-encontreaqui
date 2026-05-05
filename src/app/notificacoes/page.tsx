'use client'

import { useEffect, useState, useCallback } from 'react'
import { unstable_batchedUpdates } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { resolvePendingAction } from '@/lib/auth/routeResolution'
import GuestAccessCard from '@/components/auth/GuestAccessCard'
import {
    getNotifications, markAsRead, markAllAsRead,
    deleteNotification, clearAllNotifications,
    type Notification
} from '@/lib/api/notifications'
import {
    Bell, Building2, Users, FileText, CheckCheck, Loader2,
    Trash2, X, AlertTriangle, Megaphone
} from 'lucide-react'
import { buildPublicPropertyUrl } from '@/lib/propertyLinks'

const entityIcons: Record<string, typeof Bell> = {
    property: Building2,
    negotiation: FileText,
    broker: Users,
    user: Users,
    announcement: Megaphone,
}

const MESSAGE_PREVIEW_LIMIT = 200

function toStringOrNull(value: unknown): string | null {
    const normalized = String(value ?? '').trim()
    return normalized.length > 0 ? normalized : null
}

function resolveNotificationHref(notification: Notification): string | null {
    const metadata = notification.metadataJson ?? {}
    const negotiationId =
        toStringOrNull(metadata.negotiationId) ??
        toStringOrNull(metadata.negotiation_id)
    const contractId =
        toStringOrNull(metadata.contractId) ??
        toStringOrNull(metadata.contract_id)

    if (contractId) {
        return `/contratos/${encodeURIComponent(contractId)}`
    }

    if (negotiationId) {
        return `/propostas/${encodeURIComponent(negotiationId)}/upload-assinada`
    }

    if (notification.relatedEntityType === 'negotiation') {
        return '/documentos?tab=propostas'
    }

    if (notification.relatedEntityType === 'property' && notification.relatedEntityId) {
        const propertyPublicRef =
            toStringOrNull(metadata.publicCode) ??
            toStringOrNull(metadata.public_code) ??
            toStringOrNull(metadata.publicCodeSlug) ??
            toStringOrNull(metadata.slug)
        return propertyPublicRef
            ? buildPublicPropertyUrl({ id: notification.relatedEntityId, slug: propertyPublicRef })
            : `/imoveis/${notification.relatedEntityId}`
    }

    if (notification.relatedEntityType === 'broker' || notification.relatedEntityType === 'user') {
        return '/perfil'
    }

    if (notification.relatedEntityType === 'announcement') {
        return '/anuncie'
    }

    return null
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

function isLongMessage(msg: string) {
    return msg.trim().length > MESSAGE_PREVIEW_LIMIT
}

function truncateMessage(msg: string) {
    const trimmed = msg.trim()
    if (trimmed.length <= MESSAGE_PREVIEW_LIMIT) return trimmed
    return trimmed.substring(0, MESSAGE_PREVIEW_LIMIT).trimEnd() + '…'
}

export default function NotificacoesPage() {
    const router = useRouter()
    const { session, loading: authLoading } = useUser()

    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [clearingAll, setClearingAll] = useState(false)
    const [expandedNotif, setExpandedNotif] = useState<Notification | null>(null)

    const syncUnreadBadge = useCallback((nextNotifications: Notification[]) => {
        const unreadCount = nextNotifications.filter((item) => !item.isRead).length
        window.dispatchEvent(
            new CustomEvent('notifications-unread-count', {
                detail: { unreadCount },
            }),
        )
    }, [])

    useEffect(() => {
        if (session) {
            loadNotifications()
            return
        }
        setLoading(false)
    }, [session])

    const loadNotifications = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await getNotifications()
            unstable_batchedUpdates(() => {
                setNotifications(data)
                setError(null)
                setLoading(false)
            })
            syncUnreadBadge(data)
        } catch {
            unstable_batchedUpdates(() => {
                setError('Erro ao carregar notificações.')
                setLoading(false)
            })
        }
    }

    const handleMarkRead = useCallback(async (id: number) => {
        try {
            await markAsRead(id)
            unstable_batchedUpdates(() => {
                setNotifications(prev => {
                    const next = prev.map(n => n.id === id ? { ...n, isRead: true } : n)
                    syncUnreadBadge(next)
                    return next
                })
            })
        } catch {
            // silent
        }
    }, [])

    const handleMarkAllRead = useCallback(async () => {
        try {
            await markAllAsRead()
            unstable_batchedUpdates(() => {
                setNotifications(prev => {
                    const next = prev.map(n => ({ ...n, isRead: true }))
                    syncUnreadBadge(next)
                    return next
                })
            })
        } catch {
            // silent
        }
    }, [])

    const handleDelete = useCallback(async (id: number) => {
        setDeletingId(id)
        try {
            await deleteNotification(id)
            unstable_batchedUpdates(() => {
                setNotifications(prev => {
                    const next = prev.filter(n => n.id !== id)
                    syncUnreadBadge(next)
                    return next
                })
            })
        } catch {
            // silent — keep notification in list
        } finally {
            unstable_batchedUpdates(() => {
                setDeletingId(null)
            })
        }
    }, [])

    const handleClearAll = useCallback(async () => {
        if (!window.confirm('Tem certeza que deseja limpar todas as notificações?')) return
        setClearingAll(true)
        try {
            await clearAllNotifications()
            unstable_batchedUpdates(() => {
                setNotifications([])
                syncUnreadBadge([])
            })
        } catch {
            // silent
        } finally {
            unstable_batchedUpdates(() => {
                setClearingAll(false)
            })
        }
    }, [syncUnreadBadge])

    const handleOpenNotification = useCallback(async (notification: Notification) => {
        const href = resolveNotificationHref(notification)
        if (!notification.isRead) {
            await handleMarkRead(notification.id)
        }
        if (href) {
            router.push(href)
            return
        }
        if (isLongMessage(notification.message)) {
            setExpandedNotif(notification)
        }
    }, [handleMarkRead, router])

    const unreadCount = notifications.filter(n => !n.isRead).length
    const pendingAction = resolvePendingAction(session)

    if (authLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        )
    }

    if (!session) {
        return (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pt-24">
                <GuestAccessCard
                    icon={Bell}
                    title="Entre para ver suas notificações"
                    description="Com sua conta você acompanha alertas de propostas, contratos e atualizações importantes da operação."
                />
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pt-24">
            {/* Header */}
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
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-2 text-sm text-primary-600 font-medium hover:text-primary-700 px-3 py-2 hover:bg-primary-50 rounded-xl transition-colors"
                        >
                            <CheckCheck className="w-4 h-4" />
                            <span className="hidden sm:inline">Marcar todas como lidas</span>
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            disabled={clearingAll}
                            className="flex items-center gap-2 text-sm text-red-600 font-medium hover:text-red-700 px-3 py-2 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                            title="Limpar todas"
                        >
                            {clearingAll ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">Limpar todas</span>
                        </button>
                    )}
                </div>
            </div>

            {pendingAction && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p className="font-semibold">{pendingAction.title}</p>
                    <p className="mt-1">{pendingAction.description}</p>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
            ) : error ? (
                <div className="text-center py-20 space-y-4">
                    <AlertTriangle className="w-12 h-12 mx-auto text-red-300" />
                    <p className="text-sm text-red-600">{error}</p>
                    <button
                        onClick={loadNotifications}
                        className="text-sm text-primary-600 font-medium hover:underline"
                    >
                        Tentar novamente
                    </button>
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
                        const long = isLongMessage(notif.message)
                        return (
                            <div
                                key={notif.id}
                                className={`group flex items-start gap-4 p-4 rounded-xl border transition-colors ${notif.isRead
                                    ? 'bg-white border-slate-100'
                                    : 'bg-primary-50/30 border-primary-100 hover:bg-primary-50/50'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${notif.isRead ? 'bg-slate-100' : 'bg-primary-100'
                                    }`}>
                                    <Icon className={`w-5 h-5 ${notif.isRead ? 'text-slate-400' : 'text-primary-600'}`} />
                                </div>
                                <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => {
                                        void handleOpenNotification(notif)
                                    }}
                                >
                                    {notif.title && (
                                        <p className="text-sm font-semibold text-slate-900">{notif.title}</p>
                                    )}
                                    <p className="text-sm text-slate-600 line-clamp-3">
                                        {long ? truncateMessage(notif.message) : notif.message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-slate-400">{formatDate(notif.createdAt)}</p>
                                        {resolveNotificationHref(notif) && (
                                            <span className="text-xs font-medium text-primary-600">
                                                Abrir
                                            </span>
                                        )}
                                        {long && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setExpandedNotif(notif) }}
                                                className="text-xs text-primary-600 font-medium hover:underline"
                                            >
                                                Ler mais
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {!notif.isRead && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                                    )}
                                    <button
                                        onClick={() => handleDelete(notif.id)}
                                        disabled={deletingId === notif.id}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all text-slate-400 hover:text-red-500"
                                        title="Excluir notificação"
                                    >
                                        {deletingId === notif.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Long Message Dialog */}
            {expandedNotif && (
                <div
                    className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
                    onClick={() => setExpandedNotif(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">
                                {expandedNotif.title || 'Notificação'}
                            </h3>
                            <button
                                onClick={() => setExpandedNotif(null)}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {expandedNotif.message}
                            </p>
                            <p className="text-xs text-slate-400 mt-4">
                                {formatDate(expandedNotif.createdAt)}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 p-5 border-t border-slate-100">
                            <button
                                onClick={() => setExpandedNotif(null)}
                                className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Fechar
                            </button>
                            {resolveNotificationHref(expandedNotif) && (
                                <button
                                    onClick={() => {
                                        const href = resolveNotificationHref(expandedNotif)
                                        setExpandedNotif(null)
                                        if (href) {
                                            void handleOpenNotification(expandedNotif)
                                        }
                                    }}
                                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors"
                                >
                                    Abrir contexto
                                </button>
                            )}
                            {!expandedNotif.isRead && (
                                <button
                                    onClick={() => {
                                        handleMarkRead(expandedNotif.id)
                                        setExpandedNotif(null)
                                    }}
                                    className="flex-1 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors"
                                >
                                    Marcar como lida
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
