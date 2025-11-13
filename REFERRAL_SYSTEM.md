# Sistema de Indicações - Lidzy

## 📋 Visão Geral

Sistema completo de indicações (referral) que permite usuários convidarem amigos e ganharem créditos bônus automaticamente.

---

## 🎁 Recompensas

| Ação | Quem Recebe | Quantidade |
|------|-------------|------------|
| Amigo se cadastra e ativa conta | **Indicador** | **500 créditos** |
| Amigo se cadastra e ativa conta | **Indicado** | **300 créditos** |

**Total distribuído por indicação:** 800 créditos 🎉

---

## 🔄 Fluxo Completo

### 1. Indicador Compartilha

```
Usuário A acessa: /indicacoes
├─ Copia link: https://lidzy.com.br/cadastro?ref=abc123
└─ Compartilha via:
   ├─ WhatsApp
   ├─ Email
   ├─ Redes sociais
   └─ Ou convida por email diretamente
```

### 2. Amigo Se Cadastra

```
Amigo acessa: https://lidzy.com.br/cadastro?ref=abc123
├─ Sistema detecta código "abc123" automaticamente
├─ Valida código em tempo real
├─ Mostra: "Indicado por João • Você ganhará 300 créditos!"
└─ Completa cadastro normalmente
```

### 3. Sistema Vincula

```sql
-- Registro criado na tabela referrals
INSERT INTO referrals (
  referrer_id: 'id-do-joao',
  referred_id: 'id-do-amigo',
  codigo_referencia: 'abc123',
  status: 'completed'
)
```

### 4. Amigo Ativa Conta

Quando o amigo **compra créditos** ou **assina um plano**:

```sql
-- Trigger automático dispara: trigger_referral_bonus

-- 1. Atualiza referral
UPDATE referrals SET
  status = 'rewarded',
  creditos_bonus = 500

-- 2. Adiciona 500 ao indicador
UPDATE usuarios SET
  creditos_bonus = creditos_bonus + 500
WHERE id = 'id-do-joao'

-- 3. Adiciona 300 ao indicado
UPDATE usuarios SET
  creditos_bonus = creditos_bonus + 300
WHERE id = 'id-do-amigo'
```

---

## 📊 Estados do Sistema

| Status | Descrição |
|--------|-----------|
| `pending` | Convite enviado, amigo não se cadastrou |
| `completed` | Amigo se cadastrou mas não ativou conta |
| `rewarded` | Bônus já aplicado para ambos ✅ |

---

## 🎨 Componentes Criados

### 1. Página de Indicações

**Path:** `/app/indicacoes/page.tsx`

**Features:**
- ✅ Dashboard com estatísticas
- ✅ Cards de métricas (créditos ganhos, amigos ativos, convites pendentes)
- ✅ 3 Tabs: Compartilhar, Minhas Indicações, Como Funciona
- ✅ Link de indicação com botão copiar
- ✅ Código de referência com botão copiar
- ✅ Compartilhamento via WhatsApp e Email
- ✅ Convidar por email diretamente
- ✅ Lista de todas as indicações com status
- ✅ Tutorial completo "Como Funciona"

### 2. ReferralInput Component

**Path:** `/components/referral-input.tsx`

**Features:**
- ✅ Detecta código na URL (`?ref=abc123`)
- ✅ Validação em tempo real (debounced)
- ✅ Mostra nome do indicador
- ✅ Feedback visual (✓ válido, ✗ inválido)
- ✅ Loading state durante validação

**Uso:**
```tsx
import { ReferralInput } from "@/components/referral-input"

const [refCode, setRefCode] = useState("")

<ReferralInput
  value={refCode}
  onChange={setRefCode}
/>
```

### 3. ReferralBanner Component

**Path:** `/components/referral-banner.tsx`

**Features:**
- ✅ Banner promocional no dashboard
- ✅ Aparece apenas se usuário não tem indicações
- ✅ Pode ser dispensado (salvo no localStorage)
- ✅ Link direto para `/indicacoes`

**Uso:**
```tsx
import { ReferralBanner } from "@/components/referral-banner"

<ReferralBanner />
```

---

## 🔌 API Endpoints

### 1. Listar Indicações

```http
GET /api/referrals
```

**Resposta:**
```json
{
  "codigo_referencia": "abc123",
  "stats": {
    "total": 5,
    "completed": 3,
    "pending": 2,
    "totalCreditsEarned": 1500
  },
  "referrals": [
    {
      "id": "uuid",
      "referred_email": "amigo@email.com",
      "status": "rewarded",
      "creditos_bonus": 500,
      "created_at": "2025-11-13",
      "completed_at": "2025-11-14",
      "usuarios": {
        "nome": "Maria Silva",
        "email": "amigo@email.com"
      }
    }
  ]
}
```

### 2. Convidar por Email

```http
POST /api/referrals
Content-Type: application/json

{
  "email": "amigo@exemplo.com"
}
```

**Resposta:**
```json
{
  "referral": { ... },
  "message": "Convite enviado com sucesso!"
}
```

### 3. Validar Código

```http
GET /api/referrals/validate?codigo=abc123
```

**Resposta (válido):**
```json
{
  "valid": true,
  "referrer": {
    "nome": "João Silva"
  }
}
```

**Resposta (inválido):**
```json
{
  "valid": false,
  "error": "Código de indicação inválido"
}
```

### 4. Aplicar Referência (Após Signup)

```http
POST /api/referrals/apply
Content-Type: application/json
Authorization: Bearer {token}

{
  "codigo_referencia": "abc123"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Indicação aplicada! Bônus creditado quando ativar conta."
}
```

---

## 🗄️ Database Schema

### Tabela: `referrals`

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY,
  referrer_id UUID REFERENCES usuarios(id),  -- Quem indicou
  referred_id UUID REFERENCES usuarios(id),  -- Quem foi indicado
  referred_email VARCHAR(255),                -- Email do indicado
  codigo_referencia VARCHAR(50),              -- Código usado
  status VARCHAR(50),                         -- pending, completed, rewarded
  creditos_bonus INTEGER DEFAULT 0,           -- Créditos ganhos
  created_at TIMESTAMP,
  completed_at TIMESTAMP                      -- Quando indicado se cadastrou
);
```

### Coluna Adicionada em `usuarios`

```sql
ALTER TABLE usuarios
ADD COLUMN codigo_referencia VARCHAR(50) UNIQUE;

-- Gerar códigos para usuários existentes
UPDATE usuarios
SET codigo_referencia = SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)
WHERE codigo_referencia IS NULL;
```

---

## ⚙️ Triggers Automáticos

### trigger_referral_bonus

Dispara quando:
- `usuarios.creditos` > 0 (comprou créditos) OU
- `usuarios.assinatura_id` IS NOT NULL (assinou plano)

**O que faz:**
1. Atualiza status da referral: `pending` → `completed`
2. Adiciona 500 créditos ao indicador (`creditos_bonus`)
3. Adiciona 300 créditos ao indicado (`creditos_bonus`)
4. Marca referral como `rewarded`

**Código:**
```sql
CREATE OR REPLACE FUNCTION apply_referral_bonus()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.creditos > 0 OR NEW.assinatura_id IS NOT NULL THEN
    -- Update referral
    UPDATE referrals
    SET status = 'completed', completed_at = NOW()
    WHERE referred_id = NEW.id AND status = 'pending';

    -- Give 500 to referrer
    UPDATE usuarios
    SET creditos_bonus = creditos_bonus + 500
    WHERE id IN (SELECT referrer_id FROM referrals WHERE referred_id = NEW.id);

    -- Give 300 to referred
    NEW.creditos_bonus = NEW.creditos_bonus + 300;

    -- Mark as rewarded
    UPDATE referrals
    SET status = 'rewarded', creditos_bonus = 500
    WHERE referred_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 Integração com Signup

### Na Página de Cadastro

```tsx
"use client"

import { useState } from "react"
import { ReferralInput } from "@/components/referral-input"

export default function SignupPage() {
  const [refCode, setRefCode] = useState("")

  const handleSignup = async (userData) => {
    // 1. Criar conta normalmente
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password
    })

    if (error) return

    // 2. Se tem código de referência, aplicar
    if (refCode && refCode.length === 8) {
      await fetch("/api/referrals/apply", {
        method: "POST",
        body: JSON.stringify({ codigo_referencia: refCode })
      })
    }

    // 3. Redirecionar
    router.push("/dashboard")
  }

  return (
    <form onSubmit={handleSignup}>
      {/* Campos normais */}
      <Input name="email" />
      <Input name="password" type="password" />

      {/* Campo de referência */}
      <ReferralInput
        value={refCode}
        onChange={setRefCode}
      />

      <Button type="submit">Cadastrar</Button>
    </form>
  )
}
```

---

## 📧 Notificações por Email (Futuro)

### Quando Convidar

```
Assunto: Você foi convidado para o Lidzy!
Corpo:
  João Silva convidou você para usar o Lidzy.

  Cadastre-se e ganhe 300 créditos bônus!
  [Link de cadastro com código]
```

### Quando Amigo Se Cadastra

```
Para: Indicador
Assunto: Seu amigo se cadastrou no Lidzy! 🎉

João Silva,
Boa notícia! Maria aceitou seu convite e criou uma conta.
Quando ela ativar a conta, você ganhará 500 créditos!
```

### Quando Bônus é Creditado

```
Para: Indicador
Assunto: Você ganhou 500 créditos! 🎁

João Silva,
Maria ativou a conta dela!
Você ganhou 500 créditos de bônus. Aproveite!

---

Para: Indicado
Assunto: Bem-vindo ao Lidzy! +300 créditos 🎉

Maria,
Obrigado por aceitar o convite de João Silva!
Você ganhou 300 créditos de bônus de boas-vindas!
```

---

## 🔧 Configuração

### 1. Rodar Migration

```bash
# Aplicar no Supabase
psql -f scripts/033-add-credit-management.sql
```

### 2. Adicionar Menu

```tsx
// Na sidebar ou navbar
<Link href="/indicacoes">
  <Gift className="h-4 w-4" />
  Indicações
</Link>
```

### 3. Adicionar Banner no Dashboard

```tsx
// app/dashboard/page.tsx
import { ReferralBanner } from "@/components/referral-banner"

export default function Dashboard() {
  return (
    <div>
      <ReferralBanner />
      {/* Resto do dashboard */}
    </div>
  )
}
```

---

## 📱 Compartilhamento Social

### WhatsApp

```typescript
const shareWhatsApp = () => {
  const link = `${window.location.origin}/cadastro?ref=${codigo}`
  const text = `Você foi convidado para o Lidzy! Ganhe 300 créditos:\n${link}`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`)
}
```

### Email

```typescript
const shareEmail = () => {
  const link = `${window.location.origin}/cadastro?ref=${codigo}`
  const subject = "Convite para Lidzy - 300 créditos grátis!"
  const body = `Cadastre-se no Lidzy e ganhe 300 créditos:\n${link}`
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
```

### Copiar Link

```typescript
const copyLink = () => {
  const link = `${window.location.origin}/cadastro?ref=${codigo}`
  navigator.clipboard.writeText(link)
  toast.success("Link copiado!")
}
```

---

## 🧪 Testar

### 1. Obter Código

```
Acesse: /indicacoes
Copie seu código (ex: abc123)
```

### 2. Simular Cadastro

```
Abra aba anônima
Acesse: /cadastro?ref=abc123
Verifique se mostra: "Indicado por Seu Nome"
Cadastre-se
```

### 3. Verificar Vinculação

```sql
SELECT * FROM referrals
WHERE codigo_referencia = 'abc123';

-- Deve mostrar status 'completed'
```

### 4. Simular Ativação

```sql
-- Dar créditos ao indicado
UPDATE usuarios
SET creditos = 100
WHERE email = 'amigo@teste.com';

-- Verificar se trigger disparou
SELECT creditos_bonus FROM usuarios
WHERE codigo_referencia = 'abc123';
-- Deve mostrar 500

SELECT creditos_bonus FROM usuarios
WHERE email = 'amigo@teste.com';
-- Deve mostrar 300
```

---

## 📊 Analytics

Ver indicações na página de analytics:

```
/analytics → Tab "Indicações"
```

Ver no dashboard:

```typescript
const { data } = await fetch("/api/referrals")

// Total de créditos ganhos
data.stats.totalCreditsEarned

// Amigos ativos
data.stats.completed

// Taxa de conversão
(data.stats.completed / data.stats.total) * 100
```

---

## ❓ FAQ

**P: Posso me auto-indicar?**
R: Não, o sistema bloqueia auto-indicação.

**P: Quantas pessoas posso indicar?**
R: Ilimitado! Sem restrições.

**P: Os créditos expiram?**
R: Não, são válidos por tempo indeterminado.

**P: E se o amigo não ativar?**
R: Os bônus só são creditados após ativação (compra ou assinatura).

**P: Posso trocar o código de referência?**
R: Não, é único e permanente por usuário.

---

**Desenvolvido por:** Claude
**Data:** 2025-11-13
**Versão:** 1.0.0
