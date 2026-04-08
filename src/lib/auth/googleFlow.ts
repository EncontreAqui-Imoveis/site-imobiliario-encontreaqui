import { signInWithPopup } from 'firebase/auth'
import { loginWithGoogle, type GoogleAuthResult } from '@/lib/api/auth'
import { auth, googleProvider } from '@/lib/firebase'

export async function loginWithGooglePopup(): Promise<GoogleAuthResult> {
    const result = await signInWithPopup(auth, googleProvider)
    const idToken = await result.user.getIdToken()
    return loginWithGoogle(idToken)
}
