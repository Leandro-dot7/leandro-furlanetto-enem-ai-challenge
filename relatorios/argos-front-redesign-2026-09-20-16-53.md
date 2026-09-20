# Relatório Argos — Reteste de segurança após redesign do frontend

## Identificação da Rodada

- **Agente responsável:** Argos
- **Data:** 2026-09-20
- **Ambiente avaliado:** local, backend `http://127.0.0.1:5000` e frontend `http://127.0.0.1:5173`
- **Versão/commit de referência:** `ac980e6` + alterações locais não commitadas
- **Janela:** rodada não destrutiva durante execução local
- **Contas sintéticas:** nenhuma conta autenticada disponível para este reteste
- **Limites:** sem carga, sem DELETE/DROP, sem exploração de produção e sem extração de dados

## Escopo e Alvos

### IA e API

- `GET /api/ai/tutor/latest`
- `POST /api/ai/tutor`
- Middleware de Bearer token, rate limit, limite de corpo e vínculo do Tutor ao usuário

### Dados e sessão

- `backend/services/tutorConversationStore.js`
- Isolamento por `user_id` e `conversation_id`
- Fluxos frontend de restauração, nova conversa e logout

### Superfície do redesign

- `Layout.jsx`, `PageHeader.jsx`, `FeedbackMessage.jsx`, páginas públicas e páginas protegidas
- Busca estática por identificadores de chaves privilegiadas, HTML bruto e ações não semânticas

## Metodologia e Evidências

### Testes dinâmicos não destrutivos

```text
GET  /api/health                 -> 200
GET  /api/ai/tutor/latest        -> 401 sem Authorization
POST /api/ai/tutor               -> 401 sem Authorization
GET  /api/ai/tutor/latest        -> 401 com Bearer inválido
```

O health check retornou headers `Cache-Control: no-store` e `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`. Nenhum payload autenticado foi enviado e nenhum dado foi alterado.

### Testes estáticos

- `node --check` passou em `backend/src/server.js`, `backend/middleware/aiSecurity.js` e `backend/services/tutorConversationStore.js`.
- Busca de `SUPABASE_SERVICE_ROLE`, `service_role` e valores de chaves fora de arquivos `.env`: nenhum segredo exposto; a ocorrência de `GEMINI_API_KEY` permanece apenas como leitura de variável de ambiente e mensagem de configuração no backend.
- O renderer do Tutor continua sem `dangerouslySetInnerHTML`.
- O frontend usa `Link`/`a` e `button` para navegação/ações principais; não foi encontrado novo `div`/`span` de navegação.

### Testes automatizados disponíveis

- Backend: 3/3 testes aprovados.
- Frontend: 6/6 guardrails aprovados.
- Lint, build e `git diff --check` concluídos sem erros.

## Classificação de Severidade dos Achados

### [ARG-FRONT-001] [Severidade: Informativa]

- **Título:** Superfície visual não introduziu exposição evidente de segredos ou HTML executável.
- **Categoria:** OWASP API/LLM — exposição de segredos e XSS.
- **Componente afetado:** frontend e renderer do Tutor.
- **Evidência:** busca estática sem chaves privilegiadas expostas e respostas Markdown renderizadas por elementos React, sem HTML bruto.
- **Impacto:** nenhum impacto confirmado.
- **Recomendação:** manter a revisão estática antes de cada commit e não copiar valores de `.env` para relatórios.

### [ARG-FRONT-002] [Severidade: Média / P2 — risco residual]

- **Título:** Rate limit permanece local à instância do backend.
- **Categoria:** API Security — abuso de recurso e disponibilidade.
- **Componente afetado:** middleware de segurança da API.
- **Evidência:** controle existente em memória; não foi alterado pelo redesign e não foi submetido a carga.
- **Impacto:** em escala horizontal, chamadas podem ser distribuídas entre processos/containers e superar o limite efetivo.
- **Recomendação:** migrar o contador para armazenamento compartilhado antes de escalar horizontalmente; não fazer teste de estresse nesta rodada.

### [ARG-FRONT-003] [Severidade: Média / P2 — validação pendente]

- **Título:** RLS e isolamento de conversas não foram exercitados com duas contas sintéticas.
- **Categoria:** API/Database — BOLA/IDOR e RLS.
- **Componente afetado:** tabelas `tutor_conversas` e `tutor_mensagens`.
- **Evidência:** código filtra por usuário e os testes unitários cobrem o store com contexto autenticado, mas não houve duas sessões reais neste ambiente.
- **Impacto:** não há evidência suficiente para declarar o isolamento dinâmico confirmado.
- **Recomendação:** repetir em Supabase de teste com duas contas sintéticas, consultando e tentando reutilizar um `conversationId` de outra conta sem extrair conteúdo.

## Ações Executadas ou Recomendadas

- Retestados autenticação ausente, Bearer inválido e headers defensivos.
- Revisada a superfície adicionada pelo redesign para não expor segredos, dados ou rotas.
- Mantidos `ARG-FRONT-002` e `ARG-FRONT-003` como riscos/limitações anteriores, sem reclassificá-los como vulnerabilidades novas do frontend.
- Nenhuma correção de segurança adicional foi necessária nesta rodada.

## Validações e Limitações

- Os testes foram locais e não destrutivos.
- O backend respondeu corretamente a solicitações não autenticadas.
- Não foram testadas chamadas Gemini, persistência real do Tutor ou RLS com duas contas.
- Não houve teste de expiração/renovação de token porque não havia sessão sintética disponível.
- A ferramenta de browser estava indisponível; a revisão visual foi separada no relatório Morpheus.
- Nenhuma chave, token ou dado de usuário foi incluído neste relatório.

## Reteste pós-correção visual

- A correção de contraste do `PageHeader` não alterou rotas, middleware, payloads, autenticação ou persistência.
- Os retestes de autenticação e headers continuam válidos; nenhum novo achado de segurança foi introduzido.
