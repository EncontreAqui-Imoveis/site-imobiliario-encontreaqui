# Site Imobiliário (EncontreAqui)

Aplicação web pública de descoberta imobiliária com fluxos de autenticação, onboarding, propostas e contratos.

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Firebase Auth (Google + e-mail)
- Jest + Testing Library + Playwright

## Pré-requisitos

- Node.js 20+
- npm 10+

## Instalação

```bash
npm install
```

## Configuração de ambiente

1. Crie o arquivo local:

```bash
cp .env.example .env.local
```

2. Preencha os valores obrigatórios:

- `NEXT_PUBLIC_API_URL` (URL do backend)
- `NEXT_PUBLIC_FIREBASE_*` (projeto Firebase web)

## Desenvolvimento local

```bash
npm run dev
```

Aplicação em [http://localhost:3000](http://localhost:3000).

## Build e execução

```bash
npm run build
npm run start
```

## Scripts úteis

- `npm run lint` - lint da base `src`
- `npm run test` - testes unitários
- `npm run test:coverage` - cobertura de testes
- `npm run test:architecture` - disciplina arquitetural de imports
- `npm run test:ci` - lint + arquitetura + cobertura
- `npm run test:e2e` - build + Playwright com mock backend local (`NEXT_PUBLIC_API_URL=http://127.0.0.1:4010`)
- `npm run security:audit` - auditoria de dependências

## Referências internas

- Mapa de rotas/domínios: `docs/route-domain-map.md`
- Contratos de API web: `docs/api_contracts_web.md`

## Observações operacionais

- O app depende de `NEXT_PUBLIC_API_URL` para chamadas REST e para CSP (`next.config.js`).
- Áreas privadas têm reforço em middleware e validações por contexto/guards nas páginas.
- Para evitar drift entre ambientes, mantenha a URL da API consistente entre `.env.local`, CI e staging.
