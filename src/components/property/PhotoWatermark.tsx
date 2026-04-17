'use client'

type PhotoWatermarkProps = {
    /** Miniaturas da grelha — marca mais pequena */
    compact?: boolean
}

/**
 * Marca d'água nas fotos de imóveis (listagem, detalhe, galeria).
 * Imagem estática em `/public/branding/marcadagua.png`.
 */
export default function PhotoWatermark({ compact }: PhotoWatermarkProps) {
    return (
        <div
            className={`pointer-events-none absolute left-1/2 z-[8] -translate-x-1/2 select-none ${
                compact
                    ? 'bottom-0.5 w-[11%] max-w-[44px] min-w-[22px]'
                    : 'bottom-1.5 w-[min(72px,16%)] max-w-[20vw] min-w-[40px]'
            }`}
            aria-hidden
        >
            <img
                src="/branding/marcadagua.png"
                alt=""
                className="h-auto w-full object-contain opacity-[0.28] drop-shadow-[0_0.5px_2px_rgba(0,0,0,0.18)] dark:opacity-[0.34]"
                loading="lazy"
                decoding="async"
            />
        </div>
    )
}
