-- ============================================
-- SCRIPT COMPLETO DE CORREÇÃO DO CRM
-- Execute TODOS os passos em ordem
-- ============================================

-- PASSO 1: Ver o estado atual (DIAGNÓSTICO)
-- ============================================
SELECT 
    id,
    name,
    external_id,
    phone_number,
    instance,
    created_at
FROM contacts
WHERE tenant_id = 'SEU_TENANT_ID_AQUI'  -- SUBSTITUA!
ORDER BY created_at DESC
LIMIT 20;

-- PASSO 2: Atualizar nomes dos contatos usando dados das campanhas
-- ============================================
-- Isso vai corrigir "Novo Contato XXXX" para nomes reais
UPDATE contacts c
SET name = cl.name
FROM campaign_leads cl
WHERE c.tenant_id = 'SEU_TENANT_ID_AQUI'  -- SUBSTITUA!
  AND c.external_id IS NOT NULL
  AND cl.external_id IS NOT NULL
  AND (
      c.external_id = cl.external_id 
      OR RIGHT(c.external_id, 8) = RIGHT(cl.external_id, 8)
  )
  AND (c.name LIKE 'Novo Contato%' OR c.name LIKE 'Contato%' OR c.name LIKE '%@%')
  AND cl.name IS NOT NULL
  AND cl.name NOT LIKE '%@%';

-- PASSO 3: Remover duplicatas (mantém o mais antigo)
-- ============================================
WITH duplicates AS (
    SELECT 
        id,
        RIGHT(COALESCE(external_id, phone_number, ''), 8) as suffix,
        ROW_NUMBER() OVER (
            PARTITION BY RIGHT(COALESCE(external_id, phone_number, ''), 8)
            ORDER BY created_at ASC  -- Mantém o mais antigo
        ) as rn
    FROM contacts
    WHERE tenant_id = 'SEU_TENANT_ID_AQUI'  -- SUBSTITUA!
      AND (external_id IS NOT NULL OR phone_number IS NOT NULL)
)
DELETE FROM contacts
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- PASSO 4: Verificar se ainda há duplicatas
-- ============================================
SELECT 
    RIGHT(COALESCE(external_id, phone_number, ''), 8) as suffix,
    COUNT(*) as count,
    STRING_AGG(name, ' | ') as names
FROM contacts
WHERE tenant_id = 'SEU_TENANT_ID_AQUI'  -- SUBSTITUA!
GROUP BY RIGHT(COALESCE(external_id, phone_number, ''), 8)
HAVING COUNT(*) > 1;

-- PASSO 5: Ver resultado final
-- ============================================
SELECT 
    id,
    name,
    external_id,
    phone_number,
    instance,
    created_at
FROM contacts
WHERE tenant_id = 'SEU_TENANT_ID_AQUI'  -- SUBSTITUA!
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- INSTRUÇÕES:
-- ============================================
-- 1. Conecte ao banco: docker exec -it zaplandia-db-1 psql -U postgres -d zaplandia
-- 2. Substitua 'SEU_TENANT_ID_AQUI' pelo seu tenant ID real
-- 3. Execute PASSO 1 para ver o estado atual
-- 4. Execute PASSO 2 para corrigir nomes
-- 5. Execute PASSO 3 para remover duplicatas
-- 6. Execute PASSO 4 para verificar se ainda há duplicatas
-- 7. Execute PASSO 5 para ver o resultado final
-- 
-- IMPORTANTE: Após executar este script, faça:
-- git pull origin main
-- docker compose up -d --build
-- 
-- As novas mensagens já virão com instance name correto!
