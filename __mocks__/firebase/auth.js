module.exports = {
    getAuth: jest.fn(() => ({
        currentUser: null,
        onAuthStateChanged: jest.fn(),
    })),
    GoogleAuthProvider: jest.fn(),
    signInWithPopup: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    sendEmailVerification: jest.fn(),
    signInWithPhoneNumber: jest.fn(),
    RecaptchaVerifier: jest.fn(),
    signOut: jest.fn(),
}
