# Smoke Checklist Web

## Objetivo
Validar manualmente os fluxos externos e sensíveis que não são certificados apenas por unit/integration/E2E mockado.

## Fluxos
1. Cadastro cliente por e-mail
- Criar conta em `/auth/cadastro`
- Confirmar e-mail em `/verificacao`
- Confirmar telefone em `/cadastro/verificar-telefone`
- Evidência esperada: redirecionamento final para `Meus Imóveis`

2. Cadastro corretor via Google
- Iniciar com Google
- Escolher perfil corretor
- Completar endereço
- Confirmar telefone
- Enviar documentos em `/onboarding/broker`
- Evidência esperada: status pendente de verificação e tela de documentos sem erro

3. Atualização de telefone no perfil
- Alterar telefone em `/perfil/editar`
- Confirmar OTP
- Evidência esperada: retorno para `/perfil/editar?saved=1`

4. Upload de proposta assinada
- Abrir `/propostas/[negotiationId]/upload-assinada`
- Enviar PDF válido
- Evidência esperada: redirecionamento para `/propostas?signed=1`

5. Continuidade operacional
- Acessar `/perfil`, `/favoritos`, `/notificacoes`, `/configuracoes` sem login
- Evidência esperada: soft gate com CTA de entrar/criar conta

## Registro
- Anotar ambiente
- Anotar data/hora
- Salvar screenshot final de cada fluxo
- Registrar request id quando houver erro de backend
