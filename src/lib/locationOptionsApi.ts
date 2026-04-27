import { API_BASE_URL } from '@/lib/api/client'

export interface CityOptionWithCount {
    city: string
    total: number
}

export interface BairroOptionWithCount {
    bairro: string
    city: string
    total: number
}

export async function fetchCitiesByState(uf: string): Promise<string[]> {
    if (uf.trim().length !== 2) return []

    try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf.toUpperCase()}/municipios`)
        if (!response.ok) return []

        const payload = (await response.json()) as Array<{ nome?: string }>
        if (!Array.isArray(payload)) return []

        return payload
            .map((row) => String(row?.nome ?? '').trim())
            .filter((city) => city.length > 0)
            .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    } catch (error) {
        console.error('Erro ao carregar cidades por estado:', error)
        return []
    }
}

function normalizeCount(value: unknown): number {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < 0) return 0
    return Math.trunc(parsed)
}

function normalizeText(value: unknown): string {
    return String(value ?? '').trim()
}

export async function fetchCitiesWithCount(): Promise<CityOptionWithCount[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/properties/cities-with-count`, { cache: 'no-store' })
        if (!response.ok) return []

        const payload = await response.json()
        if (!Array.isArray(payload)) return []

        return payload
            .map((row) => ({
                city: normalizeText((row as Record<string, unknown>)?.city),
                total: normalizeCount((row as Record<string, unknown>)?.total),
            }))
            .filter((row) => row.city.length > 0)
    } catch (error) {
        console.error('Erro ao carregar cidades com contagem:', error)
        return []
    }
}

export async function fetchBairrosWithCount(city?: string): Promise<BairroOptionWithCount[]> {
    try {
        const params = new URLSearchParams()
        const normalizedCity = normalizeText(city)
        if (normalizedCity) params.set('city', normalizedCity)
        const query = params.toString()
        const url = query
            ? `${API_BASE_URL}/properties/bairros?${query}`
            : `${API_BASE_URL}/properties/bairros`
        const response = await fetch(url, { cache: 'no-store' })
        if (!response.ok) return []

        const payload = await response.json()
        if (!Array.isArray(payload)) return []

        return payload
            .map((row) => ({
                bairro: normalizeText((row as Record<string, unknown>)?.bairro),
                city: normalizeText((row as Record<string, unknown>)?.city),
                total: normalizeCount((row as Record<string, unknown>)?.total),
            }))
            .filter((row) => row.bairro.length > 0)
    } catch (error) {
        console.error('Erro ao carregar bairros com contagem:', error)
        return []
    }
}
