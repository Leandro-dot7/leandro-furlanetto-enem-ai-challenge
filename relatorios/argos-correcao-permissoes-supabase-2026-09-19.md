# Argos/Minerva — Correção de permissões do Supabase

## Evidência

O frontend retornou:

> permission denied for table redacoes

O Dashboard também falhou ao consultar o histórico. Isso confirma que o problema não é ausência de registro nem RLS filtrando linhas: o papel autenticado não tinha privilégio SQL na tabela.

## Correção aplicada ao projeto

`supabase_schema.sql` agora inclui privilégios explícitos:

- `USAGE` no schema `public` para `authenticated`.
- `SELECT/INSERT/UPDATE` em `perfis`.
- `SELECT/INSERT` em `simulados`.
- `SELECT/INSERT` em `redacoes`.

As políticas RLS continuam restringindo as linhas com `auth.uid() = user_id`. O `GRANT` não libera dados de outros usuários.

## Ação necessária no Supabase

Execute no SQL Editor do mesmo projeto apontado por `VITE_SUPABASE_URL` o bloco final de `supabase_schema.sql` (ou o arquivo completo). Depois encerre e reabra a sessão do navegador para renovar o JWT e recarregue o Dashboard.

## Reteste esperado

- Correção de redação salva em `public.redacoes`.
- Resultado de simulado salvo em `public.simulados`.
- Dashboard e Histórico carregam somente os registros do usuário autenticado.
