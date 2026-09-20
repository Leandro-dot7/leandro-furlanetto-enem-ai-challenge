# Relatório Minerva — Análise de opções de deploy

## Identificação da Rodada

- Agente responsável: Minerva
- Data e hora: 2026-09-20 17:59 (America/Sao_Paulo)
- Ambiente: análise local do commit `99d245f`
- Objetivo: comparar opções de hospedagem para o frontend React/Vite e backend Node/Express.

## Escopo e Alvos

- Frontend em `frontend/`, aplicação React 19 + Vite com saída estática `dist/`.
- Backend em `backend/`, API Express com chamadas ao Gemini, Supabase e corpus local do RAG.
- Opções analisadas: Vercel, Netlify, Firebase Hosting, Cloudflare Pages, Render, Railway, Koyeb e Fly.io.

## Metodologia e Evidências

- Consulta às documentações oficiais de cada provedor em 2026-09-20.
- Critérios: compatibilidade com Vite/React e Express, integração com GitHub, monorepo, custo inicial, comportamento do plano gratuito, cold start, configuração de variáveis e risco de cobrança.
- Evidências principais:
  - [Cloudflare Pages — React/Vite e configuração de build](https://developers.cloudflare.com/pages/configuration/build-configuration/): `npm run build`, saída `dist` e suporte a diretório-raiz de monorepo.
  - [Cloudflare Pages — pricing de Functions](https://developers.cloudflare.com/pages/functions/pricing/): assets estáticos sem custo e sem limite de requests no plano gratuito; Functions contam como Workers.
  - [Render — Express/Node](https://render.com/docs/deploy-node-express-app) e [monorepos](https://render.com/docs/monorepo-support): root directory, comandos separados e deploy automático via GitHub.
  - [Render — free web services](https://render.com/docs/free): 750 horas mensais, filesystem efêmero, suspensão após 15 minutos sem tráfego e retomada que pode levar cerca de um minuto.
  - [Vercel — Vite/Git](https://vercel.com/docs/frameworks/frontend/vite) e [termos do Hobby](https://vercel.com/legal/terms): integração excelente, mas Hobby é restrito a uso pessoal/não comercial.
  - [Netlify — monorepos](https://docs.netlify.com/build/configure-builds/monorepos/) e [plano gratuito](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/): suporte ao monorepo, porém plano gratuito baseado em créditos, com 300 créditos/mês, 10 mil requests e 1 GB de banda na referência consultada.
  - [Firebase Hosting — quotas](https://firebase.google.com/docs/hosting/usage-quotas-pricing): hosting gratuito com limites de armazenamento/banda; backend dinâmico exige Cloud Functions/Cloud Run e, em cenários integrados, Blaze/billing.
  - [Koyeb — instances](https://www.koyeb.com/docs/reference/instances) e [deploy via GitHub](https://www.koyeb.com/docs/build-and-deploy): uma Free Instance de 512 MB/0,1 vCPU/2 GB, escala a zero após uma hora e fica limitada a uma região.
  - [Railway — free trial](https://docs.railway.com/pricing/free-trial): crédito único de US$ 5 por até 30 dias e depois US$ 1/mês no plano gratuito.
  - [Fly.io — pricing](https://fly.io/docs/about/pricing/) e [free trial](https://fly.io/docs/about/free-trial/): cobrança por uso, cartão obrigatório para organizações e teste de apenas 2 horas de VM ou 7 dias.

## Classificação de Severidade dos Achados

- **P1 — bloqueio de deploy funcional:** os JSON do RAG estão ignorados em `backend/.gitignore`; um clone do GitHub não conterá o corpus local.
- **P2 — experiência:** Render gratuito dorme após inatividade e pode introduzir aproximadamente um minuto de cold start no primeiro acesso.
- **P2 — operação:** rate limit atual é local ao processo; não deve ser considerado distribuído em escala horizontal.
- **P3 — decisão de plataforma:** Vercel Hobby exige atenção ao uso pessoal/não comercial; Railway, Fly.io e Firebase/Cloud Run aumentam custo ou configuração para este estágio.

## Ações Executadas ou Recomendadas

Recomendação para a primeira publicação do desafio:

1. Frontend: **Cloudflare Pages**, com root `frontend`, build `npm run build`, output `dist`, `VITE_API_URL` apontando para a API.
2. Backend: **Render Web Service**, com root `backend`, build `npm ci`, start `npm start`, `PORT` fornecida pela plataforma e `CORS_ORIGIN` igual ao domínio do frontend.
3. Supabase permanece como Auth/Postgres/RLS; não duplicar banco no provedor de hosting.
4. Antes do deploy, decidir uma destas soluções para o RAG: versionar o corpus validado, gerar o corpus durante o build, ou movê-lo para armazenamento persistente. O filesystem gratuito do Render é efêmero.
5. Configurar alertas/limites de uso e manter `GEMINI_API_KEY` apenas nos secrets do backend.

Vercel + Render é uma alternativa válida se o projeto permanecer explicitamente pessoal/não comercial. Netlify é a segunda opção para o frontend se a equipe preferir a experiência de monorepo; Koyeb é a alternativa de backend para teste, não a primeira escolha para uma API pedagógica dependente de Gemini.

## Validações e Limitações

- A análise foi documental; nenhum provedor foi conectado ou cobrado.
- Preços, quotas e termos podem mudar; revisar as páginas oficiais no momento da criação das contas.
- Ainda falta validar o tempo real de cold start, o comportamento CORS com o domínio final, a ingestão do corpus no ambiente publicado e os limites da API Gemini/Supabase em staging.
