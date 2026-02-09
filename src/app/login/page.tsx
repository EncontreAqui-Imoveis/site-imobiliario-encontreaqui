'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Briefcase } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRegistration } from '@/contexts/RegistrationContext'
import { authApi } from '@/lib/api'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { login, loginWithGoogle, isAuthenticated, isLoading: authLoading, setSession } = useAuth()
    const { saveDraft, updateStep } = useRegistration()

    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })

    // Profile choice state for new Google users
    const [showProfileChoice, setShowProfileChoice] = useState(false)
    const [pendingGoogleUser, setPendingGoogleUser] = useState<{ email: string; name: string; idToken?: string } | null>(null)

    const redirectUrl = searchParams.get('redirect') || '/'

    // Redirect if already authenticated
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.push(redirectUrl)
        }
    }, [isAuthenticated, authLoading, router, redirectUrl])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            await login(formData.email, formData.password)
            router.push(redirectUrl)
        } catch (err: any) {
            console.error('Login error:', err)

            const errorMessage = err.message?.toLowerCase() || ''

            if (errorMessage.includes('password') || errorMessage.includes('senha') || errorMessage.includes('credential')) {
                setError('Email ou senha incorretos. Se você criou sua conta via Google, use o botão "Entrar com Google" abaixo, pois sua conta não possui senha definida.')
            } else {
                setError('Ocorreu um erro ao fazer login. Tente novamente.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = async (profileType?: 'client' | 'broker') => {
        setError('')
        setIsGoogleLoading(true)

        try {
            const result = await loginWithGoogle(profileType)

            if (result.needsRegistration && result.pending) {
                // New user - redirect to full registration flow
                saveDraft({
                    googleData: {
                        uid: result.pending.uid!,
                        email: result.pending.email,
                        displayName: result.pending.name,
                        photoURL: result.pending.photoURL || null,
                        idToken: result.pending.idToken!,
                    },
                    authData: {
                        name: result.pending.name,
                        email: result.pending.email,
                        password: '', // Password not needed for Google Auth
                        phone: '',
                        street: '',
                        number: '',
                        complement: '',
                        bairro: '',
                        city: '',
                        state: '',
                        cep: '',
                        creci: '',
                    }
                })
                router.push('/cadastro?mode=google')
                return
            }

            if (result.requiresProfileChoice && result.pending) {
                // New user - needs to choose profile type
                setPendingGoogleUser(result.pending)
                setShowProfileChoice(true)
                setIsGoogleLoading(false)
                return
            }

            if (result.success) {
                // Handle post-login redirects
                if (result.requiresDocuments) {
                    router.push('/verificacao')
                } else if (result.needsCompletion) {
                    router.push('/perfil/editar')
                } else {
                    router.push(redirectUrl)
                }
            }
        } catch (err: any) {
            console.error('Google login error:', err)

            // Handle popup closed by user
            if (err.message?.includes('popup-closed-by-user') || err.message?.includes('cancelled')) {
                // User cancelled, no need to show error
                return
            }

            setError('Erro ao fazer login com Google. Tente novamente.')
        } finally {
            setIsGoogleLoading(false)
        }
    }

    const handleProfileChoice = async (profileType: 'client' | 'broker') => {
        setShowProfileChoice(false)

        // If we have a pending ID token, use it directly to avoid re-opening Google Popup
        if (pendingGoogleUser?.idToken) {
            setIsGoogleLoading(true)
            try {
                // Call API directly with stored token
                const response = await authApi.googleAuth(pendingGoogleUser.idToken, profileType)

                if (response.error) {
                    throw new Error(typeof response.error === 'string' ? response.error : 'Erro ao fazer login com Google')
                }

                const { user, token, needsCompletion, requiresDocuments } = response.data

                // Set session in context
                setSession(user, token)

                // Handle redirects
                if (requiresDocuments) {
                    router.push('/verificacao')
                } else if (needsCompletion) {
                    router.push('/perfil/editar')
                } else {
                    router.push(redirectUrl)
                }

            } catch (err: any) {
                console.error('Profile choice error:', err)
                setError('Erro ao concluir login. Tente novamente.')
                setPendingGoogleUser(null)
            } finally {
                setIsGoogleLoading(false)
            }
        } else {
            // Fallback to old behavior if no token (shouldn't happen)
            await handleGoogleLogin(profileType)
        }
    }

    // Profile Choice Modal
    if (showProfileChoice && pendingGoogleUser) {
        return (
            <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20 flex items-center justify-center px-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Bem-vindo, {pendingGoogleUser.name}!
                        </h2>
                        <p className="text-gray-600">
                            Como você deseja usar a plataforma?
                        </p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => handleProfileChoice('client')}
                            disabled={isGoogleLoading}
                            className="w-full flex items-center gap-4 p-5 bg-white border-2 border-gray-200 hover:border-primary-500 rounded-xl transition-all group"
                        >
                            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <User className="w-7 h-7 text-blue-600" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-gray-900 text-lg">Sou Cliente</h3>
                                <p className="text-sm text-gray-500">Quero buscar e favoritar imóveis</p>
                            </div>
                        </button>

                        <button
                            onClick={() => handleProfileChoice('broker')}
                            disabled={isGoogleLoading}
                            className="w-full flex items-center gap-4 p-5 bg-white border-2 border-gray-200 hover:border-primary-500 rounded-xl transition-all group"
                        >
                            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                <Briefcase className="w-7 h-7 text-green-600" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-gray-900 text-lg">Sou Corretor</h3>
                                <p className="text-sm text-gray-500">Quero anunciar e gerenciar imóveis</p>
                            </div>
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            setShowProfileChoice(false)
                            setPendingGoogleUser(null)
                        }}
                        className="w-full mt-6 text-gray-500 hover:text-gray-700 text-sm"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20">
            <div className="flex min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-5rem)]">
                {/* Left Side - Form */}
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                    <div className="w-full max-w-md">
                        {/* Logo */}
                        <Link href="/" className="flex items-center justify-center mb-8">
                            <Image
                                src="/logo2.svg"
                                alt="Encontre Aqui Imóveis"
                                width={280}
                                height={80}
                                className="h-20"
                                style={{ width: 'auto' }}
                            />
                        </Link>

                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Bem-vindo de volta!
                            </h1>
                            <p className="text-gray-500">
                                Entre na sua conta para acessar seus favoritos e muito mais.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="seu@email.com"
                                        required
                                        className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Senha
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        required
                                        className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-12 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Forgot Password */}
                            <div className="flex justify-end">
                                <Link
                                    href="/recuperar-senha"
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    Esqueceu a senha?
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-accent-500 hover:bg-accent-600 disabled:bg-accent-400 text-primary-900 font-semibold rounded-xl shadow-lg shadow-accent-500/25 transition-all"
                            >
                                {isLoading ? (
                                    <span className="w-5 h-5 border-2 border-primary-900/30 border-t-primary-900 rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Entrar
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-gray-50 text-gray-500">ou continue com</span>
                            </div>
                        </div>

                        {/* Google Login Button */}
                        <button
                            type="button"
                            onClick={() => handleGoogleLogin()}
                            disabled={isGoogleLoading}
                            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-60 rounded-xl font-medium text-gray-700 transition-all"
                        >
                            {isGoogleLoading ? (
                                <span className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
                            ) : (
                                <>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Entrar com Google
                                </>
                            )}
                        </button>

                        {/* Register Link */}
                        <p className="mt-8 text-center text-gray-600">
                            Não tem uma conta?{' '}
                            <Link href="/cadastro" className="text-accent-600 hover:text-accent-700 font-semibold">
                                Cadastre-se grátis
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Right Side - Image (hidden on mobile) */}
                <div className="hidden lg:block lg:w-1/2 relative">
                    <div className="absolute inset-0 gradient-hero" />
                    <div className="absolute inset-0 flex items-center justify-center p-12">
                        <div className="text-center text-white max-w-md">
                            <h2 className="text-3xl font-bold mb-4">
                                Encontre o imóvel dos seus sonhos
                            </h2>
                            <p className="text-lg opacity-90">
                                Milhares de opções esperando por você. Casas, apartamentos, terrenos e muito mais.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}
