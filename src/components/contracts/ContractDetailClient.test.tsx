import { fireEvent, render, screen, within } from '@testing-library/react'

import { ContractDetailClient } from './ContractDetailClient'
import type { ContractDetail } from '@/types/contract'

let mockSessionUser = {
    id: 1,
    email: 'broker@test.com',
    phone: '62999998888',
}

jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        session: {
            user: mockSessionUser,
        },
    }),
}))

jest.mock('@/lib/api/contracts', () => ({
    buildNegotiationDocumentDownloadUrl: (negotiationId: string, documentId: number) => `/negotiations/${negotiationId}/documents/${documentId}/download`,
    deleteContractDocument: jest.fn(),
    getContractById: jest.fn(),
    setContractSignatureMethod: jest.fn(),
    updateContractData: jest.fn(),
    uploadContractDocument: jest.fn(),
}))

function buildContract(): ContractDetail {
    return {
        id: 'contract-1',
        negotiationId: 'neg-1',
        propertyId: 101,
        status: 'AWAITING_DOCS',
        sellerApprovalStatus: 'PENDING',
        buyerApprovalStatus: 'PENDING',
        createdAt: '2026-01-01T00:00:00.000Z',
        sellerInfo: {
            estado_civil: 'Solteiro(a)',
            profissao: 'Corretor',
            email: 'broker@test.com',
            telefone: '62999998888',
            dados_bancarios: 'Banco X',
        },
        buyerInfo: {
            estado_civil: 'Solteiro(a)',
            profissao: 'Cliente',
            email: 'client@test.com',
            telefone: '62911112222',
        },
        commissionData: {},
        workflowMetadata: {},
        sellerApprovalReason: null,
        buyerApprovalReason: null,
        capturingBrokerId: 1,
        capturingBrokerName: 'Captador',
        propertyTitle: 'Casa teste',
        propertyPurpose: 'Venda',
        agencyName: 'Imobiliária Teste',
        agencyAddress: 'Rua A',
        documentRequirements: {
            seller: [
                { category: 'identidade', applicability: 'required', required: true, reasonCode: 'IDENTIDADE_REQUIRED' },
                { category: 'dados_bancarios', applicability: 'required', required: true, reasonCode: 'DADOS_BANCARIOS_REQUIRED' },
                { category: 'comprovante_endereco', applicability: 'required', required: true, reasonCode: 'ENDERECO_REQUIRED' },
                { category: 'estado_civil', applicability: 'required', required: true, reasonCode: 'ESTADO_CIVIL_REQUIRED' },
                { category: 'conjuge_documentos', applicability: 'not_applicable', required: false, reasonCode: 'CONJUGE_NA_MARITAL_SINGLE_OR_EQUIVALENT' },
                { category: 'docs_imovel', applicability: 'required', required: true, reasonCode: 'DOCS_IMOVEL_REQUIRED' },
            ],
            buyer: [
                { category: 'identidade', applicability: 'required', required: true, reasonCode: 'IDENTIDADE_REQUIRED' },
                { category: 'comprovante_endereco', applicability: 'required', required: true, reasonCode: 'ENDERECO_REQUIRED' },
                { category: 'estado_civil', applicability: 'required', required: true, reasonCode: 'ESTADO_CIVIL_REQUIRED' },
                { category: 'conjuge_documentos', applicability: 'not_applicable', required: false, reasonCode: 'CONJUGE_NA_MARITAL_SINGLE_OR_EQUIVALENT' },
                { category: 'comprovante_renda', applicability: 'required', required: true, reasonCode: 'COMPROVANTE_RENDA_REQUIRED' },
            ],
        },
        responsibleUserIds: [1, 77],
        documentProgress: {
            seller: {
                side: 'seller',
                categories: [],
                totals: { pending: 6, approved: 0, rejected: 0 },
            },
            buyer: {
                side: 'buyer',
                categories: [],
                totals: { pending: 5, approved: 0, rejected: 0 },
            },
        },
        documents: [
            {
                id: 11,
                negotiationId: 'neg-1',
                type: 'other',
                documentType: 'outro',
                side: 'seller',
                documentCategory: 'dados_bancarios',
                categoryStatus: 'PENDING',
                reviewReason: null,
                validationResult: null,
                originalFileName: 'banco.pdf',
                createdAt: '2026-01-01T00:00:00.000Z',
            },
        ],
    }
}

describe('ContractDetailClient', () => {
    beforeEach(() => {
        mockSessionUser = {
            id: 1,
            email: 'broker@test.com',
            phone: '62999998888',
        }
    })

    it('mostra labels contextuais e exibe documentos do cônjuge assim que o estado civil muda', () => {
        render(<ContractDetailClient contract={buildContract()} />)

        expect(screen.getAllByText('Dados bancários').length).toBeGreaterThan(0)
        expect(screen.getAllByText(/banco\.pdf/i).length).toBeGreaterThan(0)
        expect(screen.queryByText('Outro documento')).not.toBeInTheDocument()
        expect(screen.queryByText('Documentos do cônjuge')).not.toBeInTheDocument()

        const sellerForm = screen.getByText('Dados do proprietário').closest('section')
        expect(sellerForm).not.toBeNull()
        const maritalSelect = within(sellerForm as HTMLElement).getByRole('combobox')
        fireEvent.change(maritalSelect, { target: { value: 'Casado(a)' } })

        expect(screen.getAllByText('Documentos do cônjuge').length).toBeGreaterThan(0)
        expect(screen.getAllByText('Dados bancários').length).toBeGreaterThan(0)
    })

    it('permite ao responsável editar ambos os lados na fase de documentos', () => {
        mockSessionUser = {
            id: 77,
            email: 'responsavel@test.com',
            phone: '62900001111',
        }

        render(
            <ContractDetailClient
                contract={{
                    ...buildContract(),
                    capturingBrokerId: 30003,
                    buyerClientId: 90001,
                    ownerId: 80001,
                    responsibleUserIds: [77],
                }}
            />,
        )

        expect(screen.getAllByText('Salvar dados deste lado').length).toBeGreaterThanOrEqual(2)
        expect(screen.getByText('Documentos do proprietário')).toBeInTheDocument()
        expect(screen.getByText('Documentos do comprador')).toBeInTheDocument()
    })
})
