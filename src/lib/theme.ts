export const SITE_THEME_STORAGE_KEY = 'ea_site_theme'

export type SiteThemeMode = 'light' | 'dark'

function resolveDarkModeFromStorage(stored: string | null): boolean {
    return stored === 'dark'
}

export function getResolvedDarkMode(): boolean {
    if (typeof window === 'undefined') return false
    const stored = window.localStorage.getItem(SITE_THEME_STORAGE_KEY)
    return resolveDarkModeFromStorage(stored)
}

export function applyDarkMode(enabled: boolean): void {
    if (typeof window === 'undefined') return
    document.documentElement.classList.toggle('dark', enabled)
}

export function syncThemeFromStorage(): boolean {
    const dark = getResolvedDarkMode()
    applyDarkMode(dark)
    return dark
}

export function persistTheme(mode: SiteThemeMode): void {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SITE_THEME_STORAGE_KEY, mode)
    applyDarkMode(mode === 'dark')
}
