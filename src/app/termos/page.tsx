import { Metadata } from 'next'
import Link from 'next/link'
import { Home, ChevronRight, FileText, Shield, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Termos de Uso | Encontre Aqui Imóveis',
    description: 'Termos de uso e política de privacidade da plataforma Encontre Aqui Imóveis.',
}

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <Link href="/" className="hover:text-primary-500 transition-colors">
                            <Home className="w-4 h-4" />
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 font-medium">Termos de Uso</span>
                    </nav>

                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-lg">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Termos de Uso</h1>
                            <p className="text-gray-500">Última atualização: Fevereiro 2024</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 space-y-8">

                    {/* Intro */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary-500" />
                            1. Aceitação dos Termos
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Ao acessar e utilizar a plataforma Encontre Aqui Imóveis, você concorda com estes Termos de Uso
                            e nossa Política de Privacidade. Se você não concordar com qualquer parte destes termos,
                            não deverá utilizar nossos serviços.
                        </p>
                    </section>

                    <hr className="border-gray-100" />

                    {/* Services */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">2. Descrição dos Serviços</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            A plataforma Encontre Aqui Imóveis oferece:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                            <li>Listagem e busca de imóveis para venda e aluguel</li>
                            <li>Contato entre interessados e anunciantes</li>
                            <li>Ferramentas para corretores e proprietários anunciarem imóveis</li>
                            <li>Funcionalidades de favoritos e alertas</li>
                        </ul>
                    </section>

                    <hr className="border-gray-100" />

                    {/* User Responsibilities */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">3. Responsabilidades do Usuário</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Ao utilizar nossa plataforma, você se compromete a:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                            <li>Fornecer informações verdadeiras e atualizadas</li>
                            <li>Não publicar conteúdo ilegal, ofensivo ou fraudulento</li>
                            <li>Manter a segurança de sua conta e senha</li>
                            <li>Não utilizar a plataforma para fins ilegais</li>
                            <li>Respeitar os direitos de outros usuários</li>
                        </ul>
                    </section>

                    <hr className="border-gray-100" />

                    {/* Content */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">4. Conteúdo e Anúncios</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Os anúncios publicados são de responsabilidade exclusiva de seus autores.
                            A plataforma reserva-se o direito de:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                            <li>Aprovar ou rejeitar anúncios conforme nossas políticas</li>
                            <li>Remover conteúdo que viole estes termos</li>
                            <li>Suspender ou encerrar contas de usuários infratores</li>
                        </ul>
                    </section>

                    <hr className="border-gray-100" />

                    {/* Privacy */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">5. Privacidade e Dados</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Coletamos e utilizamos seus dados conforme nossa Política de Privacidade,
                            em conformidade com a Lei Geral de Proteção de Dados (LGPD).
                            Seus dados são utilizados para melhorar nossos serviços e nunca são
                            vendidos a terceiros.
                        </p>
                    </section>

                    <hr className="border-gray-100" />

                    {/* Limitation */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            6. Limitação de Responsabilidade
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            A plataforma atua como intermediária entre anunciantes e interessados.
                            Não nos responsabilizamos por negociações realizadas fora da plataforma,
                            veracidade das informações dos anúncios ou condutas de terceiros.
                        </p>
                    </section>

                    <hr className="border-gray-100" />

                    {/* Changes */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">7. Alterações nos Termos</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Podemos atualizar estes termos periodicamente. Alterações significativas
                            serão comunicadas por e-mail ou aviso na plataforma. O uso continuado
                            após alterações constitui aceitação dos novos termos.
                        </p>
                    </section>

                    <hr className="border-gray-100" />

                    {/* Contact */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">8. Contato</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Para dúvidas sobre estes termos, entre em contato conosco através da
                            página de <Link href="/contato" className="text-primary-600 hover:underline">Contato</Link> ou
                            pelo e-mail: <a href="mailto:contato@encontreaquiimoveis.com.br" className="text-primary-600 hover:underline">contato@encontreaquiimoveis.com.br</a>
                        </p>
                    </section>

                </div>
            </div>
        </div>
    )
}
