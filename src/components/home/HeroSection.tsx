'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, Home, MapPin, ChevronDown, Loader2 } from 'lucide-react'
import SignupDraftNotice from '@/components/auth/SignupDraftNotice'

/** Arte local (pasta `public/marketing/`) — alinhada ao app móvel. */
const HERO_IMAGE = '/marketing/home-hero.png'

const propertyTypes = [
    { value: '', label: 'Todos os tipos' },
    { value: 'Casa', label: 'Casa' },
    { value: 'Apartamento', label: 'Apartamento' },
    { value: 'Terreno', label: 'Terreno' },
    { value: 'Propriedade Rural', label: 'Rural' },
    { value: 'Propriedade Comercial', label: 'Comercial' },
]

const purposes = [
    { value: '', label: 'Comprar ou Alugar' },
    { value: 'Venda', label: 'Comprar' },
    { value: 'Aluguel', label: 'Alugar' },
]

export default function HeroSection() {
    const router = useRouter()
    const [type, setType] = useState('')
    const [purpose, setPurpose] = useState('')
    const [city, setCity] = useState('')
    const [bairro, setBairro] = useState('')
    const [minPrice, setMinPrice] = useState('')
    const [maxPrice, setMaxPrice] = useState('')
    const [code, setCode] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    const handleSearch = () => {
        setIsSearching(true)
        const params = new URLSearchParams()
        if (type) params.set('type', type)
        if (purpose) params.set('purpose', purpose)
        if (city.trim()) params.set('city', city.trim())
        if (bairro.trim()) params.set('bairro', bairro.trim())
        if (minPrice.trim()) params.set('minPrice', minPrice.trim())
        if (maxPrice.trim()) params.set('maxPrice', maxPrice.trim())
        if (code.trim()) params.set('code', code.trim())
        router.push(`/imoveis?${params.toString()}`)
        setIsSearching(false)
    }

    return (
        <section
            className="relative flex min-h-[min(100svh,900px)] items-center overflow-hidden lg:min-h-[700px]"
            aria-label="Destaque da página inicial"
        >
            {/* Cobre desde o topo da viewport (header fixo transparente) — sem faixa do fundo da página */}
            <div className="absolute inset-0 min-h-full">
                <Image
                    src={HERO_IMAGE}
                    alt=""
                    fill
                    priority
                    className="object-cover object-top"
                    sizes="100vw"
                />
                <div
                    className="absolute inset-0 bg-black/20"
                    aria-hidden
                />
                <div
                    className="absolute inset-0 bg-gradient-to-b from-primary-950/72 via-primary-900/62 to-primary-950/78"
                    aria-hidden
                />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pb-32 lg:pt-32">
                <div className="mx-auto max-w-3xl">
                    <SignupDraftNotice />
                </div>
                <div className="mx-auto max-w-4xl text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-500/20 backdrop-blur-sm rounded-full text-accent-300 text-sm font-medium mb-6 animate-fadeIn border border-accent-500/30">
                        <Home className="w-4 h-4" />
                        <span>A melhor escolha para encontrar seu imóvel</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 animate-fadeIn">
                        Encontre os imóveis mais desejados do{' '}
                        <span className="text-accent-400">Brasil</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 animate-fadeIn">
                        Compre ou alugue com agilidade, segurança e sem burocracia.
                        Seu novo lar está a poucos cliques de distância.
                    </p>

                    {/* Search Box */}
                    <div className="rounded-2xl shadow-2xl p-3 sm:p-6 max-w-4xl mx-auto animate-fadeIn">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {/* Purpose */}
                            <div className="relative">
                                <label htmlFor="hero-purpose" className="block text-[10px] sm:text-xs font-medium text-white-500 mb-1 text-left">
                                    Finalidade
                                </label>
                                <div className="relative">
                                    <select
                                        id="hero-purpose"
                                        name="purpose"
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                        aria-label="Finalidade do imóvel"
                                        className="w-full min-h-[44px] appearance-none bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-2 sm:py-3 pr-8 sm:pr-10 text-gray-700 text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    >
                                        {purposes.map((p) => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Type */}
                            <div className="relative">
                                <label htmlFor="hero-type" className="block text-[10px] sm:text-xs font-medium text-white-500 mb-1 text-left">
                                    Tipo
                                </label>
                                <div className="relative">
                                    <select
                                        id="hero-type"
                                        name="type"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        aria-label="Tipo de imóvel"
                                        className="w-full min-h-[44px] appearance-none bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-2 sm:py-3 pr-8 sm:pr-10 text-gray-700 text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    >
                                        {propertyTypes.map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* City */}
                            <div className="relative">
                                <label htmlFor="hero-city" className="block text-[10px] sm:text-xs font-medium text-white-500 mb-1 text-left">
                                    Cidade
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-black-400" />
                                    <input
                                        id="hero-city"
                                        name="city"
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        maxLength={120}
                                        placeholder="Cidade"
                                        className="w-full min-h-[44px] bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl pl-8 sm:pl-10 pr-2 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Bairro */}
                            <div className="relative">
                                <label htmlFor="hero-bairro" className="block text-[10px] sm:text-xs font-medium text-white-500 mb-1 text-left">
                                    Bairro
                                </label>
                                <input
                                    id="hero-bairro"
                                    name="bairro"
                                    type="text"
                                    value={bairro}
                                    onChange={(e) => setBairro(e.target.value)}
                                    maxLength={120}
                                    placeholder="Opcional"
                                    className="w-full min-h-[44px] bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Faixa de preço */}
                            <div className="relative sm:col-span-2 lg:col-span-1">
                                <label className="block text-[10px] sm:text-xs font-medium text-white-500 mb-1 text-left">
                                    Valor (R$)
                                </label>
                                <div className="flex gap-1.5 sm:gap-2">
                                    <input
                                        id="hero-min-price"
                                        name="minPrice"
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        placeholder="Mín."
                                        className="min-w-0 min-h-[44px] flex-1 bg-gray-50 border border-black-200 rounded-lg sm:rounded-xl px-2 sm:px-3 py-2 sm:py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                    <input
                                        id="hero-max-price"
                                        name="maxPrice"
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        placeholder="Máx."
                                        className="min-w-0 min-h-[44px] flex-1 bg-gray-50 border border-black-200 rounded-lg sm:rounded-xl px-2 sm:px-3 py-2 sm:py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Código / ID */}
                            <div className="relative sm:col-span-2 lg:col-span-1">
                                <label htmlFor="hero-code" className="block text-[10px] sm:text-xs font-medium text-white-500 mb-1 text-left">
                                    Código ou ID
                                </label>
                                <input
                                    id="hero-code"
                                    name="code"
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    maxLength={80}
                                    placeholder="Opcional"
                                    className="w-full min-h-[44px] bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Search Button */}
                            <div className="flex items-end sm:col-span-2 lg:col-span-1">
                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="w-full min-h-[44px] bg-accent-500 hover:bg-accent-600 disabled:opacity-70 text-primary-900 font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                    {isSearching ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Search className="w-5 h-5" />
                                    )}
                                    <span>{isSearching ? 'Buscando...' : 'Buscar'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
