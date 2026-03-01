'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { UserSession } from '@/lib/api/auth'
import { fetchCurrentSession, logout as apiLogout } from '@/lib/api/auth'

interface UserContextValue {
    session: UserSession | null
    loading: boolean
    error: string | null
    isAuthenticated: boolean
    isBroker: boolean
    isProfileComplete: boolean
    refresh: () => Promise<void>
    logout: () => Promise<void>
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<UserSession | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadSession = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchCurrentSession()
            setSession(data)
        } catch (err) {
            console.error('Erro ao carregar sessão do usuário')
            setError('Não foi possível carregar sua sessão.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadSession()
    }, [loadSession])

    const handleLogout = useCallback(async () => {
        await apiLogout()
        setSession(null)
    }, [])

    const value: UserContextValue = {
        session,
        loading,
        error,
        isAuthenticated: !!session,
        isBroker: !!session?.isBroker && session?.broker?.status === 'approved',
        isProfileComplete: session?.profileStatus === 'complete',
        refresh: loadSession,
        logout: handleLogout,
    }

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
    const ctx = useContext(UserContext)
    if (!ctx) {
        throw new Error('useUser deve ser usado dentro de UserProvider')
    }
    return ctx
}
