'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'

export default function BrokerOnboardingPage() {
    const router = useRouter()
    const { session, loading } = useUser()

    useEffect(() => {
        if (!loading && !session) {
            router.replace('/auth/login?next=/onboarding/broker')
        }
    }, [loading, session, router])

    if (loading || !session) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p className="text-sm text-slate-600">Carregando seu perfil...</p>
            </div>
        )
    }

    const brokerStatus = session.broker?.status ?? 'pending_verification'

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-slate-50">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8 space-y-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Onboarding de Corretor
                    </h1>
                    <p className="text-sm text-slate-600">
                        Aqui vamos espelhar o fluxo do app mobile para validar seu CRECI e documentos.
                    </p>
                </div>

                <p className="text-sm text-slate-600">
                    Status atual do corretor:&nbsp;
                    <span className="font-semibold">
                        {brokerStatus === 'approved'
                            ? 'Aprovado'
                            : brokerStatus === 'rejected'
                                ? 'Rejeitado'
                                : 'Pendente de verificação'}
                    </span>
                </p>

                {/* Placeholder: formulários de CRECI e upload de documentos para alimentar `brokers` e `broker_documents`. */}
                <p className="text-sm text-slate-500">
                    Nesta tela vamos adicionar formulário de CRECI, seleção de imobiliária (quando aplicável) e upload
                    de frente/verso do CRECI e selfie, integrando diretamente com os endpoints de backend que alimentam
                    as tabelas <code>brokers</code> e <code>broker_documents</code>.
                </p>
            </div>
        </div>
    )
}

