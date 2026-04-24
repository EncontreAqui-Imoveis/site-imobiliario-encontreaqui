'use client'

import { useEffect, useMemo, useState } from 'react'
import {
    fetchBairrosWithCount,
    fetchCitiesWithCount,
    type BairroOptionWithCount,
    type CityOptionWithCount,
} from '@/lib/locationOptionsApi'

function normalizeLabel(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
}

export function useLocationOptions(selectedCity: string) {
    const [cities, setCities] = useState<CityOptionWithCount[]>([])
    const [bairros, setBairros] = useState<BairroOptionWithCount[]>([])
    const [isLoadingCities, setIsLoadingCities] = useState(false)
    const [isLoadingBairros, setIsLoadingBairros] = useState(false)
    const [activeCity, setActiveCity] = useState('')

    useEffect(() => {
        let isMounted = true
        setIsLoadingCities(true)

        fetchCitiesWithCount()
            .then((rows) => {
                if (!isMounted) return
                setCities(rows)
            })
            .finally(() => {
                if (!isMounted) return
                setIsLoadingCities(false)
            })

        return () => {
            isMounted = false
        }
    }, [])

    const selectedCityOption = useMemo(() => {
        const normalizedInput = normalizeLabel(selectedCity)
        if (!normalizedInput) return null
        return cities.find((item) => normalizeLabel(item.city) === normalizedInput) ?? null
    }, [cities, selectedCity])

    useEffect(() => {
        if (!selectedCity.trim()) {
            setActiveCity('')
            return
        }

        if (selectedCityOption) {
            setActiveCity(selectedCityOption.city)
            return
        }

        const normalizedInput = normalizeLabel(selectedCity)
        const fuzzyMatches = cities.filter((item) =>
            normalizeLabel(item.city).includes(normalizedInput),
        )
        if (fuzzyMatches.length === 1) {
            setActiveCity(fuzzyMatches[0].city)
            return
        }
        setActiveCity('')
    }, [cities, selectedCity, selectedCityOption])

    useEffect(() => {
        if (!activeCity) {
            setBairros([])
            setIsLoadingBairros(false)
            return
        }

        let isMounted = true
        setIsLoadingBairros(true)

        fetchBairrosWithCount(activeCity)
            .then((rows) => {
                if (!isMounted) return
                setBairros(rows)
            })
            .finally(() => {
                if (!isMounted) return
                setIsLoadingBairros(false)
            })

        return () => {
            isMounted = false
        }
    }, [activeCity])

    return {
        cities,
        bairros,
        isLoadingCities,
        isLoadingBairros,
        selectedCity: activeCity,
        hasSelectedCity: activeCity.trim().length > 0,
    }
}
