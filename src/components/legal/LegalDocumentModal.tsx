'use client'

import { useEffect, useId } from 'react'
import { X } from 'lucide-react'

import {
    LEGAL_DOCUMENT_VERSION,
    PRIVACY_POLICY_CONTENT,
    TERMS_OF_USE_CONTENT,
    BROKER_ADHESION_CONTENT,
} from '@/lib/legalDocuments'

export type LegalDocumentKind = 'terms' | 'privacy' | 'broker_agreement'

interface LegalDocumentModalProps {
    kind: LegalDocumentKind
    open: boolean
    onClose: () => void
}

const DOCUMENTS: Record<LegalDocumentKind, { title: string; content: string }> = {
    terms: {
        title: 'Termos de Uso',
        content: TERMS_OF_USE_CONTENT,
    },
    privacy: {
        title: 'Política de Privacidade',
        content: PRIVACY_POLICY_CONTENT,
    },
    broker_agreement: {
        title: 'Termo de Adesão do Corretor',
        content: BROKER_ADHESION_CONTENT,
    },
}

export default function LegalDocumentModal({ kind, open, onClose }: LegalDocumentModalProps) {
    const titleId = useId()
    const legalDocument = DOCUMENTS[kind]

    useEffect(() => {
        if (!open) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose()
        }
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [onClose, open])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose()
            }}
        >
            <section
                aria-labelledby={titleId}
                aria-modal="true"
                className="flex max-h-[min(86vh,760px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                role="dialog"
            >
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
                    <div>
                        <h2 id={titleId} className="text-lg font-bold text-slate-950">
                            {legalDocument.title}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Versão: {LEGAL_DOCUMENT_VERSION}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar documento"
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <X className="h-5 w-5" aria-hidden />
                    </button>
                </header>
                <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                    <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                        {legalDocument.content}
                    </pre>
                </div>
            </section>
        </div>
    )
}
