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
        <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:to-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">
                        Por que escolher a <span className="text-primary-500">Encontre Aqui</span>?
                    </h2>
                    <p className="text-gray-600 dark:text-slate-300 text-lg">
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
                                className="group rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-300 hover:border-accent-200 hover:shadow-lg"
                            >
                                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/20 transition-all duration-300 group-hover:scale-110 group-hover:from-accent-500 group-hover:to-primary-600 group-hover:shadow-accent-500/25">
                                    <Icon className="h-7 w-7 text-white transition-transform duration-300 group-hover:scale-105" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-8 text-center lg:mt-10">
                    <Link
                        href="/imoveis"
                        className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-8 py-4 font-semibold text-primary-900 shadow-lg shadow-accent-500/25 transition-all duration-200 hover:bg-accent-600"
                    >
                        <Building2 className="w-5 h-5" />
                        Explorar imóveis
                    </Link>
                </div>
            </div>
        </section>
    )
}
