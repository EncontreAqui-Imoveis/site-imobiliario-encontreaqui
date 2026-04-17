'use client'

import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth as firebaseAuth } from '@/lib/firebase'
import {
    isGooglePendingAuthResult,
    login,
    loginWithGoogle,
    type LoginPayload,
    type UserSession,
} from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'

/**
 * Mesmo fluxo do app mobile: tenta `/auth/login` no backend; se retornar 401,
 * tenta Firebase Email/Password e troca o idToken em `/auth/google` (token Firebase).
 */
export async function loginWithEmailHybrid(payload: LoginPayload): Promise<UserSession> {
    try {
        return await login(payload)
    } catch (err) {
        if (!(err instanceof ApiError) || err.status !== 401) {
            throw err
        }

        try {
            const credential = await signInWithEmailAndPassword(
                firebaseAuth,
                payload.email.trim(),
                payload.password,
            )
            const idToken = await credential.user.getIdToken(true)
            if (!idToken) {
                throw err
            }

            const result = await loginWithGoogle(idToken, 'auto')
            if (isGooglePendingAuthResult(result)) {
                throw err
            }
            return result
        } catch {
            throw err
        }
    }
}
