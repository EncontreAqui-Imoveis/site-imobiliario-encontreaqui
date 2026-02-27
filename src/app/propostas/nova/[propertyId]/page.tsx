import { notFound } from 'next/navigation'
import { fetchPropertyById } from '@/lib/propertiesApi'
import { ProposalWizard } from '@/components/proposals/ProposalWizard'

interface Props {
    params: {
        propertyId: string
    }
}

export default async function NovaPropostaPage({ params }: Props) {
    const property = await fetchPropertyById(params.propertyId)

    if (!property) {
        notFound()
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-24">
            <ProposalWizard property={property} />
        </div>
    )
}

