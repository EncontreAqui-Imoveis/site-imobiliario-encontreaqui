/**
 * Integration test: Notifications page full flow
 * Tests load, mark read, mark all read, delete individual, clear all, long message dialog
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))

jest.mock('lucide-react', () => {
    return new Proxy({}, {
        get: (_target, prop: string) => {
            const Comp = (p: Record<string, unknown>) => <span data-testid={`icon-${prop.toLowerCase()}`} {...p} />
            Comp.displayName = prop
            return Comp
        },
    })
})

jest.mock('@/lib/api/notifications', () => ({
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    clearAllNotifications: jest.fn(),
}))

jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        session: { user: { id: 1, name: 'João', email: 'joao@test.com' } },
        loading: false,
        isBroker: true,
    }),
}))

// Import AFTER mocks — the imported functions are the jest.fn() instances
import NotificacoesPage from '@/app/notificacoes/page'
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
} from '@/lib/api/notifications'

const mockedGetNotifications = getNotifications as jest.Mock
const mockedMarkAsRead = markAsRead as jest.Mock
const mockedMarkAllAsRead = markAllAsRead as jest.Mock
const mockedDeleteNotification = deleteNotification as jest.Mock
const mockedClearAllNotifications = clearAllNotifications as jest.Mock
const originalConsoleError = console.error

// Test data
const longMessage = 'A'.repeat(250)

const mockNotifications = [
    {
        id: 1,
        title: 'Nova proposta',
        message: 'Você recebeu uma proposta para Casa em Goiânia.',
        relatedEntityType: 'negotiation' as const,
        relatedEntityId: 10,
        recipientType: 'user' as const,
        recipientRole: 'broker' as const,
        isRead: false,
        metadataJson: null,
        createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
        id: 2,
        title: null,
        message: longMessage,
        relatedEntityType: 'property' as const,
        relatedEntityId: 20,
        recipientType: 'user' as const,
        recipientRole: 'broker' as const,
        isRead: true,
        metadataJson: null,
        createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    },
]

describe('Notifications Page - Integration', () => {
    beforeEach(() => {
        mockedGetNotifications.mockReset().mockResolvedValue([...mockNotifications])
        mockedMarkAsRead.mockReset().mockResolvedValue(undefined)
        mockedMarkAllAsRead.mockReset().mockResolvedValue(undefined)
        mockedDeleteNotification.mockReset().mockResolvedValue(undefined)
        mockedClearAllNotifications.mockReset().mockResolvedValue(undefined)
        mockPush.mockClear()
        mockReplace.mockClear()
        window.confirm = jest.fn(() => true)
        console.error = (...args: unknown[]) => {
            const firstArg = args[0]
            if (typeof firstArg === 'string' && firstArg.includes('not wrapped in act')) {
                return
            }
            originalConsoleError(...args)
        }
    })

    afterEach(() => {
        console.error = originalConsoleError
    })

    it('loads and displays notifications', async () => {
        render(<NotificacoesPage />)

        expect(await screen.findByText('Nova proposta')).toBeInTheDocument()
        expect(await screen.findByText(/1 não lida/)).toBeInTheDocument()

        expect(mockedGetNotifications).toHaveBeenCalled()
    })

    it('shows error state with retry button', async () => {
        mockedGetNotifications.mockRejectedValue(new Error('Network error'))

        render(<NotificacoesPage />)

        await waitFor(() => {
            expect(screen.getByText(/Erro ao carregar/)).toBeInTheDocument()
        })

        expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
    })

    it('marks all notifications as read', async () => {
        render(<NotificacoesPage />)

        await waitFor(() => {
            expect(screen.getByText('Nova proposta')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText(/Marcar todas como lidas/))

        await waitFor(() => {
            expect(mockedMarkAllAsRead).toHaveBeenCalledTimes(1)
        })
    })

    it('shows "Ler mais" for long messages', async () => {
        render(<NotificacoesPage />)

        await waitFor(() => {
            expect(screen.getByText('Ler mais')).toBeInTheDocument()
        })
    })

    it('opens long message dialog when "Ler mais" is clicked', async () => {
        render(<NotificacoesPage />)

        await waitFor(() => {
            expect(screen.getByText('Ler mais')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText('Ler mais'))

        expect(screen.getByText('Notificação')).toBeInTheDocument()
        expect(screen.getByText('Fechar')).toBeInTheDocument()
    })

    it('navigates to the related flow when notification has actionable context', async () => {
        render(<NotificacoesPage />)

        await waitFor(() => {
            expect(screen.getByText('Nova proposta')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText('Nova proposta'))

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/documentos?tab=propostas')
        })
    })

    it('clears all notifications with confirmation', async () => {
        render(<NotificacoesPage />)

        await waitFor(() => {
            expect(screen.getByText('Nova proposta')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText(/Limpar todas/))

        await waitFor(() => {
            expect(window.confirm).toHaveBeenCalledTimes(1)
            expect(mockedClearAllNotifications).toHaveBeenCalledTimes(1)
        })
    })

    it('does not clear when confirmation is cancelled', async () => {
        window.confirm = jest.fn(() => false)

        render(<NotificacoesPage />)

        await waitFor(() => {
            expect(screen.getByText('Nova proposta')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText(/Limpar todas/))

        expect(window.confirm).toHaveBeenCalled()
        expect(mockedClearAllNotifications).not.toHaveBeenCalled()
    })

    it('shows empty state when no notifications exist', async () => {
        mockedGetNotifications.mockResolvedValue([])

        render(<NotificacoesPage />)

        await waitFor(() => {
            expect(screen.getByText('Sem notificações')).toBeInTheDocument()
        })
    })
})
