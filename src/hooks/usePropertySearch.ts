'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { parseCurrencyInput } from '@/lib/currencyInput'

type SearchState = {
    type: string
    purpose: string
    city: string
    bairro: string
    minPrice: string
    maxPrice: string
    code: string
    limit: number
    bedrooms: string
}

const INITIAL_STATE: SearchState = {
    type: '',
    purpose: '',
    city: '',
    bairro: '',
    minPrice: '',
    maxPrice: '',
    code: '',
    limit: 10,
    bedrooms: '',
}

function trimOrEmpty(value: string): string {
    return value.trim()
}

export function usePropertySearch() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [form, setForm] = useState<SearchState>(INITIAL_STATE)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [targetRoute, setTargetRoute] = useState<string | null>(null)
    const [validationError, setValidationError] = useState<string | null>(null)

    const setField = useCallback(<K extends keyof SearchState>(key: K, value: SearchState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }, [])

    const buildQuery = useCallback((state: SearchState) => {
        const params = new URLSearchParams()
        if (state.type) params.set('type', state.type)
        if (state.purpose) params.set('purpose', state.purpose)

        const city = trimOrEmpty(state.city)
        if (city) params.set('city', city)

        const bairro = trimOrEmpty(state.bairro)
        if (bairro) params.set('bairro', bairro)

        const minPrice = trimOrEmpty(state.minPrice)
        if (minPrice) params.set('minPrice', String(parseCurrencyInput(minPrice)))

        const maxPrice = trimOrEmpty(state.maxPrice)
        if (maxPrice) params.set('maxPrice', String(parseCurrencyInput(maxPrice)))

        const code = trimOrEmpty(state.code)
        if (code) params.set('code', code)

        const bedrooms = trimOrEmpty(state.bedrooms)
        if (bedrooms) params.set('bedrooms', bedrooms)

        if (state.limit > 0) params.set('limit', String(state.limit))

        return params.toString()
    }, [])

    const handleSearch = useCallback(() => {
        const minPrice = parseCurrencyInput(form.minPrice)
        const maxPrice = parseCurrencyInput(form.maxPrice)
        if (maxPrice > 0 && minPrice > 0 && maxPrice < minPrice) {
            setValidationError('O valor máximo deve ser maior ou igual ao mínimo.')
            return
        }
        setValidationError(null)
        const query = buildQuery(form)
        const target = query.length > 0 ? `/imoveis?${query}` : '/imoveis'

        setIsSubmitting(true)
        setTargetRoute(target)
        startTransition(() => {
            router.push(target)
        })
    }, [buildQuery, form, router])

    const currentRoute = useMemo(() => {
        const query = searchParams?.toString() ?? ''
        return query.length > 0 ? `${pathname}?${query}` : pathname
    }, [pathname, searchParams])

    useEffect(() => {
        if (!isSubmitting || !targetRoute) return
        if (currentRoute === targetRoute) {
            setIsSubmitting(false)
            setTargetRoute(null)
        }
    }, [currentRoute, isSubmitting, targetRoute])

    return {
        form,
        setField,
        handleSearch,
        validationError,
        increaseLimit: () => setForm((prev) => ({ ...prev, limit: prev.limit + 10 })),
        isSearching: isSubmitting || isPending,
    }
}
