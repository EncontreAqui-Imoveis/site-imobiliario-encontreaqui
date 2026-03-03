import { signInWithPopup } from 'firebase/auth'
import { loginWithGoogle, type UserSession } from '@/lib/api/auth'
import { auth, googleProvider } from '@/lib/firebase'

export async function loginWithGooglePopup(): Promise<UserSession> {
    const result = await signInWithPopup(auth, googleProvider)
    const idToken = await result.user.getIdToken()
    return loginWithGoogle(idToken)
}
