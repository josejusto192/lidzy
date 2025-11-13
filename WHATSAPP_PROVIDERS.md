# Provedores WhatsApp - Lidzy

O Lidzy suporta dois provedores de WhatsApp: **Z-API** (externo, pago) e **Baileys** (auto-hospedado, gratuito).

## 🔄 Comparação de Provedores

| Característica | Z-API | Baileys |
|----------------|-------|---------|
| **Custo** | Pago (mensalidade) | Gratuito |
| **Infraestrutura** | Gerenciada por terceiros | Servidor próprio necessário |
| **Estabilidade** | Alta | Média (pode quebrar com updates do WhatsApp) |
| **Suporte** | Suporte oficial 24/7 | Comunidade open-source |
| **Limitações** | Pode ter limites de API | Sem limitações |
| **Privacidade** | Dados passam por servidor externo | Dados 100% privados |
| **Setup** | Muito fácil (só precisa de API key) | Complexo (requer servidor e configuração) |
| **Recomendado para** | Empresas que querem estabilidade | Desenvolvedores e entusiastas |

## 🚀 Quando Usar Cada Provider

### Use Z-API quando:

✅ Você quer começar rapidamente sem setup complexo
✅ Prefere estabilidade e suporte oficial
✅ Não tem infraestrutura própria
✅ Custos mensais não são problema
✅ Precisa de alta disponibilidade garantida

### Use Baileys quando:

✅ Quer economizar em custos mensais
✅ Tem servidor próprio (VPS, cloud, etc)
✅ Valoriza privacidade total dos dados
✅ Não se importa com manutenção ocasional
✅ Quer controle total da infraestrutura

## 📖 Guias de Configuração

### Opção 1: Z-API (Recomendado para iniciantes)

#### 1. Criar conta na Z-API

1. Acesse [https://www.z-api.io](https://www.z-api.io)
2. Crie uma conta
3. Contrate um plano (a partir de R$ 49/mês)

#### 2. Obter credenciais

1. No painel, vá em "Instâncias"
2. Clique em "Criar Nova Instância"
3. Anote o **Instance ID** e o **Token**

#### 3. Configurar no Lidzy

1. Acesse **Instâncias WhatsApp** no menu
2. Clique em **Nova Instância**
3. Selecione **Z-API (Externo)**
4. Preencha:
   - Nome da instância
   - Instance ID
   - API Key (Token)
5. Clique em **Criar Instância**
6. Escaneie o QR Code com o WhatsApp

✅ **Pronto!** Sua instância está conectada.

---

### Opção 2: Baileys (Para usuários avançados)

#### 1. Requisitos

- Servidor com Node.js 18+ (VPS, AWS, Digital Ocean, etc)
- PM2 para gerenciamento de processos
- IP público ou túnel (ngrok) para webhooks

#### 2. Deploy do Serviço Baileys

**Opção A: VPS/Cloud Server**

```bash
# SSH no servidor
ssh root@your-server-ip

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Clonar repositório
cd /var/www
git clone https://github.com/your-repo/lidzy.git
cd lidzy/baileys-service

# Instalar dependências
npm install --production

# Configurar variáveis
cp .env.example .env
nano .env

# Iniciar serviço
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Opção B: Localhost (Desenvolvimento)**

```bash
cd baileys-service
npm install
npm run dev
```

#### 3. Configurar variáveis de ambiente

No arquivo principal do Lidzy (`.env`):

```env
# URL do serviço Baileys
BAILEYS_SERVICE_URL=http://localhost:3001

# Se estiver em servidor remoto:
# BAILEYS_SERVICE_URL=http://your-server-ip:3001
```

#### 4. Criar instância no Lidzy

1. Acesse **Instâncias WhatsApp** no menu
2. Clique em **Nova Instância**
3. Selecione **Baileys (Auto-hospedado)**
4. Preencha o nome da instância
5. Clique em **Criar Instância**
6. Escaneie o QR Code com o WhatsApp

✅ **Pronto!** Sua instância Baileys está conectada.

## 🔧 Configuração Avançada

### Nginx (Para Baileys em produção)

```nginx
server {
    listen 80;
    server_name baileys.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Depois configure SSL:
```bash
sudo certbot --nginx -d baileys.your-domain.com
```

### Docker (Para Baileys)

```bash
cd baileys-service
docker build -t lidzy-baileys .
docker run -d -p 3001:3001 --name baileys --restart unless-stopped lidzy-baileys
```

## 🔄 Migração entre Provedores

### De Z-API para Baileys

1. Crie nova instância Baileys
2. Migre os contatos manualmente (CSV export/import)
3. Atualize automações para usar a nova instância
4. Desative a instância Z-API antiga
5. Cancele assinatura Z-API

### De Baileys para Z-API

1. Crie nova instância Z-API
2. Migre os contatos
3. Atualize automações
4. Pare o serviço Baileys

## ⚡ Performance

### Z-API
- ✅ Latência baixa (~100-200ms)
- ✅ 99.9% de uptime
- ✅ Suporta milhares de mensagens/dia
- ⚠️ Sujeito a rate limits do plano

### Baileys
- ✅ Latência muito baixa (~50ms)
- ⚠️ Depende da sua infraestrutura
- ✅ Sem limites (só hardware)
- ⚠️ Pode ter instabilidade em updates do WhatsApp

## 🔐 Segurança

### Z-API
- ✅ Infraestrutura gerenciada e segura
- ✅ Backups automáticos
- ⚠️ Dados trafegam por servidores de terceiros

### Baileys
- ✅ Dados 100% no seu servidor
- ⚠️ Você é responsável pela segurança
- ⚠️ Você deve fazer backups

**Recomendações para Baileys:**
- Use HTTPS
- Configure firewall
- Faça backups da pasta `auth/`
- Monitore logs
- Use autenticação nas APIs

## 📊 Custos

### Z-API
- **Básico:** R$ 49/mês (1 instância)
- **Pro:** R$ 99/mês (3 instâncias)
- **Enterprise:** R$ 199/mês (ilimitado)

### Baileys
- **VPS (Digital Ocean):** ~R$ 30/mês (servidor básico)
- **VPS (AWS Lightsail):** ~R$ 20/mês
- **Localhost:** Grátis (mas não recomendado para produção)

💡 **Economia:** Com Baileys você economiza ~R$ 19/mês por instância

## 🆘 Suporte

### Z-API
- Suporte oficial via ticket
- Chat 24/7
- Documentação completa

### Baileys
- GitHub Issues: [baileys](https://github.com/WhiskeySockets/Baileys)
- Comunidade Discord
- Stack Overflow

## 🎯 Recomendação Final

**Para quem está começando:** Use Z-API
**Para quem tem experiência técnica:** Use Baileys
**Para empresas:** Use Z-API
**Para desenvolvedores:** Use Baileys

Você pode usar ambos simultaneamente! Algumas instâncias em Z-API e outras em Baileys.

## 📚 Mais Informações

- [Documentação Z-API](https://developer.z-api.io/)
- [Documentação Baileys](https://github.com/WhiskeySockets/Baileys)
- [README do Baileys Service](./baileys-service/README.md)
