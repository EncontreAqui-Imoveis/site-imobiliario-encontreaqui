'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Mail, Smartphone } from 'lucide-react'

import { loadSignupDraft, resolveSignupDraftHref, saveSignupDraft, type SignupDraft } from '@/lib/authSignupDraft'

export default function VerificarMetodoPage() {
    const router = useRouter()
    const [draft, setDraft] = useState<SignupDraft | null>(null)

    useEffect(() => {
        const d = loadSignupDraft()
        if (!d) {
            router.replace('/auth/cadastro')
            return
        }
        if (d.step === 'profile' || d.step === 'basic' || d.step === 'address') {
            router.replace('/auth/cadastro')
            return
        }
        if (d.step === 'documents') {
            router.replace(resolveSignupDraftHref(d))
            return
        }
        if (d.step === 'email' || d.step === 'phone') {
            const next: SignupDraft = {
                ...d,
                step: 'verify_method',
                updatedAt: new Date().toISOString(),
            }
            saveSignupDraft(next)
            setDraft(next)
            return
        }
        if (d.step === 'verify_method') {
            setDraft(d)
            return
        }
        router.replace('/auth/cadastro')
    }, [router])

    const goEmail = () => {
        if (!draft) return
        const next: SignupDraft = { ...draft, step: 'email', updatedAt: new Date().toISOString() }
        saveSignupDraft(next)
        router.push(resolveSignupDraftHref(next))
    }

    const goPhone = () => {
        if (!draft) return
        const next: SignupDraft = { ...draft, step: 'phone', updatedAt: new Date().toISOString() }
        saveSignupDraft(next)
        router.push(resolveSignupDraftHref(next))
    }

    if (!draft) {
        return (
            <div className="min-h-[40vh] flex items-center justify-center text-slate-600 text-sm">
                Carregando…
            </div>
        )
    }

    const fromGoogle = draft.source === 'google'

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 to-slate-100">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
                <h1 className="text-2xl font-bold text-slate-900 text-center">Verificação da conta</h1>
                <p className="text-sm text-slate-600 text-center">
                    {fromGoogle
                        ? 'Seu e-mail já foi validado pelo Google. Escolha como deseja receber o código de confirmação.'
                        : 'Escolha receber o código por e-mail ou por SMS no telefone informado.'}
                </p>
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={goEmail}
                        className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-4 text-left hover:bg-slate-50 transition"
                    >
                        <Mail className="h-6 w-6 text-amber-600 shrink-0" />
                        <div>
                            <div className="font-semibold text-slate-900">E-mail</div>
                            <div className="text-xs text-slate-600">Código de 6 dígitos no seu e-mail</div>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={goPhone}
                        className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-4 text-left hover:bg-slate-50 transition"
                    >
                        <Smartphone className="h-6 w-6 text-amber-600 shrink-0" />
                        <div>
                            <div className="font-semibold text-slate-900">Telefone (SMS)</div>
                            <div className="text-xs text-slate-600">Código por mensagem de texto</div>
                        </div>
                    </button>
                </div>
                <Link
                    href="/auth/cadastro"
                    className="flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar e revisar endereço
                </Link>
            </div>
        </div>
    )
}
