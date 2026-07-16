'use client'

import { useState } from 'react'

import LegalDocumentModal, { type LegalDocumentKind } from './LegalDocumentModal'

interface LegalDocumentLinksProps {
    className?: string
}

export default function LegalDocumentLinks({ className = '' }: LegalDocumentLinksProps) {
    const [activeDocument, setActiveDocument] = useState<LegalDocumentKind | null>(null)
    const buttonClassName = `font-semibold text-primary-600 underline decoration-primary-300 underline-offset-2 transition hover:text-primary-700 ${className}`

    return (
        <>
            <button
                type="button"
                className={buttonClassName}
                onClick={() => setActiveDocument('terms')}
            >
                Termos de Uso
            </button>{' '}
            e a{' '}
            <button
                type="button"
                className={buttonClassName}
                onClick={() => setActiveDocument('privacy')}
            >
                Política de Privacidade
            </button>
            <LegalDocumentModal
                kind={activeDocument ?? 'terms'}
                open={activeDocument !== null}
                onClose={() => setActiveDocument(null)}
            />
        </>
    )
}
