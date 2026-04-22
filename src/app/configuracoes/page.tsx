'use client'

import { useUser } from '@/contexts/UserContext'
import GuestAccessCard from '@/components/auth/GuestAccessCard'
import { Loader2, Settings } from 'lucide-react'

export default function ConfiguracoesPage() {
    const { session, loading } = useUser()

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 pt-24">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Settings className="w-5 h-5 text-slate-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-600">
                    O site agora utiliza apenas o modo claro. Novas opcoes de configuracao da conta serao disponibilizadas aqui.
                </p>
                {!session && (
                    <div className="mt-4">
                        <GuestAccessCard
                            icon={Settings}
                            title="Entre para acessar configuracoes da conta"
                            description="Visitantes podem navegar normalmente. Ao entrar, voce desbloqueia preferencias e dados da conta."
                        />
                    </div>
                )}
                </div>
        </div>
    )
}
