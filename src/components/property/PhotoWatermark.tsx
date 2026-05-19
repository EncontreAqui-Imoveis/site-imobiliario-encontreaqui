'use client'

import Image from 'next/image'

type PhotoWatermarkProps = {
    /** Miniaturas da grelha — marca mais pequena */
    compact?: boolean
    /** Fullscreen — marca mais forte e mais alta */
    fullscreen?: boolean
    /**
     * `bottom` (padrão): centro-inferior.
     * `top`: centro-superior — evita o botão «Ver todas as fotos» na última célula da grelha desktop.
     */
    placement?: 'bottom' | 'top'
    /** Classes extra no contentor (ex.: z-index maior no lightbox por cima do next/image). */
    layerClassName?: string
    testId?: string
}

/**
 * Marca d'água nas fotos de imóveis (listagem, detalhe, galeria).
 * Imagem estática em `/public/branding/marcadagua.png`.
 */
export default function PhotoWatermark({
    compact,
    fullscreen,
    placement = 'bottom',
    layerClassName = '',
    testId,
}: PhotoWatermarkProps) {
    const isTop = placement === 'top'
    const isFullscreen = Boolean(fullscreen)
    const vertical =
        isTop
            ? compact
                ? 'top-0.5 w-[11%] max-w-[44px] min-w-[22px]'
                : isFullscreen
                  ? 'top-6 w-[min(160px,28vw)] max-w-[240px] min-w-[120px]'
                  : 'top-1.5 w-[min(72px,16%)] max-w-[20vw] min-w-[40px]'
            : compact
                ? 'bottom-0.5 w-[11%] max-w-[44px] min-w-[22px]'
                : isFullscreen
                  ? 'bottom-6 w-[min(160px,28vw)] max-w-[240px] min-w-[120px]'
                  : 'bottom-1.5 w-[min(72px,16%)] max-w-[20vw] min-w-[40px]'

    return (
        <div
            className={`pointer-events-none absolute left-1/2 z-[8] -translate-x-1/2 select-none ${vertical} ${layerClassName}`.trim()}
            aria-hidden
            data-testid={testId}
        >
            <Image
                src="/branding/marcadagua.png"
                alt=""
                width={160}
                height={48}
                className={`h-auto w-full object-contain drop-shadow-[0_0.5px_2px_rgba(0,0,0,0.18)] ${isFullscreen ? 'opacity-[0.5]' : 'opacity-[0.28]'}`.trim()}
            />
        </div>
    )
}
