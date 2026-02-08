import { Building2, Users, Award, Target, Heart } from 'lucide-react'
import Link from 'next/link'

const stats = [
    { value: '150+', label: 'Imóveis Cadastrados' },
    { value: '50+', label: 'Corretores Parceiros' },
    { value: '1000+', label: 'Clientes Atendidos' },
    { value: '5+', label: 'Anos de Experiência' },
]

const values = [
    {
        icon: Heart,
        title: 'Compromisso',
        description: 'Trabalhamos com dedicação para encontrar o imóvel perfeito para cada cliente.',
    },
    {
        icon: Award,
        title: 'Qualidade',
        description: 'Todos os imóveis passam por uma curadoria criteriosa para garantir o melhor para você.',
    },
    {
        icon: Users,
        title: 'Transparência',
        description: 'Comunicação clara e honesta em todas as etapas do processo imobiliário.',
    },
    {
        icon: Target,
        title: 'Inovação',
        description: 'Utilizamos tecnologia de ponta para oferecer a melhor experiência de busca.',
    },
]

export default function AboutPage() {
    return (
        <div className="min-h-screen pt-16 lg:pt-20">
            {/* Hero */}
            <section className="gradient-hero py-20 lg:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                            Somos o <span className="text-accent-400">Encontre Aqui Imóveis</span>
                        </h1>
                        <p className="text-xl text-white/80 leading-relaxed">
                            Uma imobiliária comprometida com a missão de oferecer um serviço imobiliário
                            confiável e transparente em Rio Verde e região.
                        </p>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="text-center">
                                <div className="text-4xl sm:text-5xl font-bold text-accent-500 mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-gray-600">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission */}
            <section className="py-16 lg:py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">
                                Nossa Missão
                            </h2>
                            <p className="text-gray-600 text-lg leading-relaxed mb-6">
                                Facilitar a realização do sonho da casa própria, conectando pessoas a
                                imóveis de qualidade através de um serviço ágil, seguro e transparente.
                            </p>
                            <p className="text-gray-600 text-lg leading-relaxed mb-8">
                                Acreditamos que encontrar o imóvel ideal deve ser uma experiência
                                prazerosa e sem complicações. Por isso, investimos em tecnologia e
                                em uma equipe qualificada para atender você da melhor forma.
                            </p>
                            <Link
                                href="/contato"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg transition-all"
                            >
                                Entre em contato
                            </Link>
                        </div>
                        <div className="relative">
                            <div className="aspect-square rounded-2xl gradient-primary opacity-10 absolute inset-0" />
                            <div className="relative bg-white rounded-2xl shadow-xl p-8 lg:p-12">
                                <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-lg shadow-primary-500/25">
                                    <Building2 className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                    Por que nos escolher?
                                </h3>
                                <ul className="space-y-3 text-gray-600">
                                    <li className="flex items-center gap-3">
                                        <span className="w-2 h-2 bg-primary-500 rounded-full" />
                                        Atendimento personalizado
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="w-2 h-2 bg-primary-500 rounded-full" />
                                        Corretores certificados com CRECI
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="w-2 h-2 bg-primary-500 rounded-full" />
                                        Imóveis verificados e de qualidade
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="w-2 h-2 bg-primary-500 rounded-full" />
                                        Suporte durante todo o processo
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="w-2 h-2 bg-primary-500 rounded-full" />
                                        Tecnologia para facilitar sua busca
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-16 lg:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Nossos Valores
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Princípios que guiam cada decisão e interação com nossos clientes.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((value, idx) => {
                            const Icon = value.icon
                            return (
                                <div
                                    key={idx}
                                    className="bg-gray-50 rounded-2xl p-6 text-center hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-gray-100"
                                >
                                    <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
                                        <Icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {value.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        {value.description}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 lg:py-24 gradient-hero">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Pronto para encontrar seu imóvel?
                    </h2>
                    <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                        Nossa equipe está pronta para ajudar você a encontrar o imóvel dos seus sonhos.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            href="/imoveis"
                            className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            Ver imóveis
                        </Link>
                        <a
                            href="https://wa.me/5564993012696"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition-all"
                        >
                            Falar no WhatsApp
                        </a>
                    </div>
                </div>
            </section>
        </div>
    )
}
