/** Chaves de query que representam filtro ativo na listagem pública. */
const LISTING_FILTER_KEYS = [
    'search',
    'type',
    'purpose',
    'city',
    'bairro',
    'bedrooms',
    'bathrooms',
    'minPrice',
    'maxPrice',
    'minArea',
    'maxArea',
    'areaUnit',
    'tipo_lote',
    'sort',
    'code',
    'id',
    'has_wifi',
    'tem_piscina',
    'tem_energia_solar',
    'tem_automacao',
    'tem_ar_condicionado',
    'eh_mobiliada',
] as const

export function hasActiveListingFilters(
    params: Record<string, string | string[] | undefined>,
): boolean {
    for (const key of LISTING_FILTER_KEYS) {
        const raw = params[key]
        const v = Array.isArray(raw) ? raw[0] : raw
        if (v === undefined || v === null) continue
        const s = String(v).trim()
        if (!s) continue
        if (key === 'areaUnit' && s === 'm2') continue
        return true
    }
    return false
}
