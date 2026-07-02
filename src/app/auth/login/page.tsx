'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    isGooglePendingAuthResult,
    checkEmail,
    requestPasswordReset,
    verifyPasswordResetCode,
    confirmPasswordReset,
} from '@/lib/api/auth'
import { loginWithEmailHybrid } from '@/lib/auth/hybridEmailLogin'
import { loginWithGooglePopup } from '@/lib/auth/googleFlow'
import { resolvePostAuthRoute } from '@/lib/auth/routeResolution'
import SignupDraftNotice from '@/components/auth/SignupDraftNotice'
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal'
import { useUser } from '@/contexts/UserContext'
import { createSignupDraft, saveSignupDraft } from '@/lib/authSignupDraft'
import type { ApiError } from '@/lib/api/client'
import { createSignupDraftRemote } from '@/lib/api/signupDraft'

type LoginProfile = 'client' | 'broker'

function normalizeProfile(rawProfile: unknown): LoginProfile | null {
    if (typeof rawProfile !== 'string') return null
    const value = rawProfile.trim().toLowerCase()
    if (value === 'client') return 'client'
    if (value === 'broker') return 'broker'
    return null
}

function getProfileMismatchError(apiErr: ApiError): string | null {
    const payload = apiErr.payload ?? {}
    const requestedProfile = normalizeProfile((payload as { requestedProfile?: unknown }).requestedProfile)
    const actualProfile = normalizeProfile(
        (payload as { role?: unknown }).role
        ?? (payload as { accountRole?: unknown }).accountRole
        ?? (payload as { requestedRole?: unknown }).requestedRole
        ?? (payload as { actualRole?: unknown }).actualRole,
    )
    if (!requestedProfile || !actualProfile || requestedProfile === actualProfile) return null
    if (requestedProfile === 'client' && actualProfile === 'broker') return 'Esta conta é de corretor. Selecione Corretor para entrar.'
    if (requestedProfile === 'broker' && actualProfile === 'client') return 'Esta conta é de cliente. Selecione Cliente para entrar.'
    return null
}

function isGooglePopupClosedError(err: unknown): boolean {
    const code = (err as { code?: unknown }).code
    const message = (err as { message?: unknown }).message
    return (
        code === 'auth/popup-closed-by-user'
        || code === 'auth/cancelled-popup-request'
        || String(message).toLowerCase().includes('popup-closed-by-user')
    )
}

/* ─────────────────────────────────────────────────────────────
   ÍCONES INLINE (SVG) — sem dependência extra
───────────────────────────────────────────────────────────── */
const IconMail = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
)

const IconLock = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
)

const IconArrow = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
)

const IconBack = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
)

const GoogleLogo = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
)

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { refresh, session, loading } = useUser()

    useEffect(() => {
        if (!loading && session) router.replace(resolvePostAuthRoute(session, '/meus-imoveis'))
    }, [loading, router, session])

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)

    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)

    const next = searchParams.get('next') || '/meus-imoveis'
    const isLoading = submitting || googleLoading

    const handleRequestCode = async (targetEmail: string) => {
        try {
            const status = await checkEmail(targetEmail)
            if (status.exists && status.hasFirebaseUid && !status.hasPassword) {
                throw new Error('Esta conta usa apenas Google e não possui senha local.')
            }
            await requestPasswordReset(targetEmail)
        } catch (err) {
            const apiErr = err as ApiError
            if (apiErr && 'status' in apiErr) {
                if (apiErr.status === 429) {
                    throw new Error('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
                }
                throw new Error(apiErr.message || 'Não foi possível enviar o código.')
            }
            throw err
        }
    }

    const handleVerifyCode = async (targetEmail: string, verificationCode: string) => {
        try {
            const result = await verifyPasswordResetCode(targetEmail, verificationCode)
            return result.reset_session_token
        } catch (err) {
            const apiErr = err as ApiError
            if (apiErr && 'status' in apiErr) {
                if (apiErr.status === 410) {
                    throw new Error('Código expirado. Solicite um novo.')
                }
                if (apiErr.status === 423) {
                    throw new Error('Você atingiu o limite de tentativas. Solicite um novo código.')
                }
                throw new Error(apiErr.message || 'Código inválido.')
            }
            throw err
        }
    }

    const handleConfirmReset = async (targetEmail: string, token: string, pass: string) => {
        try {
            await confirmPasswordReset(targetEmail, token, pass)
        } catch (err) {
            const apiErr = err as ApiError
            if (apiErr && 'status' in apiErr) {
                throw new Error(apiErr.message || 'Não foi possível redefinir a senha.')
            }
            throw err
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)
        try {
            const s = await loginWithEmailHybrid({ email, password })
            await refresh()
            router.push(resolvePostAuthRoute(s, next))
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr) {
                if (apiErr.status === 401) setError(getProfileMismatchError(apiErr) ?? 'Credenciais inválidas. Verifique seu e-mail e senha.')
                else setError(apiErr.message || 'Não foi possível entrar. Tente novamente.')
            } else {
                setError('Não foi possível entrar. Tente novamente.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleGoogleLogin = async () => {
        setGoogleLoading(true)
        setError(null)
        try {
            const result = await loginWithGooglePopup()
            if (isGooglePendingAuthResult(result)) {
                const requestedProfile = result.requestedProfile
                const draftProfile = requestedProfile === 'client' || requestedProfile === 'broker' ? requestedProfile : null
                let draft = createSignupDraft({
                    source: 'google',
                    userType: draftProfile,
                    step: draftProfile ? 'basic' : 'profile',
                    emailVerified: true,
                    data: { email: result.pending.email, name: result.pending.name, googleIdToken: result.pending.googleIdToken, googleUid: result.pending.googleUid, state: 'GO' },
                })
                if (draftProfile) {
                    const created = await createSignupDraftRemote({ source: draft.source, email: draft.data.email, name: draft.data.name, userType: draftProfile, googleUid: draft.data.googleUid, authProvider: 'google' })
                    draft = createSignupDraft({ ...draft, draftId: created.draftId, draftToken: created.draftToken, data: { ...draft.data, state: created.draft?.state || draft.data.state, cep: created.draft?.cep || draft.data.cep } })
                }
                saveSignupDraft(draft)
                router.push('/auth/cadastro')
                return
            }
            await refresh()
            router.push(resolvePostAuthRoute(result, next))
        } catch (err) {
            if (isGooglePopupClosedError(err)) return
            const apiErr = err as ApiError
            if ('status' in apiErr && apiErr.status === 401) setError('Não foi possível autenticar com Google. Tente novamente.')
            else setError('Erro ao conectar com o Google. Tente novamente.')
        } finally {
            setGoogleLoading(false)
        }
    }

    return (
        <div className="flex w-full overflow-hidden" style={{ fontFamily: 'var(--font-dm-sans)', zoom: '1.1', height: 'calc(100vh / 1.1)' }}>

            {/* ── Botão voltar — fixo no canto superior esquerdo com fundo branco e seta preta ── */}
            <Link
                href="/"
                aria-label="Voltar para a página inicial"
                className="fixed left-5 top-5 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-all hover:scale-105 hover:bg-gray-50 text-gray-800"
            >
                <IconBack />
            </Link>

            {/* ══════════════════════════════════════════════════
                PAINEL ESQUERDO — Imagem com Headline e gradiente
            ══════════════════════════════════════════════════ */}
            <aside
                className="hidden lg:flex w-[42%] xl:w-[40%] shrink-0 flex-col justify-end h-full pt-16 pb-28 px-10 xl:px-14 xl:pt-24 xl:pb-36 text-left relative overflow-hidden"
                style={{
                    backgroundImage: "url('/background-telalogin.webp')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 30%',
                    minHeight: '100vh',
                }}
            >
                {/* Overlay escuro de gradiente (preto no rodapé) para máximo contraste */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-0" />

                {/* Headline e subtítulo no canto inferior esquerdo */}
                <div className="relative z-10 text-left space-y-3 w-full">
                    <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-white leading-tight">
                        Bem-vindo de volta.
                    </h1>
                    <p className="text-sm xl:text-base leading-relaxed text-white/90 font-normal max-w-[460px]">
                        Acesse sua conta para continuar gerenciando seus imóveis, acompanhando leads e fechando os melhores negócios.
                    </p>
                </div>
            </aside>

            {/* ══════════════════════════════════════════════════
                PAINEL DIREITO — Formulário alinhado à esquerda
            ══════════════════════════════════════════════════ */}
            <main
                className="flex flex-1 items-center justify-center xl:justify-start overflow-y-auto xl:overflow-y-hidden bg-white px-4 py-5 sm:p-6 xl:pl-20 xl:pr-12"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {/*
                  * max-w-2xl ≈ 672px — cobre bem o espaço horizontal
                  * w-full garante responsividade em telas menores
                  */}
                <div className="w-full max-w-[90%] sm:max-w-[580px] md:max-w-[620px] lg:max-w-[700px] xl:max-w-[800px] py-6">

                    {/* Logo da Marca (sem container/borda branca, alinhado à esquerda) */}
                    <div className="flex justify-start mb-6">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/logo1.svg"
                            alt="EncontreAqui Imóveis"
                            className="h-10 xl:h-11 w-auto"
                            onError={(e) => {
                                const t = e.target as HTMLImageElement
                                t.src = '/logo_circular.png'
                                t.className = 'h-10 xl:h-11 w-10 xl:w-11 rounded-full object-contain'
                            }}
                        />
                    </div>

                    {/* Cabeçalho */}
                    <div className="mb-5 text-left">
                        <h2 className="text-2xl font-bold text-gray-900">Acesse sua conta</h2>
                        <p className="mt-1 text-sm text-gray-500">Insira seus dados para continuar.</p>
                    </div>

                    {/* Aviso de rascunho pendente */}
                    <SignupDraftNotice />

                    {/* ── Formulário ── */}
                    <form onSubmit={handleSubmit} className="space-y-3" aria-describedby={error ? 'login-error' : undefined}>

                        {/* E-mail */}
                        <div className="space-y-1.5">
                            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
                                E-mail
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                autoComplete="email"
                                required
                                maxLength={120}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-4 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/30"
                            />
                        </div>

                        {/* Senha */}
                        <div className="space-y-1.5">
                            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                                Senha
                            </label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    maxLength={256}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-4 pr-11 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/30"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 transition hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Lembrar de mim + Esqueci a senha */}
                        <div className="flex items-center justify-between pt-0.5">
                            <label htmlFor="login-remember" className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 select-none">
                                <input
                                    id="login-remember"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300"
                                    style={{ accentColor: '#ffce44' }}
                                />
                                Lembrar de mim
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsForgotPasswordOpen(true)}
                                className="text-sm font-semibold text-[#765b00] hover:text-[#5c4700] hover:underline transition bg-transparent border-none p-0 cursor-pointer"
                            >
                                Esqueci a senha?
                            </button>
                        </div>

                        {/* Mensagem de erro */}
                        {error && (
                            <p id="login-error" role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                                {error}
                            </p>
                        )}

                        {/* Botão Entrar */}
                        <button
                            id="login-submit-btn"
                            type="submit"
                            disabled={isLoading}
                            className="group flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-gray-900 transition-all hover:brightness-95 active:scale-[.99] disabled:opacity-60"
                            style={{ backgroundColor: '#ffce44' }}
                        >
                            {submitting ? (
                                <>
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    Entrando...
                                </>
                            ) : (
                                <>
                                    Entrar
                                    <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                                        <IconArrow />
                                    </span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divisor "ou entre com" */}
                    <div className="my-3 flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-xs text-gray-400">ou entre com</span>
                        <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    {/* Botão Google */}
                    <button
                        id="login-google-btn"
                        type="button"
                        aria-label="Entrar com Google"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 active:scale-[.99]"
                    >
                        <GoogleLogo />
                        Google
                    </button>

                    {/* Link de cadastro */}
                    <p className="mt-4 text-center text-sm text-gray-500">
                        Não tem uma conta?{' '}
                        <Link
                            href="/auth/cadastro"
                            className="font-semibold text-[#765b00] hover:text-[#5c4700] hover:underline transition"
                        >
                            Cadastre-se
                        </Link>
                    </p>
                    {isForgotPasswordOpen && (
                        <ForgotPasswordModal
                            isOpen={isForgotPasswordOpen}
                            onClose={() => setIsForgotPasswordOpen(false)}
                            onRequestCode={handleRequestCode}
                            onVerifyCode={handleVerifyCode}
                            onConfirmReset={handleConfirmReset}
                        />
                    )}

                </div>
            </main>
        </div>
    )
}
