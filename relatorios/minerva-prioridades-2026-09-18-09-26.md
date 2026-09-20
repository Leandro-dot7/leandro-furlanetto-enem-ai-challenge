# Minerva — Correção das prioridades do Morpheus

## Prioridade 1 — Contexto confiável do Tutor

Implementada em `backend/services/tutorConversationStore.js`.

- O navegador envia somente `message` e um `conversationId` opaco.
- O backend associa a conversa ao usuário autenticado e armazena pares usuário/modelo por uma hora.
- Histórico fornecido pelo navegador não é mais aceito como fonte de verdade.
- O contexto é limitado aos 12 últimos turnos, reduzindo custo de tokens.

**Limitação conhecida:** o armazenamento é em memória. Ele é adequado para uma instância/MVP, mas deve migrar para Redis ou Supabase antes de escalar horizontalmente ou exigir persistência entre reinícios.

## Prioridade 2 — Recuperação de senha

Foram criadas as rotas públicas `/recuperar-senha` e `/redefinir-senha`.

- A primeira chama `supabase.auth.resetPasswordForEmail` com retorno seguro para a aplicação.
- A segunda valida confirmação e tamanho de senha e chama `supabase.auth.updateUser`.
- A tela de login agora contém o link “Esqueci minha senha”.

**Configuração necessária:** cadastrar `https://<dominio>/redefinir-senha` nas Redirect URLs do Supabase Auth para cada ambiente.

## Prioridade 3 — Foco de teclado no simulado

As alternativas agora usam `focus-within:ring-*` no elemento visual que envolve o rádio oculto. Isso torna a alternativa em foco identificável antes da seleção.

## Verificação

- Sintaxe dos módulos alterados: aprovada.
- Teste local do store de conversa: aprovado.
- Lint do frontend: sem erros, apenas avisos preexistentes.
- Build de produção: aprovado; permanece o aviso de bundle JavaScript acima de 500 kB.
