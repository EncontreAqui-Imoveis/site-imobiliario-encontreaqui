'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, ChevronDown, SlidersHorizontal, MapPin, Home, Bed, Bath, DollarSign, Filter, Check } from 'lucide-react'

// ... existing options ...
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
    { value: '1', label: '1+' },
    { value: '2', label: '2+' },
    { value: '3', label: '3+' },
    { value: '4', label: '4+' },
]

const bathroomOptions = [
    { value: '', label: 'Qualquer' },
    { value: '1', label: '1+' },
    { value: '2', label: '2+' },
    { value: '3', label: '3+' },
    { value: '4', label: '4+' },
]

const lotTypeOptions = [
    { value: '', label: 'Todos' },
    { value: 'meio', label: 'Meio de quadra' },
    { value: 'inteiro', label: 'Esquina' },
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
    { value: 'title:asc', label: 'A-Z' },
]

export default function SearchFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isOpen, setIsOpen] = useState(false)
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        location: true,
        details: true,
        price: true,
        amenities: false
    })

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

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

    const [amenities, setAmenities] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {}
        amenityOptions.forEach(a => {
            initial[a.key] = searchParams.get(a.key) === '1'
        })
        return initial
    })

    // Sync from URL
    useEffect(() => {
        // Implementation kept simple: just update state when params change
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

        const newAmenities: Record<string, boolean> = {}
        amenityOptions.forEach(a => {
            newAmenities[a.key] = searchParams.get(a.key) === '1'
        })
        setAmenities(newAmenities)

    }, [searchParams])


    const handleChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const toggleAmenity = (key: string) => {
        setAmenities(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const applyFilters = () => {
        const params = new URLSearchParams()

        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.set(key === 'tipoLote' ? 'tipo_lote' : key, value)
        })

        amenityOptions.forEach(a => {
            if (amenities[a.key]) params.set(a.key, '1')
        })

        router.push(`/imoveis?${params.toString()}`)
        if (window.innerWidth < 1024) setIsOpen(false)
    }

    const clearFilters = () => {
        setFilters({
            search: '', type: '', purpose: '', city: '', bedrooms: '',
            bathrooms: '', bairro: '', minPrice: '', maxPrice: '',
            tipoLote: '', sort: '',
        })
        setAmenities(amenityOptions.reduce((acc, a) => ({ ...acc, [a.key]: false }), {}))
        router.push('/imoveis')
        if (window.innerWidth < 1024) setIsOpen(false)
    }

    const hasActiveFilters = Object.values(filters).some(v => v !== '') || Object.values(amenities).some(v => v)


    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="lg:hidden w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm mb-6 group hover:border-primary-500 transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-primary-50 transition-colors">
                        <SlidersHorizontal className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
                    </div>
                    <span className="font-semibold text-gray-900">Filtrar Imóveis</span>
                </div>
                {hasActiveFilters && (
                    <span className="bg-primary-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        Ativos
                    </span>
                )}
            </button>

            {/* Backdrop for Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
                lg:translate-x-0 lg:static lg:w-full lg:max-w-none lg:shadow-none lg:bg-transparent lg:z-0
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="h-full flex flex-col lg:h-auto lg:block bg-white lg:bg-transparent lg:rounded-2xl">

                    {/* Header (Mobile Only) */}
                    <div className="flex items-center justify-between p-5 border-b border-gray-100 lg:hidden">
                        <h3 className="text-xl font-bold text-gray-900">Filtros</h3>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-5 lg:p-0 space-y-4">

                        {/* Desktop Header */}
                        <div className="hidden lg:flex items-center justify-between mb-2">
                            <h3 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                                <Filter className="w-5 h-5" />
                                Filtros
                            </h3>
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="text-sm text-primary-600 hover:text-primary-700 font-semibold hover:underline">
                                    Limpar
                                </button>
                            )}
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => handleChange('search', e.target.value)}
                                placeholder="Buscar por termo..."
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
                            />
                        </div>

                        {/* Purpose Toggle */}
                        <div className="bg-gray-100 p-1 rounded-xl flex">
                            {purposes.map((p) => (
                                <button
                                    key={p.value}
                                    onClick={() => handleChange('purpose', p.value)}
                                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${filters.purpose === p.value
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {p.label || 'Todos'}
                                </button>
                            ))}
                        </div>

                        {/* Section: Location */}
                        <div className="bg-white lg:border lg:border-gray-200 lg:rounded-xl overflow-hidden">
                            <button
                                onClick={() => toggleSection('location')}
                                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-semibold text-gray-900 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    Localização
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.location ? 'rotate-180' : ''}`} />
                            </button>
                            {expandedSections.location && (
                                <div className="p-4 pt-0 space-y-3 border-t border-gray-50 lg:border-none">
                                    <input
                                        type="text"
                                        value={filters.city}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                        placeholder="Cidade"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                    <input
                                        type="text"
                                        value={filters.bairro}
                                        onChange={(e) => handleChange('bairro', e.target.value)}
                                        placeholder="Bairro"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Section: Details */}
                        <div className="bg-white lg:border lg:border-gray-200 lg:rounded-xl overflow-hidden">
                            <button
                                onClick={() => toggleSection('details')}
                                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Home className="w-4 h-4 text-gray-500" />
                                    Detalhes
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.details ? 'rotate-180' : ''}`} />
                            </button>
                            {expandedSections.details && (
                                <div className="p-4 pt-0 space-y-4 border-t border-gray-50 lg:border-none">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Tipo</label>
                                        <select
                                            value={filters.type}
                                            onChange={(e) => handleChange('type', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            {propertyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <Bed className="w-3 h-3" /> Quartos
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {bedroomOptions.map(b => (
                                                <button
                                                    key={b.value}
                                                    onClick={() => handleChange('bedrooms', b.value)}
                                                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${filters.bedrooms === b.value
                                                            ? 'bg-primary-50 border-primary-200 text-primary-700'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {b.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <Bath className="w-3 h-3" /> Banheiros
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {bathroomOptions.map(b => (
                                                <button
                                                    key={b.value}
                                                    onClick={() => handleChange('bathrooms', b.value)}
                                                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${filters.bathrooms === b.value
                                                            ? 'bg-primary-50 border-primary-200 text-primary-700'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {b.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section: Price */}
                        <div className="bg-white lg:border lg:border-gray-200 lg:rounded-xl overflow-hidden">
                            <button
                                onClick={() => toggleSection('price')}
                                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-semibold text-gray-900 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-gray-500" />
                                    Valores
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.price ? 'rotate-180' : ''}`} />
                            </button>
                            {expandedSections.price && (
                                <div className="p-4 pt-0 grid grid-cols-2 gap-3 border-t border-gray-50 lg:border-none">
                                    <input
                                        type="number"
                                        value={filters.minPrice}
                                        onChange={(e) => handleChange('minPrice', e.target.value)}
                                        placeholder="Mínimo"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                    <input
                                        type="number"
                                        value={filters.maxPrice}
                                        onChange={(e) => handleChange('maxPrice', e.target.value)}
                                        placeholder="Máximo"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Amenities & Extras */}
                        <div className="bg-white lg:border lg:border-gray-200 lg:rounded-xl overflow-hidden">
                            <button
                                onClick={() => toggleSection('amenities')}
                                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Check className="w-4 h-4 text-gray-500" />
                                    Comodidades
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.amenities ? 'rotate-180' : ''}`} />
                            </button>
                            {expandedSections.amenities && (
                                <div className="p-4 pt-0 space-y-2 border-t border-gray-50 lg:border-none">
                                    {amenityOptions.map(a => (
                                        <label key={a.key} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${amenities[a.key] ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 bg-white'
                                                }`}>
                                                {amenities[a.key] && <Check className="w-3 h-3" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={amenities[a.key]}
                                                onChange={() => toggleAmenity(a.key)}
                                                className="hidden"
                                            />
                                            <span className="text-sm text-gray-700">{a.label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="p-5 border-t border-gray-100 bg-white lg:bg-transparent lg:border-none lg:p-0 lg:mt-4">
                        <button
                            onClick={applyFilters}
                            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-600/20 transition-all active:scale-[0.98]"
                        >
                            Ver resultados
                        </button>
                        <button
                            onClick={clearFilters}
                            className="lg:hidden w-full mt-3 py-3 text-gray-600 font-semibold"
                        >
                            Limpar filtros
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
