const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6acc.up.railway.app'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiErrorPayload {
    message?: string
    code?: string
    [key: string]: unknown
}

export class ApiError extends Error {
    status: number

    payload?: ApiErrorPayload

    constructor(status: number, message: string, payload?: ApiErrorPayload) {
        super(message)
        this.status = status
        this.payload = payload
        this.name = 'ApiError'
    }
}

interface RequestOptions {
    method?: HttpMethod
    headers?: HeadersInit
    body?: unknown
    /**
     * Por padrão, todas as chamadas enviam cookies (`credentials: 'include'`)
     * para suportar sessão baseada em cookies HTTP-only.
     */
    includeCredentials?: boolean
    /**
     * Quando `true`, não tenta fazer `response.json()` automaticamente
     * (útil para downloads).
     */
    rawResponse?: boolean
    /**
     * Desabilita o lançamento automático de erro em status não-ok.
     */
    skipThrowOnError?: boolean
}

async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const {
        method = 'GET',
        headers,
        body,
        includeCredentials = true,
        rawResponse = false,
        skipThrowOnError = false,
    } = options

    const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`

    const init: RequestInit = {
        method,
        headers: {
            'Content-Type': body instanceof FormData ? undefined : 'application/json',
            ...(headers || {}),
        },
        credentials: includeCredentials ? 'include' : 'same-origin',
    }

    if (body !== undefined) {
        if (body instanceof FormData) {
            // Quando é FormData, deixamos o browser definir o boundary do multipart.
            delete (init.headers as Record<string, string | undefined>)['Content-Type']
            init.body = body
        } else {
            init.body = JSON.stringify(body)
        }
    }

    const response = await fetch(url, init)

    if (rawResponse) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response as any
    }

    const contentType = response.headers.get('Content-Type') || ''
    const isJson = contentType.includes('application/json')

    let data: unknown = undefined
    if (isJson) {
        try {
            data = await response.json()
        } catch {
            data = undefined
        }
    }

    if (!response.ok && !skipThrowOnError) {
        const payload = (data || {}) as ApiErrorPayload
        const message = payload.message || `Erro na API (${response.status})`
        throw new ApiError(response.status, message, payload)
    }

    return data as T
}

export const apiClient = {
    get: <T = unknown>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        request<T>(path, { ...options, method: 'GET' }),
    post: <T = unknown>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) =>
        request<T>(path, { ...options, method: 'POST', body }),
    put: <T = unknown>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) =>
        request<T>(path, { ...options, method: 'PUT', body }),
    patch: <T = unknown>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) =>
        request<T>(path, { ...options, method: 'PATCH', body }),
    delete: <T = unknown>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        request<T>(path, { ...options, method: 'DELETE' }),
}

export { API_BASE_URL }

