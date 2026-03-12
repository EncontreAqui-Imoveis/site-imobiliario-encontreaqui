export type ShareResult =
    | { kind: 'shared' }
    | { kind: 'copied' }
    | { kind: 'unsupported' }

type SharePayload = {
    title: string
    text: string
    url: string
}

export async function shareOrCopy(payload: SharePayload): Promise<ShareResult> {
    if (typeof window === 'undefined') {
        return { kind: 'unsupported' }
    }

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
            await navigator.share(payload)
            return { kind: 'shared' }
        } catch {
            // If the user cancels or the share API fails, fall back to clipboard when possible.
        }
    }

    if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
    ) {
        await navigator.clipboard.writeText(payload.url)
        return { kind: 'copied' }
    }

    return { kind: 'unsupported' }
}
