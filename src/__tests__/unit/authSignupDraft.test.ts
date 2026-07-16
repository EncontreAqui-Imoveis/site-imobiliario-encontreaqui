describe('authSignupDraft', () => {
    let draftModule: typeof import('@/lib/authSignupDraft')

    beforeEach(async () => {
        jest.resetModules()
        window.localStorage.clear()
        draftModule = await import('@/lib/authSignupDraft')
    })

    it('saves and restores a signup draft', () => {
        const draft = draftModule.createSignupDraft({
            source: 'email',
            userType: 'broker',
            step: 'address',
            data: {
                name: 'Marina',
                email: 'marina@teste.com',
                creci: '12345-F',
            },
        })

        draftModule.saveSignupDraft(draft)

        expect(draftModule.loadSignupDraft()).toMatchObject({
            source: 'email',
            userType: 'broker',
            step: 'address',
            data: {
                name: 'Marina',
                email: 'marina@teste.com',
                creci: '12345-F',
            },
        })
    })

    it('resolves the correct route for the current signup step', () => {
        expect(
            draftModule.resolveSignupDraftHref(
                draftModule.createSignupDraft({ step: 'email' }),
            ),
        ).toBe('/auth/cadastro')

        expect(
            draftModule.resolveSignupDraftHref(
                draftModule.createSignupDraft({ step: 'phone' }),
            ),
        ).toBe('/auth/cadastro')
    })

    it('stores a pending phone update draft', () => {
        draftModule.savePendingPhoneUpdateDraft({
            phone: '62999999999',
            payload: {
                phone: '62999999999',
                city: 'Goiânia',
            },
            updatedAt: new Date().toISOString(),
        })

        expect(draftModule.loadPendingPhoneUpdateDraft()).toMatchObject({
            phone: '62999999999',
            payload: {
                phone: '62999999999',
                city: 'Goiânia',
            },
        })
    })
})
