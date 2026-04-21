'use client'

import { useEffect } from 'react'
import { syncThemeFromStorage } from '@/lib/theme'

export default function ThemeBootstrap() {
    useEffect(() => {
        syncThemeFromStorage()
    }, [])

    return null
}
