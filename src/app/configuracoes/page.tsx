'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import GuestAccessCard from '@/components/auth/GuestAccessCard'
import { Loader2, Moon, Settings } from 'lucide-react'
import { persistTheme, syncThemeFromStorage } from '@/lib/theme'

export default function ConfiguracoesPage() {
    const { session, loading } = useUser()
    const [dark, setDark] = useState(false)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        const prefersDark = syncThemeFromStorage()
        setDark(prefersDark)
        setReady(true)
    }, [])

    const setMode = (next: boolean) => {
        setDark(next)
        persistTheme(next ? 'dark' : 'light')
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        )
    }

    if (!session) {
        return (
            <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 pt-24">
                <GuestAccessCard
                    icon={Settings}
                    title="Entre para acessar configurações"
                    description="Após entrar, você poderá alternar o modo escuro do site."
                />
            </div>
        )
    }

    if (!ready) {
        return (
            <div className="min-h-[40vh] flex items-center justify-center pt-24">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 pt-24">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                    <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Configurações</h1>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
                            <Moon className="w-5 h-5 text-primary-600 dark:text-primary-300" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Modo escuro</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Menos brilho em ambientes com pouca luz</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={dark}
                        onClick={() => setMode(!dark)}
                        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${dark ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                        <span
                            className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${dark ? 'translate-x-6' : ''}`}
                        />
                        <span className="sr-only">{dark ? 'Desativar modo escuro' : 'Ativar modo escuro'}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
