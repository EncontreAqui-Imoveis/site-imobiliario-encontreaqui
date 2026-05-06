import { buildTeamContactChannelUrl, resolveTeamContactPhone } from '@/lib/contactLinks'

describe('contactLinks', () => {
    const originalEnv = { ...process.env } as NodeJS.ProcessEnv

    beforeEach(() => {
        process.env.NEXT_PUBLIC_TEAM_CONTACT_WHATSAPP_PHONE = ''
        process.env.NEXT_PUBLIC_TEAM_CONTACT_PHONE = ''
        process.env.NEXT_PUBLIC_SUPPORT_PHONE = ''
    })

    afterEach(() => {
        process.env = { ...originalEnv }
    })

    it('usa o número oficial de fallback do WhatsApp quando não houver env', () => {
        expect(resolveTeamContactPhone()).toBe('5564992732027')
        expect(buildTeamContactChannelUrl()).toBe('https://wa.me/5564992732027')
    })

    it('usa o número oficial da empresa via variável de ambiente', () => {
        process.env.NEXT_PUBLIC_TEAM_CONTACT_WHATSAPP_PHONE = '(64) 99273-2027'
        expect(resolveTeamContactPhone()).toBe('5564992732027')
        expect(buildTeamContactChannelUrl()).toBe('https://wa.me/5564992732027')
    })

    it('descarta o placeholder antigo e aplica fallback', () => {
        expect(resolveTeamContactPhone('5511999999999')).toBe('5564992732027')
        expect(buildTeamContactChannelUrl('5511999999999')).toBe('https://wa.me/5564992732027')
    })
})
