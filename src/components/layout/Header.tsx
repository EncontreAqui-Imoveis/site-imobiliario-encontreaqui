'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
    Menu, X, Home, Building2, Search, Smartphone,
    User, LogOut, Heart, FileText, BarChart3,
    Settings, Bell, PlusCircle, ChevronDown
} from 'lucide-react'
import { getStoreUrlClient } from '@/lib/appLinks'
import { useUser } from '@/contexts/UserContext'
import { resolvePendingAction } from '@/lib/auth/routeResolution'

const navLinks = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/imoveis', label: 'Imóveis', icon: Building2 },
]

const authNavLinks = [
    { href: '/favoritos', label: 'Favoritos', icon: Heart },
    { href: '/propostas', label: 'Propostas', icon: FileText },
    { href: '/notificacoes', label: 'Notificações', icon: Bell },
]

const userMenuLinks = [
    { href: '/perfil', label: 'Meu Perfil', icon: User },
    { href: '/favoritos', label: 'Favoritos', icon: Heart },
    { href: '/propostas', label: 'Minhas Propostas', icon: FileText },
    { href: '/contratos', label: 'Contratos', icon: FileText },
    { href: '/notificacoes', label: 'Notificações', icon: Bell },
    { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

const brokerMenuLinks = [
    { href: '/meus-imoveis', label: 'Meus Imóveis', icon: Building2 },
    { href: '/anuncie', label: 'Anunciar Imóvel', icon: PlusCircle },
    { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
]

export default function Header() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { session, loading: authLoading, isAuthenticated, isBroker, logout } = useUser()

    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
    const [storeUrl, setStoreUrl] = useState('https://play.google.com/store')
    const userMenuRef = useRef<HTMLDivElement>(null)

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

    // Close user dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setIsUserMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Close mobile menu on route change
    useEffect(() => {
        setIsMenuOpen(false)
        setIsUserMenuOpen(false)
    }, [pathname])

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

    const handleLogout = async () => {
        setIsUserMenuOpen(false)
        setIsMenuOpen(false)
        await logout()
        router.push('/')
    }

    const headerBg =
        isHomepage && !isScrolled
            ? 'bg-primary-950/40 backdrop-blur-md shadow-sm shadow-black/20'
            : 'bg-white/95 backdrop-blur-md shadow-sm'
    const textColor =
        isHomepage && !isScrolled
            ? 'text-white drop-shadow-sm [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]'
            : 'text-gray-600'
    const logoFilter = isHomepage && !isScrolled ? 'brightness-0 invert' : ''
    const userName = session?.user?.name?.split(' ')[0] || 'Usuário'
    const userInitial = userName.charAt(0).toUpperCase()
    const pendingAction = resolvePendingAction(session)
    const resolvedAuthNavLinks = isBroker
        ? authNavLinks
        : authNavLinks.filter((link) => link.href !== '/propostas')
    const resolvedUserMenuLinks = isBroker
        ? userMenuLinks
        : userMenuLinks.filter((link) => link.href !== '/propostas')

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

                    {/* Desktop Search */}
                    <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isHomepage && !isScrolled ? 'text-white/60' : 'text-gray-400'}`} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                maxLength={120}
                                placeholder="Buscar imóveis..."
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-accent-500 ${isHomepage && !isScrolled
                                    ? 'bg-white/10 border-white/20 text-white placeholder-white/60 focus:bg-white/20'
                                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                                    }`}
                            />
                        </div>
                    </form>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 ${textColor} hover:text-accent-500 font-medium rounded-lg hover:bg-white/10 transition-all duration-200 ${pathname === link.href ? 'text-accent-500' : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {isBroker && (
                            <Link
                                href="/anuncie"
                                className={`px-4 py-2 ${textColor} hover:text-accent-500 font-medium rounded-lg hover:bg-white/10 transition-all duration-200 ${pathname === '/anuncie' ? 'text-accent-500' : ''}`}
                            >
                                Anuncie
                            </Link>
                        )}
                    </nav>

                    {/* Desktop Auth Section */}
                    <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                        {authLoading ? (
                            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                        ) : isAuthenticated ? (
                            <>
                                <Link
                                    href="/notificacoes"
                                    className={`p-2.5 rounded-xl transition-all ${isHomepage && !isScrolled
                                        ? 'text-white hover:bg-white/10'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-primary-600'
                                        } ${pathname === '/notificacoes' ? (isHomepage && !isScrolled ? 'ring-2 ring-white/40' : 'text-primary-600 bg-primary-50') : ''}`}
                                    aria-label="Notificações"
                                >
                                    <Bell className="w-5 h-5" />
                                </Link>
                            {/* Logged-in: Avatar + Dropdown */}
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${isHomepage && !isScrolled
                                        ? 'hover:bg-white/10 text-white'
                                        : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                    aria-label="Menu do usuário"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
                                        {userInitial}
                                    </div>
                                    <span className="font-medium text-sm max-w-[100px] truncate">{userName}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-fadeIn z-50">
                                        {/* User info */}
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="font-semibold text-gray-900 text-sm">{session?.user?.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                                            {isBroker && (
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-accent-100 text-accent-700 text-[10px] font-bold rounded-full uppercase">
                                                    Corretor
                                                </span>
                                            )}
                                        </div>

                                        {pendingAction && (
                                            <div className="px-4 py-3 border-b border-gray-100 bg-amber-50/70">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                                                    Pendência da conta
                                                </p>
                                                <p className="mt-1 text-xs text-amber-900">{pendingAction.description}</p>
                                                <Link
                                                    href={pendingAction.href}
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                    className="mt-2 inline-flex rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                                                >
                                                    {pendingAction.title}
                                                </Link>
                                            </div>
                                        )}

                                        {/* Nav links */}
                                        {resolvedUserMenuLinks.map((link) => {
                                            const Icon = link.icon
                                            return (
                                                <Link
                                                    key={link.href}
                                                    href={link.href}
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                                                >
                                                    <Icon className="w-4 h-4 text-gray-400" />
                                                    {link.label}
                                                </Link>
                                            )
                                        })}

                                        {/* Broker links */}
                                        {isBroker && (
                                            <>
                                                <div className="my-1 border-t border-gray-100" />
                                                {brokerMenuLinks.map((link) => {
                                                    const Icon = link.icon
                                                    return (
                                                        <Link
                                                            key={link.href}
                                                            href={link.href}
                                                            onClick={() => setIsUserMenuOpen(false)}
                                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                                                        >
                                                            <Icon className="w-4 h-4 text-gray-400" />
                                                            {link.label}
                                                        </Link>
                                                    )
                                                })}
                                            </>
                                        )}

                                        {/* Logout */}
                                        <div className="mt-1 border-t border-gray-100" />
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sair
                                        </button>
                                    </div>
                                )}
                            </div>
                            </>
                        ) : (
                            /* Not logged in: Login + Register buttons */
                            <>
                                <Link
                                    href="/auth/login"
                                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${isHomepage && !isScrolled
                                        ? 'text-white hover:bg-white/10 border border-white/30'
                                        : 'text-gray-700 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    Entrar
                                </Link>
                                <Link
                                    href="/auth/cadastro"
                                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-accent-500 hover:bg-accent-600 text-primary-900 transition-colors shadow-md"
                                >
                                    Cadastrar
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-0.5 lg:hidden">
                        {!authLoading && isAuthenticated && (
                            <Link
                                href="/notificacoes"
                                onClick={() => setIsMenuOpen(false)}
                                className={`p-2 rounded-lg transition-colors ${isHomepage && !isScrolled
                                    ? `${textColor} hover:bg-white/10`
                                    : 'text-gray-600 hover:bg-gray-100'
                                    } ${pathname === '/notificacoes' ? 'text-primary-600' : ''}`}
                                aria-label="Notificações"
                            >
                                <Bell className="w-6 h-6" />
                            </Link>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`p-2 ${textColor} hover:bg-white/10 rounded-lg transition-colors`}
                            aria-label="Menu"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* ===================== Mobile Menu ===================== */}
                {isMenuOpen && (
                    <div className="lg:hidden max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-y-contain border-t border-gray-100 animate-fadeIn bg-white rounded-b-2xl shadow-lg [touch-action:pan-y]">
                        <div className="py-4">
                        {/* Mobile Search */}
                        <form onSubmit={handleSearch} className="px-4 mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    maxLength={120}
                                    placeholder="Buscar imóveis..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </form>

                        {/* Main Nav */}
                        <nav className="flex flex-col gap-1">
                            {navLinks.map((link) => {
                                const Icon = link.icon
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${pathname === link.href
                                            ? 'text-primary-600 bg-primary-50 font-semibold'
                                            : 'text-gray-700 hover:text-primary-500 hover:bg-primary-50'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {link.label}
                                    </Link>
                                )
                            })}

                            {/* Auth-specific links */}
                            {isAuthenticated && (
                                <>
                                    <div className="my-2 border-t border-gray-100" />
                                    {resolvedAuthNavLinks.map((link) => {
                                        const Icon = link.icon
                                        return (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                onClick={() => setIsMenuOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${pathname === link.href
                                                    ? 'text-primary-600 bg-primary-50 font-semibold'
                                                    : 'text-gray-700 hover:text-primary-500 hover:bg-primary-50'
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                {link.label}
                                            </Link>
                                        )
                                    })}
                                    {isBroker && (
                                        <>
                                            <div className="my-2 border-t border-gray-100" />
                                            {brokerMenuLinks.map((link) => {
                                                const Icon = link.icon
                                                return (
                                                    <Link
                                                        key={link.href}
                                                        href={link.href}
                                                        onClick={() => setIsMenuOpen(false)}
                                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${pathname === link.href
                                                            ? 'text-primary-600 bg-primary-50 font-semibold'
                                                            : 'text-gray-700 hover:text-primary-500 hover:bg-primary-50'
                                                            }`}
                                                    >
                                                        <Icon className="w-5 h-5" />
                                                        {link.label}
                                                    </Link>
                                                )
                                            })}
                                        </>
                                    )}
                                </>
                            )}

                            <div className="my-2 border-t border-gray-100" />

                            {/* Auth buttons or Profile/Logout */}
                            {authLoading ? (
                                <div className="px-4 py-3">
                                    <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                                </div>
                            ) : isAuthenticated ? (
                                <>
                                    {pendingAction && (
                                        <div className="px-4">
                                            <Link
                                                href={pendingAction.href}
                                                onClick={() => setIsMenuOpen(false)}
                                                className="block rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 border border-amber-100"
                                            >
                                                <p className="font-semibold">{pendingAction.title}</p>
                                                <p className="mt-1 text-xs">{pendingAction.description}</p>
                                            </Link>
                                        </div>
                                    )}
                                    <Link
                                        href="/perfil"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
                                            {userInitial}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{userName}</p>
                                            <p className="text-xs text-gray-400">Ver perfil</p>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 mx-4 mt-1 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Sair
                                    </button>
                                </>
                            ) : (
                                <div className="px-4 flex flex-col gap-2">
                                    <Link
                                        href="/auth/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        Entrar
                                    </Link>
                                    <Link
                                        href="/auth/cadastro"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl shadow-md transition-colors"
                                    >
                                        Criar conta
                                    </Link>
                                </div>
                            )}

                            {/* App download - subtle */}
                            <div className="mt-2 px-4">
                                <a
                                    href={storeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-gray-400 hover:text-gray-600 text-xs font-medium rounded-xl transition-colors"
                                >
                                    <Smartphone className="w-3.5 h-3.5" />
                                    Baixar App
                                </a>
                            </div>
                        </nav>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}
