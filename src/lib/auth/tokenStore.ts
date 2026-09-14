const AUTH_TOKEN_COOKIE = 'ea_session'

export function persistAuthToken(token: string): void {
    // The BFF stores the bearer token in an HttpOnly cookie. Intentionally no-op.
    void token
}

export function clearAuthToken(): void {
    // Cookie clearing happens in POST /api/backend/auth/logout.
}

export function readAuthTokenFromBrowser(): string | null {
    return null
}

export function hasAuthTokenInBrowser(): boolean {
    // Browser JavaScript cannot inspect the HttpOnly session by design.
    return true
}

export function syncAuthTokenCookieFromStorage(): void {
    // Legacy browser tokens are not migrated; users reauthenticate into an HttpOnly session.
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
