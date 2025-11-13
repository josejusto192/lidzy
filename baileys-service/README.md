# Baileys WhatsApp Service

Serviço auto-hospedado para gerenciar conexões WhatsApp usando Baileys.

## 🚀 Features

- ✅ Conexão direta com WhatsApp (sem APIs externas)
- ✅ Suporte a múltiplas instâncias simultâneas
- ✅ Envio de mensagens de texto, imagem, vídeo e documentos
- ✅ Webhooks para receber mensagens
- ✅ QR Code para pareamento
- ✅ Reconexão automática
- ✅ API REST simples e documentada

## 📋 Requisitos

- Node.js 18+
- NPM ou Yarn
- Servidor com IP público (para webhooks)
- PM2 (opcional, para produção)

## 🔧 Instalação

### 1. Instalar dependências

```bash
cd baileys-service
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
PORT=3001
LOG_LEVEL=info
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

### 3. Rodar em desenvolvimento

```bash
npm run dev
```

### 4. Rodar em produção com PM2

```bash
npm run pm2:start
```

Ver logs:
```bash
npm run pm2:logs
```

Parar serviço:
```bash
npm run pm2:stop
```

## 🌐 Deploy

### Deploy em VPS (Digital Ocean, Linode, etc)

1. **Fazer SSH no servidor:**
```bash
ssh root@your-server-ip
```

2. **Instalar Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Instalar PM2:**
```bash
sudo npm install -g pm2
```

4. **Clonar código:**
```bash
cd /var/www
git clone https://github.com/your-repo/lidzy.git
cd lidzy/baileys-service
```

5. **Instalar dependências:**
```bash
npm install --production
```

6. **Configurar variáveis:**
```bash
nano .env
```

7. **Iniciar com PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

8. **Configurar Nginx (opcional):**

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

### Deploy com Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "src/index.js"]
```

Build e run:
```bash
docker build -t lidzy-baileys .
docker run -d -p 3001:3001 --name baileys lidzy-baileys
```

## 📡 API Endpoints

### Criar Instância

```http
POST /instances
Content-Type: application/json

{
  "instanceId": "user-123",
  "webhookUrl": "https://your-app.com/api/whatsapp/webhook"
}
```

Resposta:
```json
{
  "instanceId": "user-123",
  "connected": false,
  "qrCode": "data:image/png;base64,..."
}
```

### Status da Instância

```http
GET /instances/{instanceId}/status
```

Resposta:
```json
{
  "instanceId": "user-123",
  "connected": true,
  "phone": "5511999999999"
}
```

### Enviar Mensagem de Texto

```http
POST /instances/{instanceId}/send
Content-Type: application/json

{
  "to": "5511999999999",
  "type": "text",
  "message": {
    "text": "Olá! Esta é uma mensagem de teste."
  }
}
```

### Enviar Imagem

```http
POST /instances/{instanceId}/send
Content-Type: application/json

{
  "to": "5511999999999",
  "type": "image",
  "message": {
    "url": "https://example.com/image.jpg",
    "caption": "Legenda da imagem"
  }
}
```

### Deletar Instância

```http
DELETE /instances/{instanceId}
```

### Listar Instâncias

```http
GET /instances
```

## 🔔 Webhooks

O serviço envia os seguintes eventos para o webhook configurado:

### Evento: QR Code

```json
{
  "event": "qr",
  "instanceId": "user-123",
  "qrCode": "data:image/png;base64,..."
}
```

### Evento: Conectado

```json
{
  "event": "connected",
  "instanceId": "user-123",
  "phone": "5511999999999"
}
```

### Evento: Mensagem Recebida

```json
{
  "event": "message",
  "instanceId": "user-123",
  "from": "5511999999999",
  "messageId": "3EB0123456789",
  "timestamp": 1699999999,
  "type": "conversation",
  "message": "Olá!",
  "pushName": "Nome do Contato"
}
```

### Evento: Desconectado

```json
{
  "event": "logout",
  "instanceId": "user-123"
}
```

## 🔒 Segurança

**IMPORTANTE:** Este serviço deve rodar em uma rede privada ou protegido por firewall.

Recomendações:

1. **Use HTTPS** - Configure SSL/TLS
2. **Firewall** - Permita acesso apenas do seu servidor principal
3. **Rate Limiting** - Implemente limite de requisições
4. **Autenticação** - Adicione tokens de autenticação nas requests

## 📊 Monitoramento

Ver logs em tempo real:
```bash
pm2 logs lidzy-baileys
```

Ver status:
```bash
pm2 status
```

Monitorar recursos:
```bash
pm2 monit
```

## 🐛 Troubleshooting

### Erro: "Instance not connected"

- Verifique se o QR Code foi escaneado
- Confirme que o WhatsApp está ativo no celular
- Tente deletar e recriar a instância

### Erro: "Port already in use"

```bash
lsof -i :3001
kill -9 <PID>
```

### QR Code não gera

- Verifique os logs: `pm2 logs`
- Delete a pasta `auth/{instanceId}` e recrie a instância
- Verifique se o Baileys está atualizado

## 📝 Licença

MIT

## 🤝 Suporte

Para problemas ou dúvidas, abra uma issue no GitHub.
