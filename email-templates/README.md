# Templates de Email - Lidzy

## Como configurar no Supabase

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Authentication** > **Email Templates**
4. Selecione o template **Confirm signup**
5. Cole o conteúdo do arquivo `verification-email.html`
6. Clique em **Save**

## Variáveis disponíveis

O Supabase fornece as seguintes variáveis que você pode usar nos templates:

- `{{ .ConfirmationURL }}` - URL de confirmação do email
- `{{ .Token }}` - Token de verificação
- `{{ .TokenHash }}` - Hash do token
- `{{ .SiteURL }}` - URL do seu site
- `{{ .Email }}` - Email do usuário

## Outros templates disponíveis

Você pode criar templates personalizados para:

- **Confirm signup** - Email de verificação (este arquivo)
- **Invite user** - Convite de usuário
- **Magic link** - Link mágico para login
- **Change email address** - Mudança de email
- **Reset password** - Redefinição de senha

## Design

O template usa:
- Cores da marca Lidzy (verde #10b981)
- Design responsivo
- Compatível com todos os clientes de email
- Acessível e profissional
