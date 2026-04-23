'use client'

import { useEffect, useMemo } from 'react'
import { ChevronDown, MapPin } from 'lucide-react'
import { useLocationOptions } from '@/components/search/useLocationOptions'

type LocationSelectFieldsProps = {
    city: string
    bairro: string
    onCityChange: (value: string) => void
    onBairroChange: (value: string) => void
}

export default function LocationSelectFields({
    city,
    bairro,
    onCityChange,
    onBairroChange,
}: LocationSelectFieldsProps) {
    const { cities, bairros, isLoadingCities, isLoadingBairros } = useLocationOptions(city)
    const normalizeLabel = (value: string) =>
        value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()

    const hasSelectedCity = city.trim().length > 0
    const filteredCityOptions = useMemo(() => {
        const query = normalizeLabel(city)
        if (!query) return cities
        return cities.filter((item) => normalizeLabel(item.city).includes(query))
    }, [cities, city])
    const bairroOptions = useMemo(
        () =>
            hasSelectedCity
                ? bairros
                    .filter((item) => normalizeLabel(item.city) === normalizeLabel(city))
                    .filter((item) => normalizeLabel(item.bairro).includes(normalizeLabel(bairro)))
                : [],
        [bairros, bairro, city, hasSelectedCity],
    )

    useEffect(() => {
        if (!hasSelectedCity && bairro) {
            onBairroChange('')
        }
    }, [bairro, hasSelectedCity, onBairroChange])

    return (
        <>
            <div className="relative">
                <label htmlFor="hero-city" className="block text-[10px] sm:text-xs font-medium text-white mb-1 text-left">
                    Cidade
                </label>
                <div className="relative">
                    <MapPin className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                    <input
                        id="hero-city"
                        name="city"
                        value={city}
                        onChange={(e) => onCityChange(e.target.value)}
                        list="hero-city-options"
                        autoComplete="off"
                        placeholder={isLoadingCities ? 'Carregando cidades...' : 'Digite a cidade'}
                        className="w-full min-h-[44px] bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-3 text-sm sm:text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                    <datalist id="hero-city-options">
                        {filteredCityOptions.map((item) => (
                            <option key={item.city} value={item.city}>
                                {`${item.city} (${item.total})`}
                            </option>
                        ))}
                    </datalist>
                    <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                </div>
            </div>

            <div className="relative">
                <label htmlFor="hero-bairro" className="block text-[10px] sm:text-xs font-medium text-white mb-1 text-left">
                    Bairro
                </label>
                <div className="relative">
                    <input
                        id="hero-bairro"
                        name="bairro"
                        value={bairro}
                        onChange={(e) => onBairroChange(e.target.value)}
                        list="hero-bairro-options"
                        autoComplete="off"
                        disabled={!hasSelectedCity}
                        placeholder={
                            !hasSelectedCity
                                ? 'Selecione uma cidade primeiro'
                                : isLoadingBairros
                                    ? 'Carregando bairros...'
                                    : 'Digite o bairro'
                        }
                        className="w-full min-h-[44px] bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-2 sm:py-3 pr-8 sm:pr-10 text-sm sm:text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-70"
                    />
                    <datalist id="hero-bairro-options">
                        {bairroOptions.map((item) => (
                            <option key={`${item.city}-${item.bairro}`} value={item.bairro}>
                                {`${item.bairro} (${item.total})`}
                            </option>
                        ))}
                    </datalist>
                    <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                </div>
            </div>
        </>
    )
}
