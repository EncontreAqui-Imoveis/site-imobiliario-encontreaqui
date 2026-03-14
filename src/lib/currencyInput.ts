export function extractCurrencyDigits(value: string): string {
    return value.replace(/\D/g, '')
}

export function formatCurrencyInput(value: string): string {
    const digits = extractCurrencyDigits(value)
    if (!digits) return ''

    const cents = Number.parseInt(digits, 10)
    const formatted = (cents / 100).toLocaleString('pt-BR', {
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
    return Number.parseInt(digits, 10) / 100
}
