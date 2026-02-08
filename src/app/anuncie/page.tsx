'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    Home, Building2, MapPin, DollarSign,
    Camera, Check, ChevronLeft, ChevronRight, X, Plus,
    Droplets, Wifi, Wind, Tv, Trees, ShieldCheck, Zap, Armchair, Sun, Share2, Video, Film,
    Users, HelpCircle, AlertCircle, Phone
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { propertiesApi } from '@/lib/api'

import { Property, ImageFile } from '@/types/property'

// ... imports

// Property types
// ...

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

// Steps for the wizard (after client pre-steps)
const steps = [
    { id: 1, title: 'Básico', description: 'Tipo e Finalidade' },
    { id: 2, title: 'Localização', description: 'Endereço completo' },
    { id: 3, title: 'Detalhes', description: 'Características' },
    { id: 4, title: 'Extras', description: 'Comodidades' },
    { id: 5, title: 'Mídia', description: 'Fotos e Vídeo' },
    { id: 6, title: 'Finalizar', description: 'Preços e Descrição' },
]

// Client pre-step states
type ClientPreStep = 'choice' | 'confirm_team' | 'is_owner' | 'not_owner' | 'sent_success' | null

const SUPPORT_REQUEST_COOLDOWN = 30 * 60 * 1000 // 30 minutes in ms

function AnnounceWizard() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, isAuthenticated, isLoading } = useAuth()

    // Client pre-step state
    const [clientPreStep, setClientPreStep] = useState<ClientPreStep>(null)
    const [sendingRequest, setSendingRequest] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    // Wizard state
    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingCep, setIsLoadingCep] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [videoUploading, setVideoUploading] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [propertyId, setPropertyId] = useState<string | null>(null)
    const [isLoadingData, setIsLoadingData] = useState(false)

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
        title: '',
        description: '',
        ownerName: '',
        ownerPhone: '',
    })

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login?redirect=/anuncie')
        }
    }, [isAuthenticated, isLoading, router])

    // Determine if we need client pre-steps
    useEffect(() => {
        if (user && !editMode) {
            const isBroker = user.role === 'broker'
            // Brokers skip pre-steps, clients get them
            setClientPreStep(isBroker ? null : 'choice')
        }
    }, [user, editMode])

    // Check for Edit Mode
    useEffect(() => {
        const id = searchParams.get('id')
        if (id && !editMode) {
            setEditMode(true)
            setPropertyId(id)
            setClientPreStep(null) // Skip pre-steps for editing
            fetchPropertyData(id)
        }
    }, [searchParams])

    const fetchPropertyData = async (id: string) => {
        setIsLoadingData(true)
        try {
            const response = await propertiesApi.getById(Number(id))
            if (response.data) {
                const p = response.data
                setFormData({
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
                    images: p.images || [],
                    videoUrl: p.video_url || '',
                    priceSale: p.price_sale ? Number(p.price_sale).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '',
                    priceRent: p.price_rent ? Number(p.price_rent).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '',
                    title: p.title || '',
                    description: p.description || '',
                    ownerName: p.owner_name || '',
                    ownerPhone: p.owner_phone || '',
                })
            }
        } catch (error) {
            console.error('Error fetching property:', error)
            alert('Erro ao carregar dados do imóvel.')
        } finally {
            setIsLoadingData(false)
        }
    }

    // Check if user can send support request (rate limit)
    const canSendSupportRequest = () => {
        const lastRequest = localStorage.getItem('lastSupportRequest')
        if (!lastRequest) return true
        const elapsed = Date.now() - Number(lastRequest)
        return elapsed > SUPPORT_REQUEST_COOLDOWN
    }

    const getRemainingCooldown = () => {
        const lastRequest = localStorage.getItem('lastSupportRequest')
        if (!lastRequest) return 0
        const elapsed = Date.now() - Number(lastRequest)
        const remaining = SUPPORT_REQUEST_COOLDOWN - elapsed
        return Math.max(0, Math.ceil(remaining / 60000)) // in minutes
    }

    // Send support request to backend
    const handleSendSupportRequest = async () => {
        if (!canSendSupportRequest()) {
            const mins = getRemainingCooldown()
            alert(`Você já enviou uma solicitação recentemente. Aguarde ${mins} minutos para enviar novamente.`)
            return
        }

        setSendingRequest(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('https://backend-production-6acc.up.railway.app/users/support-request', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            if (res.status === 429) {
                throw new Error('Você já enviou uma solicitação nas últimas 24 horas.')
            }

            if (!res.ok) {
                throw new Error('Não foi possível enviar a solicitação.')
            }

            // Success - save timestamp and show message
            localStorage.setItem('lastSupportRequest', Date.now().toString())
            setSuccessMessage('Notificação enviada com sucesso! Nossa equipe responderá em até 24 horas.')
            setClientPreStep('sent_success')

            // Redirect to home after 7 seconds
            setTimeout(() => {
                router.push('/')
            }, 7000)

        } catch (error: any) {
            alert(error.message || 'Erro ao enviar solicitação.')
        } finally {
            setSendingRequest(false)
        }
    }

    const updateFormData = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

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

    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newCep = formatCep(e.target.value)
        updateFormData('cep', newCep)

        if (newCep.length === 9) {
            setIsLoadingCep(true)
            try {
                const cleanCep = newCep.replace('-', '')
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
                const data = await response.json()

                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        address: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf,
                    }))
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error)
            } finally {
                setIsLoadingCep(false)
            }
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return

        const files = Array.from(e.target.files)

        // Create local previews and store files
        const newImages: ImageFile[] = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }))

        setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...newImages]
        }))
    }

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return
        const file = e.target.files[0]

        if (file.size > 50 * 1024 * 1024) {
            if (!confirm('Este vídeo é grande (>50MB). O upload pode demorar. Deseja continuar?')) return
        }

        // Store file for submission
        setFormData(prev => ({
            ...prev,
            videoFile: file,
            videoUrl: URL.createObjectURL(file) // For preview if needed (though we don't preview video currently?)
        }))
    }

    const removeImage = (index: number) => {
        setFormData(prev => {
            const newImages = [...prev.images]
            // Revoke object URL to avoid memory leaks
            if (newImages[index].preview.startsWith('blob:')) {
                URL.revokeObjectURL(newImages[index].preview)
            }
            newImages.splice(index, 1)
            return { ...prev, images: newImages }
        })
    }

    const toggleAmenity = (field: keyof FormData) => {
        setFormData(prev => ({ ...prev, [field]: !prev[field] }))
    }

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return formData.type && formData.purpose
            case 2:
                // City, State, Neighborhood, Address, Number, Quadra, Lote required
                return formData.city && formData.neighborhood && formData.address && formData.state && formData.number && formData.quadra && formData.lote
            case 5:
                if (formData.images.length < 2) return false
                if (formData.images.length > 20) return false
                return true
            case 6:
            case 6:
                return formData.title && formData.description && (formData.priceSale || formData.priceRent) && formData.ownerName && formData.ownerPhone
            default:
                return true
        }
    }

    const getDisabledReason = () => {
        if (currentStep === 2) {
            if (!formData.quadra) return 'Quadra é obrigatória'
            if (!formData.lote) return 'Lote é obrigatório'
        }
        if (currentStep === 5) {
            if (formData.images.length < 2) return `Adicione pelo menos 2 fotos (${formData.images.length}/2)`
            if (formData.images.length > 20) return `Muitas fotos (${formData.images.length}/20)`
        }
        return ''
    }

    const handleNext = () => {
        if (currentStep < steps.length && canProceed()) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const handleSubmit = async () => {
        if (!canProceed()) return
        setIsSubmitting(true)

        try {
            const priceSale = parseCurrency(formData.priceSale)
            const priceRent = parseCurrency(formData.priceRent)
            const areaConstruida = formData.area_construida || null
            const areaTerreno = formData.area_terreno || null

            // Calculate resolved price logic like Flutter
            const supportsSale = formData.purpose.toLowerCase().includes('venda')
            const supportsRent = formData.purpose.toLowerCase().includes('aluguel')
            const resolvedSalePrice = supportsSale && priceSale && priceSale > 0 ? priceSale : null
            const resolvedRentPrice = supportsRent && priceRent && priceRent > 0 ? priceRent : null
            const resolvedPrice = resolvedSalePrice ?? resolvedRentPrice ?? 0

            // Create FormData for Multipart request
            const payload = new FormData()

            // Text fields
            payload.append('title', formData.title)
            payload.append('description', formData.description)
            payload.append('type', formData.type)
            payload.append('purpose', formData.purpose)
            payload.append('status', 'pending_approval')
            payload.append('owner_name', formData.ownerName)
            payload.append('owner_phone', formData.ownerPhone)

            // Numeric/Currency fields
            if (resolvedPrice) payload.append('price', resolvedPrice.toString())
            if (resolvedSalePrice) payload.append('price_sale', resolvedSalePrice.toString())
            if (resolvedRentPrice) payload.append('price_rent', resolvedRentPrice.toString())

            if (resolvedSalePrice) payload.append('sale_price', resolvedSalePrice.toString())
            if (resolvedRentPrice) payload.append('rent_price', resolvedRentPrice.toString())

            // Address
            payload.append('cep', formData.cep.replace(/\D/g, ''))
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

            if (formData.bedrooms) payload.append('bedrooms', formData.bedrooms.toString())
            if (formData.bathrooms) payload.append('bathrooms', formData.bathrooms.toString())
            if (formData.garageSpots) payload.append('garage_spots', formData.garageSpots.toString())

            if (areaConstruida) payload.append('area_construida', areaConstruida.toString())
            if (areaTerreno) payload.append('area_terreno', areaTerreno.toString())
            if (areaConstruida) payload.append('area', areaConstruida.toString()) // Alias

            // Booleans
            payload.append('tem_piscina', formData.tem_piscina ? 'true' : 'false')
            payload.append('tem_energia_solar', formData.tem_energia_solar ? 'true' : 'false')
            payload.append('tem_automacao', formData.tem_automacao ? 'true' : 'false')
            payload.append('tem_ar_condicionado', formData.tem_ar_condicionado ? 'true' : 'false')
            payload.append('eh_mobiliada', formData.eh_mobiliada ? 'true' : 'false')
            payload.append('has_wifi', formData.has_wifi ? 'true' : 'false')

            if (formData.videoFile) {
                payload.append('video', formData.videoFile)
            } else if (formData.videoUrl) {
                payload.append('video_url', formData.videoUrl)
            }

            // Images
            formData.images.forEach((imageFile) => {
                if (imageFile.file) {
                    payload.append('images', imageFile.file)
                }
            })

            console.log('📦 [Anuncie] FormData entries (sending Multipart):')
            // Log for debugging
            // @ts-ignore
            for (const pair of payload.entries()) {
                console.log(pair[0], pair[1])
            }

            const token = localStorage.getItem('token')
            if (!token) throw new Error('Usuário não autenticado')

            let response
            if (editMode && propertyId) {
                response = await propertiesApi.update(Number(propertyId), payload, token)
            } else {
                response = await propertiesApi.create(payload, token)
            }

            if (response.error) {
                throw new Error(response.error)
            }

            router.push('/meus-imoveis')
        } catch (error: any) {
            console.error('Error submitting:', error)
            alert(`Erro ao ${editMode ? 'atualizar' : 'publicar'} imóvel: ${error.message || 'Erro desconhecido'}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Loading states
    if (isLoading || isLoadingData) {
        return (
            <div className="min-h-screen pt-20 flex justify-center items-center">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!isAuthenticated) return null

    // ===== CLIENT PRE-STEPS =====
    if (clientPreStep !== null) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20 pb-12 flex items-center justify-center">
                <div className="max-w-lg w-full mx-auto px-4">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">

                        {/* Step: Choice */}
                        {clientPreStep === 'choice' && (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <HelpCircle className="w-8 h-8 text-accent-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Como você quer anunciar?</h2>
                                <p className="text-gray-500 mb-8">Escolha a opção que melhor se aplica a você</p>

                                <div className="space-y-4">
                                    <button
                                        onClick={() => setClientPreStep('confirm_team')}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-accent-500 hover:bg-accent-50 transition-all text-left group"
                                    >
                                        <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center group-hover:bg-accent-200 transition-colors">
                                            <Users className="w-6 h-6 text-accent-700" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Entrar em contato com a equipe</h3>
                                            <p className="text-sm text-gray-500">Nossa equipe ajudará você no processo</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setClientPreStep('is_owner')}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all text-left group"
                                    >
                                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                                            <Building2 className="w-6 h-6 text-primary-700" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Anunciar você mesmo</h3>
                                            <p className="text-sm text-gray-500">Cadastre seu imóvel diretamente</p>
                                        </div>
                                    </button>
                                </div>

                                <Link href="/" className="inline-block mt-6 text-sm text-gray-500 hover:text-gray-700">
                                    Voltar ao início
                                </Link>
                            </div>
                        )}

                        {/* Step: Confirm Team Contact */}
                        {clientPreStep === 'confirm_team' && (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Phone className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Confirmar contato</h2>
                                <p className="text-gray-500 mb-6">
                                    Se continuar, você enviará uma notificação aos administradores.
                                    Eles responderão em até <strong>24 horas</strong>.
                                </p>
                                <p className="text-gray-500 mb-8">Deseja continuar?</p>

                                <div className="space-y-3">
                                    <button
                                        onClick={handleSendSupportRequest}
                                        disabled={sendingRequest}
                                        className="w-full py-3 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        {sendingRequest ? 'Enviando...' : 'Continuar'}
                                    </button>
                                    <button
                                        onClick={() => setClientPreStep('choice')}
                                        className="w-full py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step: Is Owner? */}
                        {clientPreStep === 'is_owner' && (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Home className="w-8 h-8 text-primary-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Você é proprietário do imóvel?</h2>
                                <p className="text-gray-500 mb-8">Para anunciar, você precisa ser o dono do imóvel</p>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => setClientPreStep(null)} // Proceed to wizard
                                        className="w-full py-3 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl transition-colors"
                                    >
                                        Sim, sou proprietário
                                    </button>
                                    <button
                                        onClick={() => setClientPreStep('not_owner')}
                                        className="w-full py-3 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                                    >
                                        Não, quero anunciar de outra pessoa
                                    </button>
                                    <button
                                        onClick={() => setClientPreStep('choice')}
                                        className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        Voltar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step: Not Owner */}
                        {clientPreStep === 'not_owner' && (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <AlertCircle className="w-8 h-8 text-red-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Não é possível anunciar</h2>
                                <p className="text-gray-500 mb-8">
                                    Se o imóvel não for seu, não é possível anunciar pelo site.
                                    Fale com nossa equipe para receber orientação.
                                </p>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => setClientPreStep('confirm_team')}
                                        className="w-full py-3 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Users className="w-5 h-5" />
                                        Entrar em contato com a equipe
                                    </button>
                                    <Link
                                        href="/"
                                        className="block w-full py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        Voltar ao início
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Step: Success */}
                        {clientPreStep === 'sent_success' && (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Check className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Solicitação enviada!</h2>
                                <p className="text-gray-500 mb-4">{successMessage}</p>
                                <p className="text-sm text-gray-400">Redirecionando para a página inicial...</p>

                                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-600 mb-1">Para emergências:</p>
                                    <p className="font-semibold text-gray-900">+55 62 90000-0000</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // ===== MAIN WIZARD =====
    return (
        <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{editMode ? 'Editar Anúncio' : 'Anunciar Imóvel'}</h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Passo {currentStep}: {steps[currentStep - 1].title}
                            </p>
                        </div>
                        <Link href="/" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                            <X className="w-6 h-6" />
                        </Link>
                    </div>
                    <div className="mt-6 flex gap-2">
                        {steps.map((step) => (
                            <div key={step.id} className={`flex-1 h-2 rounded-full transition-all ${step.id <= currentStep ? 'bg-accent-500' : 'bg-gray-200'}`} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">

                    {/* Step 1: Type & Purpose */}
                    {currentStep === 1 && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">O que você quer anunciar?</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {propertyTypes.map((type) => {
                                        const Icon = type.icon
                                        return (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => updateFormData('type', type.id)}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${formData.type === type.id ? 'border-accent-500 bg-accent-50 text-accent-700' : 'border-gray-200 text-gray-600'}`}
                                            >
                                                <Icon className="w-6 h-6" />
                                                <span className="text-sm font-medium">{type.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Qual a finalidade?</h2>
                                <div className="grid grid-cols-3 gap-3">
                                    {purposes.map((purpose) => (
                                        <button
                                            key={purpose.id}
                                            type="button"
                                            onClick={() => updateFormData('purpose', purpose.id)}
                                            className={`p-4 rounded-xl border-2 font-medium transition-all ${formData.purpose === purpose.id ? 'border-accent-500 bg-accent-50 text-accent-700' : 'border-gray-200 text-gray-600'}`}
                                        >
                                            {purpose.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Location */}
                    {currentStep === 2 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-semibold text-gray-900">Localização</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">CEP</label>
                                    <div className="relative">
                                        <input type="text" value={formData.cep} onChange={handleCepChange} placeholder="00000-000" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500" />
                                        {isLoadingCep && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-primary-500">Buscando...</span>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado *</label>
                                    <input type="text" value={formData.state} onChange={e => updateFormData('state', e.target.value.toUpperCase())} placeholder="UF" maxLength={2} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 uppercase" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade *</label>
                                    <input type="text" value={formData.city} onChange={e => updateFormData('city', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bairro *</label>
                                    <input type="text" value={formData.neighborhood} onChange={e => updateFormData('neighborhood', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rua *</label>
                                <input type="text" value={formData.address} onChange={e => updateFormData('address', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" required />
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Número *</label>
                                    <input type="text" value={formData.number} onChange={e => updateFormData('number', e.target.value.replace(/\D/g, ''))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Complemento</label>
                                    <input type="text" value={formData.complement} onChange={e => updateFormData('complement', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Quadra *</label>
                                    <input type="text" value={formData.quadra} onChange={e => updateFormData('quadra', e.target.value.replace(/\D/g, ''))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Lote *</label>
                                    <input type="text" value={formData.lote} onChange={e => updateFormData('lote', e.target.value.replace(/\D/g, ''))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Lote</label>
                                <select value={formData.tipoLote} onChange={e => updateFormData('tipoLote', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                                    <option value="">Selecione</option>
                                    <option value="meio">Meio</option>
                                    <option value="inteiro">Inteiro</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Details */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900">Dimensões e Características</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Área Construída (m²)</label>
                                    <input type="number" value={formData.area_construida || ''} onChange={e => updateFormData('area_construida', Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Área Terreno (m²)</label>
                                    <input type="number" value={formData.area_terreno || ''} onChange={e => updateFormData('area_terreno', Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" />
                                </div>
                            </div>

                            {formData.type !== 'terreno' && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Quartos</label>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => updateFormData('bedrooms', Math.max(0, formData.bedrooms - 1))} className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200">-</button>
                                            <span className="w-10 text-center font-semibold">{formData.bedrooms}</span>
                                            <button type="button" onClick={() => updateFormData('bedrooms', formData.bedrooms + 1)} className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200">+</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Banheiros</label>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => updateFormData('bathrooms', Math.max(0, formData.bathrooms - 1))} className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200">-</button>
                                            <span className="w-10 text-center font-semibold">{formData.bathrooms}</span>
                                            <button type="button" onClick={() => updateFormData('bathrooms', formData.bathrooms + 1)} className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200">+</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Garagens</label>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => updateFormData('garageSpots', Math.max(0, formData.garageSpots - 1))} className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200">-</button>
                                            <span className="w-10 text-center font-semibold">{formData.garageSpots}</span>
                                            <button type="button" onClick={() => updateFormData('garageSpots', formData.garageSpots + 1)} className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200">+</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Amenities */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900">Comodidades</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {[
                                    { key: 'tem_piscina', label: 'Piscina', icon: Droplets },
                                    { key: 'tem_energia_solar', label: 'Energia Solar', icon: Sun },
                                    { key: 'tem_automacao', label: 'Automação', icon: Zap },
                                    { key: 'tem_ar_condicionado', label: 'Ar Condicionado', icon: Wind },
                                    { key: 'eh_mobiliada', label: 'Mobiliado', icon: Armchair },
                                    { key: 'has_wifi', label: 'Wi-Fi', icon: Wifi },
                                ].map((item) => {
                                    const isSelected = formData[item.key as keyof FormData]
                                    const Icon = item.icon
                                    return (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={() => toggleAmenity(item.key as keyof FormData)}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-accent-500 bg-accent-50 text-accent-700' : 'border-gray-200 text-gray-600'}`}
                                        >
                                            <Icon className="w-6 h-6" />
                                            <span>{item.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 5: Media */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900">Fotos e Vídeo</h2>
                            <p className="text-sm text-gray-500">Adicione no mínimo 2 e no máximo 20 fotos.</p>

                            {/* Photo Upload */}
                            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-gray-50/50">
                                <input type="file" multiple accept="image/*" className="hidden" id="images-upload" onChange={handleImageUpload} disabled={uploading || formData.images.length >= 20} />
                                <label htmlFor="images-upload" className={`cursor-pointer ${uploading || formData.images.length >= 20 ? 'opacity-50' : ''}`}>
                                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 mb-2">Clique para selecionar fotos</p>
                                    <span className="inline-block px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium shadow-sm">
                                        {uploading ? 'Enviando...' : `Selecionar (${formData.images.length}/20)`}
                                    </span>
                                </label>
                            </div>

                            {formData.images.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                    {formData.images.map((image, index) => (
                                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                                            <img src={image.preview} alt={`Foto ${index}`} className="w-full h-full object-cover" />
                                            <button onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Video Upload */}
                            <div className="pt-4 border-t border-gray-200">
                                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                    <Film className="w-5 h-5 text-gray-500" />
                                    Vídeo do Imóvel
                                </h3>

                                <div className="space-y-4">
                                    <div className="text-center">
                                        <span className="text-sm text-gray-400">ou envie um arquivo</span>
                                    </div>

                                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center bg-gray-50/50">
                                        <input type="file" accept="video/*" className="hidden" id="video-upload" onChange={handleVideoUpload} disabled={videoUploading} />
                                        <label htmlFor="video-upload" className={`cursor-pointer ${videoUploading ? 'opacity-50' : ''}`}>
                                            <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600">Carregar vídeo do dispositivo</p>
                                            {videoUploading && <p className="text-xs text-primary-500 mt-1">Carregando...</p>}
                                        </label>
                                    </div>

                                    {formData.videoUrl && (
                                        <div className="text-sm text-green-600 bg-green-50 p-2 rounded-lg flex items-center gap-2">
                                            <Check className="w-4 h-4" /> Vídeo carregado com sucesso
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Price */}
                    {currentStep === 6 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900">Preços e Descrição</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {formData.purpose.includes('venda') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor Venda</label>
                                        <input type="text" value={formData.priceSale} onChange={e => updateFormData('priceSale', formatCurrency(e.target.value))} placeholder="R$ 0,00" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold text-lg" />
                                    </div>
                                )}
                                {formData.purpose.includes('aluguel') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor Aluguel</label>
                                        <input type="text" value={formData.priceRent} onChange={e => updateFormData('priceRent', formatCurrency(e.target.value))} placeholder="R$ 0,00" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold text-lg" />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Título do Anúncio *</label>
                                <input type="text" value={formData.title} onChange={e => updateFormData('title', e.target.value)} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição *</label>
                                <textarea value={formData.description} onChange={e => updateFormData('description', e.target.value)} rows={5} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" />
                            </div>

                            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                                <p className="text-sm text-yellow-800">
                                    <strong>Atenção:</strong> Seu anúncio passará por análise dos moderadores antes de ser publicado.
                                </p>
                            </div>
                            {/* Owner Info - Admin Only */}
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Dados do Proprietário <span className="text-xs font-normal text-blue-600">(Uso Interno)</span>
                                </h3>
                                <p className="text-sm text-blue-700 mb-4">
                                    Esses dados ficarão visíveis apenas para os administradores.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Proprietário *</label>
                                        <input
                                            type="text"
                                            value={formData.ownerName}
                                            readOnly
                                            disabled
                                            className="w-full px-4 py-3 bg-gray-100 rounded-xl border-2 border-gray-200 text-gray-500 cursor-not-allowed"
                                            placeholder="Nome completo"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Telefone do Proprietário *</label>
                                        <input
                                            type="tel"
                                            value={formData.ownerPhone}
                                            readOnly
                                            disabled
                                            className="w-full px-4 py-3 bg-gray-100 rounded-xl border-2 border-gray-200 text-gray-500 cursor-not-allowed"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Título do Anúncio *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => updateFormData('title', e.target.value)}
                                    className="w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none transition-colors"
                                    placeholder="Ex: Linda Casa no Centro"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Descrição Completa *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => updateFormData('description', e.target.value)}
                                    rows={6}
                                    className="w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none transition-colors resize-none"
                                    placeholder="Descreva detalhes do imóvel, diferenciais..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                        <button onClick={handleBack} disabled={currentStep === 1} className="flex items-center gap-2 px-6 py-3 font-medium rounded-xl hover:bg-gray-100 disabled:opacity-50">
                            <ChevronLeft className="w-5 h-5" /> Voltar
                        </button>

                        <div className="flex items-center gap-4">
                            {getDisabledReason() && (
                                <span className="text-sm text-red-500 font-medium">{getDisabledReason()}</span>
                            )}

                            {currentStep < 6 ? (
                                <button onClick={handleNext} disabled={!canProceed()} className="flex items-center gap-2 px-6 py-3 font-semibold rounded-xl bg-accent-500 hover:bg-accent-600 text-primary-900 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Próximo <ChevronRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button onClick={handleSubmit} disabled={isSubmitting || !canProceed()} className="flex items-center gap-2 px-8 py-3 font-semibold rounded-xl bg-accent-500 hover:bg-accent-600 text-primary-900 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isSubmitting ? 'Processando...' : (editMode ? 'Salvar Alterações' : 'Enviar para Análise')} <Check className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function AnnouncePage() {
    return (
        <Suspense fallback={<div className="min-h-screen pt-20 flex justify-center"><div className="loader" /></div>}>
            <AnnounceWizard />
        </Suspense>
    )
}
