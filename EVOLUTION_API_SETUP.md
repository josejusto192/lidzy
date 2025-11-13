# 🚀 Evolution API - Guia de Configuração

Este guia explica como configurar e usar Evolution API no Lidzy.

## 📋 O que é Evolution API?

Evolution API é uma **API REST completa para WhatsApp** que usa Baileys internamente, oferecendo:

- ✅ **Gratuito e Open-Source**
- ✅ **API REST documentada** (mais fácil que Baileys puro)
- ✅ **Multi-instância** (várias contas WhatsApp simultâneas)
- ✅ **Webhooks** para receber mensagens em tempo real
- ✅ **QR Code** gerado automaticamente
- ✅ **Conexão direta** com WhatsApp (sem intermediários)

## 🎯 Por que Evolution API ao invés de Baileys direto?

| Característica | Baileys Puro | Evolution API |
|----------------|--------------|---------------|
| **Complexidade** | Alta (WebSocket, gestão de sessões) | Baixa (REST API simples) |
| **Documentação** | Moderada | Excelente (Swagger) |
| **Multi-instância** | Precisa implementar | Nativo |
| **Webhooks** | Precisa implementar | Nativo |
| **Manutenção** | Você cuida de tudo | Projeto mantido pela comunidade |
| **Deploy** | Microserviço customizado | Container Docker pronto |

## 🏗️ Arquitetura

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Lidzy     │ ──REST──▶│  Evolution API   │ ──────▶ │  WhatsApp   │
│  (Next.js)  │         │  (em Coolify)    │         │   Servers   │
└─────────────┘         └──────────────────┘         └─────────────┘
      │                         │
      │                         │
      └──────── Webhook ────────┘
         (recebe mensagens)
```

## 📦 Pré-requisitos

Você já tem Evolution API rodando no Coolify! 🎉

Certifique-se de ter:
1. **URL da Evolution API** (ex: `https://evolution.seudominio.com`)
2. **API Key** (configurada no Coolify ao fazer deploy)

## ⚙️ Configuração no Lidzy

### 1. Variáveis de Ambiente

Não é necessário adicionar variáveis de ambiente no Vercel. A configuração é feita por instância na interface do Lidzy.

### 2. Aplicar Migration

Execute esta migration no Supabase SQL Editor:

```sql
-- Copie todo o conteúdo de: scripts/035-add-evolution-support.sql
```

A migration adiciona suporte para `provider = 'evolution'` na tabela `instancias`.

### 3. Criar Instância via Interface

1. Acesse: **https://seu-app.vercel.app/instancias**
2. Clique em **"+ Nova Instância"**
3. Escolha **"Evolution API (Recomendado)"**
4. Preencha:
   - **Nome**: Ex: "WhatsApp Vendas"
   - **URL da API**: A URL do Evolution no Coolify (ex: `https://evolution.seudominio.com`)
   - **API Key**: A chave que você configurou no Evolution
5. Clique em **"Criar Instância"**
6. **Escaneie o QR Code** que aparecerá
7. Aguarde a conexão ✅

## 🔌 Endpoints Evolution API Usados

O Lidzy usa estes endpoints da Evolution API:

### Criar Instância
```bash
POST /instance/create
{
  "instanceName": "lidzy_user123_1234567890",
  "qrcode": true,
  "integration": "WHATSAPP-BAILEYS"
}
```

### Conectar e Obter QR Code
```bash
GET /instance/connect/{instanceName}
```

### Enviar Mensagem
```bash
POST /message/sendText/{instanceName}
{
  "number": "5511999999999",
  "text": "Olá! Esta é uma mensagem do Lidzy"
}
```

### Enviar Mídia
```bash
POST /message/sendMedia/{instanceName}
{
  "number": "5511999999999",
  "mediatype": "image",
  "media": "https://example.com/imagem.jpg",
  "caption": "Legenda da imagem"
}
```

### Status da Conexão
```bash
GET /instance/connectionState/{instanceName}
```

## 🔔 Configurar Webhooks

Os webhooks permitem que o Lidzy **receba mensagens** em tempo real.

### Configuração Automática

O Lidzy configura automaticamente o webhook ao criar a instância:
```
https://seu-app.vercel.app/api/whatsapp/webhook
```

### Configuração Manual (se necessário)

Se precisar configurar manualmente no Evolution API:

```bash
POST /webhook/set/{instanceName}
{
  "url": "https://seu-app.vercel.app/api/whatsapp/webhook",
  "webhook_by_events": false,
  "webhook_base64": false,
  "events": [
    "MESSAGES_UPSERT",
    "SEND_MESSAGE",
    "CONNECTION_UPDATE"
  ]
}
```

## 🧪 Testar Conexão

### Via cURL

```bash
# 1. Verificar saúde da API
curl https://evolution.seudominio.com/health

# 2. Criar instância de teste
curl -X POST https://evolution.seudominio.com/instance/create \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "teste_lidzy",
    "qrcode": true
  }'

# 3. Obter QR Code
curl https://evolution.seudominio.com/instance/connect/teste_lidzy \
  -H "apikey: SUA_API_KEY"
```

### Via Interface do Lidzy

1. Vá em **Instâncias**
2. Crie nova instância Evolution API
3. Escaneie o QR Code com WhatsApp
4. Aguarde status **"Conectado"**
5. Envie mensagem de teste

## 📊 Monitoramento

### Ver Logs da Evolution API (Coolify)

```bash
# No Coolify, acesse o terminal do container Evolution API e execute:
docker logs evolution-api --tail 100 -f
```

### Ver Status de Todas as Instâncias

```bash
curl https://evolution.seudominio.com/instance/fetchInstances \
  -H "apikey: SUA_API_KEY"
```

## 🔧 Troubleshooting

### Erro: "Failed to connect Evolution instance"

**Causa**: Evolution API não está acessível

**Solução**:
```bash
# Verificar se Evolution está online
curl https://evolution.seudominio.com/health

# Deve retornar: {"status": "ok"}
```

### Erro: "Unauthorized" ou "Invalid API Key"

**Causa**: API Key incorreta

**Solução**:
- Verifique a API Key no Coolify (variável `AUTHENTICATION_API_KEY`)
- Certifique-se de estar usando a mesma chave no Lidzy

### QR Code não aparece

**Causa**: Instância já está conectada ou sessão anterior existe

**Solução**:
```bash
# Deletar instância e criar novamente
curl -X DELETE https://evolution.seudominio.com/instance/delete/INSTANCE_NAME \
  -H "apikey: SUA_API_KEY"
```

### Mensagens não estão sendo recebidas

**Causa**: Webhook não configurado

**Solução**:
```bash
# Verificar webhook
curl https://evolution.seudominio.com/webhook/find/INSTANCE_NAME \
  -H "apikey: SUA_API_KEY"

# Se não retornar nada, configurar:
curl -X POST https://evolution.seudominio.com/webhook/set/INSTANCE_NAME \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://seu-app.vercel.app/api/whatsapp/webhook",
    "events": ["MESSAGES_UPSERT"]
  }'
```

## 🚀 Deploy da Evolution API no Coolify

Você já tem Evolution API no Coolify, mas caso precise fazer deploy novamente:

### 1. Criar Novo Resource no Coolify

- **Type**: Docker Compose
- **Repository**: `https://github.com/EvolutionAPI/evolution-api`
- **Branch**: `main`

### 2. Variáveis de Ambiente

```env
# Autenticação
AUTHENTICATION_API_KEY=sua-chave-super-secreta-aqui

# Database (PostgreSQL ou MongoDB - Evolution suporta ambos)
DATABASE_CONNECTION_URI=postgresql://user:pass@host:5432/evolution
# ou
DATABASE_CONNECTION_URI=mongodb://user:pass@host:27017/evolution

# URLs
SERVER_URL=https://evolution.seudominio.com
WEBHOOK_GLOBAL_URL=https://seu-app.vercel.app/api/whatsapp/webhook

# Configurações
LOG_LEVEL=ERROR
LOG_COLOR=false
DEL_INSTANCE=false
```

### 3. Configurar Domínio

- Adicione domínio no Coolify: `evolution.seudominio.com`
- SSL é automático via Let's Encrypt

### 4. Deploy

Clique em **Deploy** e aguarde. A Evolution API estará disponível em poucos minutos.

## 📚 Documentação Oficial

- **Evolution API**: https://doc.evolution-api.com/
- **Swagger/OpenAPI**: `https://evolution.seudominio.com/api-docs`
- **GitHub**: https://github.com/EvolutionAPI/evolution-api
- **Baileys** (usado internamente): https://github.com/WhiskeySockets/Baileys

## 💰 Custo

| Item | Custo |
|------|-------|
| **Evolution API** | R$ 0 (open-source) |
| **VPS Coolify** | ~R$ 23/mês (Hetzner CX21) |
| **Total** | **~R$ 23/mês** |

Comparado a:
- **Z-API**: R$ 49+/mês por instância
- **Outras APIs**: R$ 50-150/mês

## ✅ Checklist de Setup

- [ ] Evolution API rodando no Coolify
- [ ] URL e API Key anotadas
- [ ] Migration aplicada no Supabase (`035-add-evolution-support.sql`)
- [ ] Instância criada via interface do Lidzy
- [ ] QR Code escaneado
- [ ] Status "Conectado" verificado
- [ ] Mensagem de teste enviada com sucesso
- [ ] Webhook recebendo mensagens

## 🎉 Pronto!

Agora você tem WhatsApp integrado ao Lidzy usando Evolution API, de forma:
- ✅ **Gratuita** (exceto custo do VPS)
- ✅ **Escalável** (múltiplas instâncias)
- ✅ **Confiável** (conexão direta com WhatsApp)
- ✅ **Fácil** (API REST simples)

---

**Dúvidas?** Consulte a documentação oficial da Evolution API ou abra uma issue no GitHub.
