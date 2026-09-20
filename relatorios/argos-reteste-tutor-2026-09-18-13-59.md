# Argos — Reteste do Tutor após relato de erro

**Data:** 18/09/2026  
**Alvo:** `POST /api/ai/tutor` no ambiente local configurado pelo frontend.

## Resultado

A mensagem:

> Campo obrigatório ausente ou inválido: "messages" deve ser um array não vazio.

não existe no controlador atual do repositório. Ela pertence à implementação anterior, que recebia `{ messages: [...] }`. O código atual recebe `{ message, conversationId }` e mantém o histórico no servidor.

## Evidências

- `frontend/.env.local` aponta para `http://localhost:5000/api`.
- `frontend/src/TutorAI.jsx` envia `{ message, conversationId }`.
- `backend/controllers/aiController.js` valida `message` e `conversationId`.
- A string do erro relatado não foi encontrada no código atual com busca no repositório.
- `backend/.env` local contém Gemini, porta e CORS, mas não contém `SUPABASE_URL` nem `SUPABASE_PUBLISHABLE_KEY`, exigidas pelo middleware de autenticação atual.

## Diagnóstico

O teste está atingindo um processo antigo do backend, um deploy anterior ou um diretório diferente. Se o processo for reiniciado com o código atual sem configurar Supabase, a resposta esperada para uma chamada autenticada será `503`, não o erro antigo.

## Ação corretiva

1. Encerrar o backend antigo e iniciar novamente a partir de `Minerva/backend`.
2. Configurar no `backend/.env` os mesmos valores Supabase usados no frontend:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_PUBLISHABLE_KEY=sua_chave_anon_supabase
```

3. Reiniciar também o Vite para invalidar o bundle em cache.
4. Confirmar que uma chamada sem Bearer retorna `401`; uma chamada com sessão válida deve então avançar para a validação do Gemini.

## Status

**Código corrigido; ambiente em execução ainda não alinhado com o código do repositório.**

## Segundo reteste

- Não havia processo escutando na porta local `5000` no momento da verificação.
- `npm run dev` não iniciou porque o `nodemon` falhou com `spawn EPERM` neste ambiente; isso é uma limitação de execução do processo, não um erro do controlador.
- O `backend/.env` continua sem `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`.

### Correção operacional da Minerva

Iniciar o backend diretamente, caso o `nodemon` continue bloqueado:

```powershell
cd backend
node src/server.js
```

Em outro terminal, iniciar o frontend:

```powershell
cd frontend
npm run dev
```

Antes do teste autenticado, preencher as duas variáveis Supabase no `backend/.env`. O processo atual deve ser iniciado a partir deste diretório do projeto, não de uma cópia ou deploy antigo.
