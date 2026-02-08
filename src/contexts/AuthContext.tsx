'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { authApi, favoritesApi, notificationsApi } from '@/lib/api'
import { signInWithGoogle } from '@/lib/firebase'

interface User {
    id: number
    name: string
    email: string
    phone?: string
    role: 'client' | 'broker'
    avatar?: string
    street?: string
    number?: string
    complement?: string
    bairro?: string
    city?: string
    state?: string
    cep?: string
    creci?: string
}

interface GoogleAuthResult {
    success: boolean
    requiresProfileChoice?: boolean
    pending?: { email: string; name: string }
    needsCompletion?: boolean
    requiresDocuments?: boolean
}

interface AuthContextType {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    favorites: number[]
    login: (email: string, password: string) => Promise<void>
    loginWithGoogle: (profileType?: 'client' | 'broker') => Promise<GoogleAuthResult>
    logout: () => void
    addFavorite: (propertyId: number) => void
    removeFavorite: (propertyId: number) => void
    isFavorite: (propertyId: number) => boolean
    toggleFavorite: (propertyId: number) => void
    unreadNotifications: number
    setSession: (user: User, token: string) => void
    refreshUnreadCount: () => void
    updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [favorites, setFavorites] = useState<number[]>([])
    const [unreadNotifications, setUnreadNotifications] = useState(0)

    // Check for existing session on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        const storedToken = localStorage.getItem('token')
        const storedFavorites = localStorage.getItem('favorites')

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser))
        }
        if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites))
        }
        setIsLoading(false)
    }, [])

    // Fetch unread notifications count
    const refreshUnreadCount = useCallback(async () => {
        const token = localStorage.getItem('token')
        if (!token) return
        try {
            const response = await notificationsApi.getAll(token)
            if (response.data) {
                const items = Array.isArray(response.data) ? response.data :
                    (response.data as any).data || (response.data as any).notifications || []
                const unread = items.filter((n: any) => !n.is_read).length
                setUnreadNotifications(unread)
            }
        } catch (err) {
            console.error('Error fetching notifications count:', err)
        }
    }, [])

    // Refresh unread count when user changes
    useEffect(() => {
        if (user) {
            refreshUnreadCount()
        } else {
            setUnreadNotifications(0)
        }
    }, [user, refreshUnreadCount])

    // Persist favorites to localStorage
    useEffect(() => {
        if (user) {
            localStorage.setItem('favorites', JSON.stringify(favorites))
        }
    }, [favorites, user])

    const login = async (email: string, password: string) => {
        setIsLoading(true)
        try {
            const response = await authApi.login(email, password)
            if (response.error) {
                throw new Error(typeof response.error === 'string' ? response.error : 'Erro ao fazer login')
            }

            const { user, token } = response.data

            setUser(user)
            localStorage.setItem('user', JSON.stringify(user))
            localStorage.setItem('token', token)

            // Load favorites from API
            try {
                const favResponse = await favoritesApi.getAll(token)
                if (favResponse.data) {
                    const favIds = favResponse.data.map((p: any) => p.id)
                    setFavorites(favIds)
                    localStorage.setItem('favorites', JSON.stringify(favIds))
                }
            } catch (err) {
                console.error('Error loading favorites:', err)
            }

        } finally {
            setIsLoading(false)
        }
    }

    const loginWithGoogle = async (profileType?: 'client' | 'broker'): Promise<GoogleAuthResult> => {
        setIsLoading(true)
        try {
            // Step 1: Sign in with Google and get Firebase ID token
            const idToken = await signInWithGoogle()

            // User closed the popup - not an error, just cancel silently
            if (!idToken) {
                return { success: false }
            }

            // Step 2: Send token to backend
            const response = await authApi.googleAuth(idToken, profileType)

            if (response.error) {
                throw new Error(typeof response.error === 'string' ? response.error : 'Erro ao fazer login com Google')
            }

            // Check if backend needs profile choice (new user without profileType)
            if (response.data?.requiresProfileChoice) {
                return {
                    success: false,
                    requiresProfileChoice: true,
                    pending: response.data.pending,
                }
            }

            // Success - user is authenticated
            const { user, token, needsCompletion, requiresDocuments } = response.data

            setUser(user)
            localStorage.setItem('user', JSON.stringify(user))
            localStorage.setItem('token', token)

            // Load favorites
            try {
                const favResponse = await favoritesApi.getAll(token)
                const favData = favResponse.data ?? favResponse
                if (Array.isArray(favData)) {
                    const favIds = favData.map((p: any) => p.id)
                    setFavorites(favIds)
                    localStorage.setItem('favorites', JSON.stringify(favIds))
                }
            } catch (err) {
                console.error('Error loading favorites:', err)
            }

            return {
                success: true,
                needsCompletion,
                requiresDocuments,
            }

        } catch (error: any) {
            console.error('Google login error:', error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const logout = () => {
        setUser(null)
        setFavorites([])
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        localStorage.removeItem('favorites')
    }

    const addFavorite = async (propertyId: number) => {
        const token = localStorage.getItem('token')
        if (!favorites.includes(propertyId)) {
            setFavorites(prev => [...prev, propertyId])
            if (token) {
                try {
                    await favoritesApi.add(propertyId, token)
                } catch (err) {
                    console.error('Error adding favorite:', err)
                    setFavorites(prev => prev.filter(id => id !== propertyId))
                }
            }
        }
    }

    const removeFavorite = async (propertyId: number) => {
        const token = localStorage.getItem('token')
        setFavorites(prev => prev.filter(id => id !== propertyId))
        if (token) {
            try {
                await favoritesApi.remove(propertyId, token)
            } catch (err) {
                console.error('Error removing favorite:', err)
                setFavorites(prev => [...prev, propertyId])
            }
        }
    }

    const isFavorite = (propertyId: number) => {
        return favorites.includes(propertyId)
    }

    const toggleFavorite = (propertyId: number) => {
        if (isFavorite(propertyId)) {
            removeFavorite(propertyId)
        } else {
            addFavorite(propertyId)
        }
    }

    const setSession = useCallback((newUser: User, token: string) => {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(newUser))
        setUser(newUser)
        refreshUnreadCount()
    }, [refreshUnreadCount])

    const updateProfile = async (data: Partial<User>) => {
        const token = localStorage.getItem('token')
        if (!token) return { success: false, error: 'Não autenticado' }

        try {
            // authApi.updateProfile gets token from localStorage internally
            const response = await authApi.updateProfile(data)

            if (response.error) {
                return { success: false, error: response.error }
            }

            const res = response as any
            if (res.data && res.data.user) {
                const updatedUser = res.data.user
                setUser(updatedUser)
                localStorage.setItem('user', JSON.stringify(updatedUser))
                return { success: true }
            }

            return { success: false, error: 'Resposta inválida do servidor' }
        } catch (err: any) {
            return { success: false, error: err.message || 'Erro ao atualizar perfil' }
        }
    }


    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                favorites,
                login,
                loginWithGoogle,
                logout,
                addFavorite,
                removeFavorite,
                isFavorite,
                toggleFavorite,
                unreadNotifications,
                refreshUnreadCount,
                setSession,
                updateProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
