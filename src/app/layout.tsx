import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Providers } from './providers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Encontre Aqui Imóveis | Imóveis em Rio Verde',
    description: 'Encontre casas, apartamentos e terrenos em Rio Verde, GO. Compre ou alugue com segurança e sem burocracia.',
    keywords: 'imóveis, casas, apartamentos, terrenos, Rio Verde, Goiás, venda, aluguel',
    icons: {
        icon: '/logo_circular.png',
        shortcut: '/logo_circular.png',
        apple: '/logo_circular.png',
    },
    openGraph: {
        title: 'Encontre Aqui Imóveis | Imóveis em Rio Verde',
        description: 'Encontre seu imóvel ideal em Rio Verde, GO',
        type: 'website',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR" data-scroll-behavior="smooth">
            <body className="min-h-screen flex flex-col">
                <Providers>
                    <Header />
                    <main className="flex-1">
                        {children}
                    </main>
                    <Footer />
                </Providers>
            </body>
        </html>
    )
}
