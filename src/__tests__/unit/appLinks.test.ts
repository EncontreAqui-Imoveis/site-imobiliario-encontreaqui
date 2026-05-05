import { APP_LINKS, buildAppDeepLink, getStoreUrlByUserAgent } from '@/lib/appLinks'

describe('appLinks', () => {
    it('builds deep link with property id', () => {
        const link = buildAppDeepLink(123)
        expect(link).toContain('123')
    })

    it('returns generic deep link when id is missing', () => {
        const link = buildAppDeepLink()
        expect(link).not.toContain('{id}')
        expect(link).not.toContain('{slug}')
        expect(link.length).toBeGreaterThan(0)
    })

    it('resolves iOS store URL by user agent', () => {
        const iosUrl = getStoreUrlByUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
        expect(iosUrl).toBe(APP_LINKS.iosStore)
    })

    it('resolves Android/default store URL by user agent', () => {
        const androidUrl = getStoreUrlByUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel)')
        const fallbackUrl = getStoreUrlByUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
        expect(androidUrl).toBe(APP_LINKS.androidStore)
        expect(fallbackUrl).toBe(APP_LINKS.androidStore)
    })
})
