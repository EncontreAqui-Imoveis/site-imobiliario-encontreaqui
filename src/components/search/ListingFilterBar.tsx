'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, Search } from 'lucide-react'
import { useLocationOptions } from './useLocationOptions'
import { CurrencyInput } from '@/components/form/CurrencyInput'
import { parseCurrencyInput } from '@/lib/currencyInput'

const propertyTypes = [
    { value: '', label: 'Categoria' },
    { value: 'Casa', label: 'Casa' },
    { value: 'Apartamento', label: 'Apartamento' },
    { value: 'Terreno', label: 'Terreno' },
    { value: 'Prédio', label: 'Prédio' },
    { value: 'Fazenda', label: 'Fazenda' },
    { value: 'Chácara', label: 'Chácara' },
    { value: 'Sobrado', label: 'Sobrado' },
    { value: 'Kitnet', label: 'Kitnet' },
    { value: 'Cobertura', label: 'Cobertura' },
    { value: 'Galpão', label: 'Galpão' },
    { value: 'Loja', label: 'Loja' },
    { value: 'Sala Comercial', label: 'Sala Comercial' },
]

export default function ListingFilterBar() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [city, setCity] = useState('')
    const [bairro, setBairro] = useState('')
    const [type, setType] = useState('')
    const [minPrice, setMinPrice] = useState('')
    const [maxPrice, setMaxPrice] = useState('')
    const [code, setCode] = useState('')
    const [priceError, setPriceError] = useState<string | null>(null)
    const previousSelectedCityRef = useRef('')
    const { cities, bairros, isLoadingCities, isLoadingBairros, selectedCity, hasSelectedCity } = useLocationOptions(city)
    const normalizeLabel = (value: string) =>
        value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    const filteredCities = useMemo(() => {
        const query = normalizeLabel(city)
        if (!query) return cities
        return cities.filter((item) => normalizeLabel(item.city).includes(query))
    }, [cities, city])
    const filteredBairros = useMemo(() => {
        if (!hasSelectedCity) return []
        const bairroQuery = normalizeLabel(bairro)
        return bairros
            .filter((item) => normalizeLabel(item.bairro).includes(bairroQuery))
    }, [bairros, bairro, hasSelectedCity])

    useEffect(() => {
        setCity(searchParams.get('city') || '')
        setBairro(searchParams.get('bairro') || '')
        setType(searchParams.get('type') || '')
        setMinPrice(searchParams.get('minPrice') || '')
        setMaxPrice(searchParams.get('maxPrice') || '')
        setCode(searchParams.get('code') || '')
    }, [searchParams.toString()])

    useEffect(() => {
        const previousCity = previousSelectedCityRef.current
        const currentCity = selectedCity

        if (
            previousCity &&
            currentCity &&
            previousCity !== currentCity &&
            bairro.trim().length > 0
        ) {
            setBairro('')
        }

        previousSelectedCityRef.current = currentCity
    }, [bairro, selectedCity])

    const apply = useCallback(() => {
        const min = parseCurrencyInput(minPrice)
        const max = parseCurrencyInput(maxPrice)
        if (min > 0 && max > 0 && max < min) {
            setPriceError('O valor máximo deve ser maior ou igual ao mínimo.')
            return
        }
        setPriceError(null)
        const next = new URLSearchParams(searchParams.toString())
        const setOrDelete = (key: string, value: string) => {
            const t = value.trim()
            if (t) next.set(key, t)
            else next.delete(key)
        }
        setOrDelete('city', city)
        setOrDelete('bairro', bairro)
        setOrDelete('type', type)
        setOrDelete('minPrice', min > 0 ? String(min) : '')
        setOrDelete('maxPrice', max > 0 ? String(max) : '')
        setOrDelete('code', code)
        next.delete('id')
        router.push(`/imoveis?${next.toString()}`)
    }, [city, bairro, type, minPrice, maxPrice, code, router, searchParams])

    return (
        <div
            className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            aria-label="Filtros rápidos na listagem"
        >
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Filter className="h-4 w-4 text-primary-600" />
                Filtros rápidos
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7 lg:items-end">
                <div className="lg:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-gray-500">Cidade</label>
                    <input
                        value={city}
                        onChange={(e) => {
                            setCity(e.target.value)
                        }}
                        list="listing-city-options"
                        autoComplete="off"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                        placeholder={isLoadingCities ? 'Carregando cidades...' : 'Digite a cidade'}
                    />
                    <datalist id="listing-city-options">
                        {filteredCities.map((cityOption) => (
                            <option key={cityOption.city} value={cityOption.city}>
                                {`${cityOption.city} (${cityOption.total})`}
                            </option>
                        ))}
                    </datalist>
                </div>
                <div className="lg:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-gray-500">Bairro</label>
                    <input
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        list="listing-bairro-options"
                        autoComplete="off"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                        disabled={!hasSelectedCity || isLoadingBairros}
                        placeholder={
                            !hasSelectedCity
                                ? 'Selecione uma cidade primeiro'
                                : isLoadingBairros
                                    ? 'Carregando bairros...'
                                    : 'Digite o bairro'
                        }
                    />
                    <datalist id="listing-bairro-options">
                        {filteredBairros.map((bairroOption) => (
                            <option key={`${bairroOption.city}-${bairroOption.bairro}`} value={bairroOption.bairro}>
                                {`${bairroOption.bairro} (${bairroOption.total})`}
                            </option>
                        ))}
                    </datalist>
                </div>
                <div className="lg:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-gray-500">Categoria</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    >
                        {propertyTypes.map((t) => (
                            <option key={t.value || 'all'} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Valor mín. (R$)</label>
                    <CurrencyInput
                        value={minPrice}
                        onChange={setMinPrice}
                        placeholder="0"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Valor máx. (R$)</label>
                    <CurrencyInput
                        value={maxPrice}
                        onChange={setMaxPrice}
                        placeholder="Sem limite"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    />
                </div>
                <div className="lg:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-gray-500">Código ou ID</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        maxLength={80}
                        placeholder="Código ou UUID"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    />
                </div>
                <div className="flex sm:col-span-2 lg:col-span-1">
                    <button
                        type="button"
                        onClick={apply}
                        className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary-700"
                    >
                        <Search className="h-4 w-4" />
                        Aplicar
                    </button>
                </div>
                {priceError && (
                    <p className="sm:col-span-2 lg:col-span-7 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {priceError}
                    </p>
                )}
            </div>
        </div>
    )
}
