# Relatório Minerva — Preparação do deploy para a apresentação

## Identificação da Rodada

- Agente responsável: Minerva
- Data e hora: 2026-09-20 18:21 (America/Sao_Paulo)
- Ambiente: local, commit base `e783b0f`
- Janela operacional: testes online antes do desligamento; religamento algumas horas antes de 2026-09-22 09:00.

## Escopo e Alvos

- Corpus RAG em `backend/data/enem-rag/`.
- Configuração do Render Web Service em `render.yaml`.
- Fallback de rotas SPA em `frontend/public/_redirects` para o Cloudflare Pages.
- Instruções de ambiente e operação no `README.md`.

## Metodologia e Evidências

- Removida a regra que ignorava os JSON do corpus; os nove arquivos ENEM agora podem ser versionados.
- Validação estrutural: 9 arquivos JSON, 1.553 questões, aproximadamente 2,95 MB; todos parseiam e contêm questões.
- Consulta funcional local: `getTutorRagContext('mitose meiose cromossomos')` retornou referência de questão ENEM antes da geração.
- `render.yaml` usa `backend` como root, `npm ci`, `npm start`, health check em `/api/health` e secrets fora do arquivo.
- Frontend mantém `VITE_API_URL` configurável e fallback para `index.html` em rotas do React.

## Classificação de Severidade dos Achados

- **P1 — corrigido:** um clone limpo para deploy não tinha o corpus RAG porque os JSON eram ignorados pelo Git.
- **P2 — mitigado:** Render gratuito pode suspender o processo após inatividade e gerar cold start; a operação prevê testes online e religamento antecipado.
- **P2 — pendência operacional:** domínio final, CORS e variáveis reais ainda precisam ser configurados nos painéis Cloudflare/Render.
- **P3 — aviso existente:** bundle principal do frontend permanece acima de 500 kB e o lint mantém o aviso preexistente de Fast Refresh.

## Ações Executadas ou Recomendadas

- Publicar o frontend no Cloudflare Pages com root `frontend`, build `npm run build` e output `dist`.
- Publicar o backend no Render como Web Service com root `backend`, build `npm ci` e start `npm start`.
- Configurar no frontend `VITE_API_URL` com a URL do Render; no backend, configurar `CORS_ORIGIN` com a URL do Cloudflare Pages, além das chaves Gemini e Supabase.
- Após os testes online, desligar os serviços e preservar o Supabase ativo para dados/autenticação.
- No dia 22, religar o backend e frontend algumas horas antes das 09:00 e testar health check, autenticação, Tutor, simulado, redação e persistência.

## Validações e Limitações

- Backend: `npm test` — 5/5; frontend: `npm test` — 12/12.
- Frontend: lint aprovado; build aprovado.
- Corpus parseado e busca RAG local executada com sucesso.
- Nenhuma conta de provedor foi conectada nesta rodada; deploy, domínio, CORS em produção e shutdown/restart real permanecem para a etapa seguinte.
