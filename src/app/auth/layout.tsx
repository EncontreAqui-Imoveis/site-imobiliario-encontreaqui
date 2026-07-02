import type { ReactNode } from 'react'

/**
 * Layout do grupo /auth/*
 * Header e Footer são suprimidos pelo ConditionalShell no layout raiz.
 * Este arquivo existe apenas para garantir que o App Router
 * trate /auth/* como um segmento de layout próprio.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
    return <>{children}</>
}
