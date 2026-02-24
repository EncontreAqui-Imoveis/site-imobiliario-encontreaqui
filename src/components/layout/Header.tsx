'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Menu, X, Home, Building2, Search, Smartphone } from 'lucide-react'
import { buildAppDeepLink, getStoreUrlClient } from '@/lib/appLinks'

const navLinks = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/imoveis', label: 'Imóveis', icon: Building2 },
]

export default function Header() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
    const [storeUrl, setStoreUrl] = useState('https://play.google.com/store')

    useEffect(() => {
        setSearchQuery(searchParams.get('search') || '')
    }, [searchParams])

    useEffect(() => {
        setStoreUrl(getStoreUrlClient())
    }, [])

    const isHomepage = pathname === '/'

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams(searchParams.toString())

        if (searchQuery.trim()) {
            params.set('search', searchQuery.trim())
        } else {
            params.delete('search')
        }

        const queryString = params.toString()
        router.push(queryString ? `/imoveis?${queryString}` : '/imoveis')
    }

    const headerBg = isHomepage && !isScrolled ? 'bg-transparent' : 'bg-white/95 backdrop-blur-md shadow-sm'
    const textColor = isHomepage && !isScrolled ? 'text-white' : 'text-gray-600'
    const logoFilter = isHomepage && !isScrolled ? 'brightness-0 invert' : ''
    const openInAppUrl = buildAppDeepLink()

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg} ${!isHomepage || isScrolled ? 'border-b border-gray-100' : ''}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
                        <Image
                            src="/logo1.svg"
                            alt="Encontre Aqui Imóveis"
                            width={160}
                            height={45}
                            className={`h-9 lg:h-11 w-auto transition-all ${logoFilter}`}
                            priority
                        />
                    </Link>

                    <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isHomepage && !isScrolled ? 'text-white/60' : 'text-gray-400'}`} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar..."
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-accent-500 ${isHomepage && !isScrolled
                                        ? 'bg-white/10 border-white/20 text-white placeholder-white/60 focus:bg-white/20'
                                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                                    }`}
                            />
                        </div>
                    </form>

                    <nav className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 ${textColor} hover:text-accent-500 font-medium rounded-lg hover:bg-white/10 transition-all duration-200`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
                        <a
                            href={openInAppUrl}
                            className={`px-4 py-2.5 ${textColor} hover:text-primary-500 font-medium rounded-lg transition-all flex items-center gap-2`}
                        >
                            <Smartphone className="w-4 h-4" />
                            Abrir no App
                        </a>
                        <a
                            href={storeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 transition-all duration-200"
                        >
                            Baixar App
                        </a>
                    </div>

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`lg:hidden p-2 ${textColor} hover:bg-white/10 rounded-lg transition-colors`}
                        aria-label="Menu"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {isMenuOpen && (
                    <div className="lg:hidden py-4 border-t border-gray-100 animate-fadeIn bg-white rounded-b-2xl shadow-lg">
                        <form onSubmit={handleSearch} className="px-4 mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar imóveis..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </form>

                        <nav className="flex flex-col gap-1">
                            {navLinks.map((link) => {
                                const Icon = link.icon
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all"
                                    >
                                        <Icon className="w-5 h-5" />
                                        {link.label}
                                    </Link>
                                )
                            })}

                            <div className="my-2 border-t border-gray-100" />

                            <a
                                href={openInAppUrl}
                                onClick={() => setIsMenuOpen(false)}
                                className="mx-4 px-4 py-3 border border-primary-200 text-primary-700 font-semibold text-center rounded-xl"
                            >
                                Abrir no App
                            </a>
                            <a
                                href={storeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setIsMenuOpen(false)}
                                className="mt-2 mx-4 px-4 py-3 bg-accent-500 text-primary-900 font-semibold text-center rounded-xl shadow-lg"
                            >
                                Baixar App
                            </a>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    )
}
