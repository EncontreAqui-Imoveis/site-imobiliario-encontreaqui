import { fireEvent, render, screen, within } from '@testing-library/react'

import { ContractDetailClient } from './ContractDetailClient'
import type { ContractDetail } from '@/types/contract'

const mockVerifyContractHandshakePin = jest.fn()
const mockRejectContractHandshakeAssociation = jest.fn()

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
    rejectContractHandshakeAssociation: (...args: unknown[]) => mockRejectContractHandshakeAssociation(...args),
    updateContractData: jest.fn(),
    uploadContractDocument: jest.fn(),
    verifyContractHandshakePin: (...args: unknown[]) => mockVerifyContractHandshakePin(...args),
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
        viewerSide: 'both',
        capabilities: {
            canReadMeta: true,
            canReadSeller: true,
            canEditSeller: true,
            canReadBuyer: true,
            canEditBuyer: true,
            canReadDocumentStatus: true,
            canReadDocumentFiles: true,
            canMutateDocuments: true,
            isReadOnly: false,
        },
        documentRequirements: {
            seller: [
                { category: 'identidade', applicability: 'required', required: true, reasonCode: 'IDENTIDADE_REQUIRED' },
                { category: 'dados_bancarios', applicability: 'required', required: true, reasonCode: 'DADOS_BANCARIOS_REQUIRED' },
                { category: 'comprovante_endereco', applicability: 'required', required: true, reasonCode: 'ENDERECO_REQUIRED' },
                { category: 'estado_civil', applicability: 'required', required: true, reasonCode: 'ESTADO_CIVIL_REQUIRED' },
                { category: 'conjuge_documentos', applicability: 'not_applicable', required: false, reasonCode: 'CONJUGE_NA_MARITAL_SINGLE_OR_EQUIVALENT' },
                { category: 'certidao_inteiro_teor_escritura', applicability: 'required', required: true, reasonCode: 'CERTIDAO_INTEIRO_TEOR_REQUIRED_SALE' },
                { category: 'certidao_onus_acoes', applicability: 'required', required: true, reasonCode: 'CERTIDAO_ONUS_ACOES_REQUIRED_SALE' },
                { category: 'outro', applicability: 'optional', required: false, reasonCode: 'OUTRO_OPTIONAL' },
            ],
            buyer: [
                { category: 'identidade', applicability: 'required', required: true, reasonCode: 'IDENTIDADE_REQUIRED' },
                { category: 'comprovante_endereco', applicability: 'required', required: true, reasonCode: 'ENDERECO_REQUIRED' },
                { category: 'estado_civil', applicability: 'required', required: true, reasonCode: 'ESTADO_CIVIL_REQUIRED' },
                { category: 'conjuge_documentos', applicability: 'not_applicable', required: false, reasonCode: 'CONJUGE_NA_MARITAL_SINGLE_OR_EQUIVALENT' },
                { category: 'comprovante_renda', applicability: 'required', required: true, reasonCode: 'COMPROVANTE_RENDA_REQUIRED' },
                { category: 'outro', applicability: 'optional', required: false, reasonCode: 'OUTRO_OPTIONAL' },
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
                documentType: 'dados_bancarios',
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
        mockVerifyContractHandshakePin.mockReset()
        mockRejectContractHandshakeAssociation.mockReset()
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
        expect(screen.queryByText('Documento Pessoal (Cônjuge)')).not.toBeInTheDocument()

        const sellerForm = screen.getByText('Dados do proprietário').closest('section')
        expect(sellerForm).not.toBeNull()
        fireEvent.click(within(sellerForm as HTMLElement).getByRole('button', { name: 'Editar dados' }))
        const maritalSelect = within(sellerForm as HTMLElement).getByRole('combobox')
        fireEvent.change(maritalSelect, { target: { value: 'Casado(a)' } })

        expect(screen.getAllByText('Documento Pessoal (Cônjuge)').length).toBeGreaterThan(0)
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

        expect(screen.getAllByText('Editar dados').length).toBeGreaterThanOrEqual(2)
        expect(screen.queryByText('Salvar dados deste lado')).not.toBeInTheDocument()
        expect(screen.getByText('Documentos do proprietário')).toBeInTheDocument()
        expect(screen.getByText('Documentos do comprador')).toBeInTheDocument()
    })

    it('oculta o conteúdo enquanto o comprador precisa confirmar o PIN', () => {
        render(
            <ContractDetailClient
                contract={{
                    ...buildContract(),
                    handshake: { status: 'PENDING', requiresVerification: true },
                    capabilities: {
                        ...buildContract().capabilities!,
                        canReadSeller: false,
                        canReadBuyer: false,
                        canReadDocumentStatus: false,
                        canReadDocumentFiles: false,
                        canMutateDocuments: false,
                        canEditSeller: false,
                        canEditBuyer: false,
                        isReadOnly: true,
                        requiresHandshakeVerification: true,
                    },
                }}
            />,
        )

        expect(screen.getByRole('dialog', { name: 'Confirme o PIN da proposta' })).toBeInTheDocument()
        expect(screen.queryByText('Dados do proprietário')).not.toBeInTheDocument()
    })

    it('libera a tela reativamente após confirmar o PIN', async () => {
        mockVerifyContractHandshakePin.mockResolvedValueOnce({
            ...buildContract(),
            handshake: { status: 'VERIFIED', requiresVerification: false },
        })

        render(
            <ContractDetailClient
                contract={{
                    ...buildContract(),
                    handshake: { status: 'PENDING', requiresVerification: true },
                    capabilities: {
                        ...buildContract().capabilities!,
                        requiresHandshakeVerification: true,
                    },
                }}
            />,
        )

        fireEvent.change(screen.getByLabelText('PIN de acesso'), { target: { value: '1234' } })
        fireEvent.click(screen.getByRole('button', { name: 'Acessar proposta' }))

        expect(await screen.findByText('Dados do proprietário')).toBeInTheDocument()
        expect(mockVerifyContractHandshakePin).toHaveBeenCalledWith('contract-1', '1234')
    })

    it('consome a matriz de locação devolvida pela API, incluindo seguro incêndio', () => {
        render(
            <ContractDetailClient
                contract={{
                    ...buildContract(),
                    dealType: 'rent',
                    documentRequirements: {
                        seller: [
                            { category: 'identidade', applicability: 'required', required: true, reasonCode: 'IDENTIDADE_REQUIRED' },
                            { category: 'seguro_incendio', applicability: 'required', required: true, reasonCode: 'SEGURO_INCENDIO_REQUIRED_RENTAL' },
                            { category: 'certidao_onus_acoes', applicability: 'not_applicable', required: false, reasonCode: 'CERTIDAO_ONUS_ACOES_NA_RENTAL_ONLY' },
                        ],
                        buyer: [],
                    },
                }}
            />,
        )

        expect(screen.getByText('Apólice/Comprovante de Seguro Incêndio')).toBeInTheDocument()
        expect(screen.queryByText('Certidão de Ônus/Ações')).not.toBeInTheDocument()
    })

    it('não infere edição quando o backend declara o contrato somente leitura', () => {
        render(
            <ContractDetailClient
                contract={{
                    ...buildContract(),
                    capabilities: {
                        ...buildContract().capabilities!,
                        canEditSeller: false,
                        canEditBuyer: false,
                        canMutateDocuments: false,
                        isReadOnly: true,
                    },
                }}
            />,
        )

        expect(screen.queryByText('Editar dados')).not.toBeInTheDocument()
        expect(screen.getAllByText('Consulta de status nesta etapa.').length).toBeGreaterThan(0)
    })

    it('mantém a assinatura presencial apenas como orientação no site', () => {
        render(
            <ContractDetailClient
                contract={{
                    ...buildContract(),
                    status: 'AWAITING_SIGNATURES',
                }}
            />,
        )

        expect(screen.getByText('Assinatura presencial')).toBeInTheDocument()
        expect(screen.getByText(/Não é necessário enviar uma assinatura pelo site/i)).toBeInTheDocument()
        expect(screen.queryByText('Envio online')).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Assinar presencialmente' })).not.toBeInTheDocument()
    })
})
