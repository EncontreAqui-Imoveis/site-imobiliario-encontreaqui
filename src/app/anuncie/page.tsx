'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { createProperty } from '@/lib/api/user'
import { validateImageFile, sanitizeText } from '@/lib/sanitize'
import type { ApiError } from '@/lib/api/client'
import { Building2, MapPin, Info, Camera, DollarSign, Check, ArrowLeft, ArrowRight, X, Loader2 } from 'lucide-react'

const PROPERTY_TYPES = ['Casa', 'Apartamento', 'Terreno', 'Propriedade Rural', 'Propriedade Comercial'] as const
const PURPOSES = ['Venda', 'Aluguel', 'Venda e Aluguel'] as const
const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6

const STEP_LABELS = ['Tipo', 'Localização', 'Detalhes', 'Fotos', 'Preço', 'Revisão']

export default function AnunciePage() {
    const router = useRouter()
    const { session, loading: authLoading, isBroker } = useUser()

    const [step, setStep] = useState<WizardStep>(1)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Step 1: Type
    const [propertyType, setPropertyType] = useState<string>('')
    const [purpose, setPurpose] = useState<string>('')

    // Step 2: Location
    const [cep, setCep] = useState('')
    const [state, setState] = useState('')
    const [city, setCity] = useState('')
    const [bairro, setBairro] = useState('')
    const [address, setAddress] = useState('')
    const [numero, setNumero] = useState('')
    const [complemento, setComplemento] = useState('')
    const [cepLoading, setCepLoading] = useState(false)

    // Step 3: Details
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [bedrooms, setBedrooms] = useState<number>(0)
    const [bathrooms, setBathrooms] = useState<number>(0)
    const [garageSpots, setGarageSpots] = useState<number>(0)
    const [areaConstruida, setAreaConstruida] = useState<number>(0)
    const [areaTerreno, setAreaTerreno] = useState<number>(0)
    const [temPiscina, setTemPiscina] = useState(false)
    const [temEnergiaSolar, setTemEnergiaSolar] = useState(false)
    const [ehMobiliada, setEhMobiliada] = useState(false)

    // Step 4: Photos
    const [images, setImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Step 5: Price
    const [priceSale, setPriceSale] = useState<number>(0)
    const [priceRent, setPriceRent] = useState<number>(0)
    const [valorCondominio, setValorCondominio] = useState<number>(0)
    const [valorIptu, setValorIptu] = useState<number>(0)

    useEffect(() => {
        if (!authLoading && !session) {
            router.replace('/auth/login?next=/anuncie')
        } else if (!authLoading && session && !isBroker) {
            router.replace('/onboarding/broker')
        }
    }, [authLoading, session, isBroker, router])

    const handleCepBlur = async () => {
        const clean = cep.replace(/\D/g, '')
        if (clean.length !== 8) return
        setCepLoading(true)
        try {
            const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
            const data = await res.json()
            if (!data.erro) {
                setAddress(data.logradouro || address)
                setBairro(data.bairro || bairro)
                setCity(data.localidade || city)
                setState(data.uf || state)
            }
        } catch { /* silent */ } finally { setCepLoading(false) }
    }

    const handleAddImages = (files: FileList | null) => {
        if (!files) return
        const newFiles: File[] = []
        const newPreviews: string[] = []
        for (let i = 0; i < files.length && images.length + newFiles.length < 15; i++) {
            const validation = validateImageFile(files[i])
            if (validation.valid) {
                newFiles.push(files[i])
                newPreviews.push(URL.createObjectURL(files[i]))
            }
        }
        setImages(prev => [...prev, ...newFiles])
        setImagePreviews(prev => [...prev, ...newPreviews])
    }

    const removeImage = (idx: number) => {
        URL.revokeObjectURL(imagePreviews[idx])
        setImages(prev => prev.filter((_, i) => i !== idx))
        setImagePreviews(prev => prev.filter((_, i) => i !== idx))
    }

    const canAdvance = () => {
        switch (step) {
            case 1: return propertyType && purpose
            case 2: return city && state
            case 3: return title.trim().length > 3 && description.trim().length > 10
            case 4: return images.length > 0
            case 5: return (purpose !== 'Aluguel' ? priceSale > 0 : true) && (purpose !== 'Venda' ? priceRent > 0 : true)
            default: return true
        }
    }

    const handleSubmit = async () => {
        setSubmitting(true)
        setError(null)

        const formData = new FormData()
        // SAST-3: Sanitize text inputs before sending to API
        formData.append('title', sanitizeText(title))
        formData.append('description', sanitizeText(description))
        formData.append('type', propertyType)
        formData.append('purpose', purpose)
        formData.append('city', sanitizeText(city))
        formData.append('state', state)
        formData.append('address', sanitizeText(address))
        if (bairro) formData.append('bairro', sanitizeText(bairro))
        if (cep) formData.append('cep', cep.replace(/\D/g, ''))
        if (numero) formData.append('numero', numero)
        if (complemento) formData.append('complemento', complemento)
        if (bedrooms) formData.append('bedrooms', String(bedrooms))
        if (bathrooms) formData.append('bathrooms', String(bathrooms))
        if (garageSpots) formData.append('garageSpots', String(garageSpots))
        if (areaConstruida) formData.append('areaConstruida', String(areaConstruida))
        if (areaTerreno) formData.append('areaTerreno', String(areaTerreno))
        if (priceSale) formData.append('priceSale', String(priceSale))
        if (priceRent) formData.append('priceRent', String(priceRent))
        if (valorCondominio) formData.append('valorCondominio', String(valorCondominio))
        if (valorIptu) formData.append('valorIptu', String(valorIptu))
        formData.append('temPiscina', String(temPiscina))
        formData.append('temEnergiaSolar', String(temEnergiaSolar))
        formData.append('ehMobiliada', String(ehMobiliada))

        images.forEach(img => formData.append('images', img))

        try {
            const result = await createProperty(formData)
            router.push(`/imoveis/${result.id}`)
        } catch (err) {
            const apiErr = err as ApiError
            setError(apiErr?.message || 'Erro ao cadastrar imóvel.')
        } finally {
            setSubmitting(false)
        }
    }

    const formatPrice = (val: string) => Number(val.replace(/\D/g, '')) / 100
    const formatCep = (val: string) => {
        const d = val.replace(/\D/g, '').slice(0, 8)
        return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`
    }

    if (authLoading || !session || !isBroker) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pt-24">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Anunciar Imóvel</h1>

            {/* Progress */}
            <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
                {STEP_LABELS.map((label, i) => (
                    <div key={i} className="flex items-center gap-1 flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 < step ? 'bg-green-500 text-white' :
                            i + 1 === step ? 'bg-primary-600 text-white' :
                                'bg-slate-100 text-slate-400'
                            }`}>
                            {i + 1 < step ? <Check className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className={`text-xs font-medium hidden sm:inline ${i + 1 === step ? 'text-primary-600' : 'text-slate-400'}`}>
                            {label}
                        </span>
                        {i < STEP_LABELS.length - 1 && <div className="w-6 h-0.5 bg-slate-200 mx-1" />}
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 space-y-6">
                {/* Step 1: Type */}
                {step === 1 && (
                    <div className="space-y-5">
                        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <Building2 className="w-4 h-4" /> Tipo do imóvel
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {PROPERTY_TYPES.map(t => (
                                <button key={t} onClick={() => setPropertyType(t)}
                                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${propertyType === t ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 hover:border-slate-300'
                                        }`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                        <h2 className="text-sm font-semibold text-slate-800 pt-2">Finalidade</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {PURPOSES.map(p => (
                                <button key={p} onClick={() => setPurpose(p)}
                                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${purpose === p ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 hover:border-slate-300'
                                        }`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Location */}
                {step === 2 && (
                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Localização
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">CEP</label>
                                <input type="text" value={cep} onChange={e => setCep(formatCep(e.target.value))} onBlur={handleCepBlur}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" placeholder="00000-000" />
                                {cepLoading && <p className="text-xs text-primary-500">Buscando...</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">Estado</label>
                                <select value={state} onChange={e => setState(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
                                    <option value="">UF</option>
                                    {BRAZILIAN_STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">Cidade *</label>
                                <input type="text" value={city} onChange={e => setCity(e.target.value)} required
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">Bairro</label>
                                <input type="text" value={bairro} onChange={e => setBairro(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-600">Endereço</label>
                            <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">Número</label>
                                <input type="text" value={numero} onChange={e => setNumero(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">Complemento</label>
                                <input type="text" value={complemento} onChange={e => setComplemento(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Details */}
                {step === 3 && (
                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <Info className="w-4 h-4" /> Detalhes
                        </h2>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-600">Título *</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                placeholder="Ex: Casa moderna 3 quartos" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-600">Descrição *</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                placeholder="Descreva o imóvel em detalhes..." />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                ['Quartos', bedrooms, setBedrooms],
                                ['Banheiros', bathrooms, setBathrooms],
                                ['Vagas', garageSpots, setGarageSpots],
                            ].map(([label, val, setter]) => (
                                <div key={label as string} className="space-y-1">
                                    <label className="text-xs font-medium text-slate-600">{label as string}</label>
                                    <input type="number" min={0} value={val as number} onChange={e => (setter as (v: number) => void)(Number(e.target.value))}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">Área construída (m²)</label>
                                <input type="number" min={0} value={areaConstruida} onChange={e => setAreaConstruida(Number(e.target.value))}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">Área terreno (m²)</label>
                                <input type="number" min={0} value={areaTerreno} onChange={e => setAreaTerreno(Number(e.target.value))}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4 pt-2">
                            {[
                                ['Piscina', temPiscina, setTemPiscina],
                                ['Energia Solar', temEnergiaSolar, setTemEnergiaSolar],
                                ['Mobiliada', ehMobiliada, setEhMobiliada],
                            ].map(([label, val, setter]) => (
                                <label key={label as string} className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={val as boolean} onChange={e => (setter as (v: boolean) => void)(e.target.checked)}
                                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                    <span className="text-sm text-slate-700">{label as string}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 4: Photos */}
                {step === 4 && (
                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <Camera className="w-4 h-4" /> Fotos ({images.length}/15)
                        </h2>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
                        >
                            <Camera className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="text-sm text-slate-600">Clique para adicionar fotos</p>
                            <p className="text-xs text-slate-400 mt-1">JPEG, PNG ou WebP • Máx 10MB cada</p>
                            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                                onChange={e => handleAddImages(e.target.files)} />
                        </div>
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {imagePreviews.map((preview, i) => (
                                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                                        <img src={preview} alt="" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeImage(i)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        {i === 0 && (
                                            <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-primary-600 text-white text-[10px] font-bold rounded-full">
                                                Capa
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 5: Price */}
                {step === 5 && (
                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Valores
                        </h2>
                        {(purpose === 'Venda' || purpose === 'Venda e Aluguel') && (
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">Preço de venda (R$) *</label>
                                <input type="number" min={0} step="1000" value={priceSale} onChange={e => setPriceSale(Number(e.target.value))}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                            </div>
                        )}
                        {(purpose === 'Aluguel' || purpose === 'Venda e Aluguel') && (
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">Preço de aluguel (R$/mês) *</label>
                                <input type="number" min={0} step="100" value={priceRent} onChange={e => setPriceRent(Number(e.target.value))}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">Condomínio (R$/mês)</label>
                                <input type="number" min={0} value={valorCondominio} onChange={e => setValorCondominio(Number(e.target.value))}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">IPTU (R$/ano)</label>
                                <input type="number" min={0} value={valorIptu} onChange={e => setValorIptu(Number(e.target.value))}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 6: Review */}
                {step === 6 && (
                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold text-slate-800">Revisão do anúncio</h2>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm space-y-2">
                            <p><span className="font-medium text-slate-700">Tipo:</span> {propertyType} • {purpose}</p>
                            <p><span className="font-medium text-slate-700">Título:</span> {title}</p>
                            <p><span className="font-medium text-slate-700">Local:</span> {[address, numero, bairro, city, state].filter(Boolean).join(', ')}</p>
                            <p><span className="font-medium text-slate-700">Quartos:</span> {bedrooms} • <span className="font-medium text-slate-700">Banheiros:</span> {bathrooms} • <span className="font-medium text-slate-700">Vagas:</span> {garageSpots}</p>
                            {priceSale > 0 && <p><span className="font-medium text-slate-700">Venda:</span> R$ {priceSale.toLocaleString('pt-BR')}</p>}
                            {priceRent > 0 && <p><span className="font-medium text-slate-700">Aluguel:</span> R$ {priceRent.toLocaleString('pt-BR')}/mês</p>}
                            <p><span className="font-medium text-slate-700">Fotos:</span> {images.length} anexadas</p>
                        </div>
                    </div>
                )}

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-2">
                    <button
                        onClick={() => setStep(prev => Math.max(1, prev - 1) as WizardStep)}
                        disabled={step === 1}
                        className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800 disabled:text-slate-300"
                    >
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>
                    {step < 6 ? (
                        <button
                            onClick={() => setStep(prev => Math.min(6, prev + 1) as WizardStep)}
                            disabled={!canAdvance()}
                            className="flex items-center gap-1 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold rounded-xl shadow-md transition-colors"
                        >
                            Avançar <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold rounded-xl shadow-md transition-colors"
                        >
                            {submitting ? 'Cadastrando...' : 'Cadastrar imóvel'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
