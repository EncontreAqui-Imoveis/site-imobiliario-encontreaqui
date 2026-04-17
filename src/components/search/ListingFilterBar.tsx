'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, Search } from 'lucide-react'

const propertyTypes = [
    { value: '', label: 'Categoria' },
    { value: 'Casa', label: 'Casa' },
    { value: 'Apartamento', label: 'Apartamento' },
    { value: 'Terreno', label: 'Terreno' },
    { value: 'Propriedade Rural', label: 'Rural' },
    { value: 'Propriedade Comercial', label: 'Comercial' },
]

export default function ListingFilterBar() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [bairro, setBairro] = useState('')
    const [type, setType] = useState('')
    const [minPrice, setMinPrice] = useState('')
    const [maxPrice, setMaxPrice] = useState('')
    const [code, setCode] = useState('')

    useEffect(() => {
        setBairro(searchParams.get('bairro') || '')
        setType(searchParams.get('type') || '')
        setMinPrice(searchParams.get('minPrice') || '')
        setMaxPrice(searchParams.get('maxPrice') || '')
        setCode(searchParams.get('code') || '')
    }, [searchParams.toString()])

    const apply = useCallback(() => {
        const next = new URLSearchParams(searchParams.toString())
        const setOrDelete = (key: string, value: string) => {
            const t = value.trim()
            if (t) next.set(key, t)
            else next.delete(key)
        }
        setOrDelete('bairro', bairro)
        setOrDelete('type', type)
        setOrDelete('minPrice', minPrice)
        setOrDelete('maxPrice', maxPrice)
        setOrDelete('code', code)
        next.delete('id')
        router.push(`/imoveis?${next.toString()}`)
    }, [bairro, type, minPrice, maxPrice, code, router, searchParams])

    return (
        <div
            className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            aria-label="Filtros rápidos na listagem"
        >
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Filter className="h-4 w-4 text-primary-600" />
                Filtros rápidos
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
                <div className="lg:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-gray-500">Bairro</label>
                    <input
                        type="text"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        maxLength={120}
                        placeholder="Ex: Setor Bueno"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    />
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
                    <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Valor máx. (R$)</label>
                    <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="Sem limite"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    />
                </div>
                <div className="lg:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-gray-500">Código ou ID</label>
                    <input
                        type="text"
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
            </div>
        </div>
    )
}
