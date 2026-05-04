'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import { resolveOperationalGateRoute } from '@/lib/auth/routeResolution'
import { checkCreci } from '@/lib/api/auth'
import { requestBrokerUpgrade, uploadBrokerDocuments } from '@/lib/api/broker'
import { finalizeSignupDraft, submitSignupDraftDocuments } from '@/lib/api/signupDraft'
import type { ApiError } from '@/lib/api/client'
import { persistAuthToken } from '@/lib/auth/tokenStore'
import {
    clearSignupDraft,
    loadSignupDraft,
} from '@/lib/authSignupDraft'
import { validateDocumentFile } from '@/lib/sanitize'
import { BROKER_ADHESION_CONTENT, LEGAL_DOCUMENT_VERSION } from '@/lib/legalDocuments'
import { BadgeCheck, Upload, Camera, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react'

type Step = 'creci' | 'documents' | 'waiting'
type WaitingOutcome = 'send-later' | 'documents-sent' | 'pending-verification'

export default function BrokerOnboardingPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { session, loading, refresh } = useUser()
    const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'upgrade'
    const queryCreci = searchParams.get('creci')?.trim() ?? ''
    const isSignupMode = mode === 'signup'
    const signupDraft = loadSignupDraft()
    const hasSignupDraft = Boolean(signupDraft?.draftId && signupDraft?.draftToken)
    const signupDraftIdentity = isSignupMode && signupDraft?.draftId && signupDraft?.draftToken
        ? `${signupDraft.draftId}:${signupDraft.draftToken}`
        : ''
    const brokerStatus = session?.broker?.status ?? session?.user?.broker_status ?? null
    const resolvedCreci = session?.broker?.creci?.trim() ?? ''
    const signupDraftCreci = signupDraft?.data.creci.trim() ?? ''
    const effectiveSignupCreci = (signupDraftCreci || queryCreci).trim().toUpperCase()
    const requiresDocuments =
        mode === 'upgrade' && (session?.requiresBrokerDocuments === true || brokerStatus === 'rejected')

    const [step, setStep] = useState<Step>('creci')
    const [creci, setCreci] = useState('')
    const [creciFront, setCreciFront] = useState<File | null>(null)
    const [creciBack, setCreciBack] = useState<File | null>(null)
    const [selfie, setSelfie] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [finalizedSignup, setFinalizedSignup] = useState(false)
    const [waitingOutcome, setWaitingOutcome] = useState<WaitingOutcome | null>(null)
    const [documentSelectionValid, setDocumentSelectionValid] = useState(false)
    const [brokerAgreementAccepted, setBrokerAgreementAccepted] = useState(false)
    const [brokerAgreementScrolledToEnd, setBrokerAgreementScrolledToEnd] = useState(false)

    const getFinalizeErrorMessage = (error: unknown, fallback: string): string => {
        const apiError = error as ApiError
        const code = apiError?.payload?.code
        if (apiError?.status === 400 && code) {
            return `${String(code)}: ${apiError.payload?.error || apiError.message || fallback}`
        }
        return apiError instanceof Error ? apiError.message : fallback
    }

    const creciFrontRef = useRef<HTMLInputElement>(null)
    const creciBackRef = useRef<HTMLInputElement>(null)
    const selfieRef = useRef<HTMLInputElement>(null)
    const brokerAgreementRef = useRef<HTMLDivElement>(null)
    const activeDraftIdentityRef = useRef<string>('')
    const selectedDraftIdentityRef = useRef<string | null>(null)

    const clearSelectedDocuments = () => {
        setCreciFront(null)
        setCreciBack(null)
        setSelfie(null)
        selectedDraftIdentityRef.current = null
        setDocumentSelectionValid(false)
        setBrokerAgreementAccepted(false)
        setBrokerAgreementScrolledToEnd(false)

        if (creciFrontRef.current) {
            creciFrontRef.current.value = ''
        }
        if (creciBackRef.current) {
            creciBackRef.current.value = ''
        }
        if (selfieRef.current) {
            selfieRef.current.value = ''
        }
    }

    const markDraftDocumentSelection = () => {
        if (!signupDraftIdentity) {
            setDocumentSelectionValid(false)
            return
        }
        selectedDraftIdentityRef.current = signupDraftIdentity
        setDocumentSelectionValid(true)
    }

    const isBrokerAgreementReady = isSignupMode ? (brokerAgreementAccepted && brokerAgreementScrolledToEnd) : true

    const ensureBrokerAgreementAcceptance = () => {
        if (!isSignupMode) {
            return true
        }
        if (!brokerAgreementScrolledToEnd) {
            setError('Role até o fim do termo de adesão para habilitar o aceite.')
            return false
        }
        if (!brokerAgreementAccepted) {
            setError('É necessário aceitar o termo de adesão para continuar.')
            return false
        }
        return true
    }

    const handleBrokerAgreementScroll = () => {
        const container = brokerAgreementRef.current
        if (!container) return
        const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 4
        if (isAtBottom) {
            setBrokerAgreementScrolledToEnd(true)
        }
    }

    useEffect(() => {
        if (!isSignupMode) {
            activeDraftIdentityRef.current = ''
            clearSelectedDocuments()
            return
        }
        if (!signupDraftIdentity) {
            activeDraftIdentityRef.current = ''
            clearSelectedDocuments()
            return
        }
        if (activeDraftIdentityRef.current !== signupDraftIdentity) {
            clearSelectedDocuments()
        }
        activeDraftIdentityRef.current = signupDraftIdentity
    }, [isSignupMode, signupDraftIdentity, loading, hasSignupDraft])

    useEffect(() => {
        if (step !== 'documents') {
            setBrokerAgreementAccepted(false)
            setBrokerAgreementScrolledToEnd(false)
        }
    }, [step, isSignupMode])

    useEffect(() => {
        const container = brokerAgreementRef.current
        if (!container) return
        if (container.scrollHeight <= container.clientHeight + 4) {
            setBrokerAgreementScrolledToEnd(true)
        }
    }, [step])

    useEffect(() => {
        if (!loading && !isSignupMode && !session) {
            router.replace('/auth/login?next=/onboarding/broker')
            return
        }
        if (!loading && isSignupMode && !hasSignupDraft && !finalizedSignup) {
            router.replace('/auth/cadastro')
            return
        }
        if (!isSignupMode && session) {
            const gateRoute = resolveOperationalGateRoute(session)
            if (gateRoute && gateRoute !== '/onboarding/broker') {
                router.replace(gateRoute)
            }
        }
    }, [hasSignupDraft, isSignupMode, loading, router, session, finalizedSignup])

    useEffect(() => {
        if (isSignupMode && step === 'waiting' && waitingOutcome === 'send-later') {
            return
        }
        if (isSignupMode && step === 'creci' && effectiveSignupCreci) {
            setCreci(effectiveSignupCreci)
            setWaitingOutcome(null)
            return
        }
        if (isSignupMode && !effectiveSignupCreci && step !== 'creci') {
            setWaitingOutcome(null)
            setStep('creci')
            return
        }
        if (!session) return
        if (resolvedCreci) {
            setCreci(resolvedCreci)
        }

        if (brokerStatus === 'approved') {
            router.replace('/meus-imoveis')
            return
        }

        if (brokerStatus === 'pending_verification') {
            setWaitingOutcome('pending-verification')
            setStep('waiting')
            return
        }

        if (requiresDocuments) {
            setWaitingOutcome(null)
            setStep('documents')
            return
        }

        if (brokerStatus === 'rejected') {
            setWaitingOutcome(null)
            setStep('documents')
            return
        }

        setWaitingOutcome(null)
        setStep('creci')
    }, [brokerStatus, isSignupMode, mode, requiresDocuments, router, session, effectiveSignupCreci, resolvedCreci, step, waitingOutcome])

    const handleUpgradeRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        const trimmedCreci = creci.trim().toUpperCase()
        if (!trimmedCreci) {
            setError('Informe seu número CRECI.')
            return
        }
        setSubmitting(true)
        setError(null)
        try {
            if (isSignupMode) {
                const currentCreci = (effectiveSignupCreci || '').trim().toUpperCase()
                if (!currentCreci) {
                    setCreci(trimmedCreci)
                }
                const creciStatus = await checkCreci(trimmedCreci)
                if (creciStatus.exists) {
                    setError('Já existe um corretor com este CRECI.')
                    return
                }
                setCreci(trimmedCreci)
                setStep('documents')
                return
            }
            const currentCreci = (effectiveSignupCreci || (session?.broker?.creci ?? '')).trim().toUpperCase()
            if (trimmedCreci !== currentCreci) {
                const creciStatus = await checkCreci(trimmedCreci)
                if (creciStatus.exists) {
                    setError('Já existe um corretor com este CRECI.')
                    return
                }
            }
            await requestBrokerUpgrade({ creci: trimmedCreci })
            await refresh()
            setStep('documents')
        } catch (err) {
            const apiErr = err as ApiError
            setError(apiErr?.message || 'Erro ao solicitar upgrade. Tente novamente.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleSkipDocuments = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)
        if (isSignupMode && !ensureBrokerAgreementAcceptance()) {
            setSubmitting(false)
            return
        }
        try {
            if (isSignupMode) {
                const draftId = signupDraft?.draftId
                const draftToken = signupDraft?.draftToken
                if (!draftId || !draftToken) {
                    throw new Error('Rascunho de cadastro não encontrado.')
                }
                const finalized = await finalizeSignupDraft(
                    draftId,
                    draftToken,
                    'broker_send_later',
                    {
                        acceptedTerms: true,
                        acceptedPrivacyPolicy: true,
                        acceptedBrokerAgreement: true,
                        termsVersion: LEGAL_DOCUMENT_VERSION,
                        privacyPolicyVersion: LEGAL_DOCUMENT_VERSION,
                        brokerAgreementVersion: LEGAL_DOCUMENT_VERSION,
                    },
                )
                if (finalized.token) {
                    persistAuthToken(finalized.token)
                }
                setFinalizedSignup(true)
                setWaitingOutcome('send-later')
                setStep('waiting')
                await refresh()
                clearSignupDraft()
                clearSelectedDocuments()
                return
            }
            await refresh()
        } catch (err) {
            setFinalizedSignup(false)
            setError(getFinalizeErrorMessage(err, 'Não foi possível registrar a pendência documental.'))
        } finally {
            setSubmitting(false)
        }
    }

    const handleDocumentsUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isSignupMode && !ensureBrokerAgreementAcceptance()) {
            return
        }
        if (!signupDraftIdentity || selectedDraftIdentityRef.current !== signupDraftIdentity) {
            setError('Selecione os documentos novamente para este cadastro.')
            return
        }
        if (!documentSelectionValid) {
            setError('Selecione os documentos antes de enviar.')
            return
        }
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
            if (isSignupMode) {
                const draftId = signupDraft?.draftId
                const draftToken = signupDraft?.draftToken
                if (!draftId || !draftToken) {
                    throw new Error('Rascunho de cadastro não encontrado.')
                }
                await submitSignupDraftDocuments(draftId, draftToken, {
                    creciFront,
                    creciBack,
                    selfie,
                })
                const finalized = await finalizeSignupDraft(
                    draftId,
                    draftToken,
                    'broker_submit_documents',
                    {
                        acceptedTerms: true,
                        acceptedPrivacyPolicy: true,
                        acceptedBrokerAgreement: true,
                        termsVersion: LEGAL_DOCUMENT_VERSION,
                        privacyPolicyVersion: LEGAL_DOCUMENT_VERSION,
                        brokerAgreementVersion: LEGAL_DOCUMENT_VERSION,
                    },
                )
                if (finalized.token) {
                    persistAuthToken(finalized.token)
                }
                setFinalizedSignup(true)
                setWaitingOutcome('documents-sent')
                setStep('waiting')
                await refresh()
                clearSignupDraft()
                clearSelectedDocuments()
            } else {
                await uploadBrokerDocuments({
                    creciFront,
                    creciBack,
                    selfie,
                })
            }
            setStep('waiting')
            if (!isSignupMode) {
                await refresh()
            }
        } catch (err) {
            setFinalizedSignup(false)
            setError(getFinalizeErrorMessage(err, 'Erro ao enviar documentos.'))
        } finally {
            setSubmitting(false)
        }
    }

    if (loading || (!isSignupMode && !session)) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p className="text-sm text-slate-600">Carregando seu perfil...</p>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-3 pt-24 pb-10 sm:px-4 sm:pt-36 sm:pb-16 bg-gradient-to-b from-slate-50/95 to-slate-100/95">
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
                            {isSignupMode && effectiveSignupCreci ? (
                                <p className="text-xs text-slate-500">
                                    CRECI informado no cadastro: {effectiveSignupCreci}
                                </p>
                            ) : null}
                        </div>

                        <form onSubmit={handleDocumentsUpload} className="space-y-4">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                <h2 className="text-base font-semibold text-slate-900">Termo de adesão para corretor</h2>
                                <p className="text-xs text-slate-600">Versão: {LEGAL_DOCUMENT_VERSION}</p>
                                <div
                                    ref={brokerAgreementRef}
                                    onScroll={handleBrokerAgreementScroll}
                                    role="region"
                                    aria-label="Termo de adesão para corretores"
                                    data-testid="broker-agreement-content"
                                    className="h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700"
                                >
                                    <pre className="whitespace-pre-wrap">{BROKER_ADHESION_CONTENT}</pre>
                                </div>
                                {!brokerAgreementScrolledToEnd ? (
                                    <p className="text-xs text-amber-600">Role até o fim para habilitar o aceite.</p>
                                ) : null}
                                <label className="flex items-start gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={brokerAgreementAccepted}
                                        onChange={(event) => setBrokerAgreementAccepted(event.currentTarget.checked)}
                                        disabled={!brokerAgreementScrolledToEnd}
                                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span>
                                        Li e aceito integralmente o termo de adesão de corretor.
                                        <Link href="/termos-de-adesao-corretor" className="ml-1 text-primary-600 hover:text-primary-700">
                                            Ler termo completo
                                        </Link>
                                    </span>
                                </label>
                            </div>

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
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null
                                        setCreciFront(file)
                                        if (file) {
                                            markDraftDocumentSelection()
                                            return
                                        }
                                        setDocumentSelectionValid(false)
                                    }}
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
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null
                                        setCreciBack(file)
                                        if (file) {
                                            markDraftDocumentSelection()
                                            return
                                        }
                                        setDocumentSelectionValid(false)
                                    }}
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
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null
                                        setSelfie(file)
                                        if (file) {
                                            markDraftDocumentSelection()
                                            return
                                        }
                                        setDocumentSelectionValid(false)
                                    }}
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting || !isBrokerAgreementReady || !creciFront || !creciBack || !selfie || !documentSelectionValid}
                                className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                            >
                                {submitting ? 'Enviando...' : 'Enviar documentos'}
                            </button>
                            {isSignupMode ? (
                                <button
                                    type="button"
                                    onClick={handleSkipDocuments}
                                    disabled={submitting || !isBrokerAgreementReady}
                                    className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold px-4 py-2.5 hover:bg-slate-50 transition-colors disabled:opacity-60"
                                >
                                    Enviar depois
                                </button>
                            ) : null}
                        </form>
                    </>
                )}

                {step === 'waiting' && (
                    <div className="text-center space-y-4 py-6">
                        <div className="w-16 h-16 mx-auto bg-amber-50 rounded-full flex items-center justify-center">
                            <Clock className="w-8 h-8 text-amber-500" />
                        </div>
                        {waitingOutcome === 'send-later' ? (
                            <h1 className="text-2xl font-bold text-slate-900">Cadastro de corretor criado. Documentos pendentes.</h1>
                        ) : (
                            <h1 className="text-2xl font-bold text-slate-900">Documentos enviados / em análise.</h1>
                        )}
                        <p className="text-sm text-slate-600 max-w-sm mx-auto">
                            {waitingOutcome === 'send-later'
                                ? 'Envie seus documentos para iniciar a análise.'
                                : waitingOutcome === 'documents-sent' || waitingOutcome === 'pending-verification'
                                    ? 'Seus documentos foram enviados e serão analisados pela equipe. Você será notificado quando a verificação for concluída.'
                                    : 'Seu cadastro está em etapa de análise.'}
                        </p>
                        {waitingOutcome === 'send-later' ? (
                            <Link
                                href="/meus-imoveis"
                                className="inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-6 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                            >
                                Ir para Meus imóveis
                            </Link>
                        ) : (
                            <Link
                                href="/imoveis"
                                className="inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-6 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                            >
                                Explorar imóveis
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
