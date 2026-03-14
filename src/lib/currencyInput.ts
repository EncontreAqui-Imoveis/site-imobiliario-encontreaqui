export function extractCurrencyDigits(value: string): string {
    return value.replace(/\D/g, '')
}

export const MAX_CURRENCY_INPUT_VALUE = 9999999999.99

function clampCurrencyValue(value: number): number {
    if (!Number.isFinite(value) || value <= 0) return 0
    return Math.min(value, MAX_CURRENCY_INPUT_VALUE)
}

export function formatCurrencyInput(value: string): string {
    const digits = extractCurrencyDigits(value)
    if (!digits) return ''

    const cents = Number.parseInt(digits, 10)
    const formatted = clampCurrencyValue(cents / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
    return formatted
}

export function parseCurrencyInput(value: string): number {
    const digits = extractCurrencyDigits(value)
    if (!digits) return 0
    return clampCurrencyValue(Number.parseInt(digits, 10) / 100)
}
