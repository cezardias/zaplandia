-- Script para limpar contatos duplicados no banco de dados
-- Execute este script ANTES de fazer o deploy do novo código

-- PASSO 1: Identificar duplicatas (contatos com mesmo sufixo de 8 dígitos)
-- Este query mostra os duplicados para você revisar antes de deletar
SELECT 
    RIGHT(COALESCE(external_id, phone_number, ''), 8) as suffix,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as contact_ids,
    STRING_AGG(name, ', ') as names
FROM contacts
WHERE tenant_id = 'SEU_TENANT_ID_AQUI'  -- SUBSTITUA pelo seu tenant ID
GROUP BY RIGHT(COALESCE(external_id, phone_number, ''), 8)
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- PASSO 2: Deletar duplicatas, mantendo apenas o contato mais antigo
-- ATENÇÃO: Este script deleta dados! Faça backup antes de executar!

WITH duplicates AS (
    SELECT 
        id,
        RIGHT(COALESCE(external_id, phone_number, ''), 8) as suffix,
        ROW_NUMBER() OVER (
            PARTITION BY RIGHT(COALESCE(external_id, phone_number, ''), 8)
            ORDER BY created_at ASC  -- Mantém o mais antigo
        ) as rn
    FROM contacts
    WHERE tenant_id = 'SEU_TENANT_ID_AQUI'  -- SUBSTITUA pelo seu tenant ID
)
DELETE FROM contacts
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- PASSO 3: Verificar se ainda existem duplicatas
SELECT 
    RIGHT(COALESCE(external_id, phone_number, ''), 8) as suffix,
    COUNT(*) as count
FROM contacts
WHERE tenant_id = 'SEU_TENANT_ID_AQUI'  -- SUBSTITUA pelo seu tenant ID
GROUP BY RIGHT(COALESCE(external_id, phone_number, ''), 8)
HAVING COUNT(*) > 1;

-- Se o resultado do PASSO 3 estiver vazio, a limpeza foi bem-sucedida!
