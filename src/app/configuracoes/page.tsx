'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import { Settings, User, Shield, Bell, FileText, Loader2 } from 'lucide-react'

export default function ConfiguracoesPage() {
    const router = useRouter()
    const { session, loading } = useUser()

    useEffect(() => {
        if (!loading && !session) {
            router.replace('/auth/login?next=/configuracoes')
        }
    }, [loading, session, router])

    if (loading || !session) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        )
    }

    const settingsItems = [
        {
            icon: User,
            title: 'Editar Perfil',
            description: 'Altere seus dados pessoais e endereço',
            href: '/perfil/editar',
            color: 'bg-primary-50 text-primary-600',
        },
        {
            icon: Bell,
            title: 'Notificações',
            description: 'Gerencie suas notificações',
            href: '/notificacoes',
            color: 'bg-amber-50 text-amber-600',
        },
        {
            icon: Shield,
            title: 'Verificar Conta',
            description: 'Verifique seu e-mail para maior segurança',
            href: '/verificacao',
            color: 'bg-blue-50 text-blue-600',
        },
        {
            icon: FileText,
            title: 'Termos de Uso',
            description: 'Leia nossos termos e condições',
            href: '/termos',
            color: 'bg-slate-50 text-slate-600',
        },
        {
            icon: Shield,
            title: 'Política de Privacidade',
            description: 'Conheça nossa política de proteção de dados',
            href: '/privacidade',
            color: 'bg-green-50 text-green-600',
        },
    ]

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pt-24">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Settings className="w-5 h-5 text-slate-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 divide-y divide-slate-100">
                {settingsItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                <p className="text-xs text-slate-500">{item.description}</p>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
