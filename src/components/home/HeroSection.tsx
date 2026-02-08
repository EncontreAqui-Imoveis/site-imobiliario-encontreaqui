'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, Home, MapPin, ChevronDown } from 'lucide-react'

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

    const handleSearch = () => {
        const params = new URLSearchParams()
        if (type) params.set('type', type)
        if (purpose) params.set('purpose', purpose)
        if (city) params.set('city', city)
        router.push(`/imoveis?${params.toString()}`)
    }

    return (
        <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center gradient-hero overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-400/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-300/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 w-full">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-500/20 backdrop-blur-sm rounded-full text-accent-300 text-sm font-medium mb-6 animate-fadeIn border border-accent-500/30">
                        <Home className="w-4 h-4" />
                        <span>A melhor escolha para encontrar seu imóvel</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 animate-fadeIn">
                        Encontre os imóveis mais desejados de{' '}
                        <span className="text-accent-400">Rio Verde</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 animate-fadeIn">
                        Compre ou alugue com agilidade, segurança e sem burocracia.
                        Seu novo lar está a poucos cliques de distância.
                    </p>

                    {/* Search Box */}
                    <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 max-w-3xl mx-auto animate-fadeIn">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Purpose */}
                            <div className="relative">
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 text-left">
                                    Finalidade
                                </label>
                                <div className="relative">
                                    <select
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                        className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    >
                                        {purposes.map((p) => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Type */}
                            <div className="relative">
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 text-left">
                                    Tipo
                                </label>
                                <div className="relative">
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    >
                                        {propertyTypes.map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* City */}
                            <div className="relative">
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 text-left">
                                    Cidade
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="Rio Verde"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Search Button */}
                            <div className="flex items-end">
                                <button
                                    onClick={handleSearch}
                                    className="w-full bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold py-3 px-6 rounded-xl shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <Search className="w-5 h-5" />
                                    <span>Buscar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
