import { Building2, Shield, Clock, Award } from 'lucide-react'
import Link from 'next/link'

const features = [
    {
        icon: Building2,
        title: 'Imóveis Selecionados',
        description: 'Cada imóvel passa por uma curadoria criteriosa para garantir qualidade e transparência.',
    },
    {
        icon: Shield,
        title: 'Segurança Total',
        description: 'Todas as transações são acompanhadas por profissionais qualificados e documentação verificada.',
    },
    {
        icon: Clock,
        title: 'Atendimento Ágil',
        description: 'Resposta rápida às suas dúvidas e suporte durante todo o processo de compra ou aluguel.',
    },
    {
        icon: Award,
        title: 'Corretores Certificados',
        description: 'Profissionais com CRECI ativo e experiência comprovada no mercado imobiliário.',
    },
]

export default function AboutSection() {
    return (
        <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                        Por que escolher a <span className="text-primary-500">Encontre Aqui</span>?
                    </h2>
                    <p className="text-gray-600 text-lg">
                        Somos uma imobiliária comprometida com a missão de oferecer um serviço confiável
                        e transparente, proporcionando experiências únicas para nossos clientes.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-accent-200 transition-all duration-300 group"
                            >
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-5 shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform">
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-12 lg:mt-16 text-center">
                    <Link
                        href="/imoveis"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl shadow-lg shadow-accent-500/25 transition-all duration-200"
                    >
                        <Building2 className="w-5 h-5" />
                        Explorar imóveis
                    </Link>
                </div>
            </div>
        </section>
    )
}
