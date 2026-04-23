'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropertyGrid from '@/components/property/PropertyGrid'
import { fetchPublicPropertiesPage } from '@/lib/propertyListingApi'
import { hasActiveListingFilters } from '@/lib/listingFilterUtils'
import type { Property } from '@/types/property'

interface InfinitePropertyResultsProps {
    queryString: string
    pageSize?: number
    onTotalChange?: (total: number) => void
}

const DEFAULT_PAGE_SIZE = 10

function dedupeProperties(items: Property[]): Property[] {
    const map = new Map<number, Property>()
    items.forEach((property) => {
        map.set(property.id, property)
    })
    return [...map.values()]
}

export default function InfinitePropertyResults({
    queryString,
    pageSize = DEFAULT_PAGE_SIZE,
    onTotalChange,
}: InfinitePropertyResultsProps) {
    const [properties, setProperties] = useState<Property[]>([])
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

    const requestVersionRef = useRef(0)
    const isLoadingRef = useRef(false)
    const abortRef = useRef<AbortController | null>(null)
    const sentinelRef = useRef<HTMLDivElement | null>(null)

    const searchParams = useMemo(() => new URLSearchParams(queryString), [queryString])
    const hasFilters = useMemo(() => {
        const asRecord: Record<string, string> = {}
        searchParams.forEach((value, key) => {
            asRecord[key] = value
        })
        return hasActiveListingFilters(asRecord)
    }, [searchParams])

    const hasNextPage = currentPage < totalPages

    const loadPage = useCallback(
        async (page: number, options?: { replace?: boolean }) => {
            if (isLoadingRef.current) return

            const replace = options?.replace ?? false
            if (replace) {
                abortRef.current?.abort()
            }
            const controller = new AbortController()
            abortRef.current = controller
            isLoadingRef.current = true
            setIsLoading(true)
            const version = ++requestVersionRef.current
            try {
                const result = await fetchPublicPropertiesPage(searchParams, page, pageSize, {
                    signal: controller.signal,
                })
                if (requestVersionRef.current !== version) return

                setProperties((prev) =>
                    replace ? result.properties : dedupeProperties([...prev, ...result.properties]),
                )
                setCurrentPage(result.page)
                setTotalPages(result.totalPages)
                onTotalChange?.(result.total)
                setHasLoadedOnce(true)
            } finally {
                if (abortRef.current === controller) {
                    abortRef.current = null
                }
                if (requestVersionRef.current === version) {
                    isLoadingRef.current = false
                    setIsLoading(false)
                }
            }
        },
        [onTotalChange, pageSize, searchParams],
    )

    useEffect(() => {
        setProperties([])
        setCurrentPage(0)
        setTotalPages(0)
        setHasLoadedOnce(false)
        onTotalChange?.(0)
        requestVersionRef.current += 1
        isLoadingRef.current = false
        abortRef.current?.abort()
        void loadPage(1, { replace: true })
    }, [loadPage, onTotalChange, queryString])

    useEffect(() => {
        return () => {
            abortRef.current?.abort()
        }
    }, [])

    useEffect(() => {
        if (!hasNextPage || isLoading) return
        const sentinel = sentinelRef.current
        if (!sentinel) return

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries
                if (!entry?.isIntersecting) return
                void loadPage(currentPage + 1)
            },
            { rootMargin: '300px 0px' },
        )

        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [currentPage, hasNextPage, isLoading, loadPage])

    if (!hasLoadedOnce && isLoading) {
        return <PropertyGrid properties={[]} isLoading />
    }

    return (
        <div className="space-y-6">
            <PropertyGrid properties={properties} illustrateEmptySearch={hasFilters} />

            {isLoading && properties.length > 0 && (
                <div role="status" aria-live="polite" className="py-2 text-center text-sm text-gray-500">
                    Carregando mais imóveis...
                </div>
            )}

            {hasNextPage && <div ref={sentinelRef} aria-hidden className="h-2" />}

            {hasNextPage && properties.length > 5 && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => void loadPage(currentPage + 1)}
                        disabled={isLoading}
                        className="rounded-xl border border-primary-200 bg-white px-5 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 disabled:opacity-60"
                    >
                        {isLoading ? 'Carregando...' : 'Ver mais 10 imóveis'}
                    </button>
                </div>
            )}

            {hasLoadedOnce && !hasNextPage && properties.length > 0 && (
                <p className="py-2 text-center text-sm text-gray-500">
                    Você chegou ao fim dos resultados.
                </p>
            )}
        </div>
    )
}
