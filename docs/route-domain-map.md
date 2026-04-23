# Mapa de Rotas e Domínios - site-imobiliario

Este documento centraliza as rotas do app por domínio funcional para acelerar triagem técnica e análise de impacto.

## Público

- `/` - Home
- `/imoveis` - Listagem
- `/imoveis/[id]` - Detalhe do imóvel
- `/termos` - Termos
- `/privacidade` - Privacidade

## Autenticação e Verificação

- `/auth/login` - Login
- `/auth/cadastro` - Cadastro
- `/auth/verificar-email` - Verificação de e-mail
- `/recuperar-senha` - Recuperação de senha
- `/cadastro/verificar-telefone` - Verificação de telefone
- `/cadastro/verificar-metodo` - Método de verificação
- `/cadastro/verificar-creci` - Verificação de CRECI
- `/verificacao` - Gate de verificação de conta

## Onboarding e Perfil

- `/onboarding` - Completar perfil
- `/onboarding/broker` - Onboarding de corretor
- `/perfil` - Perfil
- `/perfil/editar` - Edição de perfil
- `/perfil/evoluir-corretor` - Evolução para corretor
- `/configuracoes` - Configurações de conta

## Funil de Imóveis

- `/favoritos` - Favoritos
- `/anuncie` - Publicar imóvel
- `/meus-imoveis` - Imóveis do usuário
- `/meus-imoveis/[id]/editar` - Edição de imóvel do usuário

## Negociação e Contratos

- `/propostas` - Propostas
- `/propostas/nova` - Novo fluxo de proposta
- `/propostas/nova/[propertyId]` - Proposta para imóvel específico
- `/propostas/[negotiationId]/upload-assinada` - Upload de proposta assinada
- `/contratos` - Contratos
- `/contratos/[id]` - Detalhe de contrato

## Corretor e Operação

- `/notificacoes` - Notificações
- `/relatorios` - Relatórios de desempenho/comissão

## Regras de triagem recomendadas

1. Confirmar domínio da rota antes de alterar UI ou serviço.
2. Identificar perfil do usuário impactado (visitante, cliente, corretor, proprietário).
3. Verificar dependências de sessão em `UserContext`, `routeResolution` e `middleware`.
4. Validar se a mudança exige atualização de API (`src/lib/api/*`) e de componentes reutilizados.
