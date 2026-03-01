import { apiClient } from '@/lib/api/client'

export interface Notification {
    id: number
    title: string | null
    message: string
    relatedEntityType: 'property' | 'broker' | 'agency' | 'user' | 'announcement' | 'negotiation' | 'other'
    relatedEntityId: number | null
    recipientType: 'admin' | 'user'
    recipientRole: 'client' | 'broker' | 'admin'
    isRead: boolean
    metadataJson: Record<string, unknown> | null
    createdAt: string
}

export async function getNotifications(): Promise<Notification[]> {
    return apiClient.get<Notification[]>('/users/notifications')
}

export async function markAsRead(id: number): Promise<void> {
    await apiClient.patch(`/users/notifications/${encodeURIComponent(id)}/read`)
}

export async function markAllAsRead(): Promise<void> {
    await apiClient.post('/users/notifications/read-all')
}
