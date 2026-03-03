jest.mock('firebase/auth', () => ({
    signInWithPopup: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({
    auth: { currentUser: null },
    googleProvider: { providerId: 'google.com' },
}))

jest.mock('@/lib/api/auth', () => ({
    loginWithGoogle: jest.fn(),
}))

describe('google auth flow service', () => {
    it('loginWithGooglePopup() resolves popup token and forwards it to auth api', async () => {
        const { signInWithPopup } = await import('firebase/auth')
        const { loginWithGoogle } = await import('@/lib/api/auth')
        const { loginWithGooglePopup } = await import('@/lib/auth/googleFlow')

        ;(signInWithPopup as jest.Mock).mockResolvedValueOnce({
            user: {
                getIdToken: jest.fn().mockResolvedValue('google-token-123'),
            },
        })
        ;(loginWithGoogle as jest.Mock).mockResolvedValueOnce({ user: { id: 1 } })

        await loginWithGooglePopup()

        expect(signInWithPopup).toHaveBeenCalledTimes(1)
        expect(loginWithGoogle).toHaveBeenCalledWith('google-token-123')
    })
})
