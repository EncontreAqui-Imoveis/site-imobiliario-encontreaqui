'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, ChevronDown, SlidersHorizontal } from 'lucide-react'

const propertyTypes = [
    { value: '', label: 'Todos os tipos' },
    { value: 'Casa', label: 'Casa' },
    { value: 'Apartamento', label: 'Apartamento' },
    { value: 'Terreno', label: 'Terreno' },
    { value: 'Propriedade Rural', label: 'Rural' },
    { value: 'Propriedade Comercial', label: 'Comercial' },
]

const purposes = [
    { value: '', label: 'Todos' },
    { value: 'Venda', label: 'Comprar' },
    { value: 'Aluguel', label: 'Alugar' },
]

const bedroomOptions = [
    { value: '', label: 'Qualquer' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4+' },
]

const bathroomOptions = [
    { value: '', label: 'Qualquer' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4+' },
]

const lotTypeOptions = [
    { value: '', label: 'Todos' },
    { value: 'meio', label: 'Meio' },
    { value: 'inteiro', label: 'Inteiro' },
]

const amenityOptions = [
    { key: 'has_wifi', label: 'Wi-Fi' },
    { key: 'tem_piscina', label: 'Piscina' },
    { key: 'tem_energia_solar', label: 'Energia Solar' },
    { key: 'tem_automacao', label: 'Automação' },
    { key: 'tem_ar_condicionado', label: 'Ar-Condicionado' },
    { key: 'eh_mobiliada', label: 'Mobiliada' },
]

const sortOptions = [
    { value: '', label: 'Padrão' },
    { value: 'created_at:desc', label: 'Mais recentes' },
    { value: 'created_at:asc', label: 'Mais antigos' },
    { value: 'price:asc', label: 'Menor preço' },
    { value: 'price:desc', label: 'Maior preço' },
    { value: 'title:asc', label: 'Ordem alfabética' },
]

export default function SearchFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isOpen, setIsOpen] = useState(false)

    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        type: searchParams.get('type') || '',
        purpose: searchParams.get('purpose') || '',
        city: searchParams.get('city') || '',
        bedrooms: searchParams.get('bedrooms') || '',
        bathrooms: searchParams.get('bathrooms') || '',
        bairro: searchParams.get('bairro') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        tipoLote: searchParams.get('tipo_lote') || '',
        sort: searchParams.get('sort') || '',
    })

    // Sync filters with URL params when they change externally
    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            search: searchParams.get('search') || '',
            type: searchParams.get('type') || '',
            purpose: searchParams.get('purpose') || '',
            city: searchParams.get('city') || '',
            bedrooms: searchParams.get('bedrooms') || '',
            bathrooms: searchParams.get('bathrooms') || '',
            bairro: searchParams.get('bairro') || '',
            minPrice: searchParams.get('minPrice') || '',
            maxPrice: searchParams.get('maxPrice') || '',
            tipoLote: searchParams.get('tipo_lote') || '',
            sort: searchParams.get('sort') || '',
        }))
    }, [searchParams])

    const [amenities, setAmenities] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {}
        amenityOptions.forEach(a => {
            initial[a.key] = searchParams.get(a.key) === '1'
        })
        return initial
    })

    const handleChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const toggleAmenity = (key: string) => {
        setAmenities(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const applyFilters = () => {
        const params = new URLSearchParams()

        // Preserve search param if it exists
        if (filters.search) params.set('search', filters.search)
        if (filters.type) params.set('type', filters.type)
        if (filters.purpose) params.set('purpose', filters.purpose)
        if (filters.city) params.set('city', filters.city)
        if (filters.bedrooms) params.set('bedrooms', filters.bedrooms)
        if (filters.bathrooms) params.set('bathrooms', filters.bathrooms)
        if (filters.bairro) params.set('bairro', filters.bairro)
        if (filters.minPrice) params.set('minPrice', filters.minPrice)
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
        if (filters.tipoLote) params.set('tipo_lote', filters.tipoLote)
        if (filters.sort) params.set('sort', filters.sort)

        // Add amenities
        amenityOptions.forEach(a => {
            if (amenities[a.key]) params.set(a.key, '1')
        })

        router.push(`/imoveis?${params.toString()}`)
        setIsOpen(false)
    }

    const clearFilters = () => {
        setFilters({
            search: '',
            type: '',
            purpose: '',
            city: '',
            bedrooms: '',
            bathrooms: '',
            bairro: '',
            minPrice: '',
            maxPrice: '',
            tipoLote: '',
            sort: '',
        })
        setAmenities(amenityOptions.reduce((acc, a) => ({ ...acc, [a.key]: false }), {}))
        router.push('/imoveis')
        setIsOpen(false)
    }

    const hasActiveAmenities = Object.values(amenities).some(v => v)

    const hasActiveFilters = Object.values(filters).some(v => v !== '') || hasActiveAmenities

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm mb-4"
            >
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Filtros</span>
                    {hasActiveFilters && (
                        <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                            !
                        </span>
                    )}
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Filters Panel */}
            <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${isOpen ? 'block' : 'hidden lg:block'
                }`}>
                <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <SlidersHorizontal className="w-5 h-5" />
                            Filtrar imóveis
                        </h3>
                        <div className="flex items-center gap-2">
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={applyFilters}
                                className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-1"
                            >
                                <Search className="w-3.5 h-3.5" />
                                Aplicar
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-5 space-y-5">
                    {/* Purpose */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Finalidade
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {purposes.map((p) => (
                                <button
                                    key={p.value}
                                    onClick={() => handleChange('purpose', p.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filters.purpose === p.value
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de imóvel
                        </label>
                        <select
                            value={filters.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {propertyTypes.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* City */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cidade
                        </label>
                        <input
                            type="text"
                            value={filters.city}
                            onChange={(e) => handleChange('city', e.target.value)}
                            placeholder="Ex: Rio Verde"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Bedrooms */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quartos
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {bedroomOptions.map((b) => (
                                <button
                                    key={b.value}
                                    onClick={() => handleChange('bedrooms', b.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filters.bedrooms === b.value
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {b.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bathrooms */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Banheiros
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {bathroomOptions.map((b) => (
                                <button
                                    key={b.value}
                                    onClick={() => handleChange('bathrooms', b.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filters.bathrooms === b.value
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {b.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bairro */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bairro
                        </label>
                        <input
                            type="text"
                            value={filters.bairro}
                            onChange={(e) => handleChange('bairro', e.target.value)}
                            placeholder="Ex: Centro"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Lot Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Lote
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {lotTypeOptions.map((l) => (
                                <button
                                    key={l.value}
                                    onClick={() => handleChange('tipoLote', l.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filters.tipoLote === l.value
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {l.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amenities */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Comodidades
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {amenityOptions.map((a) => (
                                <button
                                    key={a.key}
                                    onClick={() => toggleAmenity(a.key)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${amenities[a.key]
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Faixa de Preço
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <input
                                    type="number"
                                    value={filters.minPrice}
                                    onChange={(e) => handleChange('minPrice', e.target.value)}
                                    placeholder="Mínimo"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <input
                                    type="number"
                                    value={filters.maxPrice}
                                    onChange={(e) => handleChange('maxPrice', e.target.value)}
                                    placeholder="Máximo"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sort */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ordenar por
                        </label>
                        <select
                            value={filters.sort}
                            onChange={(e) => handleChange('sort', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {sortOptions.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-5 border-t border-gray-100 space-y-3">
                    <button
                        onClick={applyFilters}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all"
                    >
                        <Search className="w-4 h-4" />
                        Aplicar filtros
                    </button>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-600 hover:text-gray-900 font-medium transition-all"
                        >
                            <X className="w-4 h-4" />
                            Limpar filtros
                        </button>
                    )}
                </div>
            </div>
        </>
    )
}
