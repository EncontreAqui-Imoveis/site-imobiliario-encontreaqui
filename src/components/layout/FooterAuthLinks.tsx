'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import LegalDocumentModal, { type LegalDocumentKind } from '@/components/legal/LegalDocumentModal'


const accountLinks = [
    { href: '/favoritos', label: 'Favoritos' },
    { href: '/meus-processos', label: 'Meus Processos' },
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

export function FooterLegalLinks() {
    const [activeDocument, setActiveDocument] = useState<LegalDocumentKind | null>(null)
    const buttonClassName = "inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm text-slate-500 transition-colors hover:bg-slate-800/80 hover:text-slate-200 cursor-pointer outline-none"

    return (
        <>
            <button
                type="button"
                className={buttonClassName}
                onClick={() => setActiveDocument('terms')}
            >
                Termos de Uso
            </button>
            <button
                type="button"
                className={buttonClassName}
                onClick={() => setActiveDocument('privacy')}
            >
                Privacidade
            </button>
            <LegalDocumentModal
                kind={activeDocument ?? 'terms'}
                open={activeDocument !== null}
                onClose={() => setActiveDocument(null)}
            />
        </>
    )
}

