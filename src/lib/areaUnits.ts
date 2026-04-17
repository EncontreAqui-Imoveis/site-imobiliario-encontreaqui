/** Alinha com backend: `propertyAreaUnits.ts` — valores canônicos em m². */
export type AreaConstruidaUnidade = 'm2' | 'alqueire' | 'hectare'

const M2_PER_HECTARE = 10_000
const M2_PER_ALQUEIRE = 24_200

export function normalizeAreaUnidade(raw: string | null | undefined): AreaConstruidaUnidade {
    const u = String(raw ?? '')
        .trim()
        .toLowerCase()
    if (u === 'alqueire' || u === 'alq') return 'alqueire'
    if (u === 'hectare' || u === 'ha') return 'hectare'
    return 'm2'
}

export function areaInputToSquareMeters(value: number, unidade: AreaConstruidaUnidade): number {
    if (!Number.isFinite(value) || value < 0) return Number.NaN
    switch (unidade) {
        case 'm2':
            return value
        case 'hectare':
            return value * M2_PER_HECTARE
        case 'alqueire':
            return value * M2_PER_ALQUEIRE
        default:
            return value
    }
}

export function areaUnitLabel(u: AreaConstruidaUnidade): string {
    switch (u) {
        case 'hectare':
            return 'ha'
        case 'alqueire':
            return 'alqueire'
        default:
            return 'm²'
    }
}

/** Converte m² (valor canônico da API) para exibição no input na unidade escolhida. */
export function squareMetersToAreaInput(
    m2: number | null | undefined,
    unidade: AreaConstruidaUnidade,
): string {
    if (m2 == null || !Number.isFinite(m2) || m2 < 0) return ''
    let v: number
    switch (unidade) {
        case 'hectare':
            v = m2 / M2_PER_HECTARE
            break
        case 'alqueire':
            v = m2 / M2_PER_ALQUEIRE
            break
        default:
            v = m2
    }
    const s = v.toFixed(6).replace(/\.?0+$/, '')
    return s === '' ? '0' : s
}
