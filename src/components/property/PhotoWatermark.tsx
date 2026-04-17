'use client'

/**
 * Marca dágua discreta no centro-inferior da foto (listagem e detalhe).
 * Defina `NEXT_PUBLIC_PHOTO_WATERMARK` no ambiente para personalizar o texto.
 */
export default function PhotoWatermark({ label }: { label?: string }) {
    const text = (label ?? process.env.NEXT_PUBLIC_PHOTO_WATERMARK ?? 'Encontre Aqui').trim()
    if (!text) return null
    return (
        <div
            className="pointer-events-none absolute bottom-2 left-1/2 z-[8] -translate-x-1/2 select-none px-2 py-0.5"
            aria-hidden
        >
            <span className="block max-w-[90%] truncate text-center text-[10px] font-semibold uppercase tracking-wider text-white/85 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] sm:text-[11px]">
                {text}
            </span>
        </div>
    )
}
