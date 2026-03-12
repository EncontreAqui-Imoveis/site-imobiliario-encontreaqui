# Inventário de Paridade App -> Web

## Objetivo
Mapear os fluxos principais do app Flutter para o `site-imobiliario`, deixando explícito o que já está coberto, o que está parcial e o que ainda precisa de evolução.

## Jornada 1: descoberta pública
| Fluxo do app | Equivalente web | Status |
|---|---|---|
| Home / vitrine | `/` + `src/components/home/*` | cobre parcialmente |
| Busca e filtros | `/imoveis` + `src/components/search/*` | cobre parcialmente |
| Detalhe do imóvel | `/imoveis/[id]` + `PropertyDetailClient` | cobre parcialmente |
| Galeria / vídeo | `PropertyGallery` / `PropertyGalleryModal` | cobre parcialmente |
| Favoritar | `/favoritos` + `FavoriteButton` | cobre parcialmente |
| Compartilhar imóvel | `PropertyInfo` | cobre parcialmente |

## Jornada 2: auth e onboarding
| Fluxo do app | Equivalente web | Status |
|---|---|---|
| Login | `/auth/login` | cobre parcialmente |
| Cadastro | `/auth/cadastro` | cobre parcialmente |
| Recuperar senha | `/recuperar-senha` | cobre parcialmente |
| Verificação de e-mail | `/auth/verificar-email`, `/verificacao` | cobre parcialmente |
| Verificação de telefone | `/cadastro/verificar-telefone` | cobre parcialmente |
| Onboarding | `/onboarding`, `/onboarding/broker` | cobre parcialmente |
| Evolução para corretor | `/perfil/evoluir-corretor`, `/cadastro/verificar-creci` | cobre parcialmente |

## Jornada 3: operação autenticada
| Fluxo do app | Equivalente web | Status |
|---|---|---|
| Perfil | `/perfil` | cobre parcialmente |
| Editar perfil | `/perfil/editar` | cobre parcialmente |
| Configurações | `/configuracoes` | cobre parcialmente |
| Notificações | `/notificacoes` | cobre parcialmente |
| Favoritos | `/favoritos` | cobre parcialmente |
| Meus imóveis | `/meus-imoveis` | cobre parcialmente |
| Editar imóvel | `/meus-imoveis/[id]/editar` | cobre parcialmente |
| Anunciar imóvel | `/anuncie` | cobre parcialmente |
| Relatórios | `/relatorios` | cobre parcialmente |

## Jornada 4: proposta e negociação
| Fluxo do app | Equivalente web | Status |
|---|---|---|
| Nova proposta | `/propostas/nova`, `/propostas/nova/[propertyId]` | cobre parcialmente |
| Upload de proposta assinada | `/propostas/[negotiationId]/upload-assinada` | cobre parcialmente |
| Listagem de propostas | `/propostas` | cobre parcialmente |
| Estados de negociação | `/propostas`, `/contratos`, libs de negociação | cobre parcialmente |

## Jornada 5: contratos
| Fluxo do app | Equivalente web | Status |
|---|---|---|
| Lista de contratos | `/contratos` + `ContractList` | cobre parcialmente |
| Detalhe do contrato | `/contratos/[id]` + `ContractDetailClient` | cobre parcialmente |
| Estados / etapas / microcopies | contratos + tipos | cobre parcialmente |

## Gaps prioritários desta wave
1. Padronizar UX, responsividade e acessibilidade entre `auth`, `detalhe`, `propostas` e `contratos`.
2. Dar equivalência web clara para compartilhamento, uploads e feedback de estado.
3. Alinhar microcopy/status entre app e web.
4. Registrar threat model e manter `SAST` como gate explícito da evolução.
