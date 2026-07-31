'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PASSWORD_MAX_LENGTH, USER_PASSWORD_MIN_LENGTH, validateNewPassword } from '@/lib/passwordPolicy'

type Step = 'request' | 'code' | 'password' | 'success'

interface ForgotPasswordModalProps {
    isOpen: boolean
    onClose: () => void
    onRequestCode: (email: string) => Promise<void>
    onVerifyCode: (email: string, code: string) => Promise<string>
    onConfirmReset: (email: string, token: string, pass: string) => Promise<void>
}

/* ─────────────────────────────────────────────────────────────
   ÍCONES INLINE (SVG)
   ───────────────────────────────────────────────────────────── */
const IconClose = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
)

const IconSend = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
)

const IconKey = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
        <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 1.5 1.5M15.5 7.5 14 6" />
    </svg>
)

const IconLock = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
)

const IconCheck = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
        <path d="M20 6 9 17l-5-5" />
    </svg>
)

/* ─────────────────────────────────────────────────────────────
   COMPONENTE PRINCIPAL
   ───────────────────────────────────────────────────────────── */
export default function ForgotPasswordModal({
    isOpen,
    onClose,
    onRequestCode,
    onVerifyCode,
    onConfirmReset,
}: ForgotPasswordModalProps) {
    const CLOSE_TRANSITION_MS = 220
    const [step, setStep] = useState<Step>('request')
    const [email, setEmail] = useState('')
    const [code, setCode] = useState(['', '', '', '', '', ''])
    const [resetSessionToken, setResetSessionToken] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [innerLoading, setInnerLoading] = useState(false)
    const [innerError, setInnerError] = useState<string | null>(null)
    const [isMounted, setIsMounted] = useState(false)
    const [isClosing, setIsClosing] = useState(false)

    const modalRef = useRef<HTMLDivElement>(null)
    const codeRefs = useRef<(HTMLInputElement | null)[]>([])
    const closeTimerRef = useRef<number | null>(null)

    const requestClose = useCallback(() => {
        if (isClosing) return
        setIsClosing(true)
        setIsMounted(false)
        closeTimerRef.current = window.setTimeout(() => {
            closeTimerRef.current = null
            onClose()
        }, CLOSE_TRANSITION_MS)
    }, [CLOSE_TRANSITION_MS, isClosing, onClose])

    // Reset states when opening the modal
    useEffect(() => {
        if (isOpen) {
            if (closeTimerRef.current) {
                window.clearTimeout(closeTimerRef.current)
                closeTimerRef.current = null
            }
            setIsClosing(false)
            setStep('request')
            setEmail('')
            setCode(['', '', '', '', '', ''])
            setResetSessionToken('')
            setNewPassword('')
            setConfirmPassword('')
            setInnerError(null)
            setInnerLoading(false)

            // Trigger animation on next frame
            const t = setTimeout(() => setIsMounted(true), 10)
            return () => clearTimeout(t)
        } else {
            setIsMounted(false)
            setIsClosing(false)
        }
    }, [isOpen])

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) {
                window.clearTimeout(closeTimerRef.current)
                closeTimerRef.current = null
            }
        }
    }, [])

    // Close on ESC key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                requestClose()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, requestClose])

    if (!isOpen && !isClosing) return null

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            requestClose()
        }
    }

    /* ──── Step 1: Solicitação de Código ──── */
    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return

        setInnerLoading(true)
        setInnerError(null)
        try {
            await onRequestCode(email.trim())
            setStep('code')
        } catch (err) {
            setInnerError((err as Error).message || 'Não foi possível enviar o código.')
        } finally {
            setInnerLoading(false)
        }
    }

    /* ──── Step 2: Validação de Código ──── */
    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return
        const nextCode = [...code]
        nextCode[index] = value
        setCode(nextCode)

        if (value && index < 5) {
            codeRefs.current[index + 1]?.focus()
        }
    }

    const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            codeRefs.current[index - 1]?.focus()
        }
    }

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const fullCode = code.join('')
        if (fullCode.length !== 6) {
            setInnerError('Insira o código completo de 6 dígitos.')
            return
        }

        setInnerLoading(true)
        setInnerError(null)
        try {
            const token = await onVerifyCode(email, fullCode)
            setResetSessionToken(token)
            setStep('password')
        } catch (err) {
            setInnerError((err as Error).message || 'Código inválido ou expirado.')
        } finally {
            setInnerLoading(false)
        }
    }

    const handleResendCode = async () => {
        setInnerLoading(true)
        setInnerError(null)
        try {
            await onRequestCode(email)
            setCode(['', '', '', '', '', ''])
            setInnerError('Código enviado novamente para o seu e-mail.')
        } catch (err) {
            setInnerError((err as Error).message || 'Não foi possível reenviar o código.')
        } finally {
            setInnerLoading(false)
        }
    }

    /* ──── Step 3: Definição de Nova Senha ──── */
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const passwordError = validateNewPassword(newPassword)
        if (passwordError) {
            setInnerError(passwordError)
            return
        }
        if (newPassword !== confirmPassword) {
            setInnerError('As senhas não coincidem.')
            return
        }

        setInnerLoading(true)
        setInnerError(null)
        try {
            await onConfirmReset(email, resetSessionToken, newPassword)
            setStep('success')
        } catch (err) {
            setInnerError((err as Error).message || 'Não foi possível redefinir a senha.')
        } finally {
            setInnerLoading(false)
        }
    }

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
                isMounted
                    ? 'bg-black/60 opacity-100 backdrop-blur-sm pointer-events-auto'
                    : 'bg-black/0 opacity-0 backdrop-blur-none pointer-events-none'
            }`}
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className={`relative w-full max-w-[420px] bg-white rounded-2xl p-7 md:p-8 shadow-2xl flex flex-col transform transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${
                    isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
            >
                {/* Botão fechar (x) */}
                <button
                    type="button"
                    onClick={requestClose}
                    aria-label="Fechar modal"
                    className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                >
                    <IconClose />
                </button>

                {/* ──── EXIBIÇÃO DE ETAPAS ──── */}

                {/* ETAPA 1: SOLICITAÇÃO (REQUEST) */}
                {step === 'request' && (
                    <>
                        <div className="text-left mb-6">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight font-sans">
                                Esqueceu a senha?
                            </h3>
                            <p className="mt-2 text-xs md:text-sm text-gray-500 leading-relaxed font-normal font-sans">
                                Insira seu e-mail para receber as instruções de recuperação.
                            </p>
                        </div>

                        {innerError && (
                            <p role="alert" className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs md:text-sm text-red-600 text-left font-sans">
                                {innerError}
                            </p>
                        )}

                        <form onSubmit={handleRequestSubmit} className="space-y-4 text-left">
                            <div className="space-y-1.5">
                                <label htmlFor="modal-email" className="block text-sm font-semibold text-gray-700 font-sans">
                                    E-mail
                                </label>
                                <input
                                    id="modal-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-4 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/30"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={innerLoading}
                                className="group flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-gray-900 transition-all hover:brightness-95 active:scale-[.99] disabled:opacity-60 cursor-pointer"
                                style={{ backgroundColor: '#ffce44' }}
                            >
                                {innerLoading ? 'Enviando...' : 'Enviar Código'}
                                {!innerLoading && (
                                    <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                                        <IconSend />
                                    </span>
                                )}
                            </button>
                        </form>
                    </>
                )}

                {/* ETAPA 2: CÓDIGO (CODE) */}
                {step === 'code' && (
                    <>
                        <div className="text-center mb-6 flex flex-col items-center">
                            <div className="w-14 h-14 bg-yellow-50 rounded-full flex items-center justify-center mb-3">
                                <IconKey />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 leading-tight font-sans">
                                Confirmar código
                            </h3>
                            <p className="mt-2 text-xs md:text-sm text-gray-500 leading-relaxed font-normal px-2 font-sans">
                                Digite o código enviado para <span className="font-semibold text-gray-700">{email}</span>.
                            </p>
                        </div>

                        {innerError && (
                            <p role="alert" className={`mb-4 rounded-lg border px-3 py-2 text-xs md:text-sm text-left font-sans ${
                                innerError.includes('enviado novamente')
                                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                    : 'border-red-100 bg-red-50 text-red-600'
                            }`}>
                                {innerError}
                            </p>
                        )}

                        <form onSubmit={handleVerifySubmit} className="space-y-5">
                            <div className="flex justify-center gap-2">
                                {code.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { codeRefs.current[index] = el }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleCodeChange(index, e.target.value)}
                                        onKeyDown={(e) => handleCodeKeyDown(index, e)}
                                        className="w-10 h-12 md:w-12 md:h-14 text-center text-lg font-bold rounded-xl border border-gray-200 bg-gray-50 shadow-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                    />
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={innerLoading}
                                className="group flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-gray-900 transition-all hover:brightness-95 active:scale-[.99] disabled:opacity-60 cursor-pointer"
                                style={{ backgroundColor: '#ffce44' }}
                            >
                                {innerLoading ? 'Validando...' : 'Validar Código'}
                                {!innerLoading && (
                                    <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                                        <IconSend />
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={innerLoading}
                                className="w-full text-center text-xs md:text-sm text-yellow-700 hover:text-yellow-800 font-semibold transition bg-transparent border-none cursor-pointer"
                            >
                                Reenviar código
                            </button>
                        </form>
                    </>
                )}

                {/* ETAPA 3: NOVA SENHA (PASSWORD) */}
                {step === 'password' && (
                    <>
                        <div className="text-center mb-6 flex flex-col items-center">
                            <div className="w-14 h-14 bg-yellow-50 rounded-full flex items-center justify-center mb-3">
                                <IconLock />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 leading-tight font-sans">
                                Definir nova senha
                            </h3>
                            <p className="mt-2 text-xs md:text-sm text-gray-500 leading-relaxed font-normal font-sans">
                                Agora escolha sua nova senha.
                            </p>
                        </div>

                        {innerError && (
                            <p role="alert" className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs md:text-sm text-red-600 text-left font-sans">
                                {innerError}
                            </p>
                        )}

                        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
                            <div className="space-y-1.5">
                                <label htmlFor="new-password" className="block text-sm font-semibold text-gray-700 font-sans">
                                    Nova senha
                                </label>
                                <input
                                    id="new-password"
                                    type="password"
                                    required
                                    minLength={USER_PASSWORD_MIN_LENGTH}
                                    maxLength={PASSWORD_MAX_LENGTH}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-4 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/30"
                                />
                                <p className={`text-xs ${newPassword.length > 0 && newPassword.length < USER_PASSWORD_MIN_LENGTH ? 'text-red-600' : 'text-gray-500'}`} aria-live="polite">
                                    {newPassword.length > 0 && newPassword.length < USER_PASSWORD_MIN_LENGTH
                                        ? `Faltam ${USER_PASSWORD_MIN_LENGTH - newPassword.length} caracteres para o mínimo.`
                                        : `Use entre ${USER_PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres.`}
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-700 font-sans">
                                    Confirmar senha
                                </label>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-4 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/30"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={innerLoading}
                                className="group flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-gray-900 transition-all hover:brightness-95 active:scale-[.99] disabled:opacity-60 cursor-pointer"
                                style={{ backgroundColor: '#ffce44' }}
                            >
                                {innerLoading ? 'Salvando...' : 'Salvar nova senha'}
                            </button>
                        </form>
                    </>
                )}

                {/* ETAPA 4: SUCESSO (SUCCESS) */}
                {step === 'success' && (
                    <div className="text-center py-4 flex flex-col items-center">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                            <IconCheck />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight font-sans">
                            Senha redefinida!
                        </h3>
                        <p className="mt-2 text-xs md:text-sm text-gray-500 leading-relaxed font-normal px-4 mb-6 font-sans">
                            Sua senha foi redefinida com sucesso. Você já pode acessar sua conta.
                        </p>

                        <button
                            type="button"
                            onClick={requestClose}
                            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-gray-900 transition-all hover:brightness-95 active:scale-[.99] cursor-pointer"
                            style={{ backgroundColor: '#ffce44' }}
                        >
                            Concluir
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
