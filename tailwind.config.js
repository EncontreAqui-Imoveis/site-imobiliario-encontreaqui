/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Encontre Aqui Imóveis - Brand Colors
                primary: {
                    50: '#e6f2f2',
                    100: '#cce5e5',
                    200: '#99cbcb',
                    300: '#66b0b1',
                    400: '#339697',
                    500: '#0d5051', // Main teal color
                    600: '#0b4647',
                    700: '#093b3c',
                    800: '#073031',
                    900: '#052526',
                },
                accent: {
                    50: '#fffaeb',
                    100: '#fff3c7',
                    200: '#ffeca3',
                    300: '#ffe57f',
                    400: '#ffdb5c',
                    500: '#ffca45', // Main gold color
                    600: '#e6b63e',
                    700: '#cc9f37',
                    800: '#b38930',
                    900: '#997329',
                },
                // Neutral grays
                gray: {
                    50: '#fafafa',
                    100: '#f5f5f5',
                    200: '#e5e5e5',
                    300: '#d4d4d4',
                    400: '#a3a3a3',
                    500: '#737373',
                    600: '#525252',
                    700: '#404040',
                    800: '#262626',
                    900: '#171717',
                },
            },
            fontFamily: {
                sans: ['var(--font-dm-sans)', 'DM Sans', 'system-ui', 'sans-serif'],
                display: ['var(--font-hk-grotesk)', 'HK Grotesk', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
}
