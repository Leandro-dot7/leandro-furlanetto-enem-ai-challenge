# Argos — Rodada estática de segurança

**Data:** 18/09/2026  
**Escopo autorizado:** código local do Minerva ENEM, sem requisições a ambientes externos, contas ou dados reais.

## Resumo executivo

A auditoria identificou uma falha alta: os recursos pagos de IA eram expostos pelo backend sem autenticação nem limitação de uso. Também foram identificadas superfícies médias referentes a histórico do Tutor controlado pelo cliente e ausência de proteções HTTP explícitas.

## Achados

### ARG-001 — Alta — Rotas de IA sem autenticação ou autorização

- **Componente:** `backend/routes/ai.routes.js`
- **Evidência:** as rotas de tutor, simulado e redação não possuíam middleware de autenticação.
- **Impacto:** consumo não autorizado da chave Gemini, esgotamento de cota e custo financeiro.
- **Status:** corrigido nesta rodada. Veja `correcoes-2026-09-18.md`.

### ARG-002 — Média — Histórico do Tutor inteiramente controlado pelo navegador

- **Componente:** `backend/controllers/aiController.js` e `backend/services/geminiService.js`
- **Evidência:** o cliente podia enviar mensagens anteriores com papel atribuído ao modelo.
- **Impacto:** redução da integridade da conversa e aumento de superfície para injeção de contexto.
- **Status:** mitigado nesta rodada; o servidor valida formato, tamanho e preserva somente mensagens do usuário.

### ARG-003 — Média — Proteções de API insuficientes contra abuso

- **Componente:** `backend/src/server.js`
- **Evidência:** ausência de limitação de uso e de headers explícitos; limite de corpo era o padrão do Express.
- **Impacto:** maior risco de abuso automatizado e de processamento excessivo.
- **Status:** mitigado nesta rodada com limite por usuário, corpo máximo de 64 KB e headers defensivos.

## Limites da rodada

Não houve pentest dinâmico, teste de RLS em instância real, tentativa de prompt injection contra Gemini, varredura de infraestrutura nem teste de dependências online. Para isso, é necessário ambiente de homologação, URL, janela e contas sintéticas autorizadas.
