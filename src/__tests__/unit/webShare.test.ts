import { shareOrCopy } from '@/lib/webShare'

describe('webShare', () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })

    it('uses Web Share API when available', async () => {
        const share = jest.fn().mockResolvedValue(undefined)
        Object.assign(global.navigator, { share })

        const result = await shareOrCopy({
            title: 'Casa teste',
            text: 'Confira este imóvel',
            url: 'https://example.com/imoveis/1',
        })

        expect(share).toHaveBeenCalledWith({
            title: 'Casa teste',
            text: 'Confira este imóvel',
            url: 'https://example.com/imoveis/1',
        })
        expect(result).toEqual({ kind: 'shared' })
    })

    it('falls back to clipboard copy when native share is unavailable', async () => {
        const writeText = jest.fn().mockResolvedValue(undefined)
        Object.assign(global.navigator, {
            share: undefined,
            clipboard: { writeText },
        })

        const result = await shareOrCopy({
            title: 'Casa teste',
            text: 'Confira este imóvel',
            url: 'https://example.com/imoveis/1',
        })

        expect(writeText).toHaveBeenCalledWith('https://example.com/imoveis/1')
        expect(result).toEqual({ kind: 'copied' })
    })
})
