'use client'

import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'

const accountLinks = [
    { href: '/favoritos', label: 'Favoritos' },
    { href: '/documentos', label: 'Documentos' },
    { href: '/meus-imoveis', label: 'Meus Imóveis' },
    { href: '/perfil', label: 'Meu perfil' },
]

export function FooterConditionalNav() {
    const { isAuthenticated } = useUser()

    if (!isAuthenticated) return null

    return (
        <Link
            href="/anuncie"
            className="text-slate-400 transition-colors text-sm hover:text-slate-200"
        >
            Anunciar imóvel
        </Link>
    )
}

export function FooterAccountSection() {
    const { isAuthenticated } = useUser()

    if (!isAuthenticated) return null

    return (
        <div>
            <h3 className="text-slate-100 font-semibold mb-4">Minha Conta</h3>
            <ul className="space-y-2">
                {accountLinks.map((link) => (
                    <li key={link.href}>
                        <Link
                            href={link.href}
                            className="text-slate-400 transition-colors text-sm hover:text-slate-200"
                        >
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}
