import Link from 'next/link'

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Privacidade</h1>
                <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 space-y-4 text-gray-700">
                    <p>
                        Este site funciona como vitrine de imóveis. Para ações completas de conta, proposta e negociação,
                        utilize o aplicativo oficial.
                    </p>
                    <p>
                        Coletamos dados mínimos de navegação para operação da plataforma e melhoria da experiência.
                    </p>
                    <p>
                        Para dúvidas sobre privacidade, consulte os termos ou entre em contato pelos canais oficiais da empresa.
                    </p>
                    <Link href="/termos" className="inline-flex text-primary-600 hover:text-primary-700 font-semibold">
                        Ver Termos de Uso
                    </Link>
                </div>
            </div>
        </div>
    )
}
