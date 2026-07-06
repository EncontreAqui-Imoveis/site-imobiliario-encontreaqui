'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { areaUnitLabel, normalizeAreaUnidade } from '@/lib/areaUnits'

const FILTER_LABELS: Record<string, string> = {
    search: 'Busca',
    type: 'Tipo',
    purpose: 'Finalidade',
    city: 'Cidade',
    bairro: 'Bairro',
    bedrooms: 'Quartos',
    bathrooms: 'Banheiros',
    garage_spots: 'Garagens',
    minPrice: 'Preço mín.',
    maxPrice: 'Preço máx.',
    minArea: 'Área construída mín.',
    maxArea: 'Área construída máx.',
    areaUnit: 'Unid. área construída',
    minAreaTerreno: 'Área do terreno mín.',
    maxAreaTerreno: 'Área do terreno máx.',
    areaTerrenoUnit: 'Unid. área do terreno',
    sort: 'Ordenar',
    code: 'Código de Referência',
    id: 'ID',
    has_wifi: 'Wi-Fi',
    tem_piscina: 'Piscina',
    tem_energia_solar: 'Energia Solar',
    tem_automacao: 'Automação',
    tem_ar_condicionado: 'Ar-Condicionado',
    amenity_mobiliada: 'Mobiliada',
    amenities: 'Comodidade',
}

const AMENITY_TRANSLATIONS: Record<string, string> = {
    'POÇO ARTESIANO': 'Poço artesiano',
    'ELEVADOR': 'Elevador',
    'ACADEMIA': 'Academia',
    'CHURRASQUEIRA': 'Churrasqueira',
    'SALÃO DE FESTAS': 'Salão de festas',
    'QUADRA': 'Quadra',
    'CONDOMÍNIO FECHADO': 'Condomínio fechado',
    'ACEITA PETS': 'Aceita pets',
    'MOBILIADA': 'Mobiliada',
    'SISTEMA DE SEGURANÇA/CÂMERA': 'Segurança/câmera',
    'SAUNA': 'Sauna',
    'WI-FI': 'Wi-Fi',
    'PISCINA': 'Piscina',
    'ENERGIA SOLAR': 'Energia Solar',
    'AUTOMAÇÃO': 'Automação',
    'AR-CONDICIONADO': 'Ar-condicionado',
}

const SORT_TRANSLATIONS: Record<string, string> = {
    'price:asc': 'Menor preço',
    'price:desc': 'Maior preço',
    'area_construida:desc': 'Maior área',
}

function formatValue(key: string, value: string, searchParams: URLSearchParams): string {
    if (key === 'minPrice' || key === 'maxPrice') {
        const n = Number(value)
        if (!isNaN(n)) return `R$ ${n.toLocaleString('pt-BR')}`
    }
    if (key === 'minArea' || key === 'maxArea') {
        const unit = normalizeAreaUnidade(searchParams.get('areaUnit'))
        return `${value} ${areaUnitLabel(unit)}`.trim()
    }
    if (key === 'areaUnit') return areaUnitLabel(normalizeAreaUnidade(value))
    if (key === 'minAreaTerreno' || key === 'maxAreaTerreno') {
        const unit = normalizeAreaUnidade(searchParams.get('areaTerrenoUnit'))
        return `${value} ${areaUnitLabel(unit)}`.trim()
    }
    if (key === 'areaTerrenoUnit') return areaUnitLabel(normalizeAreaUnidade(value))
    if (key === 'sort') return SORT_TRANSLATIONS[value] || value
    if (key === 'bedrooms' || key === 'bathrooms' || key === 'garage_spots') return `${value}+`
    if (key === 'amenities') {
        const upper = value.toUpperCase()
        return AMENITY_TRANSLATIONS[upper] || value
    }
    if (value === '1') return '' // legacy amenity toggles
    return value
}

export default function ActiveFilterChips() {
    const searchParams = useSearchParams()
    const router = useRouter()

    // Collect active filters
    const activeFilters: { key: string; label: string; value: string; rawValue: string }[] = []
    const ignoredKeys = new Set(['status']) // always 'approved', not user-facing

    searchParams.forEach((value, key) => {
        if (!value || ignoredKeys.has(key)) return
        const label = FILTER_LABELS[key] || key
        const displayValue = formatValue(key, value, searchParams)
        activeFilters.push({ key, label, value: displayValue, rawValue: value })
    })

    if (activeFilters.length === 0) return null

    const removeFilter = (key: string, rawValue: string) => {
        const params = new URLSearchParams()
        searchParams.forEach((val, k) => {
            if (k === key && val === rawValue) {
                // Skip only the clicked key-value pair
                return
            }
            params.append(k, val)
        })
        router.push(`/imoveis?${params.toString()}`)
    }

    const clearAll = () => {
        router.push('/imoveis')
    }

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4">
            {activeFilters.map(({ key, label, value, rawValue }) => (
                <button
                    key={`${key}-${rawValue}`}
                    onClick={() => removeFilter(key, rawValue)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-sm font-medium rounded-full border border-primary-200 hover:bg-primary-100 hover:border-primary-300 transition-colors group"
                >
                    <span>{label}{value ? `: ${value}` : ''}</span>
                    <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </button>
            ))}
            {activeFilters.length > 1 && (
                <button
                    onClick={clearAll}
                    className="text-sm text-slate-500 hover:text-red-600 font-medium px-2 py-1 hover:underline transition-colors"
                >
                    Limpar todos
                </button>
            )}
        </div>
    )
}
