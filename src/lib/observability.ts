type SentryCaptureContext = {
    tags?: Record<string, string>
    extra?: Record<string, unknown>
}

type SentryLike = {
    captureException?: (error: unknown, context?: SentryCaptureContext) => void
}

function getSentry(): SentryLike | undefined {
    const candidate = globalThis as typeof globalThis & { Sentry?: SentryLike }
    return candidate.Sentry
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
            url: context.url,
            message: context.message,
        },
    })
}
