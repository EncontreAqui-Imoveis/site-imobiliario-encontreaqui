import { requireAuth } from '@/lib/auth/guards'
import { getMyContracts } from '@/lib/api/contracts'
import { ContractList } from '@/components/contracts/ContractList'

export default async function MeusContratosPage() {
    await requireAuth()
    const contracts = await getMyContracts()

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
            <ContractList contracts={contracts} />
        </div>
    )
}

