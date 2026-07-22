import { resolveNotificationHref } from '@/lib/notificationNavigation'
import { Notification } from '@/lib/api/notifications'

function notification(metadataJson: Record<string, unknown> | null): Notification {
    return {
        id: 1,
        title: 'Teste',
        message: 'Mensagem',
        relatedEntityType: 'other',
        relatedEntityId: null,
        recipientType: 'user',
        recipientRole: 'client',
        isRead: false,
        metadataJson,
        createdAt: '2026-07-22T12:00:00.000Z',
    }
}

describe('notificationNavigation', () => {
    it('uses the canonical internal route for a contract', () => {
        expect(resolveNotificationHref(notification({ route: '/contracts/contract_123' })))
            .toBe('/meus-processos/contratos/contract_123')
    })

    it('keeps supporting legacy contract metadata', () => {
        expect(resolveNotificationHref(notification({ contractId: 'legacy-contract' })))
            .toBe('/meus-processos/contratos/legacy-contract')
    })

    it('rejects arbitrary external routes instead of navigating away from the site', () => {
        expect(resolveNotificationHref(notification({ route: 'https://malicious.example/contracts/1' }))).toBeNull()
        expect(resolveNotificationHref(notification({ route: '/contracts/1?next=https://malicious.example' }))).toBeNull()
    })

    it('maps canonical property routes to public property pages', () => {
        expect(resolveNotificationHref(notification({ route: '/properties/42', public_code: 'casa-azul' })))
            .toBe('/imoveis/casa-azul')
    })
})
