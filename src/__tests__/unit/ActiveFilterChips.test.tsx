/**
 * Unit tests for ActiveFilterChips component
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ActiveFilterChips from '@/components/search/ActiveFilterChips'
import { useRouter, useSearchParams } from 'next/navigation'

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
}))

jest.mock('lucide-react', () => ({
    X: () => <span data-testid="x-icon">×</span>,
}))

describe('ActiveFilterChips', () => {
    const mockPush = jest.fn()

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush })
        mockPush.mockClear()
    })

    it('renders nothing when no filters are active', () => {
        (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

        const { container } = render(<ActiveFilterChips />)
        expect(container.firstChild).toBeNull()
    })

    it('renders chips for each active filter', () => {
        const params = new URLSearchParams({ type: 'Casa', purpose: 'Venda', city: 'Goiânia' })
            ; (useSearchParams as jest.Mock).mockReturnValue(params)

        render(<ActiveFilterChips />)

        expect(screen.getByText(/Tipo.*Casa/)).toBeInTheDocument()
        expect(screen.getByText(/Finalidade.*Venda/)).toBeInTheDocument()
        expect(screen.getByText(/Cidade.*Goiânia/)).toBeInTheDocument()
    })

    it('formats price values with R$ prefix', () => {
        const params = new URLSearchParams({ minPrice: '200000', maxPrice: '500000' })
            ; (useSearchParams as jest.Mock).mockReturnValue(params)

        render(<ActiveFilterChips />)

        expect(screen.getByText(/Preço mín.*R\$/)).toBeInTheDocument()
        expect(screen.getByText(/Preço máx.*R\$/)).toBeInTheDocument()
    })

    it('formats bedroom/bathroom values with + suffix', () => {
        const params = new URLSearchParams({ bedrooms: '3', bathrooms: '2' })
            ; (useSearchParams as jest.Mock).mockReturnValue(params)

        render(<ActiveFilterChips />)

        expect(screen.getByText(/Quartos.*3\+/)).toBeInTheDocument()
        expect(screen.getByText(/Banheiros.*2\+/)).toBeInTheDocument()
    })

    it('removes individual filter when chip is clicked', () => {
        const params = new URLSearchParams({ type: 'Casa', city: 'SP' })
            ; (useSearchParams as jest.Mock).mockReturnValue(params)

        render(<ActiveFilterChips />)

        const typeChip = screen.getByText(/Tipo.*Casa/)
        fireEvent.click(typeChip)

        // Should push URL without type but keeping city
        expect(mockPush).toHaveBeenCalledTimes(1)
        const pushedUrl = mockPush.mock.calls[0][0]
        expect(pushedUrl).not.toContain('type=')
        expect(pushedUrl).toContain('city=SP')
    })

    it('shows "Limpar todos" button when multiple filters active', () => {
        const params = new URLSearchParams({ type: 'Casa', city: 'SP' })
            ; (useSearchParams as jest.Mock).mockReturnValue(params)

        render(<ActiveFilterChips />)

        expect(screen.getByText('Limpar todos')).toBeInTheDocument()
    })

    it('does not show "Limpar todos" for single filter', () => {
        const params = new URLSearchParams({ type: 'Casa' })
            ; (useSearchParams as jest.Mock).mockReturnValue(params)

        render(<ActiveFilterChips />)

        expect(screen.queryByText('Limpar todos')).not.toBeInTheDocument()
    })

    it('renderiza filtros de área com unidade selecionada', () => {
        const params = new URLSearchParams({ minArea: '2', maxArea: '5', areaUnit: 'ha' })
        ; (useSearchParams as jest.Mock).mockReturnValue(params)

        render(<ActiveFilterChips />)

        expect(screen.getByText('Área mín.: 2 ha')).toBeInTheDocument()
        expect(screen.getByText('Área máx.: 5 ha')).toBeInTheDocument()
        expect(screen.getByText('Unid. área: ha')).toBeInTheDocument()
    })

    it('clears all filters when "Limpar todos" is clicked', () => {
        const params = new URLSearchParams({ type: 'Casa', city: 'SP' })
            ; (useSearchParams as jest.Mock).mockReturnValue(params)

        render(<ActiveFilterChips />)

        fireEvent.click(screen.getByText('Limpar todos'))

        expect(mockPush).toHaveBeenCalledWith('/imoveis')
    })

    it('ignores the status param (always approved, not user-facing)', () => {
        const params = new URLSearchParams({ status: 'approved', type: 'Casa' })
            ; (useSearchParams as jest.Mock).mockReturnValue(params)

        render(<ActiveFilterChips />)

        expect(screen.queryByText(/status/i)).not.toBeInTheDocument()
        expect(screen.getByText(/Tipo.*Casa/)).toBeInTheDocument()
    })
})
