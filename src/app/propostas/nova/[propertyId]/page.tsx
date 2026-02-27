import { notFound } from 'next/navigation'
import { fetchPropertyById } from '@/lib/propertiesApi'
import { ProposalWizard } from '@/components/proposals/ProposalWizard'

export default async function NovaPropostaPage({
    params,
}: {
    params: Promise<{ propertyId: string }>
}) {
    const { propertyId } = await params
    const property = await fetchPropertyById(propertyId)

    if (!property) {
        notFound()
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-24">
            <ProposalWizard property={property} />
        </div>
    )
}

