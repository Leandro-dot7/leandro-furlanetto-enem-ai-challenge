# Morpheus — rodada de UX do Tutor após o RAG

**Data:** 19/09/2026  
**Produto:** Minerva ENEM  
**Perfil:** dashboard web responsivo e Tutor IA conversacional para estudantes brasileiros do ENEM.  
**Escopo:** reteste estático após a implementação do RAG local, com foco em legibilidade, espera, cancelamento, continuidade da conversa e confiança no conteúdo recuperado.

**Método:** inspeção dos componentes React, cliente Axios, controlador do Tutor, store de conversa e build/lint do frontend. Não há credenciais de teste nem ferramenta de navegador autenticada neste ambiente; portanto, achados de interação visual são hipóteses até serem validados na plataforma.

## Personas e fluxos

### Ana — estudante mobile, conexão instável e baixa visão

**Objetivo:** enviar uma dúvida curta e ler a resposta sem perder o controle da tela.

**Caminho simulado:** abrir Tutor → enviar pergunta → observar “Pensando...” → ler resposta formatada → cancelar uma segunda pergunta.

**Observações:** a mensagem do estudante usa texto branco sobre fundo índigo; a resposta do Tutor usa texto escuro e blocos formatados. O campo fica desabilitado durante a requisição, mas o botão “Parar” permanece disponível e o foco volta ao campo após sucesso, erro ou cancelamento.

**Reação provável:** “Consigo diferenciar minha pergunta da resposta e sei como interromper uma espera longa.”

**Avaliação:** Usabilidade ★★★★☆ | Clareza ★★★★☆ | Confiança visual ★★★★☆  
**Severidade:** baixa, validação visual pendente.

### Bruno — estudante impaciente, usando rede móvel

**Objetivo:** cancelar uma resposta lenta e fazer uma nova pergunta sem contaminar a conversa.

**Caminho simulado:** enviar pergunta → clicar “Parar” → enviar outra pergunta.

**Observações:** o frontend aborta o Axios; o backend escuta `req.aborted`/`res.close`, propaga `AbortSignal` ao Gemini, não usa fallback após abort e não grava o turno cancelado. A proteção está presente no código e corrige o risco registrado na rodada anterior.

**Reação provável:** “O cancelamento parece geral, mas preciso ver a resposta desaparecer e a segunda pergunta manter a ordem correta.”

**Avaliação:** Usabilidade ★★★★☆ | Clareza ★★★★☆ | Confiança visual ★★★★☆  
**Severidade residual:** baixa, dependente de teste real em rede lenta e de uma segunda pergunta consecutiva.

### Luana — estudante que navega apenas por teclado/leitor de tela

**Objetivo:** enviar, interromper e retomar uma conversa sem mouse.

**Caminho simulado:** focar o input → Enter → Tab até “Parar” → cancelar → digitar novamente.

**Observações:** há `label` associado ao input, botão nativo com `aria-label`, foco visível e retorno de foco ao campo. O log usa `role="log"`, `aria-live="polite"` e `aria-relevant="additions"`. O estado “Pensando...” não expõe explicitamente `aria-busy`.

**Reação provável:** “Consigo operar o fluxo, mas o leitor de tela pode não deixar claro quando a geração terminou ou foi cancelada.”

**Avaliação:** Usabilidade ★★★★☆ | Clareza ★★★☆☆ | Confiança visual ★★★★☆  
**Severidade:** média-baixa (acessibilidade pendente).

**Sugestão:** considerar `aria-busy` no log enquanto a requisição estiver ativa e uma mensagem de status explícita para “resposta cancelada”. Validar com leitor de tela antes de classificar como falha.

### Rafael — estudante que pergunta por referência e quer conferir a fonte

**Objetivo:** perguntar sobre uma questão do ENEM e entender de onde veio a explicação.

**Caminho simulado:** perguntar sobre um tema/questão → aguardar o Tutor → procurar indicação de fonte na bolha.

**Observações:** o RAG local recupera no backend no máximo uma referência curta e informa a fonte ao modelo, mas a interface não apresenta ao estudante qual questão foi recuperada nem diferencia fato do corpus de explicação gerada. A API usada é comunitária; a aplicação não afirma visualmente que o conteúdo é oficial do INEP.

**Reação provável:** “A resposta parece confiável, mas não sei qual prova ou gabarito o Tutor consultou.”

**Avaliação:** Usabilidade ★★★★☆ | Clareza ★★★☆☆ | Confiança visual ★★★☆☆  
**Severidade:** média (confiança pedagógica; não é falha funcional confirmada).

**Sugestão:** quando houver referência, oferecer uma indicação discreta como “Referência consultada: ENEM 2023, questão X”, sem expor o prompt interno. Permitir ocultar essa informação em telas compactas.

## Pontos positivos

- O cancelamento recebeu controle visível e propagação servidor-side, corrigindo o principal risco de UX da rodada anterior.
- A resposta do Tutor deixou de aparecer como Markdown cru: títulos, listas, links seguros, citações e código recebem estrutura visual.
- Mensagens do estudante têm contraste explícito e o input possui label acessível.
- O RAG evita chamada externa por pergunta e mantém o contexto enviado ao modelo curto, reduzindo espera de rede e contexto excessivo.
- Simulado e histórico mantêm foco visível nas alternativas e estados de carregamento/error já identificáveis.

## Regressões ou riscos de UX

1. **Média — transparência da referência do RAG:** o estudante não sabe quando uma questão local foi usada nem sua origem.
2. **Média-baixa — anúncio de estado para tecnologia assistiva:** `aria-live` existe, mas a mudança entre pensando, cancelado, erro e concluído não tem status dedicado.
3. **Baixa — validação de viewport móvel:** o Tutor usa altura baseada em `100vh`; barras do navegador e teclado virtual podem reduzir a área visível. Confirmar em Android/iOS reais.
4. **Informativa — tempo do primeiro acesso ao RAG:** o cache é lido e indexado na primeira pergunta; a interface mostra apenas “Pensando...”, sem diferenciar carregamento local de geração remota.

## Verificações executadas

- `npm run lint` (frontend): aprovado; quatro avisos preexistentes de Fast Refresh/imports não utilizados.
- `npm run build` (frontend): aprovado com permissão elevada; aviso não bloqueante de bundle principal acima de 500 kB.
- Inspeção de `TutorAI.jsx`, `api.js`, `aiController.js`, `tutorConversationStore.js` e `enemRagService.js`.
- Nenhuma alteração de código foi feita nesta rodada.

## Limitações e próximos passos

- Não houve navegação autenticada, rede lenta simulada, teste de leitor de tela, teste de viewport real ou chamada Gemini em produção.
- Validar Bruno com duas perguntas consecutivas após cancelamento e verificar que o histórico do servidor não recebe resposta tardia.
- Validar Luana com NVDA/VoiceOver e teclado físico.
- Decidir com produto se a fonte do RAG deve aparecer para o estudante; se sim, transportar apenas metadados seguros, nunca instruções internas.
- Manter a revisão de segurança do Argos separada caso a referência do corpus passe a ser exibida ou clicável.

## Conclusão

O fluxo do Tutor está mais controlável e legível após as correções e o RAG não introduziu fricção funcional evidente na inspeção estática. Os próximos ganhos de experiência são transparência da referência recuperada e anúncio acessível dos estados de espera/cancelamento. A validação final depende de um ambiente autenticado com navegador e usuários de teste.
