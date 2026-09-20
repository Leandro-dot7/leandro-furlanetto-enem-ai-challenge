# Morpheus — rodada de UX do Tutor após as correções

**Data:** 19/09/2026  
**Escopo:** Tutor ENEM, com foco em contraste da mensagem do estudante, espera de respostas e cancelamento.  
**Método:** inspeção estática do fluxo React/Axios e do controlador/armazenamento de conversa no backend. Não foi feita navegação autenticada porque o repositório não contém uma conta de teste do Supabase; portanto, as conclusões de interação dinâmica permanecem pendentes de validação no navegador.

## Fluxos exercitados por persona

### Ana — estudante com baixa visão, usando celular

**Objetivo:** enviar uma pergunta e conseguir ler a própria mensagem no histórico.

**Caminho:** abrir o Tutor → escrever uma pergunta → enviar → localizar a bolha da estudante.

**Observação:** a mensagem do estudante usa `bg-indigo-600 text-white` e o componente `MessageText` mantém `text-white` também nos trechos em negrito. A regra `.prose-ai`, que usa texto escuro para respostas do Tutor, não é aplicada à mensagem do estudante.

**Reação simulada:** “Agora consigo distinguir o texto da minha pergunta do fundo escuro.”

**Resultado:** melhoria confirmada no código; contraste visual real em diferentes telas ainda precisa de teste navegável.

**Severidade residual:** baixa (validação pendente).

### Bruno — estudante impaciente, em conexão lenta

**Objetivo:** recuperar o controle quando a resposta demora.

**Caminho:** enviar pergunta → aguardar estado “Pensando...” → acionar “Parar” → continuar a conversa.

**Observação:** durante a requisição, o campo é desabilitado e o botão “Parar” fica disponível, com nome acessível, ícone e foco visível. O `AbortController` remove o placeholder de carregamento, libera o campo e devolve o foco ao input.

**Reação simulada:** “Se a resposta travar, consigo interromper e tentar de novo.”

**Achado residual:** o cancelamento interrompe a requisição no navegador, mas o backend continua aguardando o Gemini. Se o estudante enviar outra pergunta imediatamente, a resposta da primeira chamada pode chegar depois e ser anexada à conversa no servidor. Isso pode deixar a ordem do contexto diferente da ordem exibida na tela e consumir uma chamada de IA que o estudante cancelou.

**Severidade:** média, com potencial de alta em conversas rápidas.

**Sugestão:** associar cada turno a um `requestId`/sequência no servidor e marcar cancelamentos; antes de gravar a resposta, verificar se o turno ainda está ativo. Idealmente, propagar o sinal de cancelamento ao cliente Gemini quando o SDK permitir.

### Luana — estudante que navega pelo teclado

**Objetivo:** enviar, cancelar e retomar uma resposta sem perder o foco.

**Caminho:** focar o campo → enviar com Enter → mover foco ao botão “Parar” → cancelar → continuar digitando.

**Observação:** o formulário tem rótulo associado ao input, o botão de cancelamento é nativamente focável e possui `focus:ring`; ao terminar (sucesso, erro ou cancelamento), o foco retorna ao campo. O chat usa `role="log"`, `aria-live="polite"` e `aria-relevant="additions"`.

**Reação simulada:** “Consigo interromper a espera sem usar o mouse e volto direto para o campo.”

**Resultado:** não foi identificado bloqueio estático. Validar com leitor de tela para confirmar a verbalização da troca entre “Pensando...”, erro e resposta.

**Severidade residual:** baixa (validação pendente).

## Matriz de resultado

| Área | Estado | Evidência | Próximo passo |
|---|---|---|---|
| Contraste da mensagem do estudante | Corrigido no código | `text-white` no balão e em negrito | Teste visual em viewport móvel e modo de alto contraste |
| Controle durante latência | Melhorado | “Parar” + `AbortController` + foco restaurado | Validar rede lenta e repetição após cancelamento |
| Cancelamento servidor | Risco residual | `tutorChat` não recebe sinal de abort e grava o turno após o Gemini retornar | Implementar proteção por sequência/requestId antes de alterar o backend |
| Navegação por teclado | Sem bloqueio estático | labels, foco visível, `aria-live` e retorno de foco | Teste com teclado e leitor de tela |

## Verificações técnicas da rodada

- `npm run lint` (frontend): aprovado; permanecem apenas avisos preexistentes de imports/fast refresh.
- `npm run build` (frontend): aprovado; apenas o aviso conhecido de bundle principal acima de 500 kB.
- Não foram feitas alterações de código nesta rodada do Morpheus.

## Conclusão

As correções solicitadas para legibilidade e controle da espera estão presentes e reduzem a fricção no Tutor. O ponto que merece a próxima intervenção é a corrida entre cancelamento no navegador e gravação tardia no servidor. Recomenda-se validar esse cenário com duas perguntas consecutivas em rede lenta antes de liberar uma correção de concorrência.
