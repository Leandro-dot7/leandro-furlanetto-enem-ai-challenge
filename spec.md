# Minerva ENEM — Especificação do Sistema (spec.md)

> **Tipo de Documento:** Especificação Técnica e Funcional (Single Source of Truth - SSOT)  
> **Status do Projeto:** Consolidado / Brownfield  
> **Última Atualização:** 2026-09-20  
> **Repositório:** `Minerva`  

---

## 1. Visão Geral e Propósito

O **Minerva ENEM** é uma plataforma educacional web de preparação para o Exame Nacional do Ensino Médio (ENEM). Combina geração de simulados adaptados, tutoria conversacional pedagógica e avaliação analítica de redações dissertativo-argumentativas segundo as diretrizes oficiais do INEP.

A arquitetura prioriza:
- **Segurança de credenciais e custos:** Toda inferência de LLM e validação de tokens passa pelo backend; o frontend não possui chaves de API pagas.
- **Rigor pedagógico:** Uso de RAG (Retrieval-Augmented Generation) com base em questões reais do ENEM para mitigar alucinações e manter aderência à Matriz de Referência.
- **Isolamento de dados:** Políticas estritas de Row Level Security (RLS) no PostgreSQL garantem que nenhum estudante acesse dados de terceiros.

---

## 2. Stack Tecnológica e Infraestrutura

```mermaid
flowchart LR
  subgraph Cliente["Cliente (Navegador)"]
    React["React 19 + Vite\nTailwind CSS v4\nReact Router 7"]
  end

  subgraph Backend["Serviço Backend (Node.js)"]
    Express["Express 5 (ESM)\naiSecurity (Auth + Rate Limit)\nControllers & Services"]
    RAG["Corpus RAG Local\n(1.553 questões 2015-2023)"]
    MemoryStore["tutorConversationStore\n(Sessões em memória)"]
  end

  subgraph Externos["Serviços Externos"]
    SupabaseAuth["Supabase Auth\n(GoTrue /auth/v1/user)"]
    SupabaseDB[("Supabase PostgreSQL\n+ RLS Ativo")]
    Gemini["Google Gemini API\n(@google/genai)\ngemini-3.6-flash / 3.5-flash-lite"]
  end

  React -->|Login / Cadastro| SupabaseAuth
  React -->|Consultas com JWT (RLS)| SupabaseDB
  React -->|Bearer Token + Payloads| Express
  Express -->|Validação de Token| SupabaseAuth
  Express -->|Consulta Lexical| RAG
  Express <-->|Histórico Seguro| MemoryStore
  Express -->|Prompt Estruturado + JSON Schema| Gemini
```

| Camada | Tecnologias / Versões | Atribuição no Sistema |
|---|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS 4, React Router 7, Recharts, Lucide React, Axios | Interface de usuário (SPA), acessibilidade (WCAG AA), temas claro/escuro persistidos no `localStorage`. |
| **Backend API** | Node.js 18+, Express 5 (ESM), Dotenv, CORS | Endpoints REST, validação de sessão Supabase, rate limiting por usuário, proxy para LLM. |
| **Inteligência Artificial** | Google Gemini SDK (`@google/genai`), modelos `gemini-3.6-flash` e `gemini-3.5-flash-lite` | Chat do Tutor, geração de simulados estruturados (JSON), temas e correções de redação. |
| **Base Vetorial/RAG** | Arquivos locais em `backend/data/enem-rag/` gerados via script de ingestão | Busca lexical de questões reais para contextualização pedagógica sem chamadas de rede externas em runtime. |
| **Banco e Autenticação** | Supabase Auth + PostgreSQL 15+ com RLS | Autenticação (cadastro, login, redefinição de senha) e persistência de perfis, simulados e redações. |

---

## 3. Módulos Funcionais e Regras de Negócio

### 3.1. Dashboard e Metas do Estudante
- Exibe o progresso histórico em simulados (acertos por matéria) e a evolução das notas de redação.
- Permite ao estudante definir e atualizar sua meta de pontuação e curso de interesse (persistido na tabela `perfis`).

### 3.2. Simulados Inteligentes
- **Parâmetros:** Seleção de área/matéria do ENEM (Linguagens, Humanas, Natureza, Matemática) e volume de questões (`numQuestoes` entre 1 e 20).
- **Ancoragem RAG:** O backend seleciona até 2 questões históricas compactas da área solicitada para guiar estilo, vocabulário e padrão de distratores do modelo.
- **Formato da Questão:**
  - Enunciado contextualizado com situação-problema ou texto de apoio.
  - 5 alternativas indexadas de `"A"` a `"E"`, com rigorosa unicidade de resposta correta.
  - Campo `gabarito` contendo a letra correta.
  - Campo `explicacao` trazendo o raciocínio pedagógico da correta e a identificação dos distratores.
- **Persistência:** O resultado é salvo pelo cliente autenticado diretamente na tabela `simulados` via Supabase client, respeitando a RLS.

### 3.3. Tutor ENEM (Chat Pedagógico)
- **Hard Constraints de Escopo:** Exclusividade total para matérias do ENEM, conteúdos de Ensino Médio, técnicas de prova e estrutura de redação. Perguntas fora de escopo são educadamente recusadas e redirecionadas para os estudos.
- **Gestão de Sessão Server-side:** O frontend transmite apenas `message` e o opcional `conversationId`. O histórico prévio fica armazenado no servidor (`tutorConversationStore.js`), impedindo que o estudante adultere mensagens passadas do sistema ou do assistente.
- **Cancelamento Elegante:** Suporte a `AbortController` — se o usuário interrompe a requisição no navegador, o backend aborta a chamada ao Gemini e cancela o processamento para economizar quota e evitar inconsistência de histórico.
- **RAG Lexical Integrado:** Realiza varredura rápida na base local de questões com base nos termos da dúvida do aluno, injetando contexto suplementar em bloco `<REFERENCIAS_RECUPERADAS>`.

### 3.4. Redação Nota 1000
- **Geração de Tema:** Produção sob demanda de tema inédito no estilo INEP (`tema`, `eixo` temático e `contexto` motivador).
- **Regras de Correção Oficial (C1–C5):**
  - Avaliação individual das 5 competências do ENEM.
  - **Notas permitidas por competência:** Múltiplos estritos de 40 pontos: `0`, `40`, `80`, `120`, `160` ou `200`.
  - Nota final calculada como a soma exata: `C1 + C2 + C3 + C4 + C5` (escala de 0 a 1000 pontos).
  - Penalidades explícitas aplicadas pelo prompt: textos com apenas 1 ou 2 parágrafos têm teto de 80 pts na C2; ausência de conectivos interparágrafos reduz C4 para no máximo 80–120 pts; na C5, contagem mandatória dos 5 elementos da proposta de intervenção (Agente, Ação, Modo/Meio, Efeito/Finalidade e Detalhamento).
- **Validação de Entrada:** O texto enviado deve conter no mínimo 50 caracteres para ser aceito pelo backend.

---

## 4. Contratos de API (Backend Express)

Todas as rotas de IA estão agrupadas sob `/api/ai/*` e aplicam os middlewares `requireSupabaseUser` e `aiRateLimit`.

### 4.1. `POST /api/ai/tutor`
- **Headers:** `Authorization: Bearer <access_token>`
- **Body:**
  ```json
  {
    "message": "string (1 a 4000 caracteres)",
    "conversationId": "string (opcional, até 64 caracteres) | null"
  }
  ```
- **Respostas:**
  - `200 OK`: `{"resposta": "string (markdown)", "conversationId": "uuid"}`
  - `400 Bad Request`: Mensagem inválida ou tamanho excedido.
  - `401 Unauthorized`: Token ausente, inválido ou expirado.
  - `429 Too Many Requests`: Limite de requisições excedido.
  - `500 Internal Server Error`: Falha nos provedores de LLM.

### 4.2. `POST /api/ai/simulado/gerar`
- **Headers:** `Authorization: Bearer <access_token>`
- **Body:**
  ```json
  {
    "materia": "string (ex: 'Matemática e suas Tecnologias')",
    "numQuestoes": 5
  }
  ```
- **Respostas:**
  - `200 OK`:
    ```json
    {
      "materia": "Matemática e suas Tecnologias",
      "questoes": [
        {
          "id": 1,
          "enunciado": "...",
          "alternativas": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },
          "gabarito": "A",
          "explicacao": "..."
        }
      ]
    }
    ```
  - `400 Bad Request`: Parâmetros ausentes ou `numQuestoes` fora do intervalo `[1, 20]`.
  - `502 Bad Gateway`: Resposta do modelo não pôde ser convertida em JSON válido.

### 4.3. `POST /api/ai/redacao/gerar-tema`
- **Headers:** `Authorization: Bearer <access_token>`
- **Body:** `{}` (vazio)
- **Respostas:**
  - `200 OK`:
    ```json
    {
      "tema": "Desafios para a valorização da ciência no Brasil contemporâneo",
      "eixo": "Científico e Tecnológico",
      "contexto": "..."
    }
    ```

### 4.4. `POST /api/ai/redacao/corrigir`
- **Headers:** `Authorization: Bearer <access_token>`
- **Body:**
  ```json
  {
    "tema": "string não vazia",
    "texto": "string com no mínimo 50 caracteres"
  }
  ```
- **Respostas:**
  - `200 OK`:
    ```json
    {
      "notaTotal": 760,
      "competencias": {
        "C1": { "nota": 160, "titulo": "Domínio da norma culta", "feedback": "..." },
        "C2": { "nota": 160, "titulo": "Compreensão do tema", "feedback": "..." },
        "C3": { "nota": 120, "titulo": "Projeto de texto", "feedback": "..." },
        "C4": { "nota": 160, "titulo": "Coesão e conectivos", "feedback": "..." },
        "C5": { "nota": 160, "titulo": "Proposta de intervenção", "feedback": "..." }
      },
      "pontosFortes": ["..."],
      "pontosMelhoria": ["..."],
      "dicaOuro": "..."
    }
    ```

---

## 5. Modelo de Dados e Segurança (Supabase / PostgreSQL)

Arquivo de referência: [`supabase_schema.sql`](supabase_schema.sql).

### 5.1. Esquema Relacional
- **`public.perfis`**:
  - `id`: UUID PRIMARY KEY (`uuid_generate_v4()`)
  - `user_id`: UUID NOT NULL UNIQUE REFERENCES `auth.users(id)` ON DELETE CASCADE
  - `name`: TEXT
  - `curso_alvo`: TEXT
  - `meta_pontuacao`: INTEGER
  - `updated_at`: TIMESTAMPTZ NOT NULL
- **`public.simulados`**:
  - `id`: UUID PRIMARY KEY
  - `user_id`: UUID NOT NULL REFERENCES `auth.users(id)` ON DELETE CASCADE
  - `materia`: TEXT NOT NULL
  - `total_questoes`: INTEGER NOT NULL
  - `acertos`: INTEGER NOT NULL
  - `respostas`: JSONB
  - `questoes`: JSONB
  - `criado_em`: TIMESTAMPTZ NOT NULL
- **`public.redacoes`**:
  - `id`: UUID PRIMARY KEY
  - `user_id`: UUID NOT NULL REFERENCES `auth.users(id)` ON DELETE CASCADE
  - `tema`: TEXT NOT NULL
  - `texto`: TEXT NOT NULL
  - `nota_total`: INTEGER NOT NULL
  - `competencias`: JSONB NOT NULL
  - `criado_em`: TIMESTAMPTZ NOT NULL

### 5.2. Políticas de Row Level Security (RLS)
- Toda tabela possui RLS habilitado:
  - `perfis`: SELECT, INSERT, UPDATE restritos a `auth.uid() = user_id`.
  - `simulados`: SELECT e INSERT restritos a `auth.uid() = user_id`.
  - `redacoes`: SELECT e INSERT restritos a `auth.uid() = user_id`.
- Permissões concedidas ao papel `authenticated`:
  - `GRANT USAGE ON SCHEMA public TO authenticated;`
  - `GRANT SELECT, INSERT, UPDATE ON public.perfis TO authenticated;`
  - `GRANT SELECT, INSERT ON public.simulados, public.redacoes TO authenticated;`

---

## 6. Pipeline de RAG (Corpus ENEM 2015–2023)

- **Armazenamento:** Diretório não versionado `backend/data/enem-rag/`.
- **Volume:** 1.553 questões validadas cobrindo os anos 2015 a 2023.
- **Ingestão:** Script executado via CLI (`npm run rag:ingest`) que consome a API comunitária `enem.dev` com controle de rate limit e salva arquivos particionados por ano e área.
- **Consumo em Runtime:**
  - Carregado em memória na inicialização do serviço backend (`enemRagService.js`).
  - Indexação textual/lexical simples baseada em correspondência de termos e palavras-chave.
  - Limite estrito de tokens: fragmentos recuperados são truncados (máx 3.000 caracteres) para não sobrecarregar a janela de contexto nem aumentar latência desnecessariamente.

---

## 7. Requisitos Não-Funcionais e Invariantes de Operação

1. **Segurança de Autenticação:**
   - O backend nunca confia no `user_id` enviado no body de requisições. O identificador do usuário é extraído do token Bearer validado diretamente no endpoint `/auth/v1/user` do Supabase.
2. **Rate Limiting:**
   - Janela de 15 minutos com teto de 30 requisições de IA por usuário autenticado (`aiRateLimit`).
   - Respostas bloqueadas retornam status `429` com cabeçalho `Retry-After`.
3. **Resiliência de Modelos:**
   - Fallback automático entre os modelos configurados (`gemini-3.6-flash` -> `gemini-3.5-flash-lite`).
4. **Acessibilidade e Usabilidade:**
   - Conformidade com padrões WCAG 2.1 nível AA: contraste de texto adequado, suporte a navegação por teclado (foco visível) e marcação semântica com ARIA (`aria-live`, landmarks).
5. **Limitações Conhecidas:**
   - Rate limiting e sessões do tutor residem em memória local do processo Node.js. Arquiteturas com réplicas horizontais exigirão migração para Redis ou persistência no PostgreSQL.
