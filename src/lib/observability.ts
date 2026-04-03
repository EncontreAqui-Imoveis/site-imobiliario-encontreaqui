type SentryCaptureContext = {
    tags?: Record<string, string>
    extra?: Record<string, unknown>
}

type SentryLike = {
    captureException?: (error: unknown, context?: SentryCaptureContext) => void
}

const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const BEARER_REGEX = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi
const JWT_REGEX = /eyJ[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/g
const PHONE_REGEX = /\b\d{10,13}\b/g

function getSentry(): SentryLike | undefined {
    const candidate = globalThis as typeof globalThis & { Sentry?: SentryLike }
    return candidate.Sentry
}

function sanitizeText(value: string | undefined): string | undefined {
    if (!value) return value
    return value
        .replace(BEARER_REGEX, 'Bearer ***')
        .replace(JWT_REGEX, '***.***.***')
        .replace(EMAIL_REGEX, '***@***')
        .replace(PHONE_REGEX, '***')
}

function sanitizeUrl(value: string | undefined): string | undefined {
    if (!value) return value
    try {
        const url = new URL(value)
        url.search = ''
        url.hash = ''
        return url.toString()
    } catch {
        return sanitizeText(value)
    }
}

export function reportObservedError(
    error: unknown,
    context: {
        module: string
        requestId?: string
        status?: number
        url?: string
        message?: string
    }
) {
    const sentry = getSentry()
    if (!sentry?.captureException) return

    sentry.captureException(error, {
        tags: {
            module: context.module,
            ...(context.requestId ? { requestId: context.requestId } : {}),
        },
        extra: {
            status: context.status,
            url: sanitizeUrl(context.url),
            message: sanitizeText(context.message),
        },
    })
}
