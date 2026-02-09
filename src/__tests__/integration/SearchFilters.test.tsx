import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SearchFilters from '@/components/search/SearchFilters'
import { useRouter, useSearchParams } from 'next/navigation'

// Mocks
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
}))

// Mock Lucide icons
jest.mock('lucide-react', () => ({
    Search: () => <div data-testid="search-icon" />,
    X: () => <div data-testid="x-icon" />,
    ChevronDown: () => <div data-testid="chevron-down-icon" />,
    SlidersHorizontal: () => <div data-testid="sliders-icon" />,
    MapPin: () => <div data-testid="map-pin-icon" />,
    Home: () => <div data-testid="home-icon" />,
    Bed: () => <div data-testid="bed-icon" />,
    Bath: () => <div data-testid="bath-icon" />,
    DollarSign: () => <div data-testid="dollar-icon" />,
    Filter: () => <div data-testid="filter-icon" />,
    Check: () => <div data-testid="check-icon" />,
}))

describe('SearchFilters', () => {
    const mockPush = jest.fn()
    let mockSearchParams: URLSearchParams

    beforeEach(() => {
        mockSearchParams = new URLSearchParams()
            ; (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
        (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
        mockPush.mockClear()
    })

    it('renders filter sections', () => {
        render(<SearchFilters />)
        // Desktop Header
        expect(screen.getByText('Filtros')).toBeInTheDocument()

        // Sections
        expect(screen.getByText('Localização')).toBeInTheDocument()
        expect(screen.getByText('Detalhes')).toBeInTheDocument()
        expect(screen.getByText('Valores')).toBeInTheDocument()
        expect(screen.getByText('Comodidades')).toBeInTheDocument()
    })

    it('updates search text and calls router on apply', () => {
        render(<SearchFilters />)

        const searchInput = screen.getByPlaceholderText('Buscar por termo...')
        fireEvent.change(searchInput, { target: { value: 'Casa linda' } })

        const applyButton = screen.getByText('Ver resultados')
        fireEvent.click(applyButton)

        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('search=Casa+linda'))
    })

    it('toggles purpose filter', () => {
        render(<SearchFilters />)

        const rentButton = screen.getByText('Alugar')
        fireEvent.click(rentButton)

        const applyButton = screen.getByText('Ver resultados')
        fireEvent.click(applyButton)

        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('purpose=Aluguel'))
    })

    it('updates city filter', () => {
        render(<SearchFilters />)

        // City input is in "Localização" section which is expanded by default
        const cityInput = screen.getByPlaceholderText('Cidade')
        fireEvent.change(cityInput, { target: { value: 'São Paulo' } })

        const applyButton = screen.getByText('Ver resultados')
        fireEvent.click(applyButton)

        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('city=S%C3%A3o+Paulo'))
    })

    it('clears filters', () => {
        // Setup initial state with mocks
        const paramsWithFilter = new URLSearchParams()
        paramsWithFilter.set('search', 'Casa')
            ; (useSearchParams as jest.Mock).mockReturnValue(paramsWithFilter)

        render(<SearchFilters />)

        // Verify initial state passed from URL
        expect(screen.getByPlaceholderText('Buscar por termo...')).toHaveValue('Casa')

        // Click clear
        const clearButton = screen.getByText('Limpar')
        fireEvent.click(clearButton)

        expect(mockPush).toHaveBeenCalledWith('/imoveis')
        expect(screen.getByPlaceholderText('Buscar por termo...')).toHaveValue('')
    })
})
