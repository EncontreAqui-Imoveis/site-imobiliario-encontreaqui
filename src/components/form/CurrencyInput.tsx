'use client'

import { InputHTMLAttributes } from 'react'
import { formatCurrencyInput } from '@/lib/currencyInput'

type CurrencyInputProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'onChange'
> & {
    value: string
    onChange: (nextValue: string) => void
}

export function CurrencyInput({ value, onChange, className, ...props }: CurrencyInputProps) {
    return (
        <input
            {...props}
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(event) => onChange(formatCurrencyInput(event.target.value))}
            className={className}
        />
    )
}
