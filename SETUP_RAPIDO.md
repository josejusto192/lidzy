# 🚀 Setup Rápido - Lidzy com Baileys

Guia para iniciantes! Configure tudo em 3 passos.

## ✅ Passo 1: Configurar Variáveis

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

**IMPORTANTE:** No arquivo `.env`, adicione estas 2 linhas:

```env
BAILEYS_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_URL=http://localhost:3000
```

**Explicação simples:**
- `localhost:3001` = Onde o Baileys vai rodar
- `localhost:3000` = Onde o Lidzy vai rodar

Você **NÃO precisa** mudar nada! Esses valores já estão prontos para funcionar.

## ✅ Passo 2: Instalar Dependências

Execute apenas 2 comandos:

```bash
# Instalar dependências do Lidzy
npm install

# Instalar dependências do Baileys
npm run setup:baileys
```

Aguarde a instalação (pode demorar 2-3 minutos).

## ✅ Passo 3: Aplicar Migration do Banco

1. Abra o **Supabase** (https://supabase.com)
2. Vá no seu projeto
3. Clique em **SQL Editor** (menu lateral)
4. Copie TODO o conteúdo do arquivo: `scripts/034-add-baileys-support-v2.sql`
5. Cole no editor e clique em **RUN**

Você verá mensagens de sucesso:
```
✓ Coluna "provider" adicionada com sucesso
✓ Coluna "provider_config" adicionada com sucesso
✓ Coluna "session_data" adicionada com sucesso
✓ Coluna "webhook_url" adicionada com sucesso
```

## 🎯 Iniciar TUDO de uma vez

Agora é só rodar **1 comando**:

```bash
npm run dev:all
```

Você verá 2 serviços iniciando automaticamente:

```
[Lidzy]   ▲ Next.js ready on http://localhost:3000
[Baileys] 🚀 Baileys service running on port 3001
```

**Pronto! Tudo funcionando!** 🎉

## 📱 Criar sua primeira instância Baileys

1. Abra: **http://localhost:3000/instancias**
2. Clique em **"Nova Instância"**
3. Escolha **"Baileys (Auto-hospedado)"** ✅
4. Digite um nome (ex: "WhatsApp Principal")
5. Clique em **"Criar Instância"**
6. **Escaneie o QR Code** com seu WhatsApp

✅ **Conectado! Agora você pode enviar mensagens!**

## 🆘 Problemas?

### Erro: "Port 3001 already in use"

```bash
# Descubra qual processo está usando a porta:
lsof -i :3001

# Mate o processo:
kill -9 <PID>

# Tente novamente:
npm run dev:all
```

### Erro: "BAILEYS_SERVICE_URL is not defined"

Você esqueceu de adicionar as variáveis no `.env`. Volte ao **Passo 1**.

### Erro ao aplicar migration

Certifique-se de copiar **TODO** o conteúdo do arquivo `scripts/034-add-baileys-support-v2.sql`, não apenas parte dele.

## 💡 Comandos Úteis

```bash
# Iniciar tudo junto (Lidzy + Baileys)
npm run dev:all

# Iniciar apenas Lidzy
npm run dev

# Iniciar apenas Baileys
npm run dev:baileys

# Instalar dependências do Baileys
npm run setup:baileys
```

## 🎓 Próximos Passos

Depois de tudo funcionando:

1. **Teste enviar uma mensagem** pela UI do Lidzy
2. **Configure seus workflows** de automação
3. **Leia a documentação completa:**
   - `WHATSAPP_PROVIDERS.md` - Comparação Z-API vs Baileys
   - `QUICK_START_BAILEYS.md` - Deploy em produção
   - `baileys-service/README.md` - API do Baileys

## 🚀 Deploy em Produção (Futuro)

Quando você quiser colocar em produção:

1. **Lidzy** → Deploy no Vercel (como sempre)
2. **Baileys** → Deploy em VPS (Digital Ocean, AWS, etc)
3. **Atualizar `.env` de produção** com as URLs reais

**Custo estimado:**
- Lidzy no Vercel: **Grátis** (plano hobby)
- Baileys em VPS básico: **~R$ 20-30/mês**

**Total: ~R$ 25/mês** (vs R$ 49/mês+ com Z-API)

---

Dúvidas? Abra uma issue no GitHub ou consulte a documentação completa! 📚
