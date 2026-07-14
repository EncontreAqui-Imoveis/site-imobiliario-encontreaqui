'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Property } from '@/types/property'

interface ProposalWizardProps {
    property: Property
}

export function ProposalWizard({ property }: ProposalWizardProps) {
    const router = useRouter()

    useEffect(() => {
        router.replace(`/propostas/nova?propertyId=${encodeURIComponent(property.id)}`)
    }, [property.id, router])

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-6 md:p-8 space-y-4">
            <p className="text-sm text-slate-600">
                Redirecionando para o fluxo novo de geração de propostas.
            </p>
        </div>
    )
}
