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
                    ? 'bottom-1 w-[42%] max-w-[100px] min-w-[56px]'
                    : 'bottom-2 w-[min(280px,55%)] max-w-[90vw] min-w-[120px]'
            }`}
            aria-hidden
        >
            <img
                src="/branding/marcadagua.png"
                alt=""
                className="h-auto w-full object-contain opacity-[0.88] drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)]"
                loading="lazy"
                decoding="async"
            />
        </div>
    )
}
