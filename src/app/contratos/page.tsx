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
        <div className="max-w-6xl mx-auto px-4 py-24 space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900">
                    Meus contratos
                </h1>
                <p className="text-sm text-slate-600">
                    Acompanhe aqui os contratos em que você participa como cliente ou corretor.
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
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
    )
}
