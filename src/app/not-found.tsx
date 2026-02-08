import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="text-center max-w-md mx-auto">
                <h1 className="text-9xl font-bold text-gray-200">404</h1>
                <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Página não encontrada</h2>
                <p className="text-gray-500 mb-8">
                    A página que você está procurando pode ter sido removida, renomeada ou não está disponível temporariamente.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Voltar para o início
                </Link>
            </div>
        </div>
    )
}
