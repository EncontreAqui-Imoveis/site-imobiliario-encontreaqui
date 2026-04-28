import { Metadata } from 'next'
import LegalDocumentPage from '@/components/legal/LegalDocumentPage'
import { LEGAL_DOCUMENT_VERSION, PRIVACY_POLICY_CONTENT } from '@/lib/legalDocuments'

export const metadata: Metadata = {
    title: 'Política de Privacidade | Encontre Aqui Imóveis',
    description: 'Política de Privacidade da plataforma Encontre Aqui Imóveis.',
}

export default function PrivacyPolicyPage() {
    return (
        <LegalDocumentPage
            title="Política de Privacidade"
            version={LEGAL_DOCUMENT_VERSION}
            content={PRIVACY_POLICY_CONTENT}
        />
    )
}
