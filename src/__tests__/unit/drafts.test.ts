/**
 * Unit tests for the draft system (localStorage persistence)
 */
import { clearRemoteDraftIfStale, clearDraft, hasDraft, loadDraft, saveDraft } from '@/lib/drafts'

const fetchMock = jest.spyOn(global, 'fetch')

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
        fetchMock.mockReset()
    })

    afterAll(() => {
        fetchMock.mockRestore()
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
        it('clears draft when remote response is DRAFT_NOT_FOUND (404)', async () => {
            const draft = {
                currentStep: 3,
                data: { title: 'Casa com problema', actorMode: 'client-owner' },
                updatedAt: new Date().toISOString(),
                draftId: 'draft-legacy-1',
                draftToken: 'token-legacy-1',
            }
            localStorageMock.setItem('encontreaqui_property_draft', JSON.stringify(draft))
            localStorageMock.setItem('encontreaqui_property_draft_ts', Date.now().toString())

            fetchMock.mockResolvedValue(
                new Response(JSON.stringify({ code: 'DRAFT_NOT_FOUND' }), { status: 404, headers: { 'Content-Type': 'application/json' } }),
            )

            const loadedDraft = loadDraft()
            expect(loadedDraft).not.toBeNull()
            expect(await clearRemoteDraftIfStale(loadedDraft!)).toBe(true)
            expect(hasDraft()).toBe(false)
        })

        it('does not clear draft when no remote ids are present', async () => {
            saveDraft(1, { title: 'Mantido' })
            const draft = loadDraft()
            expect(draft).not.toBeNull()
            expect(await clearRemoteDraftIfStale(draft!)).toBe(false)
            expect(hasDraft()).toBe(true)
        })

        it('clears draft when backend returns 401', async () => {
            const draft = {
                currentStep: 2,
                data: { title: 'Casa pendente', actorMode: 'client-owner' },
                updatedAt: new Date().toISOString(),
                draftId: 'draft-legacy-2',
                draftToken: 'token-legacy-2',
            }
            localStorageMock.setItem('encontreaqui_property_draft', JSON.stringify(draft))
            localStorageMock.setItem('encontreaqui_property_draft_ts', Date.now().toString())

            fetchMock.mockResolvedValue(new Response(null, { status: 401 }))

            const loadedDraft = loadDraft()
            expect(loadedDraft).not.toBeNull()
            expect(await clearRemoteDraftIfStale(loadedDraft!)).toBe(true)
            expect(hasDraft()).toBe(false)
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
