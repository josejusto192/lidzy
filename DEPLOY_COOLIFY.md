# 🚀 Deploy Baileys no Coolify

Guia completo para fazer deploy do serviço Baileys no Coolify (VPS).

## 📋 Pré-requisitos

1. **VPS com Coolify instalado**
   - Mínimo: 1 CPU, 2GB RAM
   - Recomendado: 2 CPU, 4GB RAM
   - Sistema: Ubuntu 20.04+

2. **Domínio configurado** (opcional, mas recomendado)
   - Ex: `baileys.seu-dominio.com`
   - Apontando para o IP do VPS

3. **Repositório Git**
   - Seu código precisa estar no GitHub/GitLab

## 🎯 Passo a Passo no Coolify

### 1. Adicionar Novo Resource

1. Entre no **Coolify Dashboard**
2. Clique em **"+ Add Resource"**
3. Escolha **"Docker Compose"** ou **"Dockerfile"**

### 2. Configurar o Projeto

#### Opção A: Docker Compose (Recomendado)

**Configurações:**
```
Name: lidzy-baileys
Git Repository: https://github.com/seu-usuario/lidzy
Branch: main ou sua branch
Build Path: /baileys-service
Docker Compose File: docker-compose.yml
```

#### Opção B: Dockerfile

**Configurações:**
```
Name: lidzy-baileys
Git Repository: https://github.com/seu-usuario/lidzy
Branch: main
Build Path: /baileys-service
Dockerfile Path: Dockerfile
Port: 3001
```

### 3. Configurar Variáveis de Ambiente

No Coolify, vá em **"Environment Variables"** e adicione:

```env
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
ALLOWED_ORIGINS=https://seu-dominio.com,https://lidzy.vercel.app
```

### 4. Configurar Volume Persistente (IMPORTANTE!)

No Coolify, vá em **"Volumes"** e adicione:

```
/app/auth -> Persistent Volume
/app/logs -> Persistent Volume
```

Isso garante que as sessões do WhatsApp não sejam perdidas quando o container reiniciar.

### 5. Configurar Domínio e SSL

1. Vá em **"Domains"**
2. Adicione: `baileys.seu-dominio.com`
3. Coolify configura SSL automaticamente (Let's Encrypt)

### 6. Deploy!

1. Clique em **"Deploy"**
2. Aguarde o build (2-3 minutos)
3. Monitore os logs em tempo real

## ✅ Verificar se Funcionou

### Teste 1: Health Check

```bash
curl https://baileys.seu-dominio.com/health
```

Deve retornar:
```json
{"status":"ok","timestamp":"..."}
```

### Teste 2: Listar Instâncias

```bash
curl https://baileys.seu-dominio.com/instances
```

Deve retornar:
```json
{"instances":[]}
```

## 🔧 Configurar no Lidzy (Vercel)

Agora que o Baileys está rodando, configure no **Vercel**:

1. Vá em **Vercel Dashboard**
2. Selecione seu projeto **Lidzy**
3. Vá em **Settings → Environment Variables**
4. Adicione:

```
BAILEYS_SERVICE_URL=https://baileys.seu-dominio.com
```

5. Faça um **Redeploy**

## 🧪 Testar Integração Completa

1. Acesse seu Lidzy: `https://seu-lidzy.vercel.app/instancias`
2. Clique em **"Nova Instância"**
3. Selecione **"Baileys"**
4. Digite um nome
5. Clique em **"Criar"**
6. **Deve aparecer o QR Code!** 🎉

## 📊 Monitoramento no Coolify

### Ver Logs em Tempo Real

1. No Coolify, vá no seu projeto
2. Clique em **"Logs"**
3. Veja os logs ao vivo:

```
🚀 Baileys service running on port 3001
📱 WhatsApp instances ready to connect
```

### Verificar Status

No dashboard do Coolify, você verá:
- ✅ Status: Running
- 🔄 CPU/RAM usage
- 📈 Uptime

### Reiniciar Serviço

Se precisar reiniciar:
1. Clique em **"Restart"**
2. Ou faça um novo **Deploy**

## 🔐 Segurança

### 1. Firewall (Recomendado)

Configure no VPS para só permitir:
- Porta 80 (HTTP)
- Porta 443 (HTTPS)
- Porta 22 (SSH)

```bash
# No VPS
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

### 2. CORS (Já configurado)

O Baileys aceita requests apenas de:
- Seu domínio Lidzy
- localhost (para testes)

### 3. Rate Limiting (Opcional)

Adicione Nginx reverso proxy no Coolify para limitar requests.

## 📦 Backup das Sessões

As sessões do WhatsApp ficam em `/app/auth`. Para fazer backup:

### Via Coolify

1. Vá em **"Volumes"**
2. Clique em **"Download"** no volume `baileys_auth`
3. Salve em local seguro

### Via SSH no VPS

```bash
# Encontrar o volume
docker volume ls | grep baileys

# Backup
docker run --rm -v baileys_auth:/source -v $(pwd):/backup ubuntu tar czf /backup/baileys-backup.tar.gz -C /source .

# Restaurar
docker run --rm -v baileys_auth:/target -v $(pwd):/backup ubuntu tar xzf /backup/baileys-backup.tar.gz -C /target
```

## 🚨 Troubleshooting

### Container não inicia

**Verifique logs:**
```bash
# No Coolify, ou via SSH:
docker logs lidzy-baileys
```

**Causas comuns:**
- Porta 3001 já em uso
- Falta de memória RAM
- Volume não montado

### QR Code não aparece

**Verificar:**
1. Baileys está rodando? `curl https://baileys.seu-dominio.com/health`
2. Variável `BAILEYS_SERVICE_URL` correta no Vercel?
3. Logs do Baileys mostram erro?

### Conexão perde após um tempo

**Verificar:**
1. Volume persistente configurado?
2. Container reiniciou? (Coolify deve restart automático)
3. RAM suficiente? (mínimo 2GB)

### SSL não funciona

**Verificar:**
1. Domínio aponta para IP correto?
2. Aguardar 1-2 minutos para Let's Encrypt provisionar
3. Coolify gerencia SSL automaticamente

## 💰 Custos Estimados

### VPS Providers Compatíveis

| Provider | Plano | RAM | Preço/mês |
|----------|-------|-----|-----------|
| Digital Ocean | Basic | 2GB | $12 (~R$ 60) |
| Vultr | Cloud Compute | 2GB | $12 (~R$ 60) |
| Linode | Nanode | 2GB | $12 (~R$ 60) |
| Hetzner | CX11 | 2GB | €4 (~R$ 20) |
| Contabo | VPS S | 4GB | €5 (~R$ 25) |

**Recomendação:** Hetzner (mais barato) ou Digital Ocean (mais popular)

### Custo Total Mensal

```
VPS (Hetzner):        R$ 20
Domínio (opcional):   R$ 3
SSL (Let's Encrypt):  Grátis
Coolify:              Grátis (open-source)
─────────────────────────────
Total:                R$ 23/mês
```

**vs Z-API:** R$ 49/mês → **Economia de R$ 26/mês!**

## 🎯 Checklist Final

Antes de considerar completo:

- [ ] Baileys rodando no Coolify
- [ ] Health check responde
- [ ] SSL funcionando (https)
- [ ] Volume persistente configurado
- [ ] Variável configurada no Vercel
- [ ] QR Code aparece ao criar instância
- [ ] WhatsApp conecta com sucesso
- [ ] Mensagens chegam e são enviadas
- [ ] Backup configurado

## 📚 Recursos Adicionais

- **Coolify Docs:** https://coolify.io/docs
- **Baileys GitHub:** https://github.com/WhiskeySockets/Baileys
- **Seu README do Baileys:** `baileys-service/README.md`

## 🆘 Suporte

Se tiver problemas:

1. Verifique logs no Coolify
2. Teste o health endpoint
3. Consulte `TROUBLESHOOTING_BAILEYS.md`
4. Abra uma issue no GitHub

---

**Pronto!** Agora você tem Baileys rodando 24/7 no Coolify com custos baixíssimos! 🎉
