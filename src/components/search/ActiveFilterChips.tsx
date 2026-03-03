'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { X } from 'lucide-react'

const FILTER_LABELS: Record<string, string> = {
    search: 'Busca',
    type: 'Tipo',
    purpose: 'Finalidade',
    city: 'Cidade',
    bairro: 'Bairro',
    bedrooms: 'Quartos',
    bathrooms: 'Banheiros',
    minPrice: 'Preço mín.',
    maxPrice: 'Preço máx.',
    tipo_lote: 'Tipo de lote',
    sort: 'Ordenar',
    has_wifi: 'Wi-Fi',
    tem_piscina: 'Piscina',
    tem_energia_solar: 'Energia Solar',
    tem_automacao: 'Automação',
    tem_ar_condicionado: 'Ar-Condicionado',
    eh_mobiliada: 'Mobiliada',
}

function formatValue(key: string, value: string): string {
    if (key === 'minPrice' || key === 'maxPrice') {
        const n = Number(value)
        if (!isNaN(n)) return `R$ ${n.toLocaleString('pt-BR')}`
    }
    if (key === 'bedrooms' || key === 'bathrooms') return `${value}+`
    if (value === '1') return '' // amenity toggles
    return value
}

export default function ActiveFilterChips() {
    const searchParams = useSearchParams()
    const router = useRouter()

    // Collect active filters
    const activeFilters: { key: string; label: string; value: string }[] = []
    const ignoredKeys = new Set(['status']) // always 'approved', not user-facing

    searchParams.forEach((value, key) => {
        if (!value || ignoredKeys.has(key)) return
        const label = FILTER_LABELS[key] || key
        const displayValue = formatValue(key, value)
        activeFilters.push({ key, label, value: displayValue })
    })

    if (activeFilters.length === 0) return null

    const removeFilter = (key: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete(key)
        router.push(`/imoveis?${params.toString()}`)
    }

    const clearAll = () => {
        router.push('/imoveis')
    }

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4">
            {activeFilters.map(({ key, label, value }) => (
                <button
                    key={key}
                    onClick={() => removeFilter(key)}
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
