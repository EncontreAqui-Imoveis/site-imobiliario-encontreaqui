import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { UserProvider } from '@/contexts/UserContext'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import ThemeBootstrap from '@/components/theme/ThemeBootstrap'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Encontre Aqui Imóveis | Imóveis no Brasil',
    description: 'Encontre casas, apartamentos e terrenos no Brasil. Compre ou alugue com segurança e sem burocracia.',
    keywords: 'imóveis, casas, apartamentos, terrenos, Brasil, venda, aluguel',
    icons: {
        icon: '/logo_circular.png',
        shortcut: '/logo_circular.png',
        apple: '/logo_circular.png',
    },
    openGraph: {
        title: 'Encontre Aqui Imóveis | Imóveis no Brasil',
        description: 'Encontre seu imóvel ideal no Brasil',
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
                <ThemeBootstrap />
                <UserProvider>
                    <FavoritesProvider>
                        <Header />
                        <main className="flex-1">
                            {children}
                        </main>
                        <Footer />
                    </FavoritesProvider>
                </UserProvider>
            </body>
        </html>
    )
}
