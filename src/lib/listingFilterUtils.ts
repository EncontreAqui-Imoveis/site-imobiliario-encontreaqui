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
    'sort',
    'code',
    'id',
    'has_wifi',
    'tem_piscina',
    'tem_energia_solar',
    'tem_automacao',
    'tem_ar_condicionado',
    'amenity_mobiliada',
    'amenity_poco_artesiano',
    'amenity_elevador',
    'amenity_academia',
    'amenity_churrasqueira',
    'amenity_salao_festas',
    'amenity_quadra',
    'amenity_condominio_fechado',
    'amenity_aceita_pets',
    'amenity_sistema_seguranca_camera',
    'amenity_sauna',
    'garage_spots',
    'minAreaTerreno',
    'maxAreaTerreno',
    'areaTerrenoUnit',
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
        if (key === 'areaTerrenoUnit' && s === 'm2') continue
        return true
    }
    return false
}
