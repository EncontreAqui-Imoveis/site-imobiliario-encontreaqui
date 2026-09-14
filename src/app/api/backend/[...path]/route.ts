import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SESSION_COOKIE = 'ea_session'
const CSRF_COOKIE = 'ea_csrf'
const SESSION_ISSUING_PATHS = new Set(['/auth/login', '/auth/register', '/auth/google', '/auth/firebase'])
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function backendBaseUrl(): string {
    return (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
}

function isSameOriginMutation(request: NextRequest): boolean {
    const origin = request.headers.get('origin')
    return !origin || origin === request.nextUrl.origin
}

function csrfIsValid(request: NextRequest): boolean {
    const cookie = request.cookies.get(CSRF_COOKIE)?.value
    const header = request.headers.get('x-csrf-token')
    return Boolean(cookie && header && cookie === header)
}

function createProxyHeaders(request: NextRequest, sessionToken: string | null): Headers {
    const headers = new Headers()
    for (const name of ['accept', 'content-type', 'range', 'x-draft-id', 'x-draft-token']) {
        const value = request.headers.get(name)
        if (value) headers.set(name, value)
    }
    if (sessionToken) headers.set('authorization', `Bearer ${sessionToken}`)
    const requestId = request.headers.get('x-request-id')
    if (requestId) headers.set('x-request-id', requestId)
    return headers
}

async function proxy(request: NextRequest, routePath: string[]): Promise<NextResponse> {
    const baseUrl = backendBaseUrl()
    if (!baseUrl) {
        return NextResponse.json({ error: 'Servico indisponivel.' }, { status: 503 })
    }

    const path = `/${routePath.map(encodeURIComponent).join('/')}`
    const target = new URL(`${baseUrl}${path}`)
    target.search = request.nextUrl.search
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value?.trim() || null

    if (sessionToken && MUTATING_METHODS.has(request.method)) {
        if (!isSameOriginMutation(request) || !csrfIsValid(request)) {
            return NextResponse.json({ error: 'Requisicao invalida.' }, { status: 403 })
        }
    }

    const init: RequestInit = {
        method: request.method,
        headers: createProxyHeaders(request, sessionToken),
        cache: 'no-store',
        redirect: 'manual',
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
        init.body = await request.arrayBuffer()
    }

    let backendResponse: Response
    try {
        backendResponse = await fetch(target, init)
    } catch {
        return NextResponse.json({ error: 'Servico indisponivel.' }, { status: 503 })
    }

    const isSessionIssuing = SESSION_ISSUING_PATHS.has(path)
    const contentType = backendResponse.headers.get('content-type') || ''
    if (isSessionIssuing && contentType.includes('application/json')) {
        const payload = await backendResponse.json().catch(() => null)
        const token = payload && typeof payload === 'object' ? (payload as { token?: unknown }).token : null
        const responsePayload = payload && typeof payload === 'object' ? { ...payload } : payload
        if (responsePayload && typeof responsePayload === 'object') {
            delete (responsePayload as { token?: unknown }).token
        }
        const response = NextResponse.json(responsePayload, { status: backendResponse.status })
        response.headers.set('cache-control', 'no-store, private')
        if (typeof token === 'string' && token.trim() && backendResponse.ok) {
            const csrfToken = randomBytes(32).toString('base64url')
            const secure = process.env.NODE_ENV === 'production'
            response.cookies.set(SESSION_COOKIE, token, {
                httpOnly: true,
                sameSite: 'lax',
                secure,
                path: '/',
                maxAge: 60 * 60 * 24 * 7,
            })
            response.cookies.set(CSRF_COOKIE, csrfToken, {
                httpOnly: false,
                sameSite: 'lax',
                secure,
                path: '/',
                maxAge: 60 * 60 * 24 * 7,
            })
        }
        return response
    }

    const headers = new Headers()
    for (const name of ['content-type', 'content-disposition', 'cache-control', 'x-request-id']) {
        const value = backendResponse.headers.get(name)
        if (value) headers.set(name, value)
    }
    // The BFF can carry user-specific responses. Never let an intermediary
    // reuse an authenticated response across visitors.
    headers.set('cache-control', 'no-store, private')
    const response = new NextResponse(backendResponse.body, {
        status: backendResponse.status,
        headers,
    })
    if (path === '/auth/logout' || backendResponse.status === 401) {
        response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
        response.cookies.set(CSRF_COOKIE, '', { path: '/', maxAge: 0 })
    }
    return response
}

type Context = { params: Promise<{ path: string[] }> }

export async function GET(request: NextRequest, context: Context) {
    return proxy(request, (await context.params).path)
}
export async function POST(request: NextRequest, context: Context) {
    return proxy(request, (await context.params).path)
}
export async function PUT(request: NextRequest, context: Context) {
    return proxy(request, (await context.params).path)
}
export async function PATCH(request: NextRequest, context: Context) {
    return proxy(request, (await context.params).path)
}
export async function DELETE(request: NextRequest, context: Context) {
    return proxy(request, (await context.params).path)
}
