import { render, screen } from '@testing-library/react'

import RecentProperties from '@/components/home/RecentProperties'

describe('Accessibility and heuristic smoke', () => {
    it('renders an accessible empty state for recent properties', () => {
        render(<RecentProperties properties={[]} />)

        expect(
            screen.getByRole('heading', { name: /imóveis recentes/i })
        ).toBeInTheDocument()

        expect(
            screen.getByText(/nenhum imóvel recente encontrado/i)
        ).toBeInTheDocument()

        expect(screen.queryByRole('link', { name: /ver todos os imóveis/i })).not.toBeInTheDocument()
    })
})
