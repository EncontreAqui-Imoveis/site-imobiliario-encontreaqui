const AUTH_TOKEN_COOKIE = 'ea_auth_token'
const AUTH_TOKEN_STORAGE_KEY = 'ea_auth_token'

function buildCookieValue(token: string): string {
    const encodedToken = encodeURIComponent(token)
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const secureFlag = isHttps ? '; Secure' : ''
    return `${AUTH_TOKEN_COOKIE}=${encodedToken}; Path=/; SameSite=Lax${secureFlag}`
}

export function persistAuthToken(token: string): void {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
    document.cookie = buildCookieValue(token)
}

export function clearAuthToken(): void {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    document.cookie = `${AUTH_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}

export function readAuthTokenFromBrowser(): string | null {
    if (typeof window === 'undefined') return null

    const fromStorage = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)?.trim()
    if (fromStorage) {
        return fromStorage
    }

    const cookieMatch = document.cookie
        .split(';')
        .map((entry) => entry.trim())
        .find((entry) => entry.startsWith(`${AUTH_TOKEN_COOKIE}=`))

    if (!cookieMatch) return null
    const [, value = ''] = cookieMatch.split('=')
    const decoded = decodeURIComponent(value).trim()
    return decoded || null
}

export function hasAuthTokenInBrowser(): boolean {
    return Boolean(readAuthTokenFromBrowser())
}

export function syncAuthTokenCookieFromStorage(): void {
    if (typeof window === 'undefined') return

    const fromStorage = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)?.trim()
    if (!fromStorage) return

    const cookieMatch = document.cookie
        .split(';')
        .map((entry) => entry.trim())
        .find((entry) => entry.startsWith(`${AUTH_TOKEN_COOKIE}=`))

    const cookieValue = cookieMatch ? decodeURIComponent(cookieMatch.split('=')[1] ?? '').trim() : ''
    if (cookieValue === fromStorage) return

    document.cookie = buildCookieValue(fromStorage)
}

export async function readAuthTokenFromServer(): Promise<string | null> {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    return cookieStore.get(AUTH_TOKEN_COOKIE)?.value?.trim() || null
}

export async function hasAuthTokenInServer(): Promise<boolean> {
    return Boolean(await readAuthTokenFromServer())
}

export { AUTH_TOKEN_COOKIE }
