# Guia de Configuração - Integração Asaas

Este guia contém todas as instruções para configurar a integração de pagamentos com o Asaas.

## 📋 Pré-requisitos

1. Conta no Asaas (https://asaas.com)
2. API Key do Asaas
3. Conta no Resend para envio de emails (https://resend.com)

---

## 🔧 Configuração Inicial

### 1. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Configure as seguintes variáveis:

```bash
# Asaas
ASAAS_API_KEY=sua-api-key-do-asaas
ASAAS_API_URL=https://sandbox.asaas.com/api/v3  # Sandbox para testes
# ASAAS_API_URL=https://api.asaas.com/v3  # Production

# Token de segurança do webhook (gere uma string aleatória segura)
ASAAS_WEBHOOK_TOKEN=token-secreto-aleatorio-minimo-32-caracteres

# Email (Resend)
RESEND_API_KEY=re_sua_api_key_do_resend
FROM_EMAIL=noreply@seudominio.com.br
```

**⚠️ IMPORTANTE:** O `ASAAS_WEBHOOK_TOKEN` deve ser uma string aleatória e segura. Você pode gerar uma usando:

```bash
openssl rand -hex 32
```

---

## 🔐 Configurar Webhooks no Asaas

### 1. Acesse o Dashboard do Asaas

1. Entre em https://asaas.com
2. Vá em **Configurações** → **Webhooks**

### 2. Cadastre o Webhook URL

Configure o webhook apontando para:

```
https://seudominio.com.br/api/asaas/webhook
```

### 3. Configure os Eventos

Marque os seguintes eventos para receber notificações:

- ✅ `PAYMENT_CONFIRMED` - Pagamento confirmado
- ✅ `PAYMENT_RECEIVED` - Pagamento recebido
- ✅ `PAYMENT_OVERDUE` - Pagamento atrasado
- ✅ `PAYMENT_DELETED` - Pagamento cancelado
- ✅ `PAYMENT_REFUNDED` - Pagamento reembolsado
- ✅ `SUBSCRIPTION_CREATED` - Assinatura criada
- ✅ `SUBSCRIPTION_UPDATED` - Assinatura atualizada
- ✅ `SUBSCRIPTION_DELETED` - Assinatura cancelada
- ✅ `SUBSCRIPTION_EXPIRED` - Assinatura expirada

### 4. Configure Autenticação

No campo **Token de Autenticação** ou **Header personalizado**, adicione:

- **Header:** `asaas-access-token`
- **Valor:** O mesmo valor que você colocou em `ASAAS_WEBHOOK_TOKEN`

---

## 📧 Configurar Emails (Resend)

### 1. Criar Conta no Resend

1. Acesse https://resend.com
2. Crie uma conta gratuita (100 emails/dia grátis)

### 2. Obter API Key

1. No dashboard, vá em **API Keys**
2. Clique em **Create API Key**
3. Copie a key e adicione em `RESEND_API_KEY`

### 3. Configurar Domínio (Opcional mas Recomendado)

Para evitar que emails caiam no spam:

1. Vá em **Domains** no Resend
2. Adicione seu domínio
3. Configure os registros DNS (SPF, DKIM, DMARC)
4. Após verificado, use `noreply@seudominio.com` em `FROM_EMAIL`

### 4. Instalar Dependência

```bash
pnpm add resend
```

---

## 🧪 Testar a Integração

### 1. Webhook Local (Development)

Para testar webhooks localmente, use o ngrok:

```bash
# Instalar ngrok
npm install -g ngrok

# Rodar o projeto
pnpm dev

# Em outro terminal, expor porta 3000
ngrok http 3000
```

Use a URL do ngrok (ex: `https://abc123.ngrok.io/api/asaas/webhook`) no dashboard do Asaas.

### 2. Testar Criação de Assinatura

```bash
# Criar cliente
POST /api/asaas/customer
{
  "name": "João da Silva",
  "cpfCnpj": "12345678900",
  "email": "joao@example.com",
  "phone": "11999999999"
}

# Criar assinatura (BOLETO)
POST /api/asaas/subscription
{
  "planoId": "uuid-do-plano",
  "periodo": "monthly",
  "customerId": "cus_xxxxx",
  "billingType": "BOLETO"
}

# Criar assinatura (PIX)
POST /api/asaas/subscription
{
  "planoId": "uuid-do-plano",
  "periodo": "monthly",
  "customerId": "cus_xxxxx",
  "billingType": "PIX"
}

# Criar assinatura (Cartão)
POST /api/asaas/subscription
{
  "planoId": "uuid-do-plano",
  "periodo": "monthly",
  "customerId": "cus_xxxxx",
  "billingType": "CREDIT_CARD",
  "creditCard": {
    "holderName": "João da Silva",
    "number": "5162306219378829",
    "expiryMonth": "12",
    "expiryYear": "2028",
    "ccv": "318"
  },
  "creditCardHolderInfo": {
    "name": "João da Silva",
    "email": "joao@example.com",
    "cpfCnpj": "12345678900",
    "postalCode": "01310-100",
    "addressNumber": "123"
  }
}
```

### 3. Testar Webhooks

No dashboard do Asaas, você pode enviar webhooks de teste para validar sua integração.

---

## 🎨 Funcionalidades Implementadas

### ✅ Métodos de Pagamento

- **Boleto Bancário** (`BOLETO`)
- **PIX** (`PIX`)
- **Cartão de Crédito** (`CREDIT_CARD`)

### ✅ Endpoints de API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/asaas/customer` | POST | Criar cliente no Asaas |
| `/api/asaas/subscription` | POST | Criar assinatura |
| `/api/asaas/subscription/cancel` | POST | Cancelar assinatura |
| `/api/asaas/webhook` | POST | Receber webhooks do Asaas |
| `/api/payments/history` | GET | Histórico de pagamentos |
| `/api/payments/download` | GET | Download de boletos/invoices |

### ✅ Eventos de Webhook Tratados

- `PAYMENT_CONFIRMED` - Adiciona créditos, envia email ✉️
- `PAYMENT_RECEIVED` - Adiciona créditos, envia email ✉️
- `PAYMENT_OVERDUE` - Marca assinatura como atrasada, envia email ⚠️
- `PAYMENT_DELETED` - Cancela assinatura
- `PAYMENT_REFUNDED` - Remove créditos, envia email 💰
- `SUBSCRIPTION_CREATED` - Ativa assinatura
- `SUBSCRIPTION_UPDATED` - Atualiza data de cobrança
- `SUBSCRIPTION_DELETED` - Cancela assinatura, envia email
- `SUBSCRIPTION_EXPIRED` - Marca como expirada

### ✅ Segurança

- ✅ Autenticação de webhook com token
- ✅ Idempotência (evita processar pagamento 2x)
- ✅ Validação de dados de entrada
- ✅ Verificação de propriedade (user só acessa seus dados)

### ✅ Emails Automáticos

- 🎉 Pagamento confirmado
- ⚠️ Pagamento atrasado
- ❌ Assinatura cancelada
- 💰 Reembolso processado

### ✅ Interface

- Página de histórico de pagamentos (`/pagamentos`)
- Download de boletos e invoices
- Visualização de assinaturas
- Histórico de créditos

---

## 🚀 Deploy em Produção

### Checklist Pré-Deploy

- [ ] Alterar `ASAAS_API_URL` para produção (`https://api.asaas.com/v3`)
- [ ] Gerar novo `ASAAS_WEBHOOK_TOKEN` seguro
- [ ] Configurar domínio verificado no Resend
- [ ] Atualizar webhook URL no Asaas com domínio de produção
- [ ] Testar webhook em produção
- [ ] Configurar monitoramento de erros (Sentry)
- [ ] Testar fluxo completo de pagamento

### Configurar Webhook em Produção

1. Acesse dashboard do Asaas (produção)
2. Configure webhook: `https://seudominio.com.br/api/asaas/webhook`
3. Adicione o token de autenticação
4. Marque todos os eventos necessários
5. Salve e teste

---

## 🐛 Troubleshooting

### Webhook não está sendo chamado

1. Verifique se a URL está correta
2. Verifique se o endpoint está acessível publicamente
3. Veja os logs no dashboard do Asaas
4. Teste com ngrok localmente

### Erro 401 no webhook

- Verifique se o `ASAAS_WEBHOOK_TOKEN` está correto
- Verifique se está enviando o header `asaas-access-token`

### Emails não estão sendo enviados

1. Verifique se `RESEND_API_KEY` está configurado
2. Verifique logs no console
3. Confira dashboard do Resend para ver erros
4. Verifique se o domínio está verificado (se aplicável)

### Pagamento não adiciona créditos

1. Verifique logs do webhook
2. Confirme que o evento `PAYMENT_CONFIRMED` está chegando
3. Verifique se a assinatura existe no banco de dados
4. Confira se o `asaas_subscription_id` está correto

---

## 📚 Documentação Adicional

- [Documentação Asaas API](https://docs.asaas.com)
- [Documentação Resend](https://resend.com/docs)
- [Webhooks Asaas](https://docs.asaas.com/reference/webhooks)

---

## 💡 Próximos Passos (Opcional)

- [ ] Adicionar retry automático para webhooks falhados
- [ ] Implementar grace period (período de tolerância)
- [ ] Adicionar cupons de desconto
- [ ] Implementar upgrade/downgrade de planos
- [ ] Adicionar período de trial
- [ ] Dashboard de métricas de pagamentos
- [ ] Notificações push
- [ ] Sistema de dunning (cobranças recorrentes)

---

**Dúvidas?** Entre em contato com o suporte.
