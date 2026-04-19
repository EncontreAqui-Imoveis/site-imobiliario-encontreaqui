'use client'

import Image from 'next/image'

type PhotoWatermarkProps = {
    /** Miniaturas da grelha — marca mais pequena */
    compact?: boolean
    /**
     * `bottom` (padrão): centro-inferior.
     * `top`: centro-superior — evita o botão «Ver todas as fotos» na última célula da grelha desktop.
     */
    placement?: 'bottom' | 'top'
}

/**
 * Marca d'água nas fotos de imóveis (listagem, detalhe, galeria).
 * Imagem estática em `/public/branding/marcadagua.png`.
 */
export default function PhotoWatermark({ compact, placement = 'bottom' }: PhotoWatermarkProps) {
    const isTop = placement === 'top'
    const vertical =
        isTop
            ? compact
                ? 'top-0.5 w-[11%] max-w-[44px] min-w-[22px]'
                : 'top-1.5 w-[min(72px,16%)] max-w-[20vw] min-w-[40px]'
            : compact
              ? 'bottom-0.5 w-[11%] max-w-[44px] min-w-[22px]'
              : 'bottom-1.5 w-[min(72px,16%)] max-w-[20vw] min-w-[40px]'

    return (
        <div
            className={`pointer-events-none absolute left-1/2 z-[8] -translate-x-1/2 select-none ${vertical}`}
            aria-hidden
        >
            <Image
                src="/branding/marcadagua.png"
                alt=""
                width={160}
                height={48}
                className="h-auto w-full object-contain opacity-[0.28] drop-shadow-[0_0.5px_2px_rgba(0,0,0,0.18)] dark:opacity-[0.34]"
            />
        </div>
    )
}
