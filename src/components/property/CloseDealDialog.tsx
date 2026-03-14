'use client'

import { useState, useEffect, useRef } from 'react'
import { Property, formatPrice } from '@/types/property'
import { cancelPropertyDeal, closePropertyDeal } from '@/lib/propertyDeals'
import { CurrencyInput } from '@/components/form/CurrencyInput'
import { formatCurrencyInput } from '@/lib/currencyInput'
import {
    X, Loader2, DollarSign, Percent, AlertTriangle,
    Handshake, Ban, ChevronDown
} from 'lucide-react'

interface CloseDealDialogProps {
    property: Property
    open: boolean
    onClose: () => void
    onDealClosed: (updatedStatus: string) => void
}

type DealType = 'sale' | 'rent'

const RECURRENCE_OPTIONS = [
    { value: 'none', label: 'Não aumentar' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'yearly', label: 'Anual' },
] as const

function parseCurrency(raw: string): number {
    let n = raw.replace(/[^\d,.\-]/g, '').trim()
    if (!n) return 0
    const lastComma = n.lastIndexOf(',')
    const lastDot = n.lastIndexOf('.')
    if (lastComma > lastDot) {
        n = n.replaceAll('.', '').replace(',', '.')
    } else if (lastDot > lastComma) {
        n = n.replaceAll(',', '')
    }
    return parseFloat(n) || 0
}

export default function CloseDealDialog({ property, open, onClose, onDealClosed }: CloseDealDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)

    const supportsSale = property.purpose?.toLowerCase().includes('vend') || property.priceSale && property.priceSale > 0
    const supportsRent = property.purpose?.toLowerCase().includes('alug') || property.priceRent && property.priceRent > 0
    const statusLower = property.status?.toLowerCase() || ''
    const isClosedDeal = statusLower === 'sold' || statusLower === 'rented'

    const defaultType: DealType = statusLower === 'rented' ? 'rent'
        : statusLower === 'sold' ? 'sale'
            : (supportsRent && !supportsSale ? 'rent' : 'sale')

    const [dealType, setDealType] = useState<DealType>(defaultType)
    const [amount, setAmount] = useState('')
    const [commissionRate, setCommissionRate] = useState('5,00')
    const [commissionCycles, setCommissionCycles] = useState('0')
    const [recurrence, setRecurrence] = useState(defaultType === 'rent' ? 'monthly' : 'none')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Set default amount when type changes
    useEffect(() => {
        function resolveDefault(type: DealType): number {
            if (type === 'rent') return property.priceRent ?? property.price ?? 0
            return property.priceSale ?? property.price ?? 0
        }
        setAmount(formatCurrencyInput(resolveDefault(dealType).toFixed(2).replace('.', ',')))
    }, [dealType, property])

    // Dialog open/close
    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (open && !dialog.open) {
            dialog.showModal()
        } else if (!open && dialog.open) {
            dialog.close()
        }
    }, [open])

    function handleTypeChange(type: DealType) {
        setDealType(type)
        if (type === 'rent' && recurrence === 'none') setRecurrence('monthly')
        if (type === 'sale') setRecurrence('none')
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const amountNum = parseCurrency(amount)
        const commissionNum = parseCurrency(commissionRate)
        if (amountNum <= 0) { setError('Informe um valor válido.'); return }
        if (commissionNum <= 0) { setError('Informe uma comissão válida.'); return }

        setIsSubmitting(true)
        setError(null)
        try {
            const res = await closePropertyDeal(property.id, {
                type: dealType,
                amount: amountNum,
                commission_rate: commissionNum,
                commission_cycles: parseInt(commissionCycles) || 0,
                recurrence_interval: recurrence,
            })
            const updatedStatus = res?.status || (dealType === 'rent' ? 'rented' : 'sold')
            onDealClosed(updatedStatus)
            onClose()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao fechar negócio.')
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleCancel() {
        if (!window.confirm('Tem certeza que deseja cancelar este negócio?')) return

        setIsSubmitting(true)
        setError(null)
        try {
            const res = await cancelPropertyDeal(property.id)
            const updatedStatus = res?.status || 'approved'
            onDealClosed(updatedStatus)
            onClose()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao cancelar negócio.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!open) return null

    return (
        <dialog
            ref={dialogRef}
            onCancel={onClose}
            className="fixed inset-0 z-50 m-0 p-0 w-full h-full max-w-none max-h-none bg-transparent backdrop:bg-black/50"
        >
            {/* Overlay click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Sheet */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:max-w-lg sm:w-full">
                {/* Header */}
                <div className="sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl z-10 px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">
                            {isClosedDeal ? 'Atualizar negócio' : 'Fechar negócio'}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Type selector */}
                    {(supportsSale && supportsRent) ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['sale', 'rent'] as const).map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => handleTypeChange(t)}
                                        className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${dealType === t
                                            ? 'bg-primary-50 border-primary-500 text-primary-700'
                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {t === 'sale' ? 'Venda' : 'Aluguel'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="font-medium">Tipo:</span>
                            <span className="font-bold text-gray-900">{dealType === 'sale' ? 'Venda' : 'Aluguel'}</span>
                        </div>
                    )}

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor final</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <CurrencyInput
                                value={amount}
                                onChange={setAmount}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                placeholder="R$ 0,00"
                            />
                        </div>
                    </div>

                    {/* Commission Rate */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Comissão</label>
                        <div className="relative">
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={commissionRate}
                                onChange={e => setCommissionRate(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                placeholder="5,00"
                                inputMode="decimal"
                            />
                        </div>
                        {parseCurrency(amount) > 0 && parseCurrency(commissionRate) > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                                = {formatPrice(parseCurrency(amount) * (parseCurrency(commissionRate) / 100))}
                            </p>
                        )}
                    </div>

                    {/* Commission Cycles */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Comissões já realizadas</label>
                        <input
                            type="number"
                            value={commissionCycles}
                            onChange={e => setCommissionCycles(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                            placeholder="0"
                            min="0"
                        />
                    </div>

                    {/* Recurrence */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Aumentar comissão automaticamente</label>
                        <div className="relative">
                            <select
                                value={recurrence}
                                onChange={e => setRecurrence(e.target.value)}
                                className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                            >
                                {RECURRENCE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        {recurrence !== 'none' && (
                            <p className="text-xs text-gray-400 mt-1">
                                Comissão recorrente: {RECURRENCE_OPTIONS.find(o => o.value === recurrence)?.label || 'Mensal'}.
                            </p>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3 pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Handshake className="w-5 h-5" />
                                    {isClosedDeal ? 'Atualizar negócio' : 'Fechar negócio'}
                                </>
                            )}
                        </button>

                        {isClosedDeal && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                                <Ban className="w-4 h-4" />
                                Cancelar negócio
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </dialog>
    )
}
