import { initializeApp, getApps, getApp } from 'firebase/app'
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    ConfirmationResult,
    UserCredential,
    signOut as firebaseSignOut,
} from 'firebase/auth'

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase only if it hasn't been initialized yet
let app: any
let auth: any
let googleProvider: any

try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig)
    auth = getAuth(app)
    googleProvider = new GoogleAuthProvider()
} catch (error) {
    console.error('Firebase initialization error:', error)
}

export { app, auth, googleProvider }

// ============================================
// Google Sign-In
// ============================================

export async function signInWithGoogle(): Promise<string | null> {
    try {
        const result = await signInWithPopup(auth, googleProvider)
        const idToken = await result.user.getIdToken()
        return idToken
    } catch (error: any) {
        // Handle user closing the popup gracefully - not an error
        if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
            return null
        }
        // For other errors, throw with a friendly message
        console.error('Google Sign-In Error:', error)
        throw new Error('Não foi possível fazer login com Google. Tente novamente.')
    }
}

// ============================================
// Email/Password Authentication
// ============================================

export async function createFirebaseUser(email: string, password: string): Promise<UserCredential> {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        return userCredential
    } catch (error: any) {
        console.error('Create User Error:', error)
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('Este email já está cadastrado.')
        }
        if (error.code === 'auth/weak-password') {
            throw new Error('A senha deve ter pelo menos 6 caracteres.')
        }
        if (error.code === 'auth/invalid-email') {
            throw new Error('Email inválido.')
        }
        throw new Error('Erro ao criar conta. Tente novamente.')
    }
}

export async function signInFirebaseUser(email: string, password: string): Promise<UserCredential> {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        return userCredential
    } catch (error: any) {
        console.error('Sign In Error:', error)
        if (error.code === 'auth/user-not-found') {
            throw new Error('Usuário não encontrado.')
        }
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error('Senha incorreta.')
        }
        if (error.code === 'auth/invalid-email') {
            throw new Error('Email inválido.')
        }
        throw new Error('Erro ao fazer login. Tente novamente.')
    }
}

// ============================================
// Email Verification
// ============================================

export async function sendVerificationEmail(): Promise<void> {
    const user = auth.currentUser
    if (!user) {
        throw new Error('Nenhum usuário logado.')
    }
    try {
        await sendEmailVerification(user)
    } catch (error: any) {
        console.error('Send Verification Email Error:', error)
        if (error.code === 'auth/too-many-requests') {
            throw new Error('Muitas tentativas. Aguarde alguns minutos.')
        }
        throw new Error('Erro ao enviar email de verificação.')
    }
}

export async function refreshUserAndCheckEmailVerified(): Promise<boolean> {
    const user = auth.currentUser
    if (!user) return false

    try {
        await user.reload()
        return user.emailVerified
    } catch (error) {
        console.error('Refresh User Error:', error)
        return false
    }
}

export function getCurrentUser() {
    return auth.currentUser
}

export async function getIdToken(): Promise<string | null> {
    const user = auth.currentUser
    if (!user) return null
    return user.getIdToken()
}

// ============================================
// Phone Verification with RecaptchaVerifier
// ============================================

let recaptchaVerifier: RecaptchaVerifier | null = null
let confirmationResult: ConfirmationResult | null = null

export function setupRecaptcha(containerId: string): RecaptchaVerifier {
    // Clear previous verifier if exists
    if (recaptchaVerifier) {
        try {
            recaptchaVerifier.clear()
        } catch (e) {
            // Ignore cleanup errors
        }
    }

    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'normal',
        callback: () => {
            // reCAPTCHA solved - will proceed with phone verification
            console.log('reCAPTCHA solved')
        },
        'expired-callback': () => {
            // Reset reCAPTCHA if expired
            console.log('reCAPTCHA expired')
        }
    })

    return recaptchaVerifier
}

export async function sendPhoneSmsCode(phoneNumber: string): Promise<ConfirmationResult> {
    if (!recaptchaVerifier) {
        throw new Error('Configure o reCAPTCHA primeiro.')
    }

    try {
        confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
        return confirmationResult
    } catch (error: any) {
        console.error('Send SMS Error:', error)
        if (error.code === 'auth/invalid-phone-number') {
            throw new Error('Número de telefone inválido.')
        }
        if (error.code === 'auth/too-many-requests') {
            throw new Error('Muitas tentativas. Aguarde alguns minutos.')
        }
        if (error.code === 'auth/captcha-check-failed') {
            throw new Error('Verificação reCAPTCHA falhou. Tente novamente.')
        }
        throw new Error('Erro ao enviar SMS. Tente novamente.')
    }
}

export async function verifySmsCode(code: string): Promise<UserCredential> {
    if (!confirmationResult) {
        throw new Error('Envie o SMS primeiro.')
    }

    try {
        const result = await confirmationResult.confirm(code)
        return result
    } catch (error: any) {
        console.error('Verify SMS Error:', error)
        if (error.code === 'auth/invalid-verification-code') {
            throw new Error('Código incorreto.')
        }
        if (error.code === 'auth/code-expired') {
            throw new Error('Código expirado. Solicite um novo.')
        }
        throw new Error('Erro ao verificar código. Tente novamente.')
    }
}

export function clearRecaptcha() {
    if (recaptchaVerifier) {
        try {
            recaptchaVerifier.clear()
        } catch (e) {
            // Ignore cleanup errors
        }
        recaptchaVerifier = null
    }
    confirmationResult = null
}

// ============================================
// Sign Out
// ============================================

export async function signOutFirebase(): Promise<void> {
    try {
        await firebaseSignOut(auth)
    } catch (error) {
        console.error('Sign Out Error:', error)
    }
    clearRecaptcha()
}



