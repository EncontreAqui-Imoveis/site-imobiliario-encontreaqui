import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth/guards'
import { getContractById } from '@/lib/api/contracts'
import { ContractDetailClient } from '@/components/contracts/ContractDetailClient'

interface Props {
    params: {
        id: string
    }
}

export default async function ContractDetailPage({ params }: Props) {
    await requireAuth()

    try {
        const contract = await getContractById(params.id)

        return (
            <div className="max-w-6xl mx-auto px-4 py-24 space-y-6">
                <ContractDetailClient contract={contract} />
            </div>
        )
    } catch {
        notFound()
    }
}

