'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Loader2, MousePointerClick, Smartphone } from 'lucide-react'
import { applyActionCode, checkActionCode } from 'firebase/auth'

import { getStoreUrlClient } from '@/lib/appLinks'
import { auth } from '@/lib/firebase'

type VerificationState = 'loading' | 'ready' | 'submitting' | 'success' | 'error'

function normalizeMode(rawMode: string | null) {
    return (rawMode || '').trim().toLowerCase()
}

function mapFirebaseActionError(message: string) {
    const lower = message.toLowerCase()

    if (lower.includes('invalid-action-code') || lower.includes('expired-action-code')) {
        return 'Esse link expirou ou ja foi usado. Solicite um novo email de verificacao.'
    }

    if (lower.includes('user-disabled')) {
        return 'Esta conta foi desativada. Entre em contato com o suporte.'
    }

    return 'Nao foi possivel verificar o email agora. Solicite um novo link.'
}

export default function VerificationHandlerClient() {
    const searchParams = useSearchParams()
    const [state, setState] = useState<VerificationState>('loading')
    const [message, setMessage] = useState('Validando seu link de verificacao...')
    const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null)

    const mode = normalizeMode(searchParams.get('mode'))
    const oobCode = (searchParams.get('oobCode') || '').trim()
    const continueUrl = (searchParams.get('continueUrl') || '').trim()
    const storeUrl = useMemo(() => getStoreUrlClient(), [])

    useEffect(() => {
        let active = true

        async function verifyEmail() {
            if (mode !== 'verifyemail' || !oobCode) {
                if (!active) return
                setState('error')
                setMessage('Link de verificacao invalido.')
                return
            }

            try {
                const info = await checkActionCode(auth, oobCode)
                if (!active) return

                const email =
                    typeof info.data.email === 'string' ? info.data.email : null
                setVerifiedEmail(email)
                setState('ready')
                setMessage('Link pronto para confirmacao. So confirme se foi voce quem solicitou.')
            } catch (error) {
                if (!active) return
                setState('error')
                setMessage(mapFirebaseActionError(String(error)))
            }
        }

        void verifyEmail()

        return () => {
            active = false
        }
    }, [mode, oobCode])

    async function handleConfirm() {
        if (state !== 'ready') return

        setState('submitting')
        try {
            await applyActionCode(auth, oobCode)
            setState('success')
            setMessage('E-mail verificado com sucesso! Você já pode fechar esta aba e retornar ao aplicativo no seu celular.')
        } catch (error) {
            setState('error')
            setMessage(mapFirebaseActionError(String(error)))
        }
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 to-slate-100">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8 space-y-6">
                <div className="space-y-3 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary-50 flex items-center justify-center">
                        {state === 'loading' || state === 'submitting' ? (
                            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                        ) : state === 'ready' ? (
                            <MousePointerClick className="w-8 h-8 text-primary-600" />
                        ) : state === 'success' ? (
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        ) : (
                            <AlertTriangle className="w-8 h-8 text-amber-600" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {state === 'success'
                            ? 'Email verificado'
                            : state === 'ready'
                                ? 'Confirmar email'
                                : 'Verificacao de email'}
                    </h1>
                    <p className="text-sm text-slate-600">{message}</p>
                    {verifiedEmail && (
                        <p className="text-xs font-medium text-slate-500">
                            Conta confirmada: {verifiedEmail}
                        </p>
                    )}
                </div>

                <div className="space-y-3">
                    {state === 'ready' && (
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-3 transition-colors"
                        >
                            Clique aqui para confirmar seu e-mail
                        </button>
                    )}
                    <a
                        href={storeUrl}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-3 transition-colors"
                    >
                        <Smartphone className="w-4 h-4" />
                        Abrir aplicativo
                    </a>

                    <Link
                        href={continueUrl || '/auth/login'}
                        className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-3 transition-colors"
                    >
                        Continuar no site
                    </Link>
                </div>
            </div>
        </div>
    )
}
