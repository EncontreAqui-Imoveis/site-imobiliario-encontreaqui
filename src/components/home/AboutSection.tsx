import { Building2, Shield, Clock, Award } from 'lucide-react'

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
                        Por que escolher o <span className="text-primary-500">Encontre Aqui</span>?
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

                {/* CTA */}
                <div className="mt-12 lg:mt-16 text-center">
                    <a
                        href="https://wa.me/5564993012696"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Fale conosco pelo WhatsApp
                    </a>
                </div>
            </div>
        </section>
    )
}
