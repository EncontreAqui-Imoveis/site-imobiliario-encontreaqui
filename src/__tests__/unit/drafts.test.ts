/**
 * Unit tests for the draft system (localStorage persistence)
 */
import {
    clearRemoteDraftIfStale,
    clearDraft,
    hasDraft,
    isPropertyDraftStaleError,
    loadDraft,
    saveDraft,
} from '@/lib/drafts'

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
        getItem: jest.fn((key: string) => store[key] ?? null),
        setItem: jest.fn((key: string, value: string) => { store[key] = value }),
        removeItem: jest.fn((key: string) => { delete store[key] }),
        clear: jest.fn(() => { store = {} }),
        get length() { return Object.keys(store).length },
        key: jest.fn((i: number) => Object.keys(store)[i] ?? null),
    }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('Draft System', () => {
    beforeEach(() => {
        localStorageMock.clear()
        jest.clearAllMocks()
    })

    describe('saveDraft / loadDraft', () => {
        it('saves and loads a draft', () => {
            saveDraft(2, { title: 'Casa Linda', city: 'Goiânia' })
            const draft = loadDraft()

            expect(draft).not.toBeNull()
            expect(draft!.currentStep).toBe(2)
            expect(draft!.data.title).toBe('Casa Linda')
            expect(draft!.data.city).toBe('Goiânia')
        })

        it('merges data on successive saves', () => {
            saveDraft(1, { propertyType: 'Casa' })
            saveDraft(2, { city: 'Goiânia' })
            const draft = loadDraft()

            expect(draft!.data.propertyType).toBe('Casa')
            expect(draft!.data.city).toBe('Goiânia')
            expect(draft!.currentStep).toBe(2)
        })

        it('preserves remote draft identifiers across saves', () => {
            localStorageMock.setItem(
                'encontreaqui_property_draft',
                JSON.stringify({
                    currentStep: 1,
                    data: { title: 'Casa Legado', actorMode: 'client-owner' },
                    updatedAt: new Date().toISOString(),
                    draftId: 'legacy-id',
                    draftToken: 'legacy-token',
                }),
            )
            localStorageMock.setItem('encontreaqui_property_draft_ts', Date.now().toString())

            saveDraft(2, { city: 'Goiânia' })
            const draft = loadDraft()

            expect(draft?.draftId).toBe('legacy-id')
            expect(draft?.draftToken).toBe('legacy-token')
        })
    })

    describe('hasDraft', () => {
        it('returns false when no draft exists', () => {
            expect(hasDraft()).toBe(false)
        })

        it('returns true when a draft exists', () => {
            saveDraft(1, { title: 'Test' })
            expect(hasDraft()).toBe(true)
        })
    })

    describe('clearDraft', () => {
        it('clears the saved draft', () => {
            saveDraft(1, { title: 'Test' })
            expect(hasDraft()).toBe(true)

            clearDraft()
            expect(hasDraft()).toBe(false)
            expect(loadDraft()).toBeNull()
        })
    })

    describe('remote draft validation', () => {
        it('clears draft when remote validator marks it as stale', async () => {
            const draft = {
                currentStep: 3,
                data: { title: 'Casa com problema', actorMode: 'client-owner' },
                updatedAt: new Date().toISOString(),
                draftId: 'draft-legacy-1',
                draftToken: 'token-legacy-1',
            }
            localStorageMock.setItem('encontreaqui_property_draft', JSON.stringify(draft))
            localStorageMock.setItem('encontreaqui_property_draft_ts', Date.now().toString())

            const loadedDraft = loadDraft()
            expect(loadedDraft).not.toBeNull()
            expect(await clearRemoteDraftIfStale(loadedDraft!, async () => true)).toBe(true)
            expect(hasDraft()).toBe(false)
        })

        it('does not clear draft when no remote ids are present', async () => {
            saveDraft(1, { title: 'Mantido' })
            const draft = loadDraft()
            expect(draft).not.toBeNull()
            expect(await clearRemoteDraftIfStale(draft!)).toBe(false)
            expect(hasDraft()).toBe(true)
        })

        it('does not clear draft on transport errors', async () => {
            const draft = {
                currentStep: 2,
                data: { title: 'Falha de rede', actorMode: 'client-owner' },
                updatedAt: new Date().toISOString(),
                draftId: 'draft-legacy-2',
                draftToken: 'token-legacy-2',
            }
            localStorageMock.setItem('encontreaqui_property_draft', JSON.stringify(draft))
            localStorageMock.setItem('encontreaqui_property_draft_ts', Date.now().toString())

            const loadedDraft = loadDraft()
            expect(loadedDraft).not.toBeNull()
            expect(
                await clearRemoteDraftIfStale(loadedDraft!, async () => {
                    throw new Error('network down')
                }),
            ).toBe(false)
            expect(hasDraft()).toBe(true)
        })
    })

    describe('isPropertyDraftStaleError', () => {
        it('detects remote stale indicators', () => {
            expect(isPropertyDraftStaleError({ status: 401 })).toBe(true)
            expect(isPropertyDraftStaleError({ status: 404 })).toBe(true)
            expect(isPropertyDraftStaleError({ status: 200, payload: { code: 'DRAFT_NOT_FOUND' } })).toBe(true)
            expect(isPropertyDraftStaleError({ status: 200, payload: { code: 'DRAFT_EXPIRED' } })).toBe(true)
            expect(isPropertyDraftStaleError({ status: 409, payload: { code: 'DRAFT_NOT_OPEN' } })).toBe(false)
            expect(isPropertyDraftStaleError({ status: 500, payload: { code: 'INTERNAL' } })).toBe(false)
        })
    })

    describe('draft expiry', () => {
        it('returns null for expired drafts (>7 days)', () => {
            saveDraft(3, { title: 'Expired' })

            // Manually set the timestamp to 8 days ago
            const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000)
            localStorageMock.setItem('encontreaqui_property_draft_ts', eightDaysAgo.toString())

            expect(loadDraft()).toBeNull()
            expect(hasDraft()).toBe(false)
        })

        it('returns draft for non-expired drafts (<7 days)', () => {
            saveDraft(3, { title: 'Fresh' })

            // Set timestamp to 2 days ago (still valid)
            const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000)
            localStorageMock.setItem('encontreaqui_property_draft_ts', twoDaysAgo.toString())

            const draft = loadDraft()
            expect(draft).not.toBeNull()
            expect(draft!.data.title).toBe('Fresh')
        })
    })
})
