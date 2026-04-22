'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import { resolveOperationalGateRoute } from '@/lib/auth/routeResolution'
import { checkCreci } from '@/lib/api/auth'
import { requestBrokerUpgrade, uploadBrokerDocuments } from '@/lib/api/broker'
import type { ApiError } from '@/lib/api/client'
import { validateDocumentFile } from '@/lib/sanitize'
import { BadgeCheck, Upload, Camera, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react'

type Step = 'creci' | 'documents' | 'waiting'

export default function BrokerOnboardingPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { session, loading, refresh } = useUser()

    const [step, setStep] = useState<Step>('creci')
    const [creci, setCreci] = useState('')
    const [creciFront, setCreciFront] = useState<File | null>(null)
    const [creciBack, setCreciBack] = useState<File | null>(null)
    const [selfie, setSelfie] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const creciFrontRef = useRef<HTMLInputElement>(null)
    const creciBackRef = useRef<HTMLInputElement>(null)
    const selfieRef = useRef<HTMLInputElement>(null)

    const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'upgrade'
    const brokerStatus = session?.broker?.status ?? session?.user?.broker_status ?? null
    const requiresDocuments = session?.requiresBrokerDocuments === true || brokerStatus === 'rejected'

    useEffect(() => {
        if (!loading && !session) {
            router.replace('/auth/login?next=/onboarding/broker')
            return
        }

        const gateRoute = resolveOperationalGateRoute(session)
        if (!loading && gateRoute && gateRoute !== '/onboarding/broker') {
            router.replace(gateRoute)
        }
    }, [loading, router, session])

    useEffect(() => {
        if (!session) return
        const resolvedCreci = session.broker?.creci ?? ''
        if (resolvedCreci) {
            setCreci(resolvedCreci)
        }

        if (brokerStatus === 'approved') {
            router.replace('/meus-imoveis')
            return
        }

        if (mode === 'signup') {
            if (requiresDocuments) {
                setStep('documents')
                return
            }
            if (brokerStatus === 'pending_verification') {
                setStep('waiting')
                return
            }
        }

        if (brokerStatus === 'pending_verification' && !requiresDocuments) {
            setStep('waiting')
            return
        }

        if (brokerStatus === 'rejected') {
            setStep('documents')
            return
        }

        setStep('creci')
    }, [brokerStatus, mode, requiresDocuments, router, session])

    const handleUpgradeRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!creci.trim()) {
            setError('Informe seu número CRECI.')
            return
        }
        setSubmitting(true)
        setError(null)
        try {
            const normalizedCreci = creci.trim().toUpperCase()
            const currentCreci = (session?.broker?.creci ?? '').trim().toUpperCase()
            if (normalizedCreci && normalizedCreci !== currentCreci) {
                const creciStatus = await checkCreci(normalizedCreci)
                if (creciStatus.exists) {
                    setError('Já existe um corretor com este CRECI.')
                    return
                }
            }
            await requestBrokerUpgrade({ creci: creci.trim() })
            await refresh()
            setStep('documents')
        } catch (err) {
            const apiErr = err as ApiError
            setError(apiErr?.message || 'Erro ao solicitar upgrade. Tente novamente.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDocumentsUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!creciFront || !creciBack || !selfie) {
            setError('Todos os 3 documentos são obrigatórios.')
            return
        }
        for (const [file, label] of [[creciFront, 'CRECI Frente'], [creciBack, 'CRECI Verso'], [selfie, 'Selfie']] as [File, string][]) {
            const validation = validateDocumentFile(file)
            if (!validation.valid) {
                setError(`${label}: ${validation.error}`)
                return
            }
        }
        setSubmitting(true)
        setError(null)
        try {
            await uploadBrokerDocuments({
                creciFront,
                creciBack,
                selfie,
            })
            await refresh()
            setStep('waiting')
        } catch (err) {
            const apiErr = err as ApiError
            setError(apiErr?.message || 'Erro ao enviar documentos.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading || !session) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p className="text-sm text-slate-600">Carregando seu perfil...</p>
            </div>
        )
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 to-slate-100">
            <div className="w-full max-w-lg space-y-6 rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/70">
                {brokerStatus && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${brokerStatus === 'approved'
                        ? 'bg-green-50 text-green-700'
                        : brokerStatus === 'rejected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                        {brokerStatus === 'approved' && <CheckCircle className="w-4 h-4" />}
                        {brokerStatus === 'rejected' && <AlertCircle className="w-4 h-4" />}
                        {brokerStatus === 'pending_verification' && <Clock className="w-4 h-4" />}
                        {brokerStatus === 'approved' ? 'Corretor aprovado' : brokerStatus === 'rejected' ? 'Documentação rejeitada — reenvie' : 'Pendente de verificação'}
                    </div>
                )}

                {step === 'creci' && (
                    <>
                        <div className="space-y-2 text-center">
                            <div className="w-14 h-14 mx-auto bg-primary-50 rounded-full flex items-center justify-center">
                                <BadgeCheck className="w-7 h-7 text-primary-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900">Quero ser corretor</h1>
                            <p className="text-sm text-slate-600">
                                Informe seu CRECI para iniciar o processo de verificação como corretor.
                            </p>
                            <p className="text-xs text-slate-500">
                                Atalho direto: <Link href="/cadastro/verificar-creci" className="font-medium text-primary-600 hover:text-primary-700">verificar CRECI</Link>
                            </p>
                        </div>

                        <form onSubmit={handleUpgradeRequest} className="space-y-5">
                            <div className="space-y-1.5">
                                <label htmlFor="creci" className="block text-sm font-medium text-slate-700">Número CRECI</label>
                                <input
                                    id="creci"
                                    type="text"
                                    required
                                    value={creci}
                                    onChange={(e) => setCreci(e.target.value.toUpperCase())}
                                    maxLength={25}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Ex: 12345-F"
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                            >
                                {submitting ? 'Solicitando...' : 'Solicitar upgrade para corretor'}
                            </button>
                        </form>
                    </>
                )}

                {step === 'documents' && (
                    <>
                        <div className="space-y-2 text-center">
                            <h1 className="text-2xl font-bold text-slate-900">Enviar documentos</h1>
                            <p className="text-sm text-slate-600">
                                Envie as fotos do seu CRECI, frente e verso, e uma selfie para validação.
                            </p>
                        </div>

                        <form onSubmit={handleDocumentsUpload} className="space-y-4">
                            <div
                                onClick={() => creciFrontRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
                            >
                                <CreditCard className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                                <p className="text-sm font-medium text-slate-700">{creciFront ? creciFront.name : 'CRECI — Frente'}</p>
                                <p className="text-xs text-slate-400 mt-1">Clique para selecionar</p>
                                <input
                                    ref={creciFrontRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => setCreciFront(e.target.files?.[0] || null)}
                                />
                            </div>

                            <div
                                onClick={() => creciBackRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
                            >
                                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                                <p className="text-sm font-medium text-slate-700">{creciBack ? creciBack.name : 'CRECI — Verso'}</p>
                                <p className="text-xs text-slate-400 mt-1">Clique para selecionar</p>
                                <input
                                    ref={creciBackRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => setCreciBack(e.target.files?.[0] || null)}
                                />
                            </div>

                            <div
                                onClick={() => selfieRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
                            >
                                <Camera className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                                <p className="text-sm font-medium text-slate-700">{selfie ? selfie.name : 'Selfie'}</p>
                                <p className="text-xs text-slate-400 mt-1">Clique para selecionar</p>
                                <input
                                    ref={selfieRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => setSelfie(e.target.files?.[0] || null)}
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting || !creciFront || !creciBack || !selfie}
                                className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                            >
                                {submitting ? 'Enviando...' : 'Enviar documentos'}
                            </button>
                        </form>
                    </>
                )}

                {step === 'waiting' && brokerStatus === 'pending_verification' && (
                    <div className="text-center space-y-4 py-6">
                        <div className="w-16 h-16 mx-auto bg-amber-50 rounded-full flex items-center justify-center">
                            <Clock className="w-8 h-8 text-amber-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Documentos enviados!</h1>
                        <p className="text-sm text-slate-600 max-w-sm mx-auto">
                            Seus documentos estão sendo analisados pela equipe. Você será notificado quando a verificação for concluída.
                        </p>
                        <Link
                            href="/imoveis"
                            className="inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-6 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                        >
                            Explorar imóveis
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
