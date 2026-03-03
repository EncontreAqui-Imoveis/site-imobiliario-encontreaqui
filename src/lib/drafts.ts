/**
 * Draft system for the property creation wizard (/anuncie).
 * Mirrors mobile's `rascunho_cadastro` feature using localStorage.
 */

const DRAFT_KEY = 'encontreaqui_property_draft'
const DRAFT_TIMESTAMP_KEY = 'encontreaqui_property_draft_ts'

/** Max age for a draft: 7 days */
const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1000

export interface PropertyDraft {
    /** Which step the user was on (0-indexed) */
    currentStep: number
    /** Form data for each step, keyed by step index */
    data: Record<string, unknown>
    /** When the draft was last updated */
    updatedAt: string
}

function isBrowser(): boolean {
    return typeof window !== 'undefined'
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
        }
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
        localStorage.setItem(DRAFT_TIMESTAMP_KEY, Date.now().toString())
    } catch {
        console.warn('Failed to save draft to localStorage')
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
    } catch {
        // ignore
    }
}
