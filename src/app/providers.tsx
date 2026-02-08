'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { RegistrationProvider } from '@/contexts/RegistrationContext'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <RegistrationProvider>
                {children}
            </RegistrationProvider>
        </AuthProvider>
    )
}
