import { fireEvent, render, screen } from '@testing-library/react'

import LegalDocumentLinks from './LegalDocumentLinks'

describe('LegalDocumentLinks', () => {
    it('abre os documentos legais em modal e fecha pelo controle', () => {
        render(<LegalDocumentLinks />)

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Termos de Uso' }))

        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Termos de Uso' })).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Fechar documento' }))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('permite abrir a política de privacidade diretamente', () => {
        render(<LegalDocumentLinks />)

        fireEvent.click(screen.getByRole('button', { name: 'Política de Privacidade' }))

        expect(screen.getByRole('heading', { name: 'Política de Privacidade' })).toBeInTheDocument()
    })
})
