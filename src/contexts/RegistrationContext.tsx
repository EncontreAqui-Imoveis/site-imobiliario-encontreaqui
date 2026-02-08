'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

// Registration steps matching Flutter's RegistrationDraftStep
export type RegistrationStep =
    | 'form'           // Filling out the registration form
    | 'email_pending'  // Waiting for email verification
    | 'phone_pending'  // Waiting for phone verification
    | 'creci_pending'  // Waiting for CRECI verification (broker only)
    | 'complete'       // Registration complete

export type UserType = 'client' | 'broker'

export interface RegistrationAuthData {
    name: string
    email: string
    password: string
    phone: string
    street?: string
    number?: string
    complement?: string
    bairro?: string
    city?: string
    state?: string
    cep?: string
    creci?: string
}

export interface RegistrationDraft {
    step: RegistrationStep
    userType: UserType
    authData: RegistrationAuthData
    googleData?: {
        uid: string
        email: string
        displayName: string
        photoURL: string | null
        idToken: string
    }
    updatedAt: string
}

interface RegistrationContextType {
    draft: RegistrationDraft | null
    isLoading: boolean

    // Draft management
    saveDraft: (data: Partial<RegistrationDraft>) => void
    updateStep: (step: RegistrationStep) => void
    updateAuthData: (data: Partial<RegistrationAuthData>) => void
    clearDraft: () => void
    hasDraft: () => boolean

    // Convenience getters
    currentStep: RegistrationStep | null
    authData: RegistrationAuthData | null
    userType: UserType | null
}

const DRAFT_KEY = 'registration_draft'

const defaultAuthData: RegistrationAuthData = {
    name: '',
    email: '',
    password: '',
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

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined)

export function RegistrationProvider({ children }: { children: ReactNode }) {
    const [draft, setDraft] = useState<RegistrationDraft | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Load draft from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(DRAFT_KEY)
            if (stored) {
                const parsed = JSON.parse(stored) as RegistrationDraft
                // Don't restore password from localStorage for security
                // Password will need to be re-entered if user returns
                if (parsed.authData) {
                    parsed.authData.password = ''
                }
                setDraft(parsed)
            }
        } catch (error) {
            console.error('Failed to load registration draft:', error)
            localStorage.removeItem(DRAFT_KEY)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Persist draft to localStorage (without password)
    const persistDraft = useCallback((draftData: RegistrationDraft) => {
        try {
            const toStore = {
                ...draftData,
                authData: {
                    ...draftData.authData,
                    password: '', // Never store password in localStorage
                },
                updatedAt: new Date().toISOString(),
            }
            localStorage.setItem(DRAFT_KEY, JSON.stringify(toStore))
        } catch (error) {
            console.error('Failed to persist registration draft:', error)
        }
    }, [])

    const saveDraft = useCallback((data: Partial<RegistrationDraft>) => {
        setDraft(prev => {
            const newDraft: RegistrationDraft = {
                step: data.step ?? prev?.step ?? 'form',
                userType: data.userType ?? prev?.userType ?? 'client',
                authData: {
                    ...(prev?.authData ?? defaultAuthData),
                    ...(data.authData ?? {}),
                },
                updatedAt: new Date().toISOString(),
            }
            persistDraft(newDraft)
            return newDraft
        })
    }, [persistDraft])

    const updateStep = useCallback((step: RegistrationStep) => {
        setDraft(prev => {
            if (!prev) return prev
            const newDraft = { ...prev, step, updatedAt: new Date().toISOString() }
            persistDraft(newDraft)
            return newDraft
        })
    }, [persistDraft])

    const updateAuthData = useCallback((data: Partial<RegistrationAuthData>) => {
        setDraft(prev => {
            if (!prev) return prev
            const newDraft = {
                ...prev,
                authData: { ...prev.authData, ...data },
                updatedAt: new Date().toISOString(),
            }
            persistDraft(newDraft)
            return newDraft
        })
    }, [persistDraft])

    const clearDraft = useCallback(() => {
        localStorage.removeItem(DRAFT_KEY)
        setDraft(null)
    }, [])

    const hasDraft = useCallback(() => {
        return draft !== null && draft.step !== 'form'
    }, [draft])

    const value: RegistrationContextType = {
        draft,
        isLoading,
        saveDraft,
        updateStep,
        updateAuthData,
        clearDraft,
        hasDraft,
        currentStep: draft?.step ?? null,
        authData: draft?.authData ?? null,
        userType: draft?.userType ?? null,
    }

    return (
        <RegistrationContext.Provider value={value}>
            {children}
        </RegistrationContext.Provider>
    )
}

export function useRegistration() {
    const context = useContext(RegistrationContext)
    if (context === undefined) {
        throw new Error('useRegistration must be used within a RegistrationProvider')
    }
    return context
}
