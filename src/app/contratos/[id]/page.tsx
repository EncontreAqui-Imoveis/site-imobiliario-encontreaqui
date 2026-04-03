'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { ContractDetailClient } from '@/components/contracts/ContractDetailClient'
import { useUser } from '@/contexts/UserContext'
import { resolveOperationalGateRoute } from '@/lib/auth/routeResolution'
import { getContractById } from '@/lib/api/contracts'
import type { ContractDetail } from '@/types/contract'

export default function ContractDetailPage() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const { session, loading: authLoading } = useUser()
    const [contract, setContract] = useState<ContractDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!authLoading && !session) {
            router.replace(`/auth/login?next=/contratos/${params.id}`)
            return
        }
        const gateRoute = resolveOperationalGateRoute(session)
        if (!authLoading && gateRoute) {
            router.replace(gateRoute)
        }
    }, [authLoading, params.id, router, session])

    useEffect(() => {
        if (!session || !params.id) return
        let cancelled = false

        async function loadContract() {
            setLoading(true)
            setError(null)
            setNotFound(false)
            try {
                const data = await getContractById(params.id)
                if (!cancelled) {
                    setContract(data)
                }
            } catch {
                if (!cancelled) {
                    setContract(null)
                    setNotFound(true)
                    setError('Contrato não encontrado ou indisponível.')
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        void loadContract()
        return () => {
            cancelled = true
        }
    }, [params.id, session])

    if (authLoading || !session) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-24 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            </div>
        )
    }

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-24 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            </div>
        )
    }

    if (notFound || !contract) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-24">
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error ?? 'Contrato não encontrado.'}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-24 space-y-6">
            <ContractDetailClient contract={contract} />
        </div>
    )
}
