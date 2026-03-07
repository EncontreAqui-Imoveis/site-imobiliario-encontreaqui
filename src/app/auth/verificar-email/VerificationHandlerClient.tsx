'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, KeyRound, Smartphone } from 'lucide-react'

import { getStoreUrlClient } from '@/lib/appLinks'

export default function VerificationHandlerClient() {
    const searchParams = useSearchParams()
    const storeUrl = getStoreUrlClient()
    const hasLegacyParams =
        Boolean((searchParams.get('mode') || '').trim()) ||
        Boolean((searchParams.get('oobCode') || '').trim())

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 to-slate-100">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8 space-y-6">
                <div className="space-y-3 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {hasLegacyParams ? 'Link legado de verificacao' : 'Verificacao por codigo'}
                    </h1>
                    <p className="text-sm text-slate-600">
                        Agora a confirmacao de email e feita por codigo numerico. Volte ao app ou ao site e informe o codigo enviado para o seu email.
                    </p>
                </div>

                <div className="space-y-3">
                    <Link
                        href="/verificacao"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-3 transition-colors"
                    >
                        <KeyRound className="w-4 h-4" />
                        Informar codigo
                    </Link>

                    <a
                        href={storeUrl}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-3 transition-colors"
                    >
                        <Smartphone className="w-4 h-4" />
                        Abrir aplicativo
                    </a>
                </div>
            </div>
        </div>
    )
}
