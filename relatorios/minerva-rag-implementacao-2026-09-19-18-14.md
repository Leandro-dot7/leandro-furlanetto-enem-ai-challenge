# Minerva — implementação do RAG inicial do Tutor

**Data:** 19/09/2026  
**Snapshot de reversão:** `401a9bc` (`chore(snapshot): save SaaS state before RAG`)  
**Escopo:** iniciar um RAG local para o Tutor usando a API pública ENEM.dev, sem alterar o fluxo de autenticação, histórico ou dashboard.

## O que foi implementado

- `backend/scripts/ingestEnemRag.js`: job de ingestão paginada por ano, com timeout, espera de 1.100 ms entre chamadas e gravação atômica.
- `backend/services/enemRagService.js`: índice lexical local, limite padrão de uma referência curta e tratamento tolerante a cache ausente ou inválido.
- `backend/services/geminiService.js`: contexto recuperado separado da pergunta do estudante; referências são tratadas como dados não confiáveis e não como instruções.
- `backend/controllers/aiController.js`: recuperação local antes da chamada do Tutor, mantendo o `AbortSignal` já existente.
- `.env.example`, `.gitignore`, `package.json` e `README.md`: configuração, comando de ingestão e documentação.

## Execução realizada

Comando:

```bash
npm run rag:ingest -- 2023
```

Resultado: 180 questões salvas em `backend/data/enem-rag/2023.json`. O arquivo é ignorado pelo Git e não é servido por nenhuma rota Express.

O Tutor não consulta a API externa durante cada pergunta: depois da ingestão, ele pesquisa o cache local e envia no máximo uma referência curta quando há correspondência lexical. Isso reduz dependência de rede e evita enviar um corpus inteiro ao modelo. A economia efetiva de tokens e a redução de latência ainda devem ser medidas com telemetria de produção/homologação; o RAG não garante redução para toda pergunta.

## Verificações

- Sintaxe Node dos arquivos alterados: aprovada.
- Recuperação local com consulta de teste: aprovada.
- Lint do frontend: aprovado, com avisos preexistentes.
- Auditoria de dependências backend/frontend: 0 vulnerabilidades de severidade alta ou maior.
- Marcadores de HTML executável, `dangerouslySetInnerHTML` e chave de serviço Supabase: não encontrados no corpus/alterações do RAG.
- Argos: relatório em [`relatorios/argos-rag-2026-09-19-18-12.md`](./argos-rag-2026-09-19-18-12.md).

## Pendências conscientes

1. A API é comunitária, não uma fonte oficial do INEP; validar gabaritos e origem antes de ampliar o corpus.
2. Conteúdo recuperado pode sofrer prompt injection; a mitigação atual é parcial. Adicionar canários adversariais e checksum/manifesto aprovado antes de produção ampla.
3. O job ainda pode ganhar lock, retry com backoff e marcação explícita de ingestão completa.
4. O índice é lexical. Embeddings/pgvector só devem ser adotados depois de medir relevância, custo e latência.

## Reversão

O estado anterior ao RAG está preservado no commit `401a9bc`. O commit seguinte contém apenas a implementação e os relatórios desta rodada; a reversão deve ser feita de forma não destrutiva com `git revert` desse commit, caso necessário.
