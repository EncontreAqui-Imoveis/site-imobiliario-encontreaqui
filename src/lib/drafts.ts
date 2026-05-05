/**
 * Draft system for the property creation wizard (/anuncie).
 * Mirrors mobile's `rascunho_cadastro` feature using localStorage.
 */

const DRAFT_KEY = 'encontreaqui_property_draft'
const DRAFT_TIMESTAMP_KEY = 'encontreaqui_property_draft_ts'
const DRAFT_MEDIA_DB = 'encontreaqui_property_draft_media'
const DRAFT_MEDIA_STORE = 'property_draft_media'
const DRAFT_MEDIA_IMAGES_KEY = 'images'
const DRAFT_MEDIA_VIDEO_KEY = 'video'
const REMOTE_DRAFT_STALE_CODES = new Set(['DRAFT_NOT_FOUND', 'DRAFT_EXPIRED'])

/** Max age for a draft: 7 days */
const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1000

export interface PropertyDraft {
    /** Which step the user was on (0-indexed) */
    currentStep: number
    /** Form data for each step, keyed by step index */
    data: Record<string, unknown>
    /** When the draft was last updated */
    updatedAt: string
    /** Remote draft identifier (for server-validated drafts) */
    draftId?: string
    /** Remote draft token (for server-validated drafts) */
    draftToken?: string
}

type DraftApiError = {
    status?: unknown
    payload?: {
        code?: unknown
        [key: string]: unknown
    }
}

function parseDraftRemoteErrorCode(payload: unknown): string {
    if (!payload || typeof payload !== 'object') return ''
    const raw = (payload as { code?: unknown }).code
    if (typeof raw !== 'string') return ''
    return raw.trim().toUpperCase()
}

export function isPropertyDraftStaleError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false
    const apiError = error as DraftApiError
    const status = Number(apiError.status)
    if (status === 401 || status === 404) {
        return true
    }
    const code = parseDraftRemoteErrorCode(apiError.payload)
    return REMOTE_DRAFT_STALE_CODES.has(code)
}

export async function clearRemoteDraftIfStale(
    draft: PropertyDraft,
    checkRemoteDraft?: (draft: PropertyDraft) => Promise<boolean>,
): Promise<boolean> {
    if (!checkRemoteDraft) return false
    try {
        const stale = await checkRemoteDraft(draft)
        if (stale) {
            clearDraft()
            return true
        }
        return false
    } catch {
        return false
    }
}

type DraftMediaRecord = {
    id: string
    value: File[] | File | null
}

function isBrowser(): boolean {
    return typeof window !== 'undefined'
}

function supportsIndexedDb(): boolean {
    return isBrowser() && typeof window.indexedDB !== 'undefined'
}

function openDraftMediaDb(): Promise<IDBDatabase | null> {
    if (!supportsIndexedDb()) return Promise.resolve(null)

    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DRAFT_MEDIA_DB, 1)

        request.onupgradeneeded = () => {
            const db = request.result
            if (!db.objectStoreNames.contains(DRAFT_MEDIA_STORE)) {
                db.createObjectStore(DRAFT_MEDIA_STORE, { keyPath: 'id' })
            }
        }

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

async function putDraftMediaRecord(id: string, value: File[] | File | null): Promise<void> {
    const db = await openDraftMediaDb()
    if (!db) return

    await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(DRAFT_MEDIA_STORE, 'readwrite')
        const store = transaction.objectStore(DRAFT_MEDIA_STORE)
        store.put({ id, value } satisfies DraftMediaRecord)
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error)
    })

    db.close()
}

async function getDraftMediaRecord<T extends File[] | File | null>(id: string): Promise<T | null> {
    const db = await openDraftMediaDb()
    if (!db) return null

    const result = await new Promise<T | null>((resolve, reject) => {
        const transaction = db.transaction(DRAFT_MEDIA_STORE, 'readonly')
        const store = transaction.objectStore(DRAFT_MEDIA_STORE)
        const request = store.get(id)
        request.onsuccess = () => resolve((request.result?.value as T | undefined) ?? null)
        request.onerror = () => reject(request.error)
    })

    db.close()
    return result
}

async function deleteDraftMediaRecord(id: string): Promise<void> {
    const db = await openDraftMediaDb()
    if (!db) return

    await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(DRAFT_MEDIA_STORE, 'readwrite')
        const store = transaction.objectStore(DRAFT_MEDIA_STORE)
        store.delete(id)
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error)
    })

    db.close()
}

/** Save the current wizard state as a draft */
export function saveDraft(step: number, data: Record<string, unknown>): void {
    if (!isBrowser()) return
    try {
        const existing = loadDraft()
        const draft: PropertyDraft = {
            currentStep: step,
            data: { ...(existing?.data || {}), ...data },
            updatedAt: new Date().toISOString(),
            draftId: existing?.draftId,
            draftToken: existing?.draftToken,
        }
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
        localStorage.setItem(DRAFT_TIMESTAMP_KEY, Date.now().toString())
    } catch {
        console.warn('Failed to save draft to localStorage')
    }
}

export async function saveDraftMedia(images: File[], video: File | null): Promise<void> {
    if (!isBrowser()) return
    try {
        await putDraftMediaRecord(DRAFT_MEDIA_IMAGES_KEY, images)
        await putDraftMediaRecord(DRAFT_MEDIA_VIDEO_KEY, video)
    } catch {
        console.warn('Failed to save draft media to indexedDB')
    }
}

export async function loadDraftMedia(): Promise<{ images: File[]; video: File | null }> {
    if (!isBrowser()) return { images: [], video: null }
    try {
        const [images, video] = await Promise.all([
            getDraftMediaRecord<File[]>(DRAFT_MEDIA_IMAGES_KEY),
            getDraftMediaRecord<File | null>(DRAFT_MEDIA_VIDEO_KEY),
        ])
        return {
            images: Array.isArray(images) ? images : [],
            video: video instanceof File ? video : null,
        }
    } catch {
        return { images: [], video: null }
    }
}

/** Load the current draft, or null if none/expired */
export function loadDraft(): PropertyDraft | null {
    if (!isBrowser()) return null
    try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (!raw) return null

        // Check expiry
        const ts = localStorage.getItem(DRAFT_TIMESTAMP_KEY)
        if (ts) {
            const age = Date.now() - parseInt(ts, 10)
            if (age > MAX_DRAFT_AGE_MS) {
                clearDraft()
                return null
            }
        }

        return JSON.parse(raw) as PropertyDraft
    } catch {
        return null
    }
}

/** Check if a draft exists */
export function hasDraft(): boolean {
    return loadDraft() !== null
}

/** Clear the saved draft */
export function clearDraft(): void {
    if (!isBrowser()) return
    try {
        localStorage.removeItem(DRAFT_KEY)
        localStorage.removeItem(DRAFT_TIMESTAMP_KEY)
        void deleteDraftMediaRecord(DRAFT_MEDIA_IMAGES_KEY)
        void deleteDraftMediaRecord(DRAFT_MEDIA_VIDEO_KEY)
    } catch {
        // ignore
    }
}
