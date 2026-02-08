const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6acc.up.railway.app'

interface ApiResponse<T> {
    data?: T
    error?: string
    message?: string
}

async function fetchApi<T>(
    endpoint: string,
    options?: RequestInit
): Promise<ApiResponse<T>> {
    try {
        const isFormData = options?.body instanceof FormData
        const headers: Record<string, string> = {
            ...options?.headers as Record<string, string>,
        }

        if (!isFormData) {
            headers['Content-Type'] = 'application/json'
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers,
            ...options,
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('❌ [API] Erro na requisição:', {
                status: response.status,
                endpoint,
                errorData
            })
            return { error: errorData.message || `HTTP error ${response.status}`, data: errorData }
        }

        // Handle empty responses (204 No Content or empty body)
        const text = await response.text()
        if (!text) {
            return { data: undefined as unknown as T }
        }
        try {
            const data = JSON.parse(text)
            return { data }
        } catch {
            return { data: undefined as unknown as T }
        }
    } catch (error) {
        console.error('API error:', error)
        return { error: 'Erro de conexão. Tente novamente.' }
    }
}

// Properties API
export const propertiesApi = {
    getAll: (params?: Record<string, string>) => {
        const queryString = params ? `?${new URLSearchParams(params)}` : ''
        return fetchApi<any[]>(`/properties${queryString}`)
    },

    getById: (id: number) =>
        fetchApi<any>(`/properties/${id}`),

    getFeatured: () =>
        fetchApi<any[]>('/properties?featured=true&limit=6'),

    getRecent: (limit = 8) =>
        fetchApi<any[]>(`/properties?status=approved&limit=${limit}&sort=created_at:desc`),

    search: (filters: Record<string, string>) => {
        const queryString = new URLSearchParams(filters).toString()
        return fetchApi<any[]>(`/properties/search?${queryString}`)
    },

    create: (data: any, token: string) => {
        const isFormData = data instanceof FormData
        return fetchApi<any>('/properties', {
            method: 'POST',
            body: isFormData ? data : JSON.stringify(data),
            headers: { Authorization: `Bearer ${token}` }
        })
    },

    getByOwner: (ownerId: number, token: string) =>
        fetchApi<any[]>('/properties/me', {
            headers: { Authorization: `Bearer ${token}` }
        }),

    update: (id: number, data: any, token: string) => {
        const isFormData = data instanceof FormData
        return fetchApi<any>(`/properties/${id}`, {
            method: 'PUT',
            body: isFormData ? data : JSON.stringify(data),
            headers: { Authorization: `Bearer ${token}` }
        })
    },
}

// Auth API
export const authApi = {
    login: (email: string, password: string) =>
        fetchApi<any>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    register: (userData: Record<string, any>) =>
        fetchApi<any>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        }),

    checkEmailStatus: (email: string) =>
        fetchApi<{ exists: boolean; hasFirebaseUid: boolean; hasPassword: boolean }>(`/auth/check-email?email=${encodeURIComponent(email.trim().toLowerCase())}`),

    requestPasswordReset: (email: string) =>
        fetchApi<void>('/auth/password-reset/request', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),

    googleAuth: (idToken: string, profileType?: 'client' | 'broker') =>
        fetchApi<any>('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ idToken, profileType }),
        }),

    updateProfile: (data: Record<string, any>) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (!token) return Promise.resolve({ error: 'Não autenticado' })
        return fetchApi<any>('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: { Authorization: `Bearer ${token}` },
        })
    },

    requestBrokerUpgrade: (data: { creci: string }) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (!token) return Promise.resolve({ error: 'Não autenticado' })
        return fetchApi<any>('/brokers/me/request-upgrade', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { Authorization: `Bearer ${token}` },
        })
    },

    uploadBrokerDocuments: (data: {
        creci: string
        creciFront: File
        creciBack: File
        selfie: File
    }) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (!token) return Promise.reject(new Error('Não autenticado'))

        const formData = new FormData()
        formData.append('creci', data.creci)
        formData.append('creciFront', data.creciFront)
        formData.append('creciBack', data.creciBack)
        formData.append('selfie', data.selfie)

        return fetchApi<any>('/brokers/me/verify-documents', {
            method: 'POST',
            body: formData,
            headers: { Authorization: `Bearer ${token}` },
        })
    },
}

// Favorites API
export const favoritesApi = {
    getAll: (token: string) =>
        fetchApi<any[]>('/users/favorites', {
            headers: { Authorization: `Bearer ${token}` },
        }),

    add: (propertyId: number, token: string) =>
        fetchApi<void>(`/users/favorites/${propertyId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        }),

    remove: (propertyId: number, token: string) =>
        fetchApi<void>(`/users/favorites/${propertyId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        }),
}

// Notifications API
export const notificationsApi = {
    getAll: (token: string) =>
        fetchApi<any[]>('/users/notifications', {
            headers: { Authorization: `Bearer ${token}` },
        }),

    markAsRead: (id: number, token: string) =>
        fetchApi<void>(`/users/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
        }),

    markAllAsRead: (token: string) =>
        fetchApi<void>('/users/notifications/read-all', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        }),
}

// Broker API
export const brokerApi = {
    getPerformanceReport: (token: string) =>
        fetchApi<any>('/brokers/me/performance', {
            headers: { Authorization: `Bearer ${token}` },
        }),

    getCommissions: (token: string) =>
        fetchApi<any>('/brokers/me/commissions', {
            headers: { Authorization: `Bearer ${token}` },
        }),
}
