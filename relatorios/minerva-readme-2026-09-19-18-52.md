# Minerva — atualização do README

**Data:** 19/09/2026  
**Escopo:** alinhar a documentação ao estado atual do SaaS.

## Atualizações

- Documentado o modo claro/escuro e sua persistência.
- Documentado o RAG local de 2015–2023, com 1.553 questões e a distribuição por ano.
- Explicada a consulta do RAG pelo Tutor e pelo gerador de simulados.
- Atualizados comandos de ingestão, porta padrão documentada e `VITE_API_URL` local.
- Incluídas validações backend, limites de tokens/latência e dependência da fonte comunitária.
- Ajustado o roadmap para diferenciar o que já está implementado do que ainda é evolução.

## Validação

- `git diff --check`: aprovado, com os avisos conhecidos de conversão LF/CRLF do Windows.
- Conferência cruzada com `backend/.env.example`, `backend/src/server.js`, script de ingestão e relatórios RAG.
