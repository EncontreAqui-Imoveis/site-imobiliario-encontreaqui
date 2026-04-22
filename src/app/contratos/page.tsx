'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { ContractList } from '@/components/contracts/ContractList'
import { getMyContracts } from '@/lib/api/contracts'
import type { ContractSummary } from '@/types/contract'
import { useUser } from '@/contexts/UserContext'
import { resolveOperationalGateRoute } from '@/lib/auth/routeResolution'
import { Loader2 } from 'lucide-react'

export default function MeusContratosPage() {
    const router = useRouter()
    const { session, loading: authLoading } = useUser()
    const [contracts, setContracts] = useState<ContractSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!authLoading && !session) {
            router.replace('/auth/login?next=/contratos')
            return
        }
        const gateRoute = resolveOperationalGateRoute(session)
        if (!authLoading && gateRoute) {
            router.replace(gateRoute)
        }
    }, [authLoading, router, session])

    useEffect(() => {
        if (!session) return
        let cancelled = false

        async function loadContracts() {
            setLoading(true)
            setError(null)
            try {
                const data = await getMyContracts()
                if (!cancelled) {
                    setContracts(data)
                }
            } catch {
                if (!cancelled) {
                    setError('Não foi possível carregar seus contratos.')
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        void loadContracts()
        return () => {
            cancelled = true
        }
    }, [session])

    if (authLoading || !session) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-24 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <div className="max-w-xl mx-auto px-4 py-20 sm:py-24">
            <div className="rounded-2xl border border-slate-200 bg-white/95 px-5 py-5 shadow-sm backdrop-blur-sm">
                <h1 className="text-xl font-bold tracking-tight text-slate-950">
                    Contratos
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                    Toque para abrir o detalhe.
                </p>
                <div className="mt-5">
                    {loading ? (
                        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-14 shadow-sm">
                            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    ) : (
                        <ContractList contracts={contracts} />
                    )}
                </div>
            </div>
        </div>
    )
}
