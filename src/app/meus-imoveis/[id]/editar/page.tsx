'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Home, Building2, MapPin, DollarSign, Save, X, ChevronDown, ChevronUp,
    Camera, Plus, Trash2, GripVertical, Film, Video, Upload,
    Droplets, Wifi, Wind, Zap, Armchair, Sun, Trees,
    Loader2, Check, AlertCircle, ArrowLeft, Eye
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { propertiesApi } from '@/lib/api'

// Types
interface ImageFile {
    file?: File
    preview: string
    isExisting?: boolean
}

interface FormData {
    type: string
    purpose: string
    cep: string
    address: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
    quadra: string
    lote: string
    tipoLote: string
    bedrooms: number
    bathrooms: number
    garageSpots: number
    area_construida: number
    area_terreno: number
    tem_piscina: boolean
    tem_energia_solar: boolean
    tem_automacao: boolean
    tem_ar_condicionado: boolean
    eh_mobiliada: boolean
    has_wifi: boolean
    images: ImageFile[]
    videoUrl: string
    videoFile?: File
    priceSale: string
    priceRent: string
    valorIptu: string
    valorCondominio: string
    title: string
    description: string
    ownerName: string
    ownerPhone: string
}

// Property types
const propertyTypes = [
    { id: 'casa', label: 'Casa', icon: Home },
    { id: 'apartamento', label: 'Apartamento', icon: Building2 },
    { id: 'terreno', label: 'Terreno', icon: MapPin },
    { id: 'comercial', label: 'Comercial', icon: Building2 },
    { id: 'rural', label: 'Rural', icon: Trees },
]

// Purposes
const purposes = [
    { id: 'venda', label: 'Venda' },
    { id: 'aluguel', label: 'Aluguel' },
    { id: 'venda_aluguel', label: 'Venda e Aluguel' },
]

// Amenities
const amenities = [
    { key: 'tem_piscina', label: 'Piscina', icon: Droplets },
    { key: 'tem_energia_solar', label: 'Energia Solar', icon: Sun },
    { key: 'tem_automacao', label: 'Automação', icon: Zap },
    { key: 'tem_ar_condicionado', label: 'Ar Condicionado', icon: Wind },
    { key: 'eh_mobiliada', label: 'Mobiliado', icon: Armchair },
    { key: 'has_wifi', label: 'Wi-Fi', icon: Wifi },
]

// Collapsible Section Component
function EditSection({
    title,
    icon: Icon,
    children,
    defaultOpen = true,
    badge
}: {
    title: string
    icon: React.ElementType
    children: React.ReactNode
    defaultOpen?: boolean
    badge?: string
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <span className="font-semibold text-gray-900">{title}</span>
                    {badge && (
                        <span className="px-2 py-0.5 bg-accent-100 text-accent-700 text-xs font-medium rounded-full">
                            {badge}
                        </span>
                    )}
                </div>
                <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-5 pt-0 border-t border-gray-100">
                    {children}
                </div>
            </div>
        </div>
    )
}

// Counter Input Component
function CounterInput({
    label,
    value,
    onChange,
    min = 0,
    max = 20
}: {
    label: string
    value: number
    onChange: (v: number) => void
    min?: number
    max?: number
}) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(min, value - 1))}
                    className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold transition-colors"
                >
                    -
                </button>
                <span className="w-12 text-center font-semibold text-lg">{value}</span>
                <button
                    type="button"
                    onClick={() => onChange(Math.min(max, value + 1))}
                    className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold transition-colors"
                >
                    +
                </button>
            </div>
        </div>
    )
}

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()

    // State
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [originalData, setOriginalData] = useState<FormData | null>(null)
    const [isLoadingCep, setIsLoadingCep] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState<FormData>({
        type: '',
        purpose: '',
        cep: '',
        address: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        quadra: '',
        lote: '',
        tipoLote: '',
        bedrooms: 0,
        bathrooms: 0,
        garageSpots: 0,
        area_construida: 0,
        area_terreno: 0,
        tem_piscina: false,
        tem_energia_solar: false,
        tem_automacao: false,
        tem_ar_condicionado: false,
        eh_mobiliada: false,
        has_wifi: false,
        images: [],
        videoUrl: '',
        videoFile: undefined,
        priceSale: '',
        priceRent: '',
        valorIptu: '',
        valorCondominio: '',
        title: '',
        description: '',
        ownerName: '',
        ownerPhone: '',
    })

    // Auth check
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push(`/login?redirect=/meus-imoveis/${id}/editar`)
        }
    }, [authLoading, isAuthenticated, router, id])

    // Fetch property data
    useEffect(() => {
        if (id && isAuthenticated) {
            fetchPropertyData()
        }
    }, [id, isAuthenticated])

    // Track changes
    useEffect(() => {
        if (originalData) {
            const changed = JSON.stringify(formData) !== JSON.stringify(originalData)
            setHasChanges(changed)
        }
    }, [formData, originalData])

    const fetchPropertyData = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await propertiesApi.getById(Number(id))
            if (response.data) {
                const p = response.data
                const data: FormData = {
                    type: p.type || '',
                    purpose: p.purpose || '',
                    cep: p.cep || '',
                    address: p.address || '',
                    number: p.numero || '',
                    complement: p.complemento || '',
                    neighborhood: p.bairro || '',
                    city: p.city || '',
                    state: p.state || '',
                    quadra: p.quadra?.toString() || '',
                    lote: p.lote?.toString() || '',
                    tipoLote: p.tipo_lote || '',
                    bedrooms: p.bedrooms || 0,
                    bathrooms: p.bathrooms || 0,
                    garageSpots: p.garage_spots || 0,
                    area_construida: p.area_construida || 0,
                    area_terreno: p.area_terreno || 0,
                    tem_piscina: !!p.tem_piscina,
                    tem_energia_solar: !!p.tem_energia_solar,
                    tem_automacao: !!p.tem_automacao,
                    tem_ar_condicionado: !!p.tem_ar_condicionado,
                    eh_mobiliada: !!p.eh_mobiliada,
                    has_wifi: !!p.has_wifi,
                    images: (p.images || []).map((url: string) => ({ preview: url, isExisting: true })),
                    videoUrl: p.video_url || '',
                    priceSale: p.price_sale ? Number(p.price_sale).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '',
                    priceRent: p.price_rent ? Number(p.price_rent).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '',
                    valorIptu: p.valor_iptu ? Number(p.valor_iptu).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '',
                    valorCondominio: p.valor_condominio ? Number(p.valor_condominio).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '',
                    title: p.title || '',
                    description: p.description || '',
                    ownerName: p.owner_name || '',
                    ownerPhone: p.owner_phone || '',
                }
                setFormData(data)
                setOriginalData(data)
            }
        } catch (err: any) {
            console.error('Error fetching property:', err)
            setError('Erro ao carregar dados do imóvel. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    // Update form field
    const updateField = useCallback((field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }, [])

    // Format helpers
    const formatCep = (value: string) => {
        return value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substr(0, 9)
    }

    const formatCurrency = (value: string) => {
        if (!value) return ''
        const number = Number(value.replace(/\D/g, '')) / 100
        return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }

    const parseCurrency = (value: string) => {
        if (!value) return null
        return Number(value.replace(/\D/g, '')) / 100
    }

    // CEP lookup
    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newCep = formatCep(e.target.value)
        updateField('cep', newCep)

        if (newCep.length === 9) {
            setIsLoadingCep(true)
            try {
                const cleanCep = newCep.replace('-', '')
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
                const data = await response.json()

                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        address: data.logradouro || prev.address,
                        neighborhood: data.bairro || prev.neighborhood,
                        city: data.localidade || prev.city,
                        state: data.uf || prev.state,
                    }))
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error)
            } finally {
                setIsLoadingCep(false)
            }
        }
    }

    // Image handling
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return

        const files = Array.from(e.target.files)
        const newImages: ImageFile[] = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            isExisting: false
        }))

        setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...newImages].slice(0, 20)
        }))
    }

    const removeImage = (index: number) => {
        setFormData(prev => {
            const newImages = [...prev.images]
            if (newImages[index].preview.startsWith('blob:')) {
                URL.revokeObjectURL(newImages[index].preview)
            }
            newImages.splice(index, 1)
            return { ...prev, images: newImages }
        })
    }

    // Video handling
    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return
        const file = e.target.files[0]

        if (file.size > 100 * 1024 * 1024) {
            alert('O vídeo é muito grande. Tamanho máximo: 100MB')
            return
        }

        setFormData(prev => ({
            ...prev,
            videoFile: file,
            videoUrl: URL.createObjectURL(file)
        }))
    }

    // Submit
    const handleSubmit = async () => {
        if (!hasChanges) {
            router.push('/meus-imoveis')
            return
        }

        setSaving(true)
        setError(null)
        setSaveSuccess(false)

        try {
            const priceSale = parseCurrency(formData.priceSale)
            const priceRent = parseCurrency(formData.priceRent)
            const valorIptu = parseCurrency(formData.valorIptu)
            const valorCondominio = parseCurrency(formData.valorCondominio)

            // Calculate resolved price logic
            const supportsSale = formData.purpose.toLowerCase().includes('venda')
            const supportsRent = formData.purpose.toLowerCase().includes('aluguel')
            const resolvedSalePrice = supportsSale && priceSale && priceSale > 0 ? priceSale : null
            const resolvedRentPrice = supportsRent && priceRent && priceRent > 0 ? priceRent : null
            const resolvedPrice = resolvedSalePrice ?? resolvedRentPrice ?? 0

            const payload = new FormData()

            // Text fields
            payload.append('title', formData.title)
            payload.append('description', formData.description)
            payload.append('type', formData.type)
            payload.append('purpose', formData.purpose)
            if (formData.ownerName) payload.append('owner_name', formData.ownerName)
            if (formData.ownerPhone) payload.append('owner_phone', formData.ownerPhone)

            // Prices
            if (resolvedPrice) payload.append('price', resolvedPrice.toString())
            if (resolvedSalePrice) payload.append('price_sale', resolvedSalePrice.toString())
            if (resolvedRentPrice) payload.append('price_rent', resolvedRentPrice.toString())
            if (valorIptu) payload.append('valor_iptu', valorIptu.toString())
            if (valorCondominio) payload.append('valor_condominio', valorCondominio.toString())

            // Address
            if (formData.cep) payload.append('cep', formData.cep.replace(/\D/g, ''))
            if (formData.city) payload.append('city', formData.city)
            if (formData.state) payload.append('state', formData.state)
            if (formData.neighborhood) payload.append('bairro', formData.neighborhood)
            if (formData.address) payload.append('address', formData.address)
            if (formData.number) payload.append('numero', formData.number)
            if (formData.complement) payload.append('complemento', formData.complement)

            // Details
            if (formData.quadra) payload.append('quadra', formData.quadra)
            if (formData.lote) payload.append('lote', formData.lote)
            if (formData.tipoLote) payload.append('tipo_lote', formData.tipoLote)

            payload.append('bedrooms', formData.bedrooms.toString())
            payload.append('bathrooms', formData.bathrooms.toString())
            payload.append('garage_spots', formData.garageSpots.toString())

            if (formData.area_construida) payload.append('area_construida', formData.area_construida.toString())
            if (formData.area_terreno) payload.append('area_terreno', formData.area_terreno.toString())

            // Booleans
            payload.append('tem_piscina', formData.tem_piscina ? 'true' : 'false')
            payload.append('tem_energia_solar', formData.tem_energia_solar ? 'true' : 'false')
            payload.append('tem_automacao', formData.tem_automacao ? 'true' : 'false')
            payload.append('tem_ar_condicionado', formData.tem_ar_condicionado ? 'true' : 'false')
            payload.append('eh_mobiliada', formData.eh_mobiliada ? 'true' : 'false')
            payload.append('has_wifi', formData.has_wifi ? 'true' : 'false')

            // Video
            if (formData.videoFile) {
                payload.append('video', formData.videoFile)
            } else if (formData.videoUrl && !formData.videoUrl.startsWith('blob:')) {
                payload.append('video_url', formData.videoUrl)
            }

            // Images - only new ones
            formData.images.forEach((imageFile) => {
                if (imageFile.file) {
                    payload.append('images', imageFile.file)
                }
            })

            // Existing images URLs
            const existingImages = formData.images
                .filter(img => img.isExisting)
                .map(img => img.preview)
            if (existingImages.length > 0) {
                payload.append('existing_images', JSON.stringify(existingImages))
            }

            const token = localStorage.getItem('token')
            if (!token) throw new Error('Usuário não autenticado')

            const response = await propertiesApi.update(Number(id), payload, token)

            if (response.error) {
                throw new Error(response.error)
            }

            setSaveSuccess(true)
            setOriginalData(formData)
            setHasChanges(false)

            // Show success briefly then redirect
            setTimeout(() => {
                router.push('/meus-imoveis')
            }, 1500)

        } catch (err: any) {
            console.error('Error saving:', err)
            setError(err.message || 'Erro ao salvar alterações')
        } finally {
            setSaving(false)
        }
    }

    // Loading state
    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                <p className="text-gray-500">Carregando imóvel...</p>
            </div>
        )
    }

    if (!isAuthenticated) return null

    return (
        <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-16 lg:top-20 z-40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/meus-imoveis"
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </Link>
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate max-w-[200px] sm:max-w-none">
                                    {formData.title || 'Editar Imóvel'}
                                </h1>
                                <p className="text-sm text-gray-500 hidden sm:block">
                                    Edite as informações do seu anúncio
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {hasChanges && (
                                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-sm font-medium rounded-full">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                    Alterações não salvas
                                </span>
                            )}

                            <Link
                                href={`/imoveis/${id}`}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors hidden sm:flex"
                                title="Visualizar anúncio"
                            >
                                <Eye className="w-5 h-5 text-gray-600" />
                            </Link>

                            <button
                                onClick={handleSubmit}
                                disabled={saving || (!hasChanges && !saveSuccess)}
                                className={`flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${saveSuccess
                                    ? 'bg-green-500 text-white'
                                    : 'bg-accent-500 hover:bg-accent-600 text-primary-900'
                                    }`}
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : saveSuccess ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                <span className="hidden sm:inline">
                                    {saving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Salvar'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

                {/* Images Section */}
                <EditSection title="Fotos e Mídia" icon={Camera} defaultOpen={true} badge={`${formData.images.length}/20`}>
                    <div className="space-y-4">
                        {/* Image Grid */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {formData.images.map((image, index) => (
                                <div
                                    key={index}
                                    className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group"
                                >
                                    <img
                                        src={image.preview}
                                        alt={`Foto ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    {index === 0 && (
                                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-accent-500 text-primary-900 text-xs font-semibold rounded-full">
                                            Capa
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}

                            {/* Add Image Button */}
                            {formData.images.length < 20 && (
                                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                    <Plus className="w-6 h-6 text-gray-400" />
                                    <span className="text-xs text-gray-500 mt-1">Adicionar</span>
                                </label>
                            )}
                        </div>

                        <p className="text-xs text-gray-500">
                            Arraste para reordenar. A primeira imagem será a capa do anúncio.
                        </p>

                        {/* Video Section */}
                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-3 mb-3">
                                <Film className="w-5 h-5 text-gray-500" />
                                <span className="font-medium text-gray-900">Vídeo</span>
                            </div>

                            <div className="flex flex-col gap-4">
                                <label className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors">
                                    <input
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={handleVideoUpload}
                                    />
                                    <Upload className="w-4 h-4" />
                                    <span className="text-sm font-medium">Carregar vídeo do dispositivo</span>
                                </label>
                            </div>

                            {formData.videoFile && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                                    <Check className="w-4 h-4" />
                                    Vídeo selecionado: {formData.videoFile.name}
                                </div>
                            )}
                        </div>
                    </div>
                </EditSection>

                {/* Basic Info Section */}
                <EditSection title="Informações Básicas" icon={Home} defaultOpen={true}>
                    <div className="space-y-5">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Título do Anúncio *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                placeholder="Ex: Linda Casa no Centro"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                            />
                        </div>

                        {/* Type & Purpose */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Imóvel</label>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                    {propertyTypes.map((type) => {
                                        const Icon = type.icon
                                        return (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => updateField('type', type.id)}
                                                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${formData.type === type.id
                                                    ? 'border-accent-500 bg-accent-50 text-accent-700'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span className="text-xs font-medium">{type.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Finalidade</label>
                                <div className="flex flex-wrap gap-2">
                                    {purposes.map((purpose) => (
                                        <button
                                            key={purpose.id}
                                            type="button"
                                            onClick={() => updateField('purpose', purpose.id)}
                                            className={`px-4 py-2.5 rounded-xl border-2 font-medium transition-all ${formData.purpose === purpose.id
                                                ? 'border-accent-500 bg-accent-50 text-accent-700'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            {purpose.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => updateField('description', e.target.value)}
                                rows={5}
                                placeholder="Descreva os detalhes e diferenciais do imóvel..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                            />
                        </div>
                    </div>
                </EditSection>

                {/* Location Section */}
                <EditSection title="Localização" icon={MapPin} defaultOpen={false}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">CEP</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.cep}
                                        onChange={handleCepChange}
                                        placeholder="00000-000"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                    />
                                    {isLoadingCep && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin" />
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado *</label>
                                <input
                                    type="text"
                                    value={formData.state}
                                    onChange={(e) => updateField('state', e.target.value.toUpperCase())}
                                    placeholder="UF"
                                    maxLength={2}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl uppercase"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade *</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => updateField('city', e.target.value)}
                                    placeholder="Nome da cidade"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bairro *</label>
                                <input
                                    type="text"
                                    value={formData.neighborhood}
                                    onChange={(e) => updateField('neighborhood', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rua *</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => updateField('address', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Número *</label>
                                <input
                                    type="text"
                                    value={formData.number}
                                    onChange={(e) => updateField('number', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Complemento</label>
                                <input
                                    type="text"
                                    value={formData.complement}
                                    onChange={(e) => updateField('complement', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Quadra *</label>
                                <input
                                    type="text"
                                    value={formData.quadra}
                                    onChange={(e) => updateField('quadra', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lote *</label>
                                <input
                                    type="text"
                                    value={formData.lote}
                                    onChange={(e) => updateField('lote', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Lote</label>
                            <select
                                value={formData.tipoLote}
                                onChange={(e) => updateField('tipoLote', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                            >
                                <option value="">Selecione</option>
                                <option value="meio">Meio</option>
                                <option value="inteiro">Inteiro</option>
                            </select>
                        </div>
                    </div>
                </EditSection>

                {/* Characteristics Section */}
                <EditSection title="Características" icon={Building2} defaultOpen={false}>
                    <div className="space-y-6">
                        {/* Areas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Área Construída (m²)</label>
                                <input
                                    type="number"
                                    value={formData.area_construida || ''}
                                    onChange={(e) => updateField('area_construida', Number(e.target.value))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Área do Terreno (m²)</label>
                                <input
                                    type="number"
                                    value={formData.area_terreno || ''}
                                    onChange={(e) => updateField('area_terreno', Number(e.target.value))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Counters */}
                        {formData.type !== 'terreno' && (
                            <div className="flex flex-wrap gap-8">
                                <CounterInput
                                    label="Quartos"
                                    value={formData.bedrooms}
                                    onChange={(v) => updateField('bedrooms', v)}
                                />
                                <CounterInput
                                    label="Banheiros"
                                    value={formData.bathrooms}
                                    onChange={(v) => updateField('bathrooms', v)}
                                />
                                <CounterInput
                                    label="Garagens"
                                    value={formData.garageSpots}
                                    onChange={(v) => updateField('garageSpots', v)}
                                />
                            </div>
                        )}
                    </div>
                </EditSection>

                {/* Amenities Section */}
                <EditSection title="Comodidades" icon={Wifi} defaultOpen={false}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {amenities.map((item) => {
                            const isSelected = formData[item.key as keyof FormData]
                            const Icon = item.icon
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => updateField(item.key as keyof FormData, !isSelected)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${isSelected
                                        ? 'border-accent-500 bg-accent-50 text-accent-700'
                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-xs font-medium text-center">{item.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </EditSection>

                {/* Pricing Section */}
                <EditSection title="Valores" icon={DollarSign} defaultOpen={false}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(formData.purpose.includes('venda') || formData.purpose === 'venda_aluguel' || !formData.purpose) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor de Venda</label>
                                    <input
                                        type="text"
                                        value={formData.priceSale}
                                        onChange={(e) => updateField('priceSale', formatCurrency(e.target.value))}
                                        placeholder="R$ 0,00"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-semibold"
                                    />
                                </div>
                            )}
                            {(formData.purpose.includes('aluguel') || formData.purpose === 'venda_aluguel' || !formData.purpose) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor do Aluguel</label>
                                    <input
                                        type="text"
                                        value={formData.priceRent}
                                        onChange={(e) => updateField('priceRent', formatCurrency(e.target.value))}
                                        placeholder="R$ 0,00"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-semibold"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">IPTU (anual)</label>
                                <input
                                    type="text"
                                    value={formData.valorIptu}
                                    onChange={(e) => updateField('valorIptu', formatCurrency(e.target.value))}
                                    placeholder="R$ 0,00"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Condomínio (mensal)</label>
                                <input
                                    type="text"
                                    value={formData.valorCondominio}
                                    onChange={(e) => updateField('valorCondominio', formatCurrency(e.target.value))}
                                    placeholder="R$ 0,00"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                </EditSection>

                {/* Owner Info Section */}
                <EditSection title="Dados do Proprietário" icon={Building2} defaultOpen={false} badge="Uso Interno">
                    <div className="p-4 bg-blue-50 rounded-xl mb-4">
                        <p className="text-sm text-blue-700">
                            Esses dados são visíveis apenas para os administradores da plataforma.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do Proprietário</label>
                            <input
                                type="text"
                                value={formData.ownerName}
                                readOnly
                                disabled
                                placeholder="Nome completo"
                                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone do Proprietário</label>
                            <input
                                type="tel"
                                value={formData.ownerPhone}
                                readOnly
                                disabled
                                placeholder="(00) 00000-0000"
                                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </EditSection>
            </div>

            {/* Mobile Save Button */}
            {hasChanges && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 sm:hidden">
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            )}
        </div>
    )
}
