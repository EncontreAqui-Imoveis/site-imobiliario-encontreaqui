import { Metadata } from 'next'
import LegalDocumentPage from '@/components/legal/LegalDocumentPage'
import { LEGAL_DOCUMENT_VERSION, TERMS_OF_USE_CONTENT } from '@/lib/legalDocuments'

export const metadata: Metadata = {
    title: 'Termos de Uso | Encontre Aqui Imóveis',
    description: 'Termos de Uso da plataforma Encontre Aqui Imóveis.',
}

export default function TermsPage() {
    return (
        <LegalDocumentPage
            title="Termos de Uso"
            version={LEGAL_DOCUMENT_VERSION}
            content={TERMS_OF_USE_CONTENT}
        />
    )
}
