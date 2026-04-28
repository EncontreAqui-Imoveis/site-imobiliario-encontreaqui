import { Metadata } from 'next'
import LegalDocumentPage from '@/components/legal/LegalDocumentPage'
import { BROKER_ADHESION_CONTENT, LEGAL_DOCUMENT_VERSION } from '@/lib/legalDocuments'

export const metadata: Metadata = {
    title: 'Termo de Adesão de Corretor | Encontre Aqui Imóveis',
    description: 'Termo de adesão para corretores da plataforma Encontre Aqui Imóveis.',
}

export default function BrokerAdhesionTermsPage() {
    return (
        <LegalDocumentPage
            title="Termo de Adesão para Corretores"
            version={LEGAL_DOCUMENT_VERSION}
            content={BROKER_ADHESION_CONTENT}
        />
    )
}
