'use client'

import { useEffect, useMemo, useState } from 'react'
import {
    fetchBairrosWithCount,
    fetchCitiesWithCount,
    type BairroOptionWithCount,
    type CityOptionWithCount,
} from '@/lib/locationOptionsApi'

export function useLocationOptions(selectedCity: string) {
    const [cities, setCities] = useState<CityOptionWithCount[]>([])
    const [bairros, setBairros] = useState<BairroOptionWithCount[]>([])
    const [isLoadingCities, setIsLoadingCities] = useState(false)
    const [isLoadingBairros, setIsLoadingBairros] = useState(false)

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

    useEffect(() => {
        let isMounted = true
        setIsLoadingBairros(true)

        fetchBairrosWithCount(selectedCity)
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
    }, [selectedCity])

    const availableBairros = useMemo(() => {
        const normalizedCity = selectedCity.trim().toLowerCase()
        if (!normalizedCity) return bairros
        return bairros.filter((item) => item.city.trim().toLowerCase() === normalizedCity)
    }, [bairros, selectedCity])

    return {
        cities,
        bairros: availableBairros,
        isLoadingCities,
        isLoadingBairros,
    }
}
