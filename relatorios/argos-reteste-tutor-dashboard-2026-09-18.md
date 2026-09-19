# Argos — Reteste do Tutor e persistência

## Tutor

O código do repositório não contém mais a validação antiga de `messages`. O frontend envia `message` e `conversationId`; o backend atual usa esse contrato. O erro relatado indica processo/deploy antigo ou frontend servido a partir de outra cópia.

## Persistência

Dashboard e Histórico anteriormente ignoravam erros retornados pelo Supabase, exibindo listas vazias como se não houvesse dados. A Minerva corrigiu esse comportamento: falhas de consulta agora aparecem em `role="alert"` e são registradas no console. Falhas de insert também aparecem nos resultados do simulado e da redação.

## Configuração encontrada

- `frontend/.env.local` aponta para o projeto Supabase `tfmyodajgvszjuguzqrc`.
- O `backend/.env` local não possui `SUPABASE_URL` nem `SUPABASE_PUBLISHABLE_KEY`.
- `backend/.env.example` continha uma chave Gemini real; foi sanitizado. Essa chave deve ser revogada e substituída.

## Ações obrigatórias fora do código

1. Revogar/rotacionar a chave Gemini que foi colocada no `.env.example`.
2. Colocar `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` no arquivo `backend/.env` real.
3. Confirmar que `supabase_schema.sql` foi executado no mesmo projeto apontado pelo frontend.
4. Reiniciar backend e frontend a partir desta cópia do projeto.

## Validação

- Sintaxe dos módulos do backend: aprovada.
- Lint do frontend: sem erros; somente avisos preexistentes.
- Build de produção: aprovado.
