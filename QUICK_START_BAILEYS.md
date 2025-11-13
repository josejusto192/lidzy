# 🚀 Quick Start: Baileys WhatsApp

Guia rápido para começar a usar Baileys em 5 minutos.

## Opção 1: Localhost (Desenvolvimento/Testes)

### 1. Aplicar migração do banco de dados

```bash
# No Supabase, execute o script:
./scripts/034-add-baileys-support.sql
```

### 2. Configurar variável de ambiente

Adicione no arquivo `.env`:

```env
BAILEYS_SERVICE_URL=http://localhost:3001
```

### 3. Iniciar serviço Baileys

```bash
cd baileys-service
npm install
npm run dev
```

Você verá:
```
🚀 Baileys service running on port 3001
📱 WhatsApp instances ready to connect
```

### 4. Criar instância no Lidzy

1. Acesse http://localhost:3000/instancias
2. Clique em "Nova Instância"
3. Escolha **Baileys (Auto-hospedado)**
4. Digite um nome (ex: "WhatsApp Teste")
5. Clique em "Criar"
6. Escaneie o QR Code com o WhatsApp

✅ **Pronto!** Sua instância está conectada.

## Opção 2: Produção (VPS/Cloud)

### 1. SSH no servidor

```bash
ssh root@your-server-ip
```

### 2. Instalar dependências

```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
sudo npm install -g pm2
```

### 3. Deploy

```bash
# Clonar projeto
cd /var/www
git clone YOUR_REPO_URL
cd lidzy/baileys-service

# Instalar
npm install --production

# Configurar
cp .env.example .env
nano .env  # Edite PORT e ALLOWED_ORIGINS

# Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Copie e execute o comando mostrado
```

### 4. Configurar firewall

```bash
# Permitir porta 3001
sudo ufw allow 3001/tcp
sudo ufw reload
```

### 5. Configurar no Lidzy

No arquivo `.env` do projeto principal:

```env
BAILEYS_SERVICE_URL=http://your-server-ip:3001
```

### 6. (Opcional) Configurar Nginx + SSL

```bash
# Criar configuração Nginx
sudo nano /etc/nginx/sites-available/baileys

# Adicione:
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

# Ativar
sudo ln -s /etc/nginx/sites-available/baileys /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL
sudo certbot --nginx -d baileys.your-domain.com
```

Atualize `.env`:
```env
BAILEYS_SERVICE_URL=https://baileys.your-domain.com
```

## 🔍 Verificar se está funcionando

### Teste o serviço Baileys

```bash
curl http://localhost:3001/health
# Deve retornar: {"status":"ok","timestamp":"..."}
```

### Ver logs

```bash
# PM2
pm2 logs lidzy-baileys

# Dev
# Os logs aparecem automaticamente no terminal
```

### Listar instâncias

```bash
curl http://localhost:3001/instances
```

## 🐛 Troubleshooting

### Erro: "Cannot find module '@whiskeysockets/baileys'"

```bash
cd baileys-service
npm install
```

### Erro: "Port 3001 already in use"

```bash
# Encontrar processo
lsof -i :3001

# Matar processo
kill -9 <PID>

# Ou mudar porta no .env
PORT=3002
```

### Erro: "ECONNREFUSED localhost:3001"

1. Verifique se o serviço está rodando: `pm2 list`
2. Se não estiver: `cd baileys-service && pm2 start ecosystem.config.js`
3. Verifique logs: `pm2 logs lidzy-baileys`

### QR Code não aparece

1. Verifique logs do serviço Baileys
2. Delete a pasta `auth/INSTANCE_ID` e tente novamente
3. Verifique se o webhook está configurado corretamente

## 📱 Enviar mensagem de teste

```bash
# 1. Obter ID da instância
curl http://localhost:3001/instances

# 2. Enviar mensagem
curl -X POST http://localhost:3001/instances/INSTANCE_ID/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "type": "text",
    "message": {
      "text": "Olá do Baileys!"
    }
  }'
```

## 🔄 Atualizar Baileys

```bash
cd baileys-service
npm update @whiskeysockets/baileys
pm2 restart lidzy-baileys
```

## 📊 Monitorar

```bash
# Ver status
pm2 status

# Ver uso de recursos
pm2 monit

# Ver logs em tempo real
pm2 logs lidzy-baileys --lines 100
```

## 💡 Dicas

1. **Backups:** Faça backup da pasta `auth/` regularmente
2. **Múltiplas instâncias:** Você pode ter várias instâncias simultâneas
3. **Firewall:** Em produção, restrinja acesso à porta 3001 apenas do seu servidor principal
4. **Monitoramento:** Configure alertas no PM2 para downtime
5. **Updates:** Acompanhe o repositório do Baileys para updates importantes

## 🆘 Precisa de ajuda?

- 📖 [Documentação Completa](./WHATSAPP_PROVIDERS.md)
- 📚 [README do Baileys Service](./baileys-service/README.md)
- 🐛 [GitHub Issues](https://github.com/your-repo/issues)
