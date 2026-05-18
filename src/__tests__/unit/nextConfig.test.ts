const nextConfig = require('../../../next.config.js')

describe('next config cloudinary policy', () => {
    it('keeps Cloudinary host consistent in image patterns and CSP', async () => {
        const remotePatterns = nextConfig.images.remotePatterns

        expect(remotePatterns).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    protocol: 'https',
                    hostname: 'res.cloudinary.com',
                }),
            ]),
        )

        expect(
            remotePatterns.some(
                (pattern: { hostname?: string }) => pattern.hostname === 'res.cloudinary.co',
            ),
        ).toBe(false)

        const headers = await nextConfig.headers()
        const csp = headers[0].headers.find(
            (header: { key: string }) => header.key === 'Content-Security-Policy',
        )

        expect(csp?.value).toContain('https://res.cloudinary.com')
        expect(csp?.value?.match(/https:\/\/res\.cloudinary\.co(?!m)/)).toBeNull()
    })
})
