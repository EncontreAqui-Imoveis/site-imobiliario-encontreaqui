import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, MapPin, Instagram, Facebook } from 'lucide-react'

const footerLinks = {
    navigation: [
        { href: '/', label: 'Início' },
        { href: '/imoveis', label: 'Imóveis' },
        { href: '/sobre', label: 'Sobre Nós' },
        { href: '/contato', label: 'Contato' },
    ],
    properties: [
        { href: '/imoveis?type=Casa', label: 'Casas' },
        { href: '/imoveis?type=Apartamento', label: 'Apartamentos' },
        { href: '/imoveis?type=Terreno', label: 'Terrenos' },
        { href: '/imoveis?purpose=Aluguel', label: 'Aluguel' },
    ],
}

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-primary-900 text-gray-300">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Brand */}
                    <div className="lg:col-span-1">
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
                        <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            Sua imobiliária de confiança em Rio Verde. Encontre o imóvel dos seus sonhos com segurança e transparência.
                        </p>
                        <div className="flex gap-3">
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-primary-800 hover:bg-accent-500 hover:text-primary-900 rounded-lg flex items-center justify-center transition-colors"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-primary-800 hover:bg-accent-500 hover:text-primary-900 rounded-lg flex items-center justify-center transition-colors"
                                aria-label="Facebook"
                            >
                                <Facebook className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Navegação</h3>
                        <ul className="space-y-2">
                            {footerLinks.navigation.map((link) => (
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

                    {/* Properties */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Imóveis</h3>
                        <ul className="space-y-2">
                            {footerLinks.properties.map((link) => (
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

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Contato</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-accent-400 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-400">
                                    Rio Verde, GO
                                </span>
                            </li>
                            <li>
                                <a
                                    href="https://wa.me/5564993012696"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-gray-400 hover:text-accent-400 transition-colors"
                                >
                                    <Phone className="w-5 h-5 text-accent-400" />
                                    <span className="text-sm">(64) 99301-2696</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href="mailto:contato@encontreaquiimoveis.com"
                                    className="flex items-center gap-3 text-gray-400 hover:text-accent-400 transition-colors"
                                >
                                    <Mail className="w-5 h-5 text-accent-400" />
                                    <span className="text-sm">contato@encontreaquiimoveis.com</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
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
