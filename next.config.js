/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production'
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6acc.up.railway.app'

const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.co',
                pathname: '/**',
            },
        ],
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin-allow-popups',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            // Next injeta scripts inline; em dev também pode exigir eval (HMR).
                            `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
                            // Google Fonts CSS (fonts.googleapis.com) é carregado como stylesheet externo.
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "img-src 'self' https://res.cloudinary.com data:",
                            `connect-src 'self' ${apiUrl}`,
                            // Google Fonts binários vêm de fonts.gstatic.com.
                            "font-src 'self' data: https://fonts.gstatic.com",
                            'frame-ancestors \'self\'',
                        ].join('; '),
                    },
                ],
            },
        ]
    },
}

module.exports = nextConfig
