import { render, screen } from '@testing-library/react'
import LocationSelectFields from '@/components/search/LocationSelectFields'

jest.mock('@/components/search/useLocationOptions', () => ({
    useLocationOptions: jest.fn(() => ({
        cities: [{ city: 'Rio Verde', total: 6 }],
        bairros: [{ bairro: 'Jardim América', city: 'Rio Verde', total: 2 }],
        isLoadingCities: false,
        isLoadingBairros: false,
        selectedCity: 'Rio Verde',
        hasSelectedCity: true,
        hasBairros: true,
    })),
}))

jest.mock('lucide-react', () => ({
    ChevronDown: () => <div data-testid="chevron-down-icon" />,
    MapPin: () => <div data-testid="map-pin-icon" />,
}))

describe('LocationSelectFields', () => {
    it('renders bairro options after a valid city is selected', () => {
        const { container } = render(
            <LocationSelectFields
                city="Rio Verde"
                bairro=""
                onCityChange={jest.fn()}
                onBairroChange={jest.fn()}
            />,
        )

        expect(screen.getByDisplayValue('Rio Verde')).toBeInTheDocument()
        expect(
            container.querySelector('datalist#hero-bairro-options option[value="Jardim América"]'),
        ).toBeTruthy()
    })

    it('shows explicit empty-state placeholder when the city has no bairros', () => {
        const { useLocationOptions } = jest.requireMock('@/components/search/useLocationOptions') as {
            useLocationOptions: jest.Mock
        }

        useLocationOptions.mockReturnValue({
            cities: [{ city: 'Rio Verde', total: 6 }],
            bairros: [],
            isLoadingCities: false,
            isLoadingBairros: false,
            selectedCity: 'Rio Verde',
            hasSelectedCity: true,
            hasBairros: false,
        })

        render(
            <LocationSelectFields
                city="Rio Verde"
                bairro=""
                onCityChange={jest.fn()}
                onBairroChange={jest.fn()}
            />,
        )

        expect(screen.getByPlaceholderText('Nenhum bairro encontrado na cidade')).toBeInTheDocument()
    })

    it('clears bairro only when the resolved city actually changes', () => {
        const onBairroChange = jest.fn()
        const { rerender } = render(
            <LocationSelectFields
                city="Rio Verde"
                bairro="Jardim América"
                onCityChange={jest.fn()}
                onBairroChange={onBairroChange}
            />,
        )

        rerender(
            <LocationSelectFields
                city="Rio Verde"
                bairro="Jardim América"
                onCityChange={jest.fn()}
                onBairroChange={onBairroChange}
            />,
        )

        expect(onBairroChange).not.toHaveBeenCalled()

        const { useLocationOptions } = jest.requireMock('@/components/search/useLocationOptions') as {
            useLocationOptions: jest.Mock
        }
        useLocationOptions.mockReturnValue({
            cities: [{ city: 'Goiânia', total: 3 }],
            bairros: [{ bairro: 'Centro', city: 'Goiânia', total: 1 }],
            isLoadingCities: false,
            isLoadingBairros: false,
            selectedCity: 'Goiânia',
            hasSelectedCity: true,
            hasBairros: true,
        })

        rerender(
            <LocationSelectFields
                city="Goiânia"
                bairro="Jardim América"
                onCityChange={jest.fn()}
                onBairroChange={onBairroChange}
            />,
        )

        expect(onBairroChange).toHaveBeenCalledWith('')
    })
})
