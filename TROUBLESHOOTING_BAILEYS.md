# 🔧 Troubleshooting: "relation instancias_whatsapp does not exist"

Se você está recebendo o erro `ERROR: 42P01: relation "instancias_whatsapp" does not exist`, siga este guia.

## ⚠️ Causa do Erro

O erro ocorre porque:
1. O código está procurando por uma tabela chamada `instancias_whatsapp`
2. Mas a tabela correta no seu banco é `instancias` (sem "_whatsapp")

## 🔍 Passo 1: Diagnóstico

Execute o script de diagnóstico no **Supabase SQL Editor**:

```sql
-- Copie e cole todo o conteúdo de:
scripts/034-diagnostico.sql
```

Isso vai mostrar:
- ✓ Se a tabela `instancias` existe
- ✓ Se `instancias_whatsapp` existe (não deveria)
- ✓ Quais colunas existem
- ✓ Se a migration já foi aplicada
- ✓ Quantas instâncias você tem

### Resultados Esperados:

```
✓ Tabela instancias existe: SIM
✓ Tabela instancias_whatsapp existe: NÃO
✓ Total de instâncias: X
```

## 🛠️ Passo 2: Aplicar Migration

Após confirmar que a tabela `instancias` existe, aplique a migration:

### Opção A: Script com Validações (Recomendado)

```sql
-- Execute no Supabase SQL Editor:
-- Copie e cole todo o conteúdo de:
scripts/034-add-baileys-support-v2.sql
```

Este script:
- ✅ Verifica se a tabela existe antes de alterar
- ✅ Não falha se as colunas já existirem
- ✅ Mostra mensagens de progresso
- ✅ Faz verificação final

### Opção B: Script Original

```sql
-- Se preferir o script mais simples:
-- Copie e cole todo o conteúdo de:
scripts/034-add-baileys-support.sql
```

## ✅ Passo 3: Verificar Sucesso

Após aplicar a migration, execute:

```sql
-- Verificar se as colunas foram criadas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'instancias'
  AND column_name IN ('provider', 'provider_config', 'session_data', 'webhook_url');
```

Deve retornar:
```
provider         | character varying
provider_config  | jsonb
session_data     | jsonb
webhook_url      | text
```

## 🚀 Passo 4: Reiniciar Aplicação

Após aplicar a migration:

```bash
# Se estiver rodando em desenvolvimento:
# Ctrl+C para parar
# Depois:
npm run dev

# Se estiver em produção (Vercel):
# Faça um novo deploy ou force revalidate
```

## 🐛 Problemas Comuns

### Erro: "relation instancias does not exist"

Significa que a tabela `instancias` não foi criada. Execute primeiro:

```sql
-- Execute o script de criação da tabela:
scripts/007_create_instancias.sql
```

### Erro: "column already exists"

Isso é OK! Significa que você já aplicou a migration antes. Pode ignorar.

### Erro depois de aplicar migration

1. **Limpe o cache do Next.js:**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Verifique se o código está atualizado:**
   ```bash
   git pull origin claude/general-task-011CV4ioysJprs7Sd4ZDneHu
   ```

3. **Reinicie o servidor Vercel** (se em produção)

## 🔍 Debug Avançado

### Verificar se há views ou funções antigas:

```sql
-- Ver views que referenciam instancias
SELECT table_name, view_definition
FROM information_schema.views
WHERE view_definition LIKE '%instancias%'
  AND table_schema = 'public';

-- Ver funções que referenciam instancias
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_definition LIKE '%instancias%'
  AND routine_schema = 'public';
```

Se encontrar alguma referência a `instancias_whatsapp`, você precisará atualizar essas views/funções manualmente.

## 📞 Ainda com Problema?

Se nenhuma solução funcionou:

1. **Compartilhe o resultado do script de diagnóstico**
2. **Compartilhe o erro completo** que você está recebendo
3. **Informe onde o erro está acontecendo:**
   - No Supabase SQL Editor?
   - Na aplicação Next.js?
   - Em qual endpoint/página?

## ✨ Sucesso!

Após resolver, você poderá:
- ✅ Ver suas instâncias Z-API existentes funcionando normalmente
- ✅ Criar novas instâncias Baileys
- ✅ Escolher entre Z-API e Baileys para cada instância

## 📚 Próximos Passos

Após a migration funcionar:
1. Leia [QUICK_START_BAILEYS.md](./QUICK_START_BAILEYS.md) para configurar Baileys
2. Leia [WHATSAPP_PROVIDERS.md](./WHATSAPP_PROVIDERS.md) para comparar providers
3. Teste criando uma instância no Lidzy em `/instancias`
