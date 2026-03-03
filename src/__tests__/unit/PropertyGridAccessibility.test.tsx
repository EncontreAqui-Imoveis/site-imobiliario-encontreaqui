import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

import PropertyGrid from '@/components/property/PropertyGrid'

expect.extend(toHaveNoViolations)

jest.mock('next/link', () => {
    function MockNextLink({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
        return <a href={href} {...rest}>{children}</a>
    }
    MockNextLink.displayName = 'MockNextLink'
    return MockNextLink
})

jest.mock('lucide-react', () => {
    return new Proxy({}, {
        get: (_target, prop: string) => {
            const Comp = () => <div data-testid={`icon-${prop.toLowerCase()}`} />
            Comp.displayName = prop
            return Comp
        },
    })
})

describe('PropertyGrid accessibility and recovery states', () => {
    it('exposes an accessible empty state with a recovery CTA', async () => {
        const { container } = render(<PropertyGrid properties={[]} />)

        expect(
            screen.getByRole('region', { name: /estado vazio da busca/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('status')
        ).toHaveTextContent(/nenhum imóvel encontrado/i)
        expect(
            screen.getByRole('link', { name: /ver todos os imóveis disponíveis/i })
        ).toBeInTheDocument()

        const results = await axe(container, {
            rules: {
                'color-contrast': { enabled: false },
            },
        })

        expect(results).toHaveNoViolations()
    })

    it('announces the loading state while cards are being hydrated', () => {
        render(<PropertyGrid properties={[]} isLoading={true} />)

        expect(
            screen.getByRole('status', { name: /carregando imóveis/i })
        ).toBeInTheDocument()
    })
})
