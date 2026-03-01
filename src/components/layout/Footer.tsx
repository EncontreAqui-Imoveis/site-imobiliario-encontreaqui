import Link from 'next/link'
import Image from 'next/image'
import { Download } from 'lucide-react'
import { APP_LINKS } from '@/lib/appLinks'

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
        <footer className="bg-primary-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
                    <div>
                        <Link href="/" className="inline-block mb-4">
                            <Image
                                src="/logo2.svg"
                                alt="Encontre Aqui Imóveis"
                                width={168}
                                height={80}
                                className="h-16 w-auto"
                                priority
                            />
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Vitrine oficial de imóveis. Para interações completas, utilize o aplicativo da imobiliária.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">Navegação</h3>
                        <ul className="space-y-2">
                            {footerLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-accent-400 transition-colors text-sm"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">Minha Conta</h3>
                        <ul className="space-y-2">
                            {accountLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-accent-400 transition-colors text-sm"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">Aplicativo</h3>
                        <div className="space-y-2">
                            <a
                                href={APP_LINKS.androidStore}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-full items-center justify-center gap-2 px-4 py-3 bg-accent-500 hover:bg-accent-600 text-primary-900 rounded-xl text-sm font-semibold transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Baixar no Android
                            </a>
                            <a
                                href={APP_LINKS.iosStore}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-full items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Baixar no iOS
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-primary-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-500">
                            © {currentYear} Encontre Aqui Imóveis. Todos os direitos reservados.
                        </p>
                        <div className="flex gap-6">
                            <Link href="/termos" className="text-sm text-gray-500 hover:text-gray-400 transition-colors">
                                Termos de Uso
                            </Link>
                            <Link href="/privacidade" className="text-sm text-gray-500 hover:text-gray-400 transition-colors">
                                Privacidade
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
