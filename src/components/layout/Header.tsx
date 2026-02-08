'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Menu, X, Home, Building2, Users, Phone, Heart, User, Search, LogOut, Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const navLinks = [
    { href: '/imoveis', label: 'Imóveis', icon: Building2 },
    { href: '/contato', label: 'Contato', icon: Phone },
    { href: '/meus-imoveis', label: 'Meus Imóveis', icon: User, requiresAuth: true },
]

export default function Header() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { isAuthenticated, user, favorites, logout, unreadNotifications } = useAuth()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

    // Sync search query with URL params
    useEffect(() => {
        setSearchQuery(searchParams.get('search') || '')
    }, [searchParams])

    // Check if we're on homepage for transparent header
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

        // Clone existing params
        const params = new URLSearchParams(searchParams.toString())

        if (searchQuery.trim()) {
            params.set('search', searchQuery.trim())
        } else {
            params.delete('search')
        }

        router.push(`/imoveis?${params.toString()}`)
    }

    const handleLogout = () => {
        logout()
        setIsMenuOpen(false)
        router.push('/')
    }

    // Dynamic header styles based on scroll and page
    const headerBg = isHomepage && !isScrolled
        ? 'bg-transparent'
        : 'bg-white/95 backdrop-blur-md shadow-sm'

    const textColor = isHomepage && !isScrolled
        ? 'text-white'
        : 'text-gray-600'

    const logoFilter = isHomepage && !isScrolled
        ? 'brightness-0 invert'
        : ''

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg} ${!isHomepage || isScrolled ? 'border-b border-gray-100' : ''}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    {/* Logo */}
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

                    {/* Desktop Search Bar */}
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

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {navLinks
                            .filter((link) => !link.requiresAuth || isAuthenticated)
                            .map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-4 py-2 ${textColor} hover:text-accent-500 font-medium rounded-lg hover:bg-white/10 transition-all duration-200`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
                        {/* Icons - Only show when authenticated */}
                        {isAuthenticated && (
                            <>
                                {/* Notifications */}
                                <Link
                                    href="/notificacoes"
                                    className={`relative p-2.5 ${textColor} hover:text-primary-500 rounded-lg transition-all`}
                                    title="Notificações"
                                >
                                    <Bell className="w-5 h-5" />
                                    {unreadNotifications > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                            {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                        </span>
                                    )}
                                    <span className="sr-only">Notificações</span>
                                </Link>
                                {/* Favorites */}
                                <Link
                                    href="/favoritos"
                                    className={`relative p-2.5 ${textColor} hover:text-red-500 rounded-lg transition-all`}
                                    title="Favoritos"
                                >
                                    <Heart className="w-5 h-5" />
                                    <span className="sr-only">Favoritos</span>
                                </Link>
                            </>
                        )}

                        {isAuthenticated ? (
                            <>
                                <Link
                                    href="/perfil"
                                    className={`px-4 py-2.5 ${textColor} hover:text-primary-500 font-medium rounded-lg transition-all flex items-center gap-2`}
                                >
                                    <User className="w-4 h-4" />
                                    {user?.name?.split(' ')[0] || 'Perfil'}
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className={`p-2.5 ${textColor} hover:text-red-500 rounded-lg transition-all`}
                                    title="Sair"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className={`px-4 py-2.5 ${textColor} hover:text-primary-500 font-medium rounded-lg transition-all`}
                            >
                                Entrar
                            </Link>
                        )}

                        <Link
                            href="/anuncie"
                            className="px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 transition-all duration-200"
                        >
                            Anuncie Grátis
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`lg:hidden p-2 ${textColor} hover:bg-white/10 rounded-lg transition-colors`}
                        aria-label="Menu"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden py-4 border-t border-gray-100 animate-fadeIn bg-white rounded-b-2xl shadow-lg">
                        {/* Mobile Search */}
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
                            {navLinks
                                .filter((link) => !link.requiresAuth || isAuthenticated)
                                .map((link) => {
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

                            {/* Favorites - Only show when authenticated */}
                            {isAuthenticated && (
                                <Link
                                    href="/favoritos"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <Heart className="w-5 h-5" />
                                    Favoritos
                                </Link>
                            )}

                            {isAuthenticated ? (
                                <>
                                    <Link
                                        href="/meus-imoveis"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all"
                                    >
                                        <Building2 className="w-5 h-5" />
                                        Meus Imóveis
                                    </Link>
                                    <Link
                                        href="/perfil"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all"
                                    >
                                        <User className="w-5 h-5" />
                                        Meu Perfil
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all w-full text-left"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Sair
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all"
                                >
                                    <User className="w-5 h-5" />
                                    Entrar
                                </Link>
                            )}

                            <Link
                                href="/anuncie"
                                onClick={() => setIsMenuOpen(false)}
                                className="mt-2 mx-4 px-4 py-3 bg-accent-500 text-primary-900 font-semibold text-center rounded-xl shadow-lg"
                            >
                                Anuncie Grátis
                            </Link>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    )
}
