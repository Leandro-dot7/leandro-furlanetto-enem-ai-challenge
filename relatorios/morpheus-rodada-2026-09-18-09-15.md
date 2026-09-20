# Morpheus — Rodada de UX após as correções da Minerva

**Data:** 18/09/2026  
**Método:** inspeção estática do frontend e dos fluxos cliente-servidor. Não foi possível realizar navegação autenticada: o repositório não contém credenciais de teste do Supabase.

## Perfil do alvo

- **Produto:** Minerva ENEM
- **Interfaces:** dashboard web e Tutor IA conversacional
- **Público:** estudantes brasileiros preparando-se para o ENEM
- **Fluxos analisados:** acesso, simulado, redação, Tutor e navegação móvel
- **Fase:** pré-lançamento, inferido pela presença de URLs de deploy placeholder no README

## Personas e achados

### Ana, 17 anos — estudante mobile, conexão instável

**Fluxo:** gerar um simulado e aguardar as questões.

**Observação:** a tela de carregamento informa que a IA está gerando o conteúdo, mas não apresenta estimativa, ação de cancelar nem tentativa novamente enquanto a espera está em curso. Em caso de falha, a pessoa volta à configuração com uma mensagem de erro.

**Reação:** “Não sei se ainda está carregando ou se travou; fico esperando sem saber o que fazer.”

**Severidade:** Média.

**Sugestão:** adicionar estado de progresso/tempo esperado, botão de cancelar e CTA de tentar novamente junto ao erro.

### Rafael, 18 anos — estudante que aprende por diálogo

**Fluxo:** fazer perguntas de continuidade ao Tutor ENEM.

**Observação:** como mitigação de segurança, o backend agora descarta mensagens com papel `model` que chegam do navegador. Isso protege contra histórico forjado, mas também remove as respostas anteriores do Tutor. Perguntas como “pode explicar melhor o segundo passo?” passam ao Gemini sem o “segundo passo” referido.

**Reação:** “Parece que o tutor esqueceu o que ele mesmo acabou de me explicar.”

**Severidade:** Alta.

**Sugestão:** manter histórico confiável no servidor, vinculado ao usuário e a uma conversa; não restaurar a confiança no histórico enviado pelo cliente. Até existir essa persistência, avisar visualmente que cada pergunta é tratada de forma independente.

### Luana, 19 anos — usuária que navega só com teclado

**Fluxo:** responder às alternativas do simulado.

**Observação:** os controles de rádio são visualmente ocultos com `sr-only`. A alternativa é selecionável por teclado, porém não há estilo `focus-within` no rótulo da opção; portanto, o foco pode não ser visível antes da seleção.

**Reação:** “Não consigo ver em qual alternativa o teclado está parado.”

**Severidade:** Média.

**Sugestão:** adicionar uma borda/anel de foco visível à `label` com `focus-within`, sem depender da seleção da alternativa.

### Carlos, 23 anos — estudante retornando após esquecer a senha

**Fluxo:** recuperar o acesso à conta.

**Observação:** a tela de login possui e-mail, senha e link de cadastro, mas não oferece recuperação de senha.

**Reação:** “Tenho conta, mas esqueci a senha; parece que preciso criar outra.”

**Severidade:** Alta.

**Sugestão:** incluir “Esqueci minha senha”, com fluxo de `resetPasswordForEmail` do Supabase e confirmação clara de envio.

## Aspectos positivos

- Campos de autenticação têm rótulos associados, autocomplete e mensagens de erro com `role="alert"`.
- O Tutor usa `role="log"`, `aria-live="polite"` e mantém foco no campo após uma resposta.
- A seleção de quantidade de questões usa `aria-pressed`; alternativas usam controles de rádio.
- Redação apresenta contagem de palavras/caracteres e explica o mínimo antes de liberar o envio.

## Prioridade recomendada

1. Preservar contexto do Tutor de forma confiável no servidor.
2. Implementar recuperação de senha.
3. Corrigir foco visível nas alternativas.
4. Melhorar a espera/recuperação de falha no simulado.

Estes achados são hipóteses de UX derivadas do código e devem ser validados em uma rodada navegada com contas de teste e, idealmente, estudantes reais.
