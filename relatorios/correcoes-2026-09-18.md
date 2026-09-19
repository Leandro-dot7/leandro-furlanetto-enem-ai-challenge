# Minerva — Correções de segurança aplicadas

**Data:** 18/09/2026  
**Origem:** achados `ARG-001` a `ARG-003` da rodada Argos.

## Implementado

1. **Autenticação de IA no backend**
   - Todas as rotas sob `/api/ai` agora exigem `Authorization: Bearer <access token>`.
   - O token é validado contra `/auth/v1/user` do Supabase antes de qualquer chamada ao Gemini.
   - Se `SUPABASE_URL` ou `SUPABASE_PUBLISHABLE_KEY` não estiverem configuradas no backend, o acesso é negado de forma segura (`503`).
   - O frontend passou a anexar a sessão Supabase nas requisições Axios.

2. **Controle de consumo**
   - Limite em memória de 30 chamadas de IA por usuário autenticado a cada 15 minutos.
   - Corpo JSON limitado a 64 KB.
   - Em múltiplas instâncias do backend, migrar o contador para Redis ou outro armazenamento compartilhado.

3. **Integridade do histórico do Tutor**
   - Máximo de 12 mensagens e 4.000 caracteres por mensagem.
   - Papéis e conteúdo são validados.
   - Mensagens declaradas como `model` pelo navegador são descartadas; somente as mensagens do estudante seguem ao Gemini.

4. **Headers defensivos da API**
   - `Cache-Control: no-store`, CSP restritiva para respostas JSON, `X-Content-Type-Options`, `X-Frame-Options` e `Referrer-Policy`.

## Configuração obrigatória para deploy

Configure no ambiente do **backend**:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_PUBLISHABLE_KEY=sua_chave_anon_supabase
```

Sem essas variáveis, as rotas de IA retornam `503` intencionalmente, em vez de ficarem públicas.

## Verificações executadas

- Sintaxe Node dos arquivos alterados.
- Lint do frontend: sem erros; avisos preexistentes de imports não usados.
- Build de produção do frontend concluído com sucesso; há apenas o aviso do Vite sobre bundle JavaScript acima de 500 kB.
- `npm audit --offline --omit=dev` em frontend e backend: nenhuma vulnerabilidade conhecida reportada.

## Riscos restantes

- Falta validar os controles em homologação com contas de teste e uma instância Supabase real.
- O rate limit é local à instância; não basta para ambiente horizontalmente escalado.
- A validação do token depende temporariamente da disponibilidade do Supabase Auth. Um próximo passo é validar JWT por JWKS com cache local.
