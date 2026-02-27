import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth/guards'
import { getContractById } from '@/lib/api/contracts'
import { ContractDetailClient } from '@/components/contracts/ContractDetailClient'

export default async function ContractDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    await requireAuth()

    try {
        const { id } = await params
        const contract = await getContractById(id)

        return (
            <div className="max-w-6xl mx-auto px-4 py-24 space-y-6">
                <ContractDetailClient contract={contract} />
            </div>
        )
    } catch {
        notFound()
    }
}

