'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import { resolveOperationalGateRoute } from '@/lib/auth/routeResolution'
import { fetchEditableProperty, saveEditedProperty } from '@/lib/propertiesEditorService'
import { fetchCitiesByState } from '@/lib/locationOptionsApi'
import {
    clampAreaInput,
    clampCountInput,
    digitsOnly,
    isOptionalBairroPropertyType,
    MAX_PROPERTY_AREA,
    MAX_PROPERTY_COUNT,
    PROPERTY_TYPES,
    PROPERTY_PURPOSES,
    normalizeDecimalInput,
    requiresLotFields,
} from '@/lib/propertyCreate'
import {
    areaInputToSquareMeters,
    normalizeAreaUnidade,
    squareMetersToAreaInput,
    type AreaConstruidaUnidade,
} from '@/lib/areaUnits'
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currencyInput'
import { CurrencyInput } from '@/components/form/CurrencyInput'
import { Property } from '@/types/property'
import { PROPERTY_CANONICAL_AMENITIES, PropertyAmenity } from '@/lib/propertyCreate'
import {
    ArrowLeft, Loader2, Save, Home, ChevronRight,
    AlertTriangle, CheckCircle
} from 'lucide-react'

const STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

export default function EditPropertyPage() {
    const router = useRouter()
    const params = useParams()
    const propertyId = params.id as string
    const { session, loading: authLoading, isBroker } = useUser()
    const isClientOwner = session?.user?.role !== 'broker'

    const [property, setProperty] = useState<Property | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [cityOptions, setCityOptions] = useState<string[]>([])
    const [cityLoading, setCityLoading] = useState(false)

    // Form state
    const [form, setForm] = useState({
        title: '', description: '', type: 'Casa', purpose: 'Venda',
        priceSale: '', priceRent: '',
        address: '', numero: '', quadra: '', lote: '', bairro: '',
        complemento: '', city: '', state: 'GO', cep: '', semCep: false,
        bedrooms: '', bathrooms: '', suites: '', garageSpots: '', amenities: [] as PropertyAmenity[],
        areaConstruida: '', areaTerreno: '',
        areaConstruidaUnidade: 'm2' as AreaConstruidaUnidade,
        semQuadra: false, semLote: false,
        hasWifi: false, temPiscina: false, temEnergiaSolar: false,
        temAutomacao: false, temArCondicionado: false, ehMobiliada: false,
    })

    useEffect(() => {
        let canceled = false
        void (async () => {
            if (!form.state.trim()) {
                setCityOptions([])
                setCityLoading(false)
                return
            }
            setCityLoading(true)
            const options = await fetchCitiesByState(form.state)
            if (!canceled) {
                setCityOptions(options)
                setCityLoading(false)
            }
        })()

        return () => {
            canceled = true
        }
    }, [form.state])

    // Auth guard
    useEffect(() => {
        if (!authLoading && !session) {
            router.replace(`/auth/login?next=/meus-imoveis/${propertyId}/editar`)
            return
        }
        const gateRoute = resolveOperationalGateRoute(session)
        if (!authLoading && gateRoute) {
            router.replace(gateRoute)
        } else if (!authLoading && session?.user?.role === 'broker' && !isBroker) {
            router.replace('/onboarding/broker')
        }
    }, [authLoading, session, isBroker, router, propertyId])

    // Load property
    const loadProperty = useCallback(async () => {
        try {
            const p: Property = await fetchEditableProperty(propertyId)
            setProperty(p)
            const unit = normalizeAreaUnidade(p.areaConstruidaUnidade)
            setForm({
                title: p.title || '',
                description: p.description || '',
                type: p.type || 'Casa',
                purpose: p.purpose || 'Venda',
                priceSale: p.priceSale ? formatCurrencyInput(String(p.priceSale)) : '',
                priceRent: p.priceRent ? formatCurrencyInput(String(p.priceRent)) : '',
                address: p.address || '',
                numero: p.numero || '',
                quadra: p.quadra || '',
                lote: p.lote || '',
                bairro: p.bairro || '',
                complemento: p.complemento || '',
                city: p.city || '',
                state: p.state || 'GO',
                cep: p.cep || '',
                semCep: p.semCep ?? false,
                bedrooms: p.bedrooms ? String(p.bedrooms) : '',
                bathrooms: p.bathrooms ? String(p.bathrooms) : '',
                suites: p.suites ? String(p.suites) : '',
                garageSpots: p.garageSpots ? String(p.garageSpots) : '',
                amenities: Array.isArray(p.amenities)
                    ? p.amenities
                        .map((item) => String(item).trim())
                        .filter((item) => PROPERTY_CANONICAL_AMENITIES.includes(item as PropertyAmenity))
                        .filter((value, index, values) => values.indexOf(value) === index) as PropertyAmenity[]
                    : [],
                areaConstruida:
                    p.areaConstruida != null
                        ? squareMetersToAreaInput(p.areaConstruida, unit)
                        : '',
                areaTerreno: p.areaTerreno ? String(p.areaTerreno) : '',
                areaConstruidaUnidade: unit,
                semQuadra: p.semQuadra ?? false,
                semLote: p.semLote ?? false,
                hasWifi: p.hasWifi || false,
                temPiscina: p.temPiscina || false,
                temEnergiaSolar: p.temEnergiaSolar || false,
                temAutomacao: p.temAutomacao || false,
                temArCondicionado: p.temArCondicionado || false,
                ehMobiliada: p.ehMobiliada || false,
            })
        } catch {
            setLoadError('Não foi possível carregar o imóvel.')
        }
    }, [propertyId])

    const needsLotFields = useMemo(() => requiresLotFields(form.type), [form.type])
    const bairroOptional = useMemo(() => isOptionalBairroPropertyType(form.type), [form.type])

    useEffect(() => { if (propertyId) loadProperty() }, [propertyId, loadProperty])

    useEffect(() => {
        if (!property) return
        if (property.status !== 'pending_approval') return
        router.replace(`/meus-imoveis?focus=${property.id}&editBlocked=1`)
    }, [property, router])

    function updateField(key: string, value: string | boolean) {
        setForm(prev => ({ ...prev, [key]: value }))
        setSaved(false)
        setSaveError(null)
    }

    function updateAmenity(amenity: PropertyAmenity, checked: boolean) {
        setForm((prev) => {
            if (checked) {
                return {
                    ...prev,
                    amenities: Array.from(new Set([...prev.amenities, amenity])),
                }
            }
            return {
                ...prev,
                amenities: prev.amenities.filter((value) => value !== amenity),
            }
        })
        setSaved(false)
        setSaveError(null)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!property) return

        setSaving(true)
        setSaveError(null)
        setSaved(false)

        try {
            const unit = normalizeAreaUnidade(form.areaConstruidaUnidade)
            const areaInputVal = normalizeDecimalInput(form.areaConstruida)
            const areaConstruidaM2 = areaInputToSquareMeters(areaInputVal, unit)
            const payload = {
                title: form.title.trim(),
                description: form.description.trim(),
                type: form.type,
                purpose: form.purpose,
                priceSale: parseCurrencyInput(form.priceSale) || 0,
                priceRent: parseCurrencyInput(form.priceRent) || 0,
                address: form.address.trim(),
                numero: form.numero.trim(),
                quadra: form.quadra.trim(),
                lote: form.lote.trim(),
                bairro: form.bairro.trim(),
                complemento: form.complemento.trim(),
                city: form.city.trim(),
                state: form.state,
                cep: form.semCep ? '' : form.cep.trim(),
                semCep: form.semCep,
                bedrooms: parseInt(form.bedrooms) || 0,
                bathrooms: parseInt(form.bathrooms) || 0,
                suites: parseInt(form.suites) || 0,
                garageSpots: parseInt(form.garageSpots) || 0,
                areaConstruida: Number.isFinite(areaConstruidaM2) ? areaConstruidaM2 : 0,
                areaConstruidaUnidade: unit,
                semQuadra: form.semQuadra,
                semLote: form.semLote,
                areaTerreno: normalizeDecimalInput(form.areaTerreno) || 0,
                amenities: form.amenities,
                hasWifi: form.hasWifi,
                temPiscina: form.temPiscina,
                temEnergiaSolar: form.temEnergiaSolar,
                temAutomacao: form.temAutomacao,
                temArCondicionado: form.temArCondicionado,
                ehMobiliada: form.ehMobiliada,
            }

            await saveEditedProperty(property.id, payload, isClientOwner ? 'client' : 'broker')
            setProperty((current) => (current ? { ...current, hasPendingEditRequest: true } : current))
            if (property.status === 'rejected') {
                await loadProperty()
            }
            setSaved(true)
        } catch (err: unknown) {
            setSaveError(err instanceof Error ? err.message : 'Erro ao salvar alterações.')
        } finally {
            setSaving(false)
        }
    }

    /* ── Render guards ── */
    if (authLoading || !session) {
        return <div className="min-h-screen flex items-center justify-center pt-20"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
    }

    if (session?.user?.role === 'broker' && !isBroker) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="text-center space-y-4 max-w-md">
                    <AlertTriangle className="w-16 h-16 mx-auto text-amber-400" />
                    <h1 className="text-xl font-bold text-gray-900">Acesso restrito a corretores</h1>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors">Voltar ao início</Link>
                </div>
            </div>
        )
    }

    if (loadError || !propertyId) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="text-center space-y-4">
                    <AlertTriangle className="w-16 h-16 mx-auto text-red-400" />
                    <h1 className="text-xl font-bold text-gray-900">{loadError || 'Imóvel não especificado'}</h1>
                    <Link href="/meus-imoveis" className="text-primary-600 font-semibold hover:underline">Ir para meus imóveis</Link>
                </div>
            </div>
        )
    }

    if (!property) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                <p className="text-sm text-gray-500 ml-2">Carregando...</p>
            </div>
        )
    }

    if (property.status === 'pending_approval') {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                <p className="text-sm text-gray-500 ml-2">Redirecionando...</p>
            </div>
        )
    }

    if (property.hasPendingEditRequest) {
        return (
            <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                        <Link href="/" className="hover:text-primary-600"><Home className="w-4 h-4" /></Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/meus-imoveis" className="hover:text-primary-600">Meus Imóveis</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 font-medium truncate max-w-[200px]">{property.title}</span>
                    </nav>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5" />
                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold text-gray-900">Edição já enviada para análise</h1>
                                <p className="text-sm text-amber-900">
                                    Já existe uma solicitação de edição pendente para este imóvel.
                                    Enquanto o admin não revisar, a versão pública atual continua valendo.
                                </p>
                                <div className="pt-2">
                                    <Link
                                        href={`/imoveis/${property.id}`}
                                        className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                                    >
                                        Voltar ao imóvel
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
    const labelClass = "block text-sm font-medium text-gray-700 mb-1"

    return (
        <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link href="/" className="hover:text-primary-600"><Home className="w-4 h-4" /></Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link href="/meus-imoveis" className="hover:text-primary-600">Meus Imóveis</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-gray-900 font-medium truncate max-w-[200px]">{property.title}</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-gray-900 font-medium">Editar</span>
                </nav>

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Editar Imóvel</h1>
                    </div>
                </div>

                {property.status === 'rejected' && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
                        <p className="font-semibold">Anúncio rejeitado</p>
                        {property.rejectionReason?.trim() ? (
                            <p className="mt-1 whitespace-pre-wrap">{property.rejectionReason.trim()}</p>
                        ) : null}
                        <p className="mt-2 text-red-800 dark:text-red-200">
                            Ajuste os dados e salve — o anúncio volta para análise.
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900">Informações Básicas</h2>
                        <div>
                            <label className={labelClass}>Título *</label>
                            <input type="text" value={form.title} onChange={e => updateField('title', e.target.value)} maxLength={120} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Descrição</label>
                            <textarea value={form.description} onChange={e => updateField('description', e.target.value.slice(0, 500))} maxLength={500} className={`${inputClass} min-h-[120px] resize-y`} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Tipo</label>
                                <select value={form.type} onChange={e => updateField('type', e.target.value)} className={inputClass}>
                                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Finalidade</label>
                                <select value={form.purpose} onChange={e => updateField('purpose', e.target.value)} className={inputClass}>
                                    {PROPERTY_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Pricing */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900">Preços</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Preço de Venda (R$)</label>
                                <CurrencyInput value={form.priceSale} onChange={(value) => updateField('priceSale', value)} className={inputClass} placeholder="R$ 0,00" />
                            </div>
                            <div>
                                <label className={labelClass}>Aluguel Mensal (R$)</label>
                                <CurrencyInput value={form.priceRent} onChange={(value) => updateField('priceRent', value)} className={inputClass} placeholder="R$ 0,00" />
                            </div>
                        </div>
                    </section>

                    {/* Location */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900">Localização</h2>
                        <div>
                            <label className={labelClass}>Endereço</label>
                            <input type="text" value={form.address} onChange={e => updateField('address', e.target.value)} maxLength={120} className={inputClass} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>Número</label>
                                <input type="text" value={form.numero} onChange={e => updateField('numero', digitsOnly(e.target.value).slice(0, 25))} maxLength={25} inputMode="numeric" className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>{needsLotFields && !form.semQuadra ? 'Quadra *' : 'Quadra'}</label>
                                <input type="text" value={form.quadra} disabled={form.semQuadra} onChange={e => updateField('quadra', e.target.value)} maxLength={25} className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`} />
                                <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600">
                                    <input type="checkbox" checked={form.semQuadra} onChange={(e) => { updateField('semQuadra', e.target.checked); if (e.target.checked) updateField('quadra', '') }} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                    Sem quadra
                                </label>
                            </div>
                            <div>
                                <label className={labelClass}>{needsLotFields && !form.semLote ? 'Lote *' : 'Lote'}</label>
                                <input type="text" value={form.lote} disabled={form.semLote} onChange={e => updateField('lote', e.target.value)} maxLength={25} className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`} />
                                <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600">
                                    <input type="checkbox" checked={form.semLote} onChange={(e) => { updateField('semLote', e.target.checked); if (e.target.checked) updateField('lote', '') }} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                    Sem lote
                                </label>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>{bairroOptional ? 'Bairro' : 'Bairro *'}</label>
                                <input type="text" value={form.bairro} onChange={e => updateField('bairro', e.target.value)} maxLength={120} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>{form.semCep ? 'CEP (opcional)' : 'CEP'}</label>
                                <input type="text" value={form.cep} disabled={form.semCep} onChange={e => updateField('cep', e.target.value)} className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`} maxLength={9} />
                                <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600">
                                    <input type="checkbox" checked={form.semCep} onChange={(e) => { updateField('semCep', e.target.checked); if (e.target.checked) updateField('cep', '') }} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                    Sem CEP
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Complemento</label>
                            <input type="text" value={form.complemento} onChange={e => updateField('complemento', e.target.value)} maxLength={120} className={inputClass} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Cidade</label>
                                <input
                                    type="text"
                                    list="edit-property-city-options"
                                    value={form.city}
                                    onChange={e => updateField('city', e.target.value)}
                                    maxLength={120}
                                    className={inputClass}
                                    placeholder={cityLoading ? 'Carregando cidades...' : 'Digite ou selecione'}
                                />
                                <datalist id="edit-property-city-options">
                                    {cityOptions.map((option) => <option key={option} value={option} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className={labelClass}>Estado</label>
                                <select value={form.state} onChange={e => updateField('state', e.target.value)} className={inputClass}>
                                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Characteristics */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900">Características</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <label className={labelClass}>Quartos</label>
                                <input type="number" value={form.bedrooms} onChange={e => updateField('bedrooms', clampCountInput(e.target.value))} className={inputClass} min="0" max={MAX_PROPERTY_COUNT} />
                            </div>
                            <div>
                                <label className={labelClass}>Banheiros</label>
                                <input type="number" value={form.bathrooms} onChange={e => updateField('bathrooms', clampCountInput(e.target.value))} className={inputClass} min="0" max={MAX_PROPERTY_COUNT} />
                            </div>
                            <div>
                                <label className={labelClass}>Vagas</label>
                                <input type="number" value={form.garageSpots} onChange={e => updateField('garageSpots', clampCountInput(e.target.value))} className={inputClass} min="0" max={MAX_PROPERTY_COUNT} />
                            </div>
                            <div>
                                <label className={labelClass}>Suítes</label>
                                <input type="number" value={form.suites} onChange={e => updateField('suites', clampCountInput(e.target.value))} className={inputClass} min="0" max={MAX_PROPERTY_COUNT} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 sm:col-start-4">
                                <label className={labelClass}>Área construída</label>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={form.areaConstruida}
                                        onChange={e => updateField('areaConstruida', clampAreaInput(e.target.value))}
                                        className={`${inputClass} sm:flex-1`}
                                    />
                                    <select
                                        value={form.areaConstruidaUnidade}
                                        onChange={e => updateField('areaConstruidaUnidade', e.target.value as AreaConstruidaUnidade)}
                                        className={`${inputClass} sm:w-36 sm:shrink-0`}
                                        aria-label="Unidade da área construída"
                                    >
                                        <option value="m2">m²</option>
                                        <option value="hectare">Hectare (ha)</option>
                                        <option value="alqueire">Alqueire paulista</option>
                                    </select>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">O valor é convertido para m² no cadastro.</p>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Área Total (m²)</label>
                            <input type="number" value={form.areaTerreno} onChange={e => updateField('areaTerreno', clampAreaInput(e.target.value))} className={inputClass} step="0.01" min="0" max={MAX_PROPERTY_AREA} />
                        </div>
                    </section>

                    {/* Amenities */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900">Comodidades</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {([
                                ['hasWifi', 'Wi-Fi'],
                                ['temPiscina', 'Piscina'],
                                ['temEnergiaSolar', 'Energia Solar'],
                                ['temAutomacao', 'Automação'],
                                ['temArCondicionado', 'Ar Condicionado'],
                                ['ehMobiliada', 'Mobiliada'],
                            ] as const).map(([key, label]) => (
                                <label key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={form[key]}
                                        onChange={e => updateField(key, e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">{label}</span>
                                </label>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {PROPERTY_CANONICAL_AMENITIES.filter((amenity) => amenity !== 'MOBILIADA').map((amenity) => (
                                <label key={amenity} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={form.amenities.includes(amenity)}
                                        onChange={(event) => updateAmenity(amenity, event.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">{amenity}</span>
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* Feedback */}
                    {saveError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{saveError}</p>
                        </div>
                    )}
                    {saved && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-green-700">Solicitação de edição enviada para aprovação!</p>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 active:scale-[0.98] disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {saving ? 'Enviando...' : 'Enviar para aprovação'}
                    </button>
                </form>
            </div>
        </div>
    )
}
