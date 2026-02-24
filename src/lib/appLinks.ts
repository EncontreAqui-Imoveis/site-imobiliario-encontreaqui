const DEFAULT_ANDROID_STORE_URL = 'https://play.google.com/store'
const DEFAULT_IOS_STORE_URL = 'https://apps.apple.com'
const DEFAULT_DEEP_LINK_TEMPLATE = 'encontreaqui://imoveis/{id}'

export const APP_LINKS = {
    androidStore: process.env.NEXT_PUBLIC_ANDROID_STORE_URL || DEFAULT_ANDROID_STORE_URL,
    iosStore: process.env.NEXT_PUBLIC_IOS_STORE_URL || DEFAULT_IOS_STORE_URL,
    fallbackStore:
        process.env.NEXT_PUBLIC_APP_FALLBACK_URL ||
        process.env.NEXT_PUBLIC_ANDROID_STORE_URL ||
        DEFAULT_ANDROID_STORE_URL,
    deepLinkTemplate:
        process.env.NEXT_PUBLIC_APP_DEEP_LINK_TEMPLATE || DEFAULT_DEEP_LINK_TEMPLATE,
}

export function buildAppDeepLink(propertyId?: string | number): string {
    const template = APP_LINKS.deepLinkTemplate

    if (propertyId === undefined || propertyId === null || String(propertyId).trim() === '') {
        return template.replace('/{id}', '').replace('{id}', '').replace('/:id', '').replace(':id', '')
    }

    const encoded = encodeURIComponent(String(propertyId))

    if (template.includes('{id}')) {
        return template.replace('{id}', encoded)
    }

    if (template.includes(':id')) {
        return template.replace(':id', encoded)
    }

    return `${template.replace(/\/+$/, '')}/${encoded}`
}

export function getStoreUrlByUserAgent(userAgent?: string): string {
    const ua = String(userAgent || '').toLowerCase()
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod') || ua.includes('ios')) {
        return APP_LINKS.iosStore
    }
    return APP_LINKS.androidStore
}

export function getStoreUrlClient(): string {
    if (typeof window === 'undefined') {
        return APP_LINKS.fallbackStore
    }
    return getStoreUrlByUserAgent(window.navigator.userAgent)
}
