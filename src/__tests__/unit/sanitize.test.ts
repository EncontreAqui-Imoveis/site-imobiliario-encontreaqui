import { sanitizeText, sanitizeObject, validateImageFile, validateDocumentFile } from '@/lib/sanitize'

describe('sanitizeText', () => {
    it('removes simple HTML tags', () => {
        expect(sanitizeText('<b>bold</b>')).toBe('bold')
    })

    it('removes <script> tags (encodes then strips)', () => {
        const result = sanitizeText('<script>alert("xss")</script>')
        // Tags should be encoded then stripped, inner content remains encoded
        expect(result).not.toContain('script')
        expect(result).not.toContain('<')
    })

    it('encodes HTML entities <, >, ", \', &', () => {
        const result = sanitizeText('a & b "c" \'d\'')
        expect(result).toContain('&amp;')
        expect(result).toContain('&quot;')
        expect(result).toContain('&#x27;')
    })

    it('handles empty string', () => {
        expect(sanitizeText('')).toBe('')
    })

    it('handles nested tags like <div><script>x</script></div>', () => {
        const result = sanitizeText('<div><script>x</script></div>')
        expect(result).not.toContain('script')
        expect(result).not.toContain('<')
        expect(result).not.toContain('>')
    })

    it('trims whitespace', () => {
        expect(sanitizeText('  hello  ')).toBe('hello')
    })
})

describe('sanitizeObject', () => {
    it('sanitizes string values recursively', () => {
        const obj = { name: '<b>Test</b>', age: 25, nested: { text: '<i>italic</i>' } }
        const result = sanitizeObject(obj)
        expect(result.name).not.toContain('<b>')
        expect(result.age).toBe(25)
        expect((result.nested as { text: string }).text).not.toContain('<i>')
    })

    it('preserves numbers and booleans', () => {
        const obj = { count: 42, active: true, label: 'safe' }
        const result = sanitizeObject(obj)
        expect(result.count).toBe(42)
        expect(result.active).toBe(true)
        expect(result.label).toBe('safe')
    })
})

describe('validateImageFile', () => {
    it('rejects image/svg+xml', () => {
        const file = new File(['test'], 'test.svg', { type: 'image/svg+xml' })
        const result = validateImageFile(file)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Formato não permitido')
    })

    it('rejects files larger than 10MB', () => {
        const largeContent = new ArrayBuffer(11 * 1024 * 1024)
        const file = new File([largeContent], 'big.jpg', { type: 'image/jpeg' })
        const result = validateImageFile(file)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('muito grande')
    })

    it('accepts valid JPEG file', () => {
        const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
        const result = validateImageFile(file)
        expect(result.valid).toBe(true)
    })
})

describe('validateDocumentFile', () => {
    it('accepts PDF files', () => {
        const file = new File(['test'], 'doc.pdf', { type: 'application/pdf' })
        const result = validateDocumentFile(file)
        expect(result.valid).toBe(true)
    })

    it('rejects executable files', () => {
        const file = new File(['test'], 'virus.exe', { type: 'application/x-msdownload' })
        const result = validateDocumentFile(file)
        expect(result.valid).toBe(false)
    })
})
