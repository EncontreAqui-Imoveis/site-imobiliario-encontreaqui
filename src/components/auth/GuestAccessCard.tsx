import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface Props {
    icon: LucideIcon
    title: string
    description: string
}

export default function GuestAccessCard({ icon: Icon, title, description }: Props) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 px-6 py-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <Icon className="h-7 w-7 text-slate-500" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Link
                    href="/auth/login"
                    className="inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    Entrar
                </Link>
                <Link
                    href="/auth/cadastro"
                    className="inline-flex rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                    Criar conta
                </Link>
            </div>
        </div>
    )
}
