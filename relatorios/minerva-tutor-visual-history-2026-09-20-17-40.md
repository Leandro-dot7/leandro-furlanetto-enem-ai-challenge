# Relatório Minerva — Tutor, visualização e histórico

## Identificação da Rodada

- Agente responsável: Minerva
- Data e hora: 2026-09-20 17:40 (America/Sao_Paulo)
- Ambiente: local, working tree baseado no commit `2fedfb6`
- Escopo: correção de renderização do Tutor, histórico persistente, paleta visual e organização estrutural.

## Escopo e Alvos

- `frontend/src/TutorAI.jsx` e o novo `frontend/src/components/tutor/TutorMarkdown.jsx`.
- `backend/routes/ai.routes.js`, `backend/controllers/aiController.js` e `backend/services/tutorConversationStore.js`.
- `supabase_schema.sql`, tokens visuais e estilos globais do frontend.
- Convenções de `relatorios/`, `agents.md` e documentação de trabalho em `docs/`.

## Metodologia e Evidências

- Substituição do parser regex por `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex` e `rehype-sanitize`.
- Tabelas ganharam rolagem horizontal acessível; links abrem com `target="_blank"` e `rel="noreferrer"`; HTML bruto é ignorado.
- Implementado `DELETE /api/ai/tutor/history`, derivando o usuário do contexto autenticado e removendo conversas com cascata para mensagens.
- Adicionadas políticas/grants explícitos de `DELETE` no schema Supabase.
- A paleta clara saiu do branco absoluto para `#eef1ee`, com superfície principal `#fbfaf7`, preservando contraste e leitura.
- Auditoria estrutural removeu arquivos scaffold sem uso (`App.css`, assets Vite/React/hero, cliente Supabase duplicado) e documentou a distinção entre `spec.md` como fonte de verdade e `docs/superpowers/` como histórico de trabalho.
- Pesquisa aplicada: [WCAG](https://www.w3.org/TR/wcag/), [foco visível](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html), [cor e fadiga visual](https://pmc.ncbi.nlm.nih.gov/articles/PMC12331638/), [pistas de cor na aprendizagem](https://pubmed.ncbi.nlm.nih.gov/39062383/) e [polaridade em telas](https://pubmed.ncbi.nlm.nih.gov/36533999/).

## Classificação de Severidade dos Achados

- **P2 — corrigido:** marcadores Markdown, tabelas e fórmulas apareciam como texto cru para o estudante.
- **P2 — corrigido:** não havia operação de limpeza do histórico persistido.
- **P2 — mitigado:** branco absoluto e overrides legados dificultavam o conforto visual no modo claro.
- **P3 — corrigido:** estrutura continha arquivos scaffold/duplicados sem uso e os relatórios não registravam hora.

## Ações Executadas ou Recomendadas

- Usar o botão **Limpar histórico**, que solicita confirmação e informa que a exclusão é permanente.
- Executar no SQL Editor o bloco de políticas/grants de `supabase_schema.sql` antes de validar a limpeza contra o projeto Supabase remoto.
- Manter `spec.md` como fonte de verdade; usar `docs/README.md` para orientar a documentação derivada.

## Validações e Limitações

- Frontend: `npm test` — 12/12; `npm run lint` — sucesso, com o aviso preexistente de Fast Refresh em `AuthContext.jsx`; `npm run build` — sucesso.
- Backend: `npm test` — 5/5; `node --check` nos módulos alterados — sucesso; smoke test de health, frontend, GET e DELETE sem autenticação — sucesso, com 401 nas rotas protegidas.
- `git diff --check` — sucesso.
- Não foi possível executar inspeção visual interativa porque não havia navegador/superfície CUA disponível. Também não foram usadas credenciais reais do Gemini/Supabase; RLS remoto e resposta real do modelo permanecem para reteste integrado.
