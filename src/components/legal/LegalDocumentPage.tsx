import type { ReactNode } from 'react'

interface LegalDocumentPageProps {
    title: string
    version: string
    content: string
    children?: ReactNode
}

export default function LegalDocumentPage({ title, version, content, children }: LegalDocumentPageProps) {
    return (
        <main className="min-h-screen bg-slate-50 pt-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <h1 className="text-3xl font-bold text-slate-900 mb-3">{title}</h1>
                <p className="mb-6 text-sm text-slate-600">Versão: {version}</p>
                <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 text-slate-700">
                    <pre className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{content}</pre>
                    {children ? <div className="mt-6 border-t border-slate-100 pt-6">{children}</div> : null}
                </div>
            </div>
        </main>
    )
}
