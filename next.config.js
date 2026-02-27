/** @type {import('next').NextConfig} */
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
                            "script-src 'self'",
                            "style-src 'self' 'unsafe-inline'",
                            "img-src 'self' https://res.cloudinary.com data:",
                            "connect-src 'self' https://backend-production-6acc.up.railway.app",
                            'font-src \'self\' data:',
                            'frame-ancestors \'self\'',
                        ].join('; '),
                    },
                ],
            },
        ]
    },
}

module.exports = nextConfig
