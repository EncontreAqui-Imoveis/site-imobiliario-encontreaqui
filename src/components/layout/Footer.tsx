import Link from 'next/link'
import Image from 'next/image'
import { Download, Instagram, MessageCircle } from 'lucide-react'
import { APP_LINKS } from '@/lib/appLinks'

const INSTAGRAM_URL =
    'https://www.instagram.com/encontre.aquiimoveis?igsh=MXI2N3ZmZzY4a281eQ=='
/** Placeholder até haver número oficial da empresa */
const WHATSAPP_PLACEHOLDER_URL = 'https://wa.me/5511999999999'

const footerLinks = [
    { href: '/', label: 'Início' },
    { href: '/imoveis', label: 'Imóveis' },
    { href: '/anuncie', label: 'Anunciar imóvel' },
]

const accountLinks = [
    { href: '/favoritos', label: 'Favoritos' },
    { href: '/propostas', label: 'Propostas' },
    { href: '/contratos', label: 'Contratos' },
    { href: '/perfil', label: 'Meu perfil' },
]

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
                    <div>
                        <Link href="/" className="relative mb-4 inline-block h-48 w-[201px]">
                            <Image
                                src="/branding/7.svg"
                                alt="Encontre Aqui Imóveis"
                                fill
                                className="object-contain object-left"
                                sizes="201px"
                            />
                        </Link>
                        <p className="mb-8 text-sm leading-relaxed text-slate-400">
                            Vitrine oficial de imóveis. Para interações completas, utilize o aplicativo da imobiliária.
                        </p>
                        <div className="flex items-center gap-3">
                            <a
                                href={INSTAGRAM_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-500/60 hover:text-emerald-400 transition-colors"
                                aria-label="Instagram Encontre Aqui Imóveis"
                            >
                                <Instagram className="h-5 w-5" aria-hidden />
                            </a>
                            <a
                                href={WHATSAPP_PLACEHOLDER_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-500/60 hover:text-emerald-400 transition-colors"
                                aria-label="WhatsApp (número em atualização)"
                                title="Número da empresa em breve"
                            >
                                <MessageCircle className="h-5 w-5" aria-hidden />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-slate-100 font-semibold mb-4">Navegação</h3>
                        <ul className="space-y-2">
                            {footerLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-slate-400 hover:text-slate-200 transition-colors text-sm"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-slate-100 font-semibold mb-4">Minha Conta</h3>
                        <ul className="space-y-2">
                            {accountLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-slate-400 hover:text-slate-200 transition-colors text-sm"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-slate-100 font-semibold mb-4">Aplicativo</h3>
                        <div className="space-y-2">
                            <a
                                href={APP_LINKS.androidStore}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-accent-500/50 hover:bg-slate-800"
                            >
                                <Download className="h-4 w-4" />
                                Baixar no Android
                            </a>
                            <a
                                href={APP_LINKS.iosStore}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-accent-500/50 hover:bg-slate-800"
                            >
                                <Download className="h-4 w-4" />
                                Baixar no iOS
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-slate-500">
                            © {currentYear} Encontre Aqui Imóveis. Todos os direitos reservados.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                            <Link
                                href="/termos"
                                className="inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm text-slate-500 transition-colors hover:bg-slate-800/80 hover:text-slate-200"
                            >
                                Termos de Uso
                            </Link>
                            <Link
                                href="/privacidade"
                                className="inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm text-slate-500 transition-colors hover:bg-slate-800/80 hover:text-slate-200"
                            >
                                Privacidade
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
