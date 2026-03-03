/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production'
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6acc.up.railway.app'

const nextConfig = {
    eslint: {
        // Keep lint available as a separate command, but don't block builds
        // until the legacy backlog is cleaned up.
        ignoreDuringBuilds: true,
    },
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
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(self)',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://apis.google.com https://www.gstatic.com`,
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "img-src 'self' https://res.cloudinary.com https://lh3.googleusercontent.com data: blob:",
                            `connect-src 'self' ${apiUrl} https://viacep.com.br https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com`,
                            "font-src 'self' data: https://fonts.gstatic.com",
                            "frame-src https://accounts.google.com https://*.firebaseapp.com",
                            "frame-ancestors 'self'",
                        ].join('; '),
                    },
                ],
            },
        ]
    },
}

module.exports = nextConfig
