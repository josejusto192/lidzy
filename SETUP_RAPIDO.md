# 🚀 Setup Rápido - Lidzy com Evolution API

Guia para iniciantes! Configure tudo em 3 passos.

## ✅ Passo 1: Aplicar Migration do Banco

1. Abra o **Supabase** (https://supabase.com)
2. Vá no seu projeto
3. Clique em **SQL Editor** (menu lateral)
4. Copie TODO o conteúdo do arquivo: `scripts/035-add-evolution-support.sql`
5. Cole no editor e clique em **RUN**

Você verá uma mensagem de sucesso:
```
✓ Evolution API is now available as a provider option
```

## ✅ Passo 2: Instalar Dependências

Execute o comando:

```bash
npm install
```

Aguarde a instalação (pode demorar 2-3 minutos).

## ✅ Passo 3: Iniciar o Lidzy

```bash
npm run dev
```

Você verá:

```
▲ Next.js ready on http://localhost:3000
```

**Pronto! Tudo funcionando!** 🎉

## 📱 Criar sua primeira instância Evolution API

### Pré-requisito: Evolution API no Coolify

Você já deve ter Evolution API rodando no Coolify. Se não tiver, consulte: `EVOLUTION_API_SETUP.md`

Você precisará:
- **URL da Evolution API** (ex: `https://evolution.seudominio.com`)
- **API Key** (configurada no Coolify)

### Criar Instância

1. Abra: **http://localhost:3000/instancias**
2. Clique em **"+ Nova Instância"**
3. Escolha **"Evolution API (Recomendado)"** ✅
4. Preencha:
   - **Nome**: Ex: "WhatsApp Principal"
   - **URL da API**: Sua URL do Coolify
   - **API Key**: Sua chave do Evolution
5. Clique em **"Criar Instância"**
6. **Escaneie o QR Code** que aparecer
7. Aguarde status **"Conectado"**

✅ **Conectado! Agora você pode enviar mensagens!**

## 🆘 Problemas?

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

### Erro ao aplicar migration

Certifique-se de copiar **TODO** o conteúdo do arquivo `scripts/035-add-evolution-support.sql`, não apenas parte dele.

## 💡 Comandos Úteis

```bash
# Desenvolvimento local
npm run dev

# Build para produção
npm run build

# Iniciar em produção
npm start
```

## 🎓 Documentação

- **Setup completo Evolution API**: `EVOLUTION_API_SETUP.md`
- **Como funciona Evolution API**: https://doc.evolution-api.com/

## 🚀 Deploy em Produção

### Lidzy (Vercel)

1. Conecte seu repositório GitHub no Vercel
2. Deploy automático em cada push
3. **Custo**: Grátis (plano Hobby)

### Evolution API (Coolify/VPS)

Você já tem rodando! Se precisar fazer deploy novamente, consulte: `EVOLUTION_API_SETUP.md`

**Custo estimado:**
- Lidzy no Vercel: **Grátis** (plano hobby)
- Evolution API em VPS: **~R$ 23/mês** (Hetzner CX21)

**Total: ~R$ 23/mês** (vs R$ 49/mês+ com Z-API)

## 🎯 Próximos Passos

Depois de tudo funcionando:

1. ✅ **Teste enviar uma mensagem** pela UI do Lidzy
2. ✅ **Configure webhooks** para receber mensagens
3. ✅ **Crie múltiplas instâncias** (Evolution suporta multi-instância)
4. ✅ **Configure automações** de atendimento

---

Dúvidas? Consulte `EVOLUTION_API_SETUP.md` para documentação completa! 📚
