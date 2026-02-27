'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'

export default function OnboardingPage() {
    const router = useRouter()
    const { session, loading } = useUser()

    useEffect(() => {
        if (!loading && !session) {
            router.replace('/auth/login?next=/onboarding')
        }
    }, [loading, session, router])

    if (loading || !session) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p className="text-sm text-slate-600">Carregando seu perfil...</p>
            </div>
        )
    }

    const isComplete = session.profileStatus === 'complete'

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-slate-50">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8 space-y-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">
                        {isComplete ? 'Perfil completo' : 'Complete seu perfil'}
                    </h1>
                    <p className="text-sm text-slate-600">
                        Suas informações de contato ajudam corretores e clientes a se comunicarem com segurança.
                    </p>
                </div>

                {/* Placeholder: aqui entra o formulário completo de endereço/contato, alinhado à tabela `users`. */}
                <p className="text-sm text-slate-500">
                    Nesta tela vamos espelhar o onboarding do app mobile, permitindo que você
                    complete telefone, endereço e demais dados obrigatórios antes de gerar propostas.
                </p>
            </div>
        </div>
    )
}

