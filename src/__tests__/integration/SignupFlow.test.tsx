import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import CadastroPage from '@/app/auth/cadastro/page'
import VerificacaoPage from '@/app/verificacao/page'
import VerificarMetodoPage from '@/app/cadastro/verificar-metodo/page'

const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockRefresh = jest.fn().mockResolvedValue(undefined)
const mockSearchParamsGet = jest.fn()
const mockCheckEmail = jest.fn()
const mockCheckCreci = jest.fn()
const mockSendEmailVerificationCode = jest.fn()
const mockVerifyEmailCode = jest.fn()
const mockRegisterUserFromSignupDraft = jest.fn()
const mockResolvePostAuthRoute = jest.fn()
const mockLoadSignupDraft = jest.fn()
const mockMarkSignupDraftEmailVerified = jest.fn()
const mockSaveSignupDraft = jest.fn()
const mockRewindSignupDraftToAddress = jest.fn()
const mockLoginWithGooglePopup = jest.fn()
const mockIsGooglePendingAuthResult = jest.fn()
const mockCreateSignupDraftRemote = jest.fn()
const mockPatchSignupDraftRemote = jest.fn()
const mockDiscardSignupDraft = jest.fn()
const mockSendSignupDraftEmailCode = jest.fn()

function createDraftConflictError(code: string) {
    return Object.assign(new Error('Conflito de cadastro'), {
        status: 409,
        payload: { code },
    })
}

type DraftValidationErrorPayload = {
    code: string
    error?: string
    fields?: Record<string, string[]>
}

function createDraftValidationError(code: string, options?: { error?: string; fields?: Record<string, string[]> }) {
    return Object.assign(new Error('Erro de validação de cadastro'), {
        status: 400,
        payload: {
            code,
            error: options?.error ?? 'erro de validação',
            fields: options?.fields ?? {},
        } as DraftValidationErrorPayload,
    })
}

function logDraftValidationError(label: string, error: unknown) {
    if (!error || typeof error !== 'object') return
    const anyError = error as { status?: unknown; payload?: DraftValidationErrorPayload }
    // eslint-disable-next-line no-console
    console.log(`[POST /auth/register/draft] ${label} 400:`, JSON.stringify({
        status: anyError.status,
        code: anyError.payload?.code,
        error: anyError.payload?.error,
        fields: anyError.payload?.fields,
    }))
}

function createNetworkFailure() {
    return Object.assign(new TypeError('Failed to fetch'))
}

function logDraftPayload(label: string, payload: unknown) {
    if (typeof payload === 'object' && payload !== null) {
        // eslint-disable-next-line no-console
        console.log(`[POST /auth/register/draft] ${label}: ${JSON.stringify(payload)}`)
    }
}

jest.mock('next/link', () => {
    function MockNextLink({
        children,
        href,
        ...rest
    }: {
        children: React.ReactNode
        href: string
        [key: string]: unknown
    }) {
        return <a href={href} {...rest}>{children}</a>
    }
    MockNextLink.displayName = 'MockNextLink'
    return MockNextLink
})

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush, replace: mockReplace }),
    useSearchParams: () => ({
        get: mockSearchParamsGet,
    }),
}))

jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        session: null,
        loading: false,
        refresh: mockRefresh,
        isProfileComplete: false,
    }),
}))

jest.mock('@/lib/api/auth', () => ({
    checkEmail: (...args: unknown[]) => mockCheckEmail(...args),
    checkCreci: (...args: unknown[]) => mockCheckCreci(...args),
    sendEmailVerificationCode: (...args: unknown[]) => mockSendEmailVerificationCode(...args),
    verifyEmailCode: (...args: unknown[]) => mockVerifyEmailCode(...args),
    isGooglePendingAuthResult: (...args: unknown[]) => mockIsGooglePendingAuthResult(...args),
}))

jest.mock('@/lib/api/signupDraft', () => ({
    createSignupDraftRemote: (...args: unknown[]) => mockCreateSignupDraftRemote(...args),
    patchSignupDraftRemote: (...args: unknown[]) => mockPatchSignupDraftRemote(...args),
    discardSignupDraft: (...args: unknown[]) => mockDiscardSignupDraft(...args),
    sendSignupDraftEmailCode: (...args: unknown[]) => mockSendSignupDraftEmailCode(...args),
}))

jest.mock('@/lib/registerFromSignupDraft', () => ({
    registerUserFromSignupDraft: (...args: unknown[]) => mockRegisterUserFromSignupDraft(...args),
}))

jest.mock('@/lib/auth/routeResolution', () => ({
    resolvePostAuthRoute: (...args: unknown[]) => mockResolvePostAuthRoute(...args),
}))

jest.mock('@/lib/authSignupDraft', () => ({
    createSignupDraft: jest.requireActual('@/lib/authSignupDraft').createSignupDraft,
    loadSignupDraft: () => mockLoadSignupDraft(),
    patchSignupDraft: jest.requireActual('@/lib/authSignupDraft').patchSignupDraft,
    clearSignupDraft: jest.requireActual('@/lib/authSignupDraft').clearSignupDraft,
    resolveSignupDraftHref: jest.requireActual('@/lib/authSignupDraft').resolveSignupDraftHref,
    saveSignupDraft: (...args: unknown[]) => mockSaveSignupDraft(...args),
    rewindSignupDraftToAddress: () => mockRewindSignupDraftToAddress(),
    markSignupDraftEmailVerified: (...args: unknown[]) => mockMarkSignupDraftEmailVerified(...args),
}))

jest.mock('@/lib/auth/googleFlow', () => ({
    loginWithGooglePopup: (...args: unknown[]) => mockLoginWithGooglePopup(...args),
}))

jest.mock('lucide-react', () => {
    return new Proxy({}, {
        get: (_target, prop: string) => {
            const Comp = (p: Record<string, unknown>) => <span data-testid={`icon-${prop.toLowerCase()}`} {...p} />
            Comp.displayName = prop
            return Comp
        },
    })
})

describe('signup flow', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockSearchParamsGet.mockReturnValue(null)
        mockCheckEmail.mockResolvedValue({ exists: false })
        mockCheckCreci.mockResolvedValue({ exists: false })
        mockIsGooglePendingAuthResult.mockReturnValue(false)
        mockLoginWithGooglePopup.mockReset()
        mockCreateSignupDraftRemote.mockResolvedValue({
            draftId: 'draft-test-1',
            draftToken: 'draft-token-1',
            draft: {
                profileType: 'client',
                email: 'cliente-google@example.com',
                name: 'Cliente Google',
                phone: null,
                street: null,
                number: null,
                complement: null,
                bairro: null,
                city: null,
                state: null,
                cep: null,
                withoutNumber: false,
                creci: null,
                needsEmailVerification: false,
                needsPhoneVerification: false,
                currentStep: 'IDENTITY',
                status: 'DRAFT',
            },
            expiresAtMinutes: 20,
        })
        mockPatchSignupDraftRemote.mockResolvedValue({ draft: { currentStep: 'CONTACT' } })
        mockDiscardSignupDraft.mockResolvedValue(undefined)
        mockSendSignupDraftEmailCode.mockResolvedValue({ delivery: 'sent', expires_at: new Date().toISOString() })
        mockResolvePostAuthRoute.mockReturnValue('/meus-imoveis')
        mockLoadSignupDraft.mockReturnValue(null)
        mockMarkSignupDraftEmailVerified.mockImplementation(() => ({
            source: 'email',
            userType: 'client',
            step: 'verify_method',
            emailVerified: true,
            phoneVerified: false,
            data: {
                name: 'João',
                email: 'joao@example.com',
                password: '123456',
                phone: '62999998888',
                street: 'Rua A',
                number: '10',
                semNumero: false,
                complement: '',
                bairro: 'Centro',
                city: 'Rio Verde',
                state: 'GO',
                cep: '75900000',
                creci: '',
                googleIdToken: '',
                googleUid: '',
            },
            updatedAt: new Date().toISOString(),
        }))
        global.fetch = jest.fn(async (input: RequestInfo | URL) => {
            const url = String(input)
            if (url.includes('/municipios')) {
                return {
                    ok: true,
                    json: async () => [{ nome: 'Goiania' }, { nome: 'Anapolis' }],
                }
            }

            return {
                ok: true,
                json: async () => ({}),
            }
        }) as jest.Mock
        window.fetch = global.fetch
        window.localStorage.clear()
        window.sessionStorage.clear()
    })

    it('shows a clear selected state for profile cards', async () => {
        render(<CadastroPage />)

        const clientButton = screen.getByRole('button', { name: /quero cadastrar como cliente/i })
        const brokerButton = screen.getByRole('button', { name: /quero cadastrar como corretor/i })

        expect(clientButton).toHaveAttribute('aria-pressed', 'false')
        expect(brokerButton).toHaveAttribute('aria-pressed', 'false')

        fireEvent.click(clientButton)

        expect(clientButton).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByText('Escolha aplicada. Continue para preencher seus dados.')).toBeInTheDocument()
        expect(screen.queryByText('Selecionado')).not.toBeInTheDocument()
        const selectedIcons = within(clientButton).getAllByTestId('icon-checkcircle2')
        expect(selectedIcons).toHaveLength(1)
    })

    it('mapeia e-mail já registrado para ação de login quando 409 retorna do backend', async () => {
        mockCreateSignupDraftRemote.mockRejectedValueOnce(createDraftConflictError('EMAIL_ALREADY_EXISTS'))
        render(<CadastroPage />)

        fireEvent.click(screen.getByRole('button', { name: /quero cadastrar como cliente/i }))
        fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }))

        fireEvent.change(screen.getByLabelText('Nome completo *'), {
            target: { value: 'Cliente Conflito' },
        })
        fireEvent.change(screen.getByLabelText('E-mail *'), {
            target: { value: 'conflito@example.com' },
        })
        fireEvent.change(screen.getByLabelText('Senha *'), {
            target: { value: '123456' },
        })
        fireEvent.change(screen.getByLabelText('Telefone *'), {
            target: { value: '(62) 98888-8888' },
        })

        fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }))

        await waitFor(() => {
            expect(screen.getByText('Este e-mail já está cadastrado. Faça login para continuar.')).toBeInTheDocument()
        })
        expect(screen.getAllByRole('link', { name: 'Entrar' }).length).toBeGreaterThan(0)
        expect(screen.getByRole('button', { name: 'Descartar cadastro' })).toBeInTheDocument()
    })

    it('mapeia draft já existente para opções de continuar e descartar quando 409 retorna', async () => {
        mockCreateSignupDraftRemote.mockRejectedValueOnce(createDraftConflictError('DRAFT_ALREADY_EXISTS'))
        render(<CadastroPage />)

        fireEvent.click(screen.getByRole('button', { name: /quero cadastrar como cliente/i }))
        fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }))

        fireEvent.change(screen.getByLabelText('Nome completo *'), {
            target: { value: 'Cliente Conflito' },
        })
        fireEvent.change(screen.getByLabelText('E-mail *'), {
            target: { value: 'conflito2@example.com' },
        })
        fireEvent.change(screen.getByLabelText('Senha *'), {
            target: { value: '123456' },
        })
        fireEvent.change(screen.getByLabelText('Telefone *'), {
            target: { value: '(62) 97777-7777' },
        })

        fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }))

        await waitFor(() => {
            expect(screen.getByText('Já existe um cadastro em andamento para este e-mail.')).toBeInTheDocument()
        })
        expect(screen.getByRole('button', { name: 'Continuar cadastro' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Descartar cadastro' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Trocar de conta' })).toBeInTheDocument()
    })

    it('na seleção de perfil + Google de corretor, segue para passo básico sem criar draft remoto sem CRECI', async () => {
        mockIsGooglePendingAuthResult.mockReturnValue(true)
        mockLoginWithGooglePopup.mockResolvedValue({
            pending: {
                email: 'corretor-google-test@example.com',
                name: 'Corretor Google',
                googleIdToken: 'google-token',
                googleUid: 'google-uid',
            },
        })

        render(<CadastroPage />)

        fireEvent.click(screen.getByRole('button', { name: /quero cadastrar como corretor/i }))
        fireEvent.click(screen.getByRole('button', { name: 'Continuar com Google' }))

        await waitFor(() => {
            expect(mockCreateSignupDraftRemote).not.toHaveBeenCalled()
        })

        expect(screen.getByLabelText(/CRECI/i)).toBeInTheDocument()
        expect(mockSaveSignupDraft).toHaveBeenCalledWith(
            expect.objectContaining({
                source: 'google',
                step: 'basic',
                userType: 'broker',
                data: expect.objectContaining({
                    email: 'corretor-google-test@example.com',
                }),
            }),
        )
    })

    it('Google broker no fluxo de perfil mapeia erro de CRECI inválido ao validar dados', async () => {
        mockIsGooglePendingAuthResult.mockReturnValue(true)
        mockLoginWithGooglePopup.mockResolvedValue({
            pending: {
                email: 'corretor-google-test@example.com',
                name: 'Corretor Google',
                googleIdToken: 'google-token',
                googleUid: 'google-uid',
            },
        })
        const validationError = createDraftValidationError('DRAFT_CRICI_INVALID', {
            error: 'CRECI inválido',
            fields: { creci: ['CRECI inválido'] },
        })
        mockCreateSignupDraftRemote.mockRejectedValueOnce(validationError)
        logDraftValidationError('google-broker-basic', validationError)
        render(<CadastroPage />)

        fireEvent.click(screen.getByRole('button', { name: /quero cadastrar como corretor/i }))
        fireEvent.click(screen.getByRole('button', { name: 'Continuar com Google' }))

        await waitFor(() => {
            expect(screen.getByLabelText('Telefone *')).toBeInTheDocument()
            expect(screen.getByLabelText(/CRECI/i)).toBeInTheDocument()
        })

        fireEvent.change(screen.getByLabelText('Telefone *'), {
            target: { value: '(62) 98888-7777' },
        })
        fireEvent.change(screen.getByLabelText(/CRECI/i), {
            target: { value: 'ABC123' },
        })
        fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }))

        await waitFor(() => {
            expect(mockCreateSignupDraftRemote).toHaveBeenCalledTimes(1)
            expect(screen.getByText('CRECI inválido.')).toBeInTheDocument()
        })
    })

    it('fluxo sem Google não envia endereço no POST inicial e não mostra erro de endereço inválido', async () => {
        render(<CadastroPage />)

        fireEvent.click(screen.getByRole('button', { name: /quero cadastrar como cliente/i }))
        fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }))

        fireEvent.change(screen.getByLabelText('Nome completo *'), {
            target: { value: 'Cliente Sem Endereço' },
        })
        fireEvent.change(screen.getByLabelText('E-mail *'), {
            target: { value: 'cliente-sem-endereco@example.com' },
        })
        fireEvent.change(screen.getByLabelText('Senha *'), {
            target: { value: '123456' },
        })
        fireEvent.change(screen.getByLabelText('Telefone *'), {
            target: { value: '(62) 98888-8888' },
        })

        fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }))

        await waitFor(() => {
            expect(mockCreateSignupDraftRemote).toHaveBeenCalledTimes(1)
        })

        const payload = mockCreateSignupDraftRemote.mock.calls[0]?.[0]
        logDraftPayload('email-sem-endereco', payload)
        expect(payload).toMatchObject({
            profileType: 'client',
            source: 'email',
            authProvider: 'email',
            email: 'cliente-sem-endereco@example.com',
            currentStep: 'CONTACT',
        })
        expect(payload).not.toHaveProperty('street')
        expect(payload).not.toHaveProperty('number')
        expect(payload).not.toHaveProperty('bairro')
        expect(payload).not.toHaveProperty('city')
        expect(payload).not.toHaveProperty('state')
        expect(payload).not.toHaveProperty('cep')
        expect(payload).not.toHaveProperty('creci')

        expect(screen.getByLabelText('CEP (opcional)')).toBeInTheDocument()
        expect(screen.queryByText(/Endereço inválido/i)).not.toBeInTheDocument()
    })

    it('fluxo sem Google mostra erro de conexão para falha de rede no POST inicial', async () => {
        mockCreateSignupDraftRemote.mockRejectedValueOnce(createNetworkFailure())
        render(<CadastroPage />)

        fireEvent.click(screen.getByRole('button', { name: /quero cadastrar como cliente/i }))
        fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }))

        fireEvent.change(screen.getByLabelText('Nome completo *'), {
            target: { value: 'Cliente Sem Conexão' },
        })
        fireEvent.change(screen.getByLabelText('E-mail *'), {
            target: { value: 'cliente-sem-conexao@example.com' },
        })
        fireEvent.change(screen.getByLabelText('Senha *'), {
            target: { value: '123456' },
        })
        fireEvent.change(screen.getByLabelText('Telefone *'), {
            target: { value: '(62) 98888-9999' },
        })

        fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }))

        await waitFor(() => {
            expect(screen.queryByText('CRECI inválido.')).not.toBeInTheDocument()
        })
        await waitFor(() => {
            expect(screen.getByText(/Falha de conexão com o servidor/)).toBeInTheDocument()
        })
    })

    it('não exibe "Trocar de conta" fora de conflito real no passo de perfil', async () => {
        render(<CadastroPage />)

        expect(screen.queryByRole('button', { name: 'Trocar de conta' })).not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: /quero cadastrar como cliente/i }))
        fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }))

        expect(screen.queryByRole('button', { name: 'Trocar de conta' })).not.toBeInTheDocument()
    })

    it('chama descarte remoto, limpa draft local e navega no Trocar de conta (conflito de draft)', async () => {
        window.localStorage.setItem('ea_signup_draft_v1', JSON.stringify({
            source: 'email',
            userType: 'client',
            step: 'basic',
            emailVerified: false,
            phoneVerified: false,
            draftId: 'draft-conflict-1',
            draftToken: 'draft-token-conflict-1',
            data: {
                name: 'Cliente Conflito',
                email: 'conflito3@example.com',
                password: '123456',
                phone: '(62) 97777-7777',
                street: 'Rua A',
                number: '100',
                semNumero: false,
                complement: '',
                bairro: 'Centro',
                city: 'Anapolis',
                state: 'GO',
                cep: '75900000',
                creci: '',
                googleIdToken: '',
                googleUid: '',
            },
            updatedAt: new Date().toISOString(),
        }))
        window.localStorage.setItem('ea_signup_draft_ts_v1', String(Date.now()))

        mockLoadSignupDraft.mockReturnValue({
            source: 'email',
            userType: null,
            step: 'profile',
            emailVerified: false,
            phoneVerified: false,
            draftId: 'draft-conflict-1',
            draftToken: 'draft-token-conflict-1',
            data: {
                name: 'Cliente Conflito',
                email: 'conflito3@example.com',
                password: '123456',
                phone: '(62) 97777-7777',
                street: '',
                number: '',
                semNumero: false,
                complement: '',
                bairro: '',
                city: '',
                state: 'GO',
                cep: '',
                creci: '',
                googleIdToken: '',
                googleUid: '',
            },
            updatedAt: new Date().toISOString(),
        })

        mockPatchSignupDraftRemote.mockRejectedValueOnce(createDraftConflictError('DRAFT_ALREADY_EXISTS'))
        render(<CadastroPage />)

        fireEvent.click(screen.getByRole('button', { name: /quero cadastrar como cliente/i }))
        fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }))

        fireEvent.change(screen.getByLabelText('Nome completo *'), {
            target: { value: 'Cliente Conflito' },
        })
        fireEvent.change(screen.getByLabelText('E-mail *'), {
            target: { value: 'conflito3@example.com' },
        })
        fireEvent.change(screen.getByLabelText('Senha *'), {
            target: { value: '123456' },
        })
        fireEvent.change(screen.getByLabelText('Telefone *'), {
            target: { value: '(62) 97777-7777' },
        })

        fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }))

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Trocar de conta' })).toBeInTheDocument()
        })

        const createCallsBeforeSwitch = mockCreateSignupDraftRemote.mock.calls.length
        fireEvent.click(screen.getByRole('button', { name: 'Trocar de conta' }))

        await waitFor(() => {
            expect(mockDiscardSignupDraft).toHaveBeenCalledWith('draft-conflict-1', 'draft-token-conflict-1')
            expect(mockPush).toHaveBeenCalledWith('/auth/login')
        })

        expect(window.localStorage.getItem('ea_signup_draft_v1')).toBeNull()
        expect(window.localStorage.getItem('ea_signup_draft_ts_v1')).toBeNull()
        expect(mockCreateSignupDraftRemote).toHaveBeenCalledTimes(createCallsBeforeSwitch)
    })

    it('pula tela de perfil quando há userType no draft com step profile', async () => {
        mockLoadSignupDraft.mockReturnValue({
            source: 'email',
            userType: 'broker',
            step: 'profile',
            emailVerified: false,
            phoneVerified: false,
            draftId: null,
            draftToken: null,
            data: {
                name: '',
                email: '',
                password: '',
                phone: '',
                street: '',
                number: '',
                semNumero: false,
                complement: '',
                bairro: '',
                city: '',
                state: 'GO',
                cep: '',
                creci: '',
                googleIdToken: '',
                googleUid: '',
            },
            updatedAt: new Date().toISOString(),
        })
        render(<CadastroPage />)

        await waitFor(() => {
            expect(screen.getByLabelText('Nome completo *')).toBeInTheDocument()
        })

        expect(screen.queryByRole('button', { name: /quero cadastrar como cliente/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /quero cadastrar como corretor/i })).not.toBeInTheDocument()
    })

    it('não renderiza stepper/lista de etapas no topo', () => {
        render(<CadastroPage />)

        expect(screen.queryByLabelText('Progresso do cadastro')).not.toBeInTheDocument()
        expect(screen.queryByRole('list', { name: 'Progresso do cadastro' })).not.toBeInTheDocument()
        expect(
            screen.getByText('Selecione seu tipo de perfil para avançarmos para o próximo passo.'),
        ).toBeInTheDocument()
    })

    it('preserva perfil escolhido antes do Google e avança para dados básicos', async () => {
        mockIsGooglePendingAuthResult.mockReturnValue(true)
        mockLoginWithGooglePopup.mockResolvedValue({
            pending: {
                email: 'cliente-google@example.com',
                name: 'Cliente Google',
                googleIdToken: 'google-token',
                googleUid: 'google-uid',
            },
        })

        render(<CadastroPage />)

        fireEvent.click(screen.getByRole('button', { name: /quero cadastrar como cliente/i }))
        fireEvent.click(screen.getByRole('button', { name: 'Continuar com Google' }))

        await waitFor(() => {
            expect(mockSaveSignupDraft).toHaveBeenCalledWith(
                expect.objectContaining({
                    source: 'google',
                    step: 'basic',
                    userType: 'client',
                    data: expect.objectContaining({
                        email: 'cliente-google@example.com',
                    }),
                }),
            )
        })

        expect(screen.getByLabelText('Nome completo *')).toBeInTheDocument()
        expect(screen.getByLabelText('E-mail *')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /quero cadastrar como cliente/i })).not.toBeInTheDocument()
    })

    it('bloqueia e-mail já existente na etapa de dados antes de avançar', async () => {
        mockCheckEmail.mockResolvedValueOnce({ exists: true })
        render(<CadastroPage />)

        fireEvent.click(screen.getByRole('button', { name: /quero cadastrar como cliente/i }))
        fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }))

        fireEvent.change(screen.getByLabelText('Nome completo *'), {
            target: { value: 'Cliente Bloqueado' },
        })
        fireEvent.change(screen.getByLabelText('E-mail *'), {
            target: { value: 'bloqueado@example.com' },
        })
        fireEvent.change(screen.getByLabelText('Senha *'), {
            target: { value: '123456' },
        })
        fireEvent.change(screen.getByLabelText('Telefone *'), {
            target: { value: '(62) 99999-9999' },
        })

        fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }))

        await waitFor(() => {
            expect(mockCheckEmail).toHaveBeenCalledWith('bloqueado@example.com')
        })
        expect(screen.getByText('Já existe uma conta com este e-mail.')).toBeInTheDocument()
    })

    it('mapeia DRAFT_ADDRESS_INVALID para erro de endereço na etapa de endereço', async () => {
        const validationError = createDraftValidationError('DRAFT_ADDRESS_INVALID', {
            error: 'Endereço inválido',
            fields: { address: ['Endereço inválido'] },
        })
        mockPatchSignupDraftRemote.mockRejectedValueOnce(validationError)
        logDraftValidationError('email-address-draft-invalid', validationError)

        render(<CadastroPage />)

        fireEvent.click(screen.getByRole('button', { name: /quero cadastrar como cliente/i }))
        fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }))

        fireEvent.change(screen.getByLabelText('Nome completo *'), {
            target: { value: 'Cliente Address' },
        })
        fireEvent.change(screen.getByLabelText('E-mail *'), {
            target: { value: 'cliente-address@example.com' },
        })
        fireEvent.change(screen.getByLabelText('Senha *'), {
            target: { value: '123456' },
        })
        fireEvent.change(screen.getByLabelText('Telefone *'), {
            target: { value: '(62) 98888-7777' },
        })

        fireEvent.click(screen.getByRole('button', { name: /^continuar$/i }))

        await waitFor(() => {
            expect(screen.getByLabelText('CEP (opcional)')).toBeInTheDocument()
        })

        fireEvent.change(screen.getByLabelText(/CEP \(opcional\)/), {
            target: { value: '74000-000' },
        })
        fireEvent.change(screen.getByLabelText('Estado *'), {
            target: { value: 'GO' },
        })
        fireEvent.change(screen.getByLabelText('Cidade'), {
            target: { value: 'Goiânia' },
        })
        fireEvent.change(screen.getByLabelText('Bairro'), {
            target: { value: 'Centro' },
        })
        fireEvent.change(screen.getByLabelText('Rua'), {
            target: { value: 'Rua das Flores' },
        })
        fireEvent.change(screen.getByLabelText('Número *'), {
            target: { value: '100' },
        })

        fireEvent.click(screen.getByRole('button', { name: /ir para a página de verificação/i }))

        await waitFor(() => {
            expect(mockPatchSignupDraftRemote).toHaveBeenCalledTimes(1)
        })
        await waitFor(() => {
            expect(screen.getByText('Endereço inválido.')).toBeInTheDocument()
        })
    })

    it('exibe aviso de e-mail já confirmado e pergunta de telefone na etapa verificar método', async () => {
        mockSearchParamsGet.mockImplementation((key: string) => (key === 'flow' ? 'signup' : null))
        mockLoadSignupDraft.mockReturnValue({
            source: 'email',
            userType: 'client',
            step: 'email',
            draftId: 'draft-client-test',
            draftToken: 'draft-client-test-token',
            emailVerified: false,
            phoneVerified: false,
            data: {
                name: 'João',
                email: 'joao@example.com',
                password: '123456',
                phone: '62999998888',
                street: 'Rua A',
                number: '10',
                semNumero: false,
                complement: '',
                bairro: 'Centro',
                city: 'Rio Verde',
                state: 'GO',
                cep: '75900000',
                creci: '',
                googleIdToken: '',
                googleUid: '',
            },
            updatedAt: new Date().toISOString(),
        })
        mockSendSignupDraftEmailCode.mockResolvedValue({ delivery: 'already_verified' })
        mockRegisterUserFromSignupDraft.mockResolvedValue({
            user: { role: 'client', email_verified: true, phone: '' },
            isBroker: false,
            profileStatus: 'complete',
            requiresBrokerDocuments: false,
        })

        render(<VerificacaoPage />)

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/cadastro/verificar-metodo')
        })
        expect(screen.getByText('Conta verificada!')).toBeInTheDocument()
        expect(screen.getByText('E-mail já confirmado.')).toBeInTheDocument()
        expect(mockRegisterUserFromSignupDraft).not.toHaveBeenCalled()

        expect(mockPush).not.toHaveBeenCalledWith('/cadastro/verificar-telefone?flow=signup')
    })

    it('oferece "Prosseguir com verificação de corretor" para perfil corretor no verificar método', async () => {
        mockLoadSignupDraft.mockReturnValue({
            source: 'google',
            userType: 'broker',
            step: 'verify_method',
            emailVerified: true,
            phoneVerified: false,
            data: {
                name: 'Maria',
                email: 'maria@example.com',
                password: '',
                phone: '62999998888',
                street: 'Rua B',
                number: '20',
                semNumero: false,
                complement: '',
                bairro: 'Centro',
                city: 'Rio Verde',
                state: 'GO',
                cep: '75900000',
                creci: 'GO123',
                googleIdToken: 'token',
                googleUid: 'uid',
            },
            updatedAt: new Date().toISOString(),
        })
        mockRegisterUserFromSignupDraft.mockResolvedValue({
            user: { role: 'broker', email_verified: true, phone: '' },
            isBroker: true,
            profileStatus: 'complete',
            requiresBrokerDocuments: true,
        })

        render(<VerificarMetodoPage />)

        await waitFor(() => {
            expect(
                screen.getByText(/Seu e-mail já foi (confirmado|verificado)\. Você quer verificar seu telefone\?/i),
            ).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Sim, verificar por SMS' })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Prosseguir com verificação de corretor' })).toBeInTheDocument()
        })
        expect(mockRegisterUserFromSignupDraft).not.toHaveBeenCalled()
    })

    it('finaliza cadastro de corretor com sucesso e segue para onboarding de documentos', async () => {
        mockLoadSignupDraft.mockReturnValue({
            source: 'google',
            userType: 'broker',
            step: 'verify_method',
            emailVerified: true,
            phoneVerified: false,
            data: {
                name: 'Maria',
                email: 'maria@example.com',
                password: '',
                phone: '62999998888',
                street: 'Rua B',
                number: '20',
                semNumero: false,
                complement: '',
                bairro: 'Centro',
                city: 'Rio Verde',
                state: 'GO',
                cep: '75900000',
                creci: 'GO123',
                googleIdToken: 'token',
                googleUid: 'uid',
            },
            updatedAt: new Date().toISOString(),
        })
        mockRegisterUserFromSignupDraft.mockResolvedValue({
            user: { role: 'broker', email_verified: true, phone: '' },
            isBroker: true,
            profileStatus: 'complete',
            requiresBrokerDocuments: true,
        })

        render(<VerificarMetodoPage />)

        fireEvent.click(screen.getByRole('button', { name: 'Prosseguir com verificação de corretor' }))

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/onboarding/broker?mode=signup&creci=GO123')
        })
        expect(mockReplace).not.toHaveBeenCalledWith('/meus-imoveis')
    })

    it('preserva o CRECI informado no cadastro e não reexibe campo ao ir para documentos', async () => {
        mockLoadSignupDraft.mockReturnValue({
            source: 'google',
            userType: 'broker',
            step: 'verify_method',
            emailVerified: true,
            phoneVerified: false,
            data: {
                name: 'Maria',
                email: 'maria@example.com',
                password: '',
                phone: '62999998888',
                street: 'Rua B',
                number: '20',
                semNumero: false,
                complement: '',
                bairro: 'Centro',
                city: 'Rio Verde',
                state: 'GO',
                cep: '75900000',
                creci: 'GO123',
                googleIdToken: 'token',
                googleUid: 'uid',
            },
            updatedAt: new Date().toISOString(),
        })
        mockRegisterUserFromSignupDraft.mockResolvedValue({
            user: { role: 'broker', email_verified: true, phone: '' },
            isBroker: true,
            profileStatus: 'complete',
            requiresBrokerDocuments: true,
        })

        render(<VerificarMetodoPage />)

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Prosseguir com verificação de corretor' })).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole('button', { name: 'Prosseguir com verificação de corretor' }))

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/onboarding/broker?mode=signup&creci=GO123')
        })
    })
})
