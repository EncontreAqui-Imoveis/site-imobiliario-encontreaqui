import { render, screen } from '@testing-library/react'
import PropertyGalleryModal from '@/components/property/PropertyGalleryModal'

describe('PropertyGalleryModal', () => {
    it('renders the fullscreen watermark over the image area', () => {
        const { container } = render(
            <PropertyGalleryModal
                images={['https://res.cloudinary.com/demo/image/upload/sample.jpg']}
                isOpen
                onClose={jest.fn()}
            />,
        )

        expect(screen.getByText('1 / 1')).toBeInTheDocument()
        expect(screen.getByTestId('fullscreen-watermark')).toBeInTheDocument()
    })
})
