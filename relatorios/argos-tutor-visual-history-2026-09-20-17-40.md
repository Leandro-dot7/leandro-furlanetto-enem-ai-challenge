# Relatório Argos — Histórico do Tutor e superfície de ataque

## Identificação da Rodada

- Agente responsável: Argos
- Data e hora: 2026-09-20 17:40 (America/Sao_Paulo)
- Ambiente: local, working tree baseado no commit `2fedfb6`
- Escopo: autenticação da rota, escopo do DELETE, RLS, sanitização de Markdown e exposição de segredos.

## Escopo e Alvos

- `DELETE /api/ai/tutor/history` e middleware de autenticação/rate limit.
- `clearTutorHistory` e construção do filtro por `user_id`.
- Políticas/grants de `tutor_conversas` e `tutor_mensagens`.
- `TutorMarkdown.jsx` e prompt de saída do Gemini.

## Metodologia e Evidências

- Smoke test sem sessão: `GET /api/ai/tutor/latest` retornou 401 e `DELETE /api/ai/tutor/history` retornou 401.
- Inspeção confirmou que o DELETE usa `req.authUser`, não aceita `user_id` do corpo/query do cliente e envia filtro codificado para o PostgREST.
- A rota permanece sob `requireSupabaseUser` e `aiRateLimit`.
- O renderer usa `rehype-sanitize`, `skipHtml`, não usa `rehypeRaw` nem `dangerouslySetInnerHTML`; imagens são convertidas em texto acessível.
- Busca estática não encontrou `service_role` nem segredos em código/relatórios.

## Classificação de Severidade dos Achados

- **P2 — mitigado:** antes não existia operação explícita para excluir o histórico persistente; agora há endpoint, políticas e confirmação na UI.
- **P2 — pendência de integração:** RLS e cascata precisam ser exercitados no projeto Supabase remoto com duas contas de teste autorizadas.
- **P2 — risco preexistente:** rate limit em memória continua inadequado para múltiplos processos/containers e deve migrar para mecanismo compartilhado antes de escala horizontal.
- **P3 — corrigido:** superfície de Markdown foi reduzida por sanitização e remoção de HTML bruto.

## Ações Executadas ou Recomendadas

- Aplicar no Supabase o bloco de DELETE policies/grants de `supabase_schema.sql`.
- Retestar com duas contas: cada conta deve excluir apenas seu próprio histórico; uma conta não pode observar nem remover conversas da outra.
- Para produção multi-instância, substituir o rate limit local por armazenamento compartilhado.

## Validações e Limitações

- Backend `npm test`: 5/5; `node --check` nos arquivos alterados: sucesso; smoke de autenticação: sucesso.
- A validação remota de RLS não foi executada por ausência de credenciais/projeto de teste. Nenhum teste de carga ou tentativa destrutiva contra terceiros foi realizado.
