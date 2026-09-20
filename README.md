# Minerva ENEM

Plataforma de preparação para o ENEM com simulados, tutor pedagógico e correção de redação assistidos por IA.

O projeto combina React, Express, Supabase e Google Gemini. O backend concentra as chamadas de IA, valida a sessão do estudante e aplica limites de uso; o frontend não contém chaves privadas.

## Funcionalidades

- Dashboard com evolução de estudos.
- Autenticação Supabase: cadastro, login, logout, recuperação e redefinição de senha.
- Simulados por área do conhecimento, com questões, alternativas, gabarito e explicação.
- Tutor ENEM com escopo pedagógico, recusa fora do tema e histórico persistido por estudante no Supabase.
- Correção de redação pelas competências C1–C5.
- Histórico de simulados e redações com Row Level Security (RLS).
- Interface responsiva com suporte a teclado, landmarks e mensagens acessíveis.

O modo claro é o padrão da primeira visita; o alternador de tema fica disponível no canto superior direito e a escolha é persistida no navegador.

## Arquitetura

```mermaid
flowchart LR
  Browser[React + Vite]
  Auth[(Supabase Auth)]
  Data[(Supabase PostgreSQL + RLS)]
  API[Express API]
  RAG[Corpus local ENEM]
  AI[Gemini Service]

  Browser -->|sessão e histórico| Auth
  Browser -->|dados protegidos| Data
  Browser -->|Bearer token| API
  API -->|valida sessão + rate limit| Auth
  API -->|recupera referência curta| RAG
  API --> AI
  AI --> Gemini[Google Gemini]
```

O frontend protege as páginas para melhorar a experiência, mas a autorização real das rotas de IA acontece no backend. O Tutor mantém o histórico confiável por usuário nas tabelas `tutor_conversas` e `tutor_mensagens`; o navegador envia somente a nova mensagem e o identificador da conversa. Ao abrir a tela, a última conversa é restaurada pela rota `GET /api/ai/tutor/latest`.

## RAG de questões ENEM

O Tutor e o gerador de simulados usam um índice lexical local com questões de **2015 a 2023**. A ingestão atual possui **1.553 questões**: 181 (2015), 181 (2016), 181 (2017), 181 (2018), 107 (2019), 180 (2020), 181 (2021), 181 (2022) e 180 (2023). A quantidade de 2019 é a quantidade retornada pela API, sem preenchimento artificial.

O Tutor recupera uma referência curta antes de responder. O gerador de simulados recupera até duas referências compactas da área solicitada antes de gerar questões inéditas. O corpus é lido localmente durante as perguntas; a API externa é usada somente no job de ingestão. O contexto enviado ao modelo é limitado para evitar o envio do corpus inteiro e reduzir dependência de rede.

Os arquivos do corpus ficam em `backend/data/enem-rag/` e são versionados pelo Git. Após uma nova ingestão, reinicie o backend para recarregar o índice em memória. A API é comunitária; valide amostras contra o INEP antes de usar o corpus como fonte oficial.

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router 7, Recharts, Lucide React, Axios |
| Backend | Node.js 18+, Express 5, `@google/genai`, CORS, Dotenv |
| Dados e autenticação | Supabase Auth, PostgreSQL e RLS |
| IA | Google Gemini com instruções de sistema e respostas JSON |

## Agentes do projeto

A governança e ciclo de handoff entre os agentes é detalhada em [agents.md](agents.md). A especificação do sistema está em [spec.md](spec.md).

- [Minerva](agents/Minerva.md): engenharia, arquitetura, estabilidade e evolução full-stack.
- [Morpheus](agents/Morpheus.md): personas sintéticas, UX, acessibilidade e reteste de regressões.
- [Argos](agents/Argos.md): segurança ofensiva autorizada, com evidências reproduzíveis.

As execuções e correções ficam registradas em [relatorios/](relatorios/).

## Requisitos

- Node.js 18 ou superior.
- Projeto Supabase com Auth habilitado.
- Chave da API do Gemini.

## Configuração local

### 1. Banco de dados

Execute [`supabase_schema.sql`](supabase_schema.sql) no SQL Editor do projeto Supabase. O script cria as tabelas de perfis, simulados e redações, habilita as políticas RLS por usuário e concede os privilégios SQL necessários ao papel `authenticated`. Se as tabelas já existirem, execute também o bloco de `GRANT` ao final do arquivo.

### 2. Backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Preencha `backend/.env`:

```env
PORT=5000
GEMINI_API_KEY=sua_chave_do_gemini
CORS_ORIGIN=http://localhost:5173
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_PUBLISHABLE_KEY=sua_chave_anon_supabase
ENEM_API_BASE_URL=https://api.enem.dev/v1
ENEM_RAG_YEARS=2015,2016,2017,2018,2019,2020,2021,2022,2023
```

Inicie:

```powershell
npm run dev
```

Para carregar o corpus inicial do Tutor e dos simulados, execute uma ingestão versionada antes de iniciar o backend:

```powershell
npm run rag:ingest -- 2015 2016 2017 2018 2019 2020 2021 2022 2023
```

O job respeita o limite da API, grava o corpus em `backend/data/enem-rag/` (versionado) e o Tutor e o gerador de simulados consultam somente referências locais durante a geração. Após uma nova ingestão, revise as amostras, commite as alterações e reinicie o backend para recarregar o corpus.

Endpoints principais:

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/ai/tutor` | Responder ao Tutor |
| GET | `/api/ai/tutor/latest` | Restaurar a última conversa persistida |
| POST | `/api/ai/simulado/gerar` | Gerar questões |
| POST | `/api/ai/redacao/gerar-tema` | Gerar tema |
| POST | `/api/ai/redacao/corrigir` | Corrigir redação |

As rotas `/api/ai/*` exigem `Authorization: Bearer <access_token>` e aplicam limite de chamadas. Nunca coloque `GEMINI_API_KEY` no frontend.

### 3. Frontend

```powershell
cd frontend
npm install
```

Crie `frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_anon_supabase
VITE_API_URL=http://localhost:5000/api
```

Inicie:

```powershell
npm run dev
```

Abra o endereço informado pelo Vite, normalmente `http://localhost:5173`.

No Supabase Auth, adicione `http://localhost:5173/redefinir-senha` às Redirect URLs. Em produção, cadastre também a URL equivalente do domínio publicado.

## Deploy para a apresentação

O frontend será publicado no Cloudflare Pages e o backend como Render Web Service. No Cloudflare Pages, use `frontend` como diretório raiz, `npm run build` como comando e `dist` como saída. No Render, use `backend` como Root Directory, `npm ci` como Build Command e `npm start` como Start Command.

Variáveis do frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_API_URL` apontando para a URL pública do Render. Variáveis do backend: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `CORS_ORIGIN` apontando para o domínio do Cloudflare Pages.

Durante os testes online, mantenha os serviços ligados apenas pelo período necessário. Antes do desligamento, valide `/api/health`, login, Tutor, simulado, redação e persistência. No dia 22, religue o Render e o Cloudflare Pages algumas horas antes das 9h e execute um smoke test final.

## Validação

No frontend:

```powershell
npm run lint
npm run build
```

No backend:

```powershell
node --check services/enemRagService.js
node --check services/geminiService.js
npm audit --omit=dev --audit-level=high
```

Para executar o backend em desenvolvimento, use `npm run dev` ou, em modo de execução, `npm start`.

O projeto também possui auditorias documentadas em `relatorios/`, incluindo as rodadas Argos e Morpheus e as correções aplicadas pela Minerva.

## Segurança e limites atuais

- RLS restringe dados ao `auth.uid()` do estudante.
- CORS é configurável por ambiente; ele não é usado como autenticação.
- O limite de IA está em memória na configuração atual. Para múltiplas instâncias, migrar esse estado para Redis ou outra camada compartilhada; o contexto do Tutor é persistido no Supabase.
- Testes dinâmicos contra homologação exigem URL, janela e contas de teste autorizadas.
- O Tutor e o gerador de simulados usam RAG lexical com cache local da API enem.dev; a evolução é validar qualidade, origem e busca híbrida quando houver métricas suficientes.

## Operação e limites do RAG

- A API de questões é comunitária e não substitui a validação com fonte oficial do INEP.
- A economia efetiva de tokens e latência deve ser medida em homologação; o sistema limita o contexto, mas não garante redução para toda pergunta.
- O índice lexical é carregado em memória no processo atual. Para múltiplas instâncias, migrar o índice e os limites para uma camada compartilhada.

## Roadmap de RAG para simulados

Estado atual: o corpus local cobre 2015–2023 e o gerador consulta até duas referências compactas da área antes de criar novas questões. Os itens abaixo são a evolução de qualidade e governança, não pré-requisitos para o fluxo atual.

1. Catalogar habilidades da Matriz ENEM e fontes licenciadas.
2. Criar banco de questões aprovadas, com dificuldade, habilidade, tema e hash.
3. Adicionar cache e exclusão de questões já respondidas.
4. Indexar corpus curado com busca textual + vetorial.
5. Recuperar poucos trechos e gerar somente quando não houver questão adequada.
6. Medir custo, latência, repetição, validade do JSON e qualidade pedagógica.

## Autor

Desenvolvido por Leonardo Furlanetto para um desafio de inovação educacional com IA.
