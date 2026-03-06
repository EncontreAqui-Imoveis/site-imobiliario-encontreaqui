export function generateIdempotencyKey(prefix = 'proposal'): string {
    const cryptoRef = globalThis.crypto as Crypto | undefined
    if (cryptoRef?.randomUUID) {
        return `${prefix}-${cryptoRef.randomUUID()}`
    }

    const fallback = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    return `${prefix}-${fallback}`
}
