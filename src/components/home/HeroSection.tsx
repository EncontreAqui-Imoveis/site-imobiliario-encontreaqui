'use client'

import React, { useEffect, useMemo } from 'react'
import Image from 'next/image'
import { ChevronDown, Loader2 } from 'lucide-react'
import { usePropertySearch } from '@/hooks/usePropertySearch'
import { useLocationOptions } from '@/components/search/useLocationOptions'
import { CurrencyInput } from '@/components/form/CurrencyInput'

const HERO_IMAGE = '/marketing/home-hero.webp'

const propertyTypes = [
    { value: '', label: 'Todos os tipos' },
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

type HomeDeal = 'sale' | 'rent'

export default function HeroSection({ initialDeal = 'sale' }: { initialDeal?: HomeDeal }) {
    const { form, setField, handleSearch, isSearching, validationError } = usePropertySearch()

    // Sync purpose to 'Venda' / 'Aluguel' on mount if it's empty
    useEffect(() => {
        if (!form.purpose) {
            setField('purpose', initialDeal === 'rent' ? 'Aluguel' : 'Venda')
        }
    }, [form.purpose, setField, initialDeal])

    // Load locations using useLocationOptions hook
    const {
        cities,
        bairros,
        isLoadingCities,
        isLoadingBairros,
        selectedCity,
        hasSelectedCity,
    } = useLocationOptions(form.city)

    // Helper for normalizing labels for filtering
    const normalizeLabel = (value: string) =>
        value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()

    // Filter cities based on user input
    const filteredCityOptions = useMemo(() => {
        const query = normalizeLabel(form.city)
        if (!query) return cities
        return cities.filter((item) => normalizeLabel(item.city).includes(query))
    }, [cities, form.city])

    // Filter bairros based on user input and selected city
    const bairroOptions = useMemo(
        () =>
            hasSelectedCity
                ? bairros.filter((item) => normalizeLabel(item.bairro).includes(normalizeLabel(form.bairro)))
                : [],
        [bairros, form.bairro, hasSelectedCity],
    )

    return (
        <section
            className="relative flex min-h-[min(100svh,900px)] items-center overflow-hidden bg-[#f8fafc] pt-20 pb-12 lg:min-h-[750px]"
            aria-label="Destaque da página inicial"
        >
            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Card Fundido de Duas Colunas (Pesquisa + Imagem) */}
                <div className="mt-0 lg:mt-2 flex flex-col lg:flex-row w-full bg-white shadow-sm border border-gray-200/80 rounded-2xl overflow-hidden items-stretch">
                    {/* ══════════════════════════════════════════════════
                        PAINEL ESQUERDO — Formulário de Pesquisa (Equilibrado 50%)
                    ══════════════════════════════════════════════════ */}
                    <div className="w-full lg:w-1/2 px-8 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-20 flex flex-col justify-center">
                        {/* Pill Switcher Comprar / Alugar */}
                        <div className="relative inline-grid grid-cols-2 p-1 bg-gray-100/70 rounded-full w-48 mb-5 mt-3 border border-gray-200/40 select-none">
                            <div
                                className="absolute top-1 bottom-1 left-1 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out"
                                style={{
                                    width: 'calc(50% - 4px)',
                                    transform: form.purpose === 'Aluguel' ? 'translateX(100%)' : 'translateX(0%)'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setField('purpose', 'Venda')}
                                className={`relative z-10 py-1.5 text-xs sm:text-sm font-bold text-center rounded-full transition-colors duration-300 ${
                                    form.purpose === 'Venda' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                Comprar
                            </button>
                            <button
                                type="button"
                                onClick={() => setField('purpose', 'Aluguel')}
                                className={`relative z-10 py-1.5 text-xs sm:text-sm font-bold text-center rounded-full transition-colors duration-300 ${
                                    form.purpose === 'Aluguel' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                Alugar
                            </button>
                        </div>

                        {/* Título Principal */}
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-[1.25] tracking-tight mb-6 font-sans">
                            Encontre os imóveis mais desejados do Brasil
                        </h1>

                        {/* Inputs de Pesquisa */}
                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Tipo */}
                                <div className="space-y-1">
                                    <label htmlFor="hero-type" className="block text-xs font-semibold text-gray-700">Tipo</label>
                                    <div className="relative flex items-center bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 focus-within:border-amber-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-amber-400/10 rounded-none transition-all duration-200 h-[48px]">
                                        <select
                                            id="hero-type"
                                            name="type"
                                            value={form.type}
                                            onChange={(e) => setField('type', e.target.value)}
                                            className="w-full h-full px-4 bg-transparent text-gray-800 outline-none text-sm font-semibold appearance-none cursor-pointer"
                                        >
                                            {propertyTypes.map((t) => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 text-gray-400 w-4 h-4 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Cidade */}
                                <div className="space-y-1">
                                    <label htmlFor="hero-city" className="block text-xs font-semibold text-gray-700">Cidade</label>
                                    <div className="relative flex items-center bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 focus-within:border-amber-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-amber-400/10 rounded-none transition-all duration-200 h-[48px]">
                                        <input
                                            id="hero-city"
                                            name="city"
                                            value={form.city}
                                            onChange={(e) => setField('city', e.target.value)}
                                            list="hero-city-options"
                                            autoComplete="off"
                                            placeholder={isLoadingCities ? 'Carregando...' : 'Digite a cidade'}
                                            className="w-full h-full px-4 bg-transparent text-gray-800 placeholder-gray-400 outline-none text-sm font-semibold"
                                        />
                                        <ChevronDown className="absolute right-4 text-gray-400 w-4 h-4 pointer-events-none" />
                                        <datalist id="hero-city-options">
                                            {filteredCityOptions.map((item) => (
                                                <option key={item.city} value={item.city}>
                                                    {`${item.city} (${item.total})`}
                                                </option>
                                            ))}
                                        </datalist>
                                    </div>
                                </div>

                                {/* Bairro */}
                                <div className="space-y-1">
                                    <label htmlFor="hero-bairro" className="block text-xs font-semibold text-gray-700">Bairro</label>
                                    <div className="relative flex items-center bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 focus-within:border-amber-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-amber-400/10 rounded-none transition-all duration-200 h-[48px]">
                                        <input
                                            id="hero-bairro"
                                            name="bairro"
                                            value={form.bairro}
                                            onChange={(e) => setField('bairro', e.target.value)}
                                            list="hero-bairro-options"
                                            autoComplete="off"
                                            disabled={!hasSelectedCity}
                                            placeholder={
                                                !hasSelectedCity
                                                    ? 'Selecione uma cidade'
                                                    : isLoadingBairros
                                                        ? 'Carregando...'
                                                        : 'Digite o bairro'
                                            }
                                            className="w-full h-full px-4 bg-transparent text-gray-800 placeholder-gray-400 outline-none text-sm font-semibold disabled:opacity-50"
                                        />
                                        <ChevronDown className="absolute right-4 text-gray-400 w-4 h-4 pointer-events-none" />
                                        <datalist id="hero-bairro-options">
                                            {bairroOptions.map((item) => (
                                                <option key={`${item.city}-${item.bairro}`} value={item.bairro}>
                                                    {`${item.bairro} (${item.total})`}
                                                </option>
                                            ))}
                                        </datalist>
                                    </div>
                                </div>

                                {/* Código ou ID */}
                                <div className="space-y-1">
                                    <label htmlFor="hero-code" className="block text-xs font-semibold text-gray-700">Código ou ID</label>
                                    <div className="relative flex items-center bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 focus-within:border-amber-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-amber-400/10 rounded-none transition-all duration-200 h-[48px]">
                                        <input
                                            id="hero-code"
                                            name="code"
                                            type="text"
                                            value={form.code}
                                            onChange={(e) => setField('code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                                            maxLength={6}
                                            placeholder="Opcional"
                                            className="w-full h-full px-4 bg-transparent text-gray-800 placeholder-gray-400 outline-none text-sm font-semibold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Valor (R$) - Mín e Máx */}
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-gray-700">Valor (R$)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative flex items-center bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 focus-within:border-amber-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-amber-400/10 rounded-none transition-all duration-200 h-[48px]">
                                        <CurrencyInput
                                            id="hero-min-price"
                                            name="minPrice"
                                            value={form.minPrice}
                                            onChange={(value) => setField('minPrice', value)}
                                            placeholder="Mín."
                                            className="w-full h-full px-4 bg-transparent text-gray-800 placeholder-gray-400 outline-none text-sm font-semibold"
                                        />
                                    </div>
                                    <div className="relative flex items-center bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 focus-within:border-amber-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-amber-400/10 rounded-none transition-all duration-200 h-[48px]">
                                        <CurrencyInput
                                            id="hero-max-price"
                                            name="maxPrice"
                                            value={form.maxPrice}
                                            onChange={(value) => setField('maxPrice', value)}
                                            placeholder="Máx."
                                            className="w-full h-full px-4 bg-transparent text-gray-800 placeholder-gray-400 outline-none text-sm font-semibold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Erro de validação */}
                            {validationError && (
                                <p className="rounded-none border border-red-200 bg-red-50 px-3 py-2 text-left text-xs text-red-700">
                                    {validationError}
                                </p>
                            )}

                            {/* Botão de Busca */}
                            <button
                                type="button"
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="w-full h-[48px] bg-amber-400 hover:bg-amber-500 disabled:opacity-70 text-gray-900 font-bold rounded-none shadow-sm active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-base cursor-pointer"
                            >
                                {isSearching ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Buscar Imóvel'
                                )}
                            </button>
                        </form>
                    </div>

                    {/* ══════════════════════════════════════════════════
                        PAINEL DIREITO — Imagem Fusa (Equilibrado 50%)
                    ══════════════════════════════════════════════════ */}
                    <div className="w-full lg:w-1/2 relative min-h-[300px] lg:min-h-auto">
                        <Image
                            src={HERO_IMAGE}
                            alt="Encontre seu imóvel dos sonhos"
                            fill
                            priority
                            className="object-cover object-center"
                            sizes="(max-w-1024px) 100vw, 50vw"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
