/**
 * Sanitize user input strings to prevent XSS.
 * Encodes HTML entities first, then strips any residual tags.
 */
export function sanitizeText(input: string): string {
    return input
        // Step 1: Encode HTML entities FIRST (before stripping tags)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        // Step 2: Strip any residual encoded tags (e.g. &lt;script&gt;)
        .replace(/&lt;[^&]*&gt;/g, '')
        .trim()
}

/**
 * Sanitize an object's string values recursively.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const sanitized = { ...obj }
    for (const key of Object.keys(sanitized)) {
        const val = sanitized[key]
        if (typeof val === 'string') {
            (sanitized as Record<string, unknown>)[key] = sanitizeText(val)
        } else if (val && typeof val === 'object' && !Array.isArray(val)) {
            (sanitized as Record<string, unknown>)[key] = sanitizeObject(val as Record<string, unknown>)
        }
    }
    return sanitized
}

// ---- Upload validation ----

const ALLOWED_IMAGE_MIMES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    // SAST-2: image/svg+xml removed — SVGs can contain <script>, <foreignObject>, onload= handlers
]

const ALLOWED_VIDEO_MIMES = [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/3gpp',
]

const ALLOWED_DOC_MIMES = [
    'application/pdf',
    ...ALLOWED_IMAGE_MIMES,
]

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const MAX_VIDEO_FILE_SIZE_MB = 25
const MAX_VIDEO_FILE_SIZE_BYTES = MAX_VIDEO_FILE_SIZE_MB * 1024 * 1024

export interface FileValidationResult {
    valid: boolean
    error?: string
}

export function validateImageFile(file: File): FileValidationResult {
    if (!ALLOWED_IMAGE_MIMES.includes(file.type)) {
        return { valid: false, error: `Formato não permitido: ${file.type}. Use JPEG, PNG ou WebP.` }
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return { valid: false, error: `Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). Máximo: ${MAX_FILE_SIZE_MB}MB.` }
    }
    return { valid: true }
}

export function validateVideoFile(file: File): FileValidationResult {
    if (!ALLOWED_VIDEO_MIMES.includes(file.type)) {
        return {
            valid: false,
            error: `Formato não permitido: ${file.type}. Use MP4, MOV, AVI, WEBM ou 3GP.`,
        }
    }
    if (file.size > MAX_VIDEO_FILE_SIZE_BYTES) {
        return {
            valid: false,
            error: `Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). Máximo: ${MAX_VIDEO_FILE_SIZE_MB}MB.`,
        }
    }
    return { valid: true }
}

export function validateDocumentFile(file: File): FileValidationResult {
    if (!ALLOWED_DOC_MIMES.includes(file.type)) {
        return { valid: false, error: `Formato não permitido: ${file.type}. Use PDF, JPEG, PNG ou WebP.` }
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return { valid: false, error: `Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). Máximo: ${MAX_FILE_SIZE_MB}MB.` }
    }
    return { valid: true }
}
