'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { clearSignupDraft, loadSignupDraft, resolveSignupDraftHref } from '@/lib/authSignupDraft'

export default function SignupDraftNotice() {
    const router = useRouter()
    const [hasDraft, setHasDraft] = useState(false)

    useEffect(() => {
        setHasDraft(loadSignupDraft() != null)
    }, [])

    if (!hasDraft) return null

    const handleContinue = () => {
        router.push(resolveSignupDraftHref(loadSignupDraft()))
    }

    const handleDiscard = () => {
        clearSignupDraft()
        setHasDraft(false)
    }

    return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <p className="font-semibold">Continuar cadastro</p>
            <p className="mt-1">
                Encontramos um cadastro em andamento. Você pode retomar de onde parou ou descartar esse rascunho.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={handleContinue}
                    className="inline-flex rounded-xl bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700"
                >
                    Continuar cadastro
                </button>
                <button
                    type="button"
                    onClick={handleDiscard}
                    className="inline-flex rounded-xl border border-amber-300 bg-white px-4 py-2 font-semibold text-amber-900 hover:bg-amber-100"
                >
                    Descartar cadastro
                </button>
            </div>
        </div>
    )
}
