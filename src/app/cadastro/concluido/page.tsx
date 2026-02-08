'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle, Home, User, AlertCircle } from 'lucide-react'
import { useRegistration } from '@/contexts/RegistrationContext'

function ConcluidoContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { clearDraft } = useRegistration()

    const docsPending = searchParams.get('docs') === 'pending'

    // Clear any remaining draft
    useEffect(() => {
        clearDraft()
    }, [clearDraft])

    return (
        <main className="min-h-screen gradient-hero flex items-center justify-center px-4 py-12">
            <div className="relative z-10 w-full max-w-md">
                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <Image
                            src="/logo.png"
                            alt="EncontreAqui"
                            width={80}
                            height={80}
                            className="h-20"
                            style={{ width: 'auto' }}
                        />
                    </div>

                    {/* Success Icon */}
                    <div className="text-center mb-6">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-12 h-12 text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Cadastro Concluído!
                        </h1>
                        <p className="text-white/70">
                            Sua conta foi criada com sucesso. Bem-vindo ao EncontreAqui Imóveis!
                        </p>
                    </div>

                    {/* Docs Pending Warning */}
                    {docsPending && (
                        <div className="mb-6 p-4 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-amber-200 text-sm font-medium">Documentos pendentes</p>
                                <p className="text-amber-200/70 text-xs mt-1">
                                    Lembre-se de enviar seus documentos para ativar completamente sua conta de corretor.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-4">
                        <Link
                            href="/"
                            className="w-full py-4 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl shadow-lg shadow-accent-500/25 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" />
                            Explorar Imóveis
                        </Link>

                        <Link
                            href="/perfil"
                            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <User className="w-4 h-4" />
                            Ver Meu Perfil
                        </Link>
                    </div>

                    {/* Welcome message */}
                    <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-white/60 text-sm text-center">
                            🏠 Comece a buscar seu novo lar ou anuncie seus imóveis agora mesmo!
                        </p>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default function ConcluidoPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center gradient-hero">
                <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ConcluidoContent />
        </Suspense>
    )
}
