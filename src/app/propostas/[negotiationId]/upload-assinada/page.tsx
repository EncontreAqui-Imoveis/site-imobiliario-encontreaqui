'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { resolveOperationalGateRoute } from '@/lib/auth/routeResolution'
import { uploadSignedProposal } from '@/lib/api/negotiations'
import type { ApiError } from '@/lib/api/client'

export default function UploadPropostaAssinadaPage() {
    const router = useRouter()
    const params = useParams<{ negotiationId: string }>()
    const { session, loading: authLoading } = useUser()
    const negotiationId = params.negotiationId

    const [file, setFile] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (!authLoading && !session) {
            router.replace(`/auth/login?next=/meus-processos/propostas/${negotiationId}/upload-assinada`)
            return
        }
        const gateRoute = resolveOperationalGateRoute(session)
        if (!authLoading && gateRoute) {
            router.replace(gateRoute)
        }
    }, [authLoading, negotiationId, router, session])

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.files?.[0]
        if (!selected) return

        if (selected.type !== 'application/pdf') {
            setError('Envie apenas arquivos PDF.')
            setFile(null)
            return
        }

        setError(null)
        setFile(selected)
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!file || !negotiationId) return

        setSubmitting(true)
        setError(null)
        setSuccess(false)

        try {
            await uploadSignedProposal(negotiationId, file)
            setSuccess(true)
            window.setTimeout(() => {
                router.replace('/meus-processos/propostas?signed=1')
            }, 1200)
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr) {
                if (apiErr.status === 403) {
                    setError('Você não participa desta negociação.')
                } else if (apiErr.status === 404) {
                    setError('Negociação não encontrada.')
                } else if (apiErr.status === 400 || apiErr.status === 415) {
                    setError(apiErr.message || 'Arquivo inválido.')
                } else {
                    setError('Não foi possível enviar a proposta assinada.')
                }
            } else {
                setError('Não foi possível enviar a proposta assinada.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const goBackToHome = () => {
        router.push('/')
    }

    if (authLoading || !session) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p className="text-sm text-slate-600">Carregando...</p>
            </div>
        )
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-slate-50">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8 space-y-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Upload de proposta assinada
                    </h1>
                    <p className="text-sm text-slate-600">
                        Envie o PDF assinado desta proposta para que a negociação avance para a fase de documentação.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Arquivo PDF
                        </label>
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
                        />
                        <p className="text-xs text-slate-500">
                            Apenas arquivos PDF. Tamanho máximo conforme limite configurado no backend.
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                            {file?.name?.trim() ? file.name.trim() : 'Envie sua proposta assinada'}
                        </p>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                            {error}
                        </p>
                    )}
                    {success && (
                        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                            Proposta assinada enviada com sucesso! A administração será notificada para análise.
                        </p>
                    )}

                    <div className="flex justify-between items-center">
                        <button
                            type="button"
                            onClick={goBackToHome}
                            className="text-sm text-slate-600 hover:text-slate-800"
                        >
                            Voltar para a home
                        </button>
                        <button
                            type="submit"
                            disabled={!file || submitting}
                            className="inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                        >
                            {submitting ? 'Enviando...' : 'Enviar proposta assinada'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

