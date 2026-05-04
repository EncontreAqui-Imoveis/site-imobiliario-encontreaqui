import { test, expect, type Page } from '@playwright/test'

const mockClientProfile = {
  role: 'client',
  status: null,
  requiresDocuments: false,
  user: {
    id: 10,
    name: 'Cliente E2E',
    email: 'cliente-e2e@example.com',
    email_verified: true,
    phone: '62999999999',
    street: 'Rua Teste',
    number: '100',
    bairro: 'Centro',
    city: 'Goiânia',
    state: 'GO',
    cep: '74000000',
    createdAt: '2026-04-07T10:00:00.000Z',
    token_hint: 'site-client-token',
  },
}

async function mockAuthApi(page: Page) {
  await page.route('**/auth/login', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }

    const body = await route.request().postDataJSON()
    if (body?.email === 'cliente-e2e@example.com' && body?.password === '123456') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            ...mockClientProfile.user,
            role: 'client',
          },
          token: 'site-client-token',
          needsCompletion: false,
          requiresDocuments: false,
        }),
      })
      return
    }

    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Credenciais inválidas.',
      }),
    })
  })

  await page.route('**/users/me', async (route) => {
    const req = route.request()
    const hasCookie = String(req.headers().cookie || '')
      .split(';')
      .map((entry) => entry.trim())
      .some((entry) => entry.startsWith('ea_auth_token='))

    await route.fulfill({
      status: hasCookie ? 200 : 401,
      contentType: 'application/json',
      body: hasCookie ? JSON.stringify(mockClientProfile) : JSON.stringify({ error: 'Unauthorized' }),
    })
  })
}

test('rota protegida sem sessao redireciona para login', async ({ page }) => {
  await page.goto('/meus-imoveis')
  await expect(page).toHaveURL('/auth/login?next=%2Fmeus-imoveis')
})

test('login permite entrar com credenciais de teste e remove bloqueio de sessão', async ({ page }) => {
  await mockAuthApi(page)
  await page.goto('/auth/login')

  await page.getByLabel('E-mail').fill('cliente-e2e@example.com')
  await page.locator('#password').fill('123456')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).not.toHaveURL('/auth/login')
  await expect(page).toHaveURL('/meus-imoveis')
})

test('login mostra erro específico quando 401 retorna papel divergente', async ({ page }) => {
    await page.route('**/auth/login', async (route) => {
        if (route.request().method() !== 'POST') {
            await route.continue()
            return
        }

        await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
                message: 'Credenciais inválidas.',
                requestedProfile: 'client',
                role: 'broker',
            }),
        })
    })

    await page.goto('/auth/login')

    await page.getByLabel('E-mail').fill('cliente-e2e@example.com')
    await page.locator('#password').fill('123456')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(page.locator('#login-error')).toHaveText(
        'Esta conta é de corretor. Selecione Corretor para entrar.',
    )
    await expect(page).toHaveURL('/auth/login')
})

test('usuario autenticado não acessa /auth/login nem /auth/cadastro', async ({ page }) => {
  await page.route('**/users/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockClientProfile),
    })
  })

  await page.addInitScript(() => {
    window.localStorage.setItem('ea_auth_token', 'site-client-token')
  })

  await page.goto('/auth/login')
  await expect(page).toHaveURL('/meus-imoveis')

  await page.goto('/auth/cadastro')
  await expect(page).toHaveURL('/meus-imoveis')
})

test('step de cadastro é indicador de progresso e seleção tem check único', async ({ page }) => {
  await mockAuthApi(page)
  await page.goto('/auth/cadastro')

  const clientButton = page.getByRole('button', { name: /quero cadastrar como cliente/i })
  await clientButton.click()

  await expect(clientButton).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: /quero cadastrar como corretor/i })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect(page.locator('text=Etapa 1: Perfil')).toHaveCount(0)
  await expect(clientButton.locator('svg')).toHaveCount(1)
  await expect(
      page.getByText('Selecione seu tipo de perfil para avançarmos para o próximo passo.'),
  ).toBeVisible()
})

test('bloco de cadastro respeita margem de topo em mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/auth/cadastro')

  const authPanel = page.locator('main').locator('div', { has: page.getByRole('heading', { name: 'Criar conta' }) }).first()

  await expect(authPanel).toHaveClass(/min-h-\[calc\(100vh-4rem\)]/)
  await expect(authPanel).toHaveClass(/pt-24/)
  await expect(authPanel).toHaveClass(/sm:pt-36/)
})

test('bloco de seleção de verificação de método respeita margem em mobile', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'ea_signup_draft_v1',
      JSON.stringify({
        source: 'email',
        userType: 'client',
        step: 'verify_method',
        emailVerified: false,
        phoneVerified: false,
        data: {
          name: 'Cliente E2E',
          email: 'cliente-e2e@example.com',
          password: '123456',
          phone: '62999999999',
          street: 'Rua Teste',
          number: '100',
          semNumero: false,
          complement: '',
          bairro: 'Centro',
          city: 'Goiânia',
          state: 'GO',
          cep: '74000000',
          creci: '',
          googleIdToken: '',
          googleUid: '',
        },
        updatedAt: new Date().toISOString(),
      }),
    )
  })

  await page.setViewportSize({ width: 768, height: 1024 })
  await page.route('**/users/me', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockClientProfile) })
  })
  await page.goto('/cadastro/verificar-metodo')

  const verifyPanel = page.locator('main').locator('div', { has: page.getByRole('heading', { name: 'Verificação da conta' }) }).first()

  await expect(verifyPanel).toHaveClass(/min-h-\[calc\(100vh-4rem\)]/)
  await expect(verifyPanel).toHaveClass(/pt-24/)
  await expect(verifyPanel).toHaveClass(/sm:pt-36/)
})

test('bloco de login não entra abaixo da navbar em viewport mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/auth/login')

  const loginPanel = page.locator('main').locator('div', { has: page.getByRole('heading', { name: 'Entrar na plataforma' }) }).first()

  await expect(loginPanel).toHaveClass(/min-h-\[calc\(100vh-4rem\)]/)
  await expect(loginPanel).toHaveClass(/pt-28/)
  await expect(loginPanel).toHaveClass(/sm:pt-36/)
})

test('verificar método com e-mail já confirmado pergunta se quer validar telefone', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'ea_signup_draft_v1',
      JSON.stringify({
        source: 'google',
        userType: 'client',
        step: 'verify_method',
        emailVerified: true,
        phoneVerified: false,
        data: {
          name: 'Cliente E2E',
          email: 'cliente-e2e@example.com',
          password: '',
          phone: '62999999999',
          street: 'Rua Teste',
          number: '100',
          semNumero: false,
          complement: '',
          bairro: 'Centro',
          city: 'Goiânia',
          state: 'GO',
          cep: '74000000',
          creci: '',
          googleIdToken: 'google-token',
          googleUid: 'google-uid',
        },
        updatedAt: new Date().toISOString(),
      }),
    )
  })

  await page.goto('/cadastro/verificar-metodo')

  await expect(page.getByText(/Seu e-mail já foi (confirmado|verificado)\. Você quer verificar seu telefone\?/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /Sim, verificar por SMS/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Não, continuar sem verificar/i })).toBeVisible()
})

test('revisar dados do cadastro volta para etapa correta sem reenviar e-mail', async ({ page }) => {
  let sendCount = 0
  await page.route('**/auth/email-verification/send', async (route) => {
    sendCount += 1
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ delivery: 'already_verified' }),
    })
  })
  await page.route('**/auth/email-verification/verify-code', async (route) => {
    await route.fulfill({
      status: 200,
      body: '',
    })
  })

  await page.addInitScript(() => {
    window.localStorage.setItem(
      'ea_signup_draft_v1',
      JSON.stringify({
        source: 'email',
        userType: 'client',
        step: 'email',
        emailVerified: false,
        phoneVerified: false,
        data: {
          name: 'Cliente E2E',
          email: 'cliente-e2e@example.com',
          password: '123456',
          phone: '62999999999',
          street: 'Rua Teste',
          number: '100',
          semNumero: false,
          complement: '',
          bairro: 'Centro',
          city: 'Goiânia',
          state: 'GO',
          cep: '74000000',
          creci: '',
          googleIdToken: '',
          googleUid: '',
        },
        updatedAt: new Date().toISOString(),
      }),
    )
    window.sessionStorage.setItem('ea_email_otp_sent_cliente-e2e@example.com', String(Date.now()))
  })

  await page.route('**/users/me', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockClientProfile) })
  })

  await page.goto('/verificacao?flow=signup')
  await expect(page.getByRole('button', { name: 'Revisar dados do cadastro' })).toBeVisible()

  await page.getByRole('button', { name: 'Revisar dados do cadastro' }).click()
  await expect(page).toHaveURL('/auth/cadastro')

  await page.reload()
  await expect(page).toHaveURL('/auth/cadastro')
  expect(sendCount).toBe(0)
})

test('nao reenvia código de e-mail quando retorno acontece em janela de cooldown', async ({ page }) => {
  let sendCount = 0
  await page.route('**/auth/email-verification/send', async (route) => {
    sendCount += 1
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ delivery: 'sent' }),
    })
  })

  await page.addInitScript(() => {
    window.localStorage.setItem(
      'ea_signup_draft_v1',
      JSON.stringify({
        source: 'email',
        userType: 'client',
        step: 'email',
        emailVerified: false,
        phoneVerified: false,
        data: {
          name: 'Cliente E2E',
          email: 'cliente-e2e@example.com',
          password: '123456',
          phone: '62999999999',
          street: 'Rua Teste',
          number: '100',
          semNumero: false,
          complement: '',
          bairro: 'Centro',
          city: 'Goiânia',
          state: 'GO',
          cep: '74000000',
          creci: '',
          googleIdToken: '',
          googleUid: '',
        },
        updatedAt: new Date().toISOString(),
      }),
    )
  })

  await page.route('**/users/me', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthorized' }) })
  })

  await page.goto('/verificacao?flow=signup')
  await expect(page.getByText('Verificar conta')).toBeVisible()
  await page.reload()
  await expect(sendCount).toBe(1)
})
