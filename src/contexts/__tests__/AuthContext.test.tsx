import '@testing-library/jest-dom'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import { authApi } from '@/lib/api'

// Mock dependencies
jest.mock('@/lib/api', () => ({
    authApi: {
        login: jest.fn(),
        logout: jest.fn().mockResolvedValue({}),
    },
    favoritesApi: {
        getAll: jest.fn().mockResolvedValue({ data: [] }),
    },
    notificationsApi: {
        getAll: jest.fn().mockResolvedValue({ data: [] }),
    }
}))

jest.mock('@/lib/firebase', () => ({
    signInWithGoogle: jest.fn(),
    auth: {
        currentUser: null,
        onAuthStateChanged: jest.fn(() => () => { }),
    }
}))

// Test Component
function TestComponent() {
    const { user, login, logout, isAuthenticated } = useAuth()
    return (
        <div>
            <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Guest'}</div>
            {user && <div data-testid="user-name">{user.name}</div>}
            <button onClick={() => login('test@example.com', 'password')}>Login</button>
            <button onClick={logout}>Logout</button>
        </div>
    )
}

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear()
        jest.clearAllMocks()
    })

    it('provides initial guest state', () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Guest')
    })

    it('restores session from localStorage', async () => {
        const user = { id: 1, name: 'Test User', email: 'test@example.com', role: 'client' }
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('token', 'fake-token')

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated')
            expect(screen.getByTestId('user-name')).toHaveTextContent('Test User')
        })
    })

    it('handles successful login', async () => {
        const user = { id: 1, name: 'Login User', email: 'login@example.com', role: 'client' }
            ; (authApi.login as jest.Mock).mockResolvedValue({
                data: { user, token: 'new-token' }
            })

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )

        await act(async () => {
            screen.getByText('Login').click()
        })

        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated')
            expect(screen.getByTestId('user-name')).toHaveTextContent('Login User')
            expect(localStorage.getItem('token')).toBe('new-token')
        })
    })

    it('handles logout', async () => {
        // Setup initial logged in state
        const user = { id: 1, name: 'Logout User', email: 'logout@example.com', role: 'client' }
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('token', 'fake-token')

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )

        // Wait for restore
        await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated'))

        // Perform logout
        await act(async () => {
            screen.getByText('Logout').click()
        })

        expect(screen.getByTestId('auth-status')).toHaveTextContent('Guest')
        expect(localStorage.getItem('token')).toBeNull()
        expect(localStorage.getItem('user')).toBeNull()
    })
})
