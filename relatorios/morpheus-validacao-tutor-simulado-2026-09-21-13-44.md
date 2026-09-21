# Morpheus — validação sintética do Tutor e do Simulado

## Identificação da Rodada

- **Agente:** Morpheus (UX sintética e acessibilidade).
- **Data e hora:** 21/09/2026, 13:44 (America/Sao_Paulo).
- **Ambiente:** árvore de trabalho local, sem login, credenciais ou chamadas ao Gemini/Supabase de produção.
- **Versão:** `552524f` mais alterações locais ainda não commitadas em `TutorAI.jsx`, RAG e geração de simulado.
- **Perfil do alvo:** Minerva ENEM, SaaS web em português para estudantes brasileiros; interface conversacional e prática por questões, em fase de validação online. Esta rodada prioriza retorno ao Tutor, primeira pergunta, falha de restauração, geração de simulado e uso por teclado/mobile.
- **Natureza do estudo:** quatro personas **sintéticas**, geradas uma vez e reutilizadas nos fluxos. Nenhuma pessoa real participou.

## Escopo e Alvos

- `frontend/src/TutorAI.jsx`: recuperação de histórico, composição da pergunta, envio, sugestões, erro e limpeza.
- `frontend/src/Simulado.jsx`: configuração, espera, erro, alternativas e resposta.
- `frontend/src/components/ui/FeedbackMessage.jsx`, `frontend/src/lib/api.js`: feedback e prazo do cliente.
- `backend/services/enemRagService.js`, `backend/services/geminiService.js`, `backend/controllers/aiController.js`: seleção de referências, modelos, validação do JSON e erros.
- Testes locais existentes do frontend/backend e consulta local ao corpus versionado. Sem teste de carga ou navegação autenticada.

## Metodologia e Evidências

### Tipos de evidência usados

- **Execução local:** `node --test --test-isolation=none` passou com **20/20 testes no frontend** e **12/12 no backend**. O comando padrão `npm test` não iniciou neste ambiente por `spawn EPERM`; isso não foi tratado como falha da aplicação. Os testes de UI são predominantemente inspeções estruturais de código, não cliques no navegador.
- **Execução local do RAG:** `getSimuladoRagContext('Ciências da Natureza')` retornou fontes `ciencias-natureza`; `getTutorRagContext('Qual a diferença entre mitose e meiose?')` retornou `Questão 83 - ENEM 2016 — ciencias-natureza`. Em contraste, **`getSimuladoRagContext('Linguagens e Códigos')` retornou `null`**. O valor é exatamente o enviado pela seleção em `frontend/src/Simulado.jsx:20`; o mapa em `backend/services/enemRagService.js:19-24` aceita apenas `linguagens`.
- **Inspeção estática:** estados e mensagens do Tutor, tratamento de erro, espera do Simulado, timeout, foco e semântica. As consequências para uma pessoa são **inferências de UX**, não observações de usuário real.
- **Não executado:** login, restauração real de conversa, geração real pelo Gemini, viewport móvel, leitor de tela, axe/Lighthouse e comparação visual dos dois temas. Não há afirmação de conformidade WCAG.

### Personas e jornadas

#### 1. Ana — 17 anos, estudante mobile, proficiência média

- **Contexto:** ônibus, conexão oscilante e poucos minutos para tirar uma dúvida; escreve perguntas curtas e sem pontuação. Frustração conhecida: campos travados sem motivo aparente.
- **Objetivo/fluxo declarado:** abrir o Tutor, começar a escrever antes de terminar a recuperação e enviar a pergunta quando liberado.
- **Caminho simulado:** entra em Tutor → lê aviso junto ao compositor → digita “mitose e meiose” → aguarda o botão Enviar habilitar → envia.
- **Observação no código:** há aviso visível com `role="status"` e `aria-live="polite"` (`TutorAI.jsx:268-271`); o campo fica editável durante `restoring` (`:276-286`); o envio permanece desabilitado (`:298-303`) e a guarda em `sendMessage` também impede envio prematuro (`:132-133`). As sugestões ficam nativamente desabilitadas e visualmente atenuadas (`:318-326`).
- **Inferência da persona, não teste humano:** “Consigo formular a dúvida enquanto carrega e entendo por que ainda não posso enviar.” A espera longa ainda poderia causar impaciência.
- **Avaliação sintética:** Usabilidade ★★★★☆ | Clareza ★★★★☆ | Confiança visual ★★★★☆. **Fricção:** P3, validar espera real em conexão lenta.
- **Melhoria:** testar em 375 px e com rede lenta; manter o texto digitado se a restauração falhar ou terminar.

#### 2. Rafael — 18 anos, estudante recorrente, proficiência alta

- **Contexto:** desktop, histórico extenso, aprende fazendo perguntas de continuidade; irrita-se quando o Tutor parece esquecer a conversa.
- **Objetivo/fluxo declarado:** retomar uma conversa anterior e fazer uma pergunta de seguimento; considerar também falha de restauração.
- **Caminho simulado:** abre Tutor → aguarda histórico → vê mensagens persistidas e envia seguimento. Variante: a restauração falha → aparece aviso → tenta nova pergunta.
- **Observação no código:** o retorno de `/ai/tutor/latest` preenche `conversationId` e mensagens (`TutorAI.jsx:92-103`), alinhado com o conserto de contexto no servidor documentado em rodada anterior. A falha mostra aviso de que é possível começar nova pergunta (`:104-108`), mas o backend pode responder `503` quando falta a persistência (`backend/controllers/aiController.js:29-45`) e o envio subsequente também depende dessa persistência (`:72-82`). O aviso não diferencia indisponibilidade temporária de configuração ausente e não oferece “tentar recuperar novamente”.
- **Inferência da persona, não teste humano:** “Se a conversa antiga não carregou, tenho receio de perder meu contexto. Se a nova pergunta também falhar, o aviso parece prometer algo que não funciona.”
- **Avaliação sintética:** Usabilidade ★★★☆☆ | Clareza ★★★☆☆ | Confiança visual ★★★☆☆. **Fricção:** P2 condicional à falha da persistência.
- **Melhoria:** distinguir falha temporária de backend indisponível, oferecer nova tentativa de restauração e não sugerir início de conversa quando o serviço de persistência está ausente. Confirmar em ambiente autenticado.

#### 3. Luana — 19 anos, usuária de teclado com baixa visão, proficiência média

- **Contexto:** notebook com zoom elevado; navega por Tab e tem dificuldade com controles de baixo contraste.
- **Objetivo/fluxos declarados:** identificar quando o Tutor está pronto; percorrer sugestões; selecionar e confirmar alternativa de um simulado.
- **Caminho simulado:** abre Tutor → percorre campo e sugestões durante restauração → depois segue para Simulado → escolhe área/quantidade → navega pelas alternativas → confirma.
- **Observação no código:** campo do Tutor tem rótulo associado (`TutorAI.jsx:275-278`); sugestões são `<button disabled>` enquanto não estão disponíveis (`:320-326`); conversa usa `role="log"` com atualização polida (`:255-261`). No Simulado, área tem `<label>` (`Simulado.jsx:46-56`), quantidade usa `aria-pressed` (`:66-77`) e alternativas ocultam visualmente o rádio, mas aplicam `focus-within:ring` ao rótulo (`:189-207`). Isso indica correção do achado de foco da rodada de 18/09 no código atual.
- **Inferência da persona, não teste humano:** “Os controles parecem ter uma ordem e um foco identificável; preciso confirmar em leitor de tela e com zoom, pois o código não prova a experiência final.”
- **Avaliação sintética:** Usabilidade ★★★★☆ | Clareza ★★★★☆ | Confiança visual ★★★☆☆. **Fricção:** P3, validação dinâmica pendente, não falha confirmada.
- **Melhoria:** testar teclado completo, leitor de tela, zoom 200%, viewport 375 px e contraste nos dois temas antes de afirmar acessibilidade.

#### 4. Bruno — 20 anos, estudante sob pressão de tempo, proficiência baixa

- **Contexto:** quer praticar Linguagens rapidamente em celular; não distingue “questão oficial usada como referência” de “questão inédita gerada”. Frustração: espera sem previsão.
- **Objetivo/fluxo declarado:** gerar 5 questões de “Linguagens e Códigos”, resolver e ver o resultado; considerar falha na geração.
- **Caminho simulado:** mantém a área inicial da tela (`Linguagens e Códigos`) → escolhe 5 questões → aciona “Gerar Simulado com IA” → espera → se falhar, volta à configuração e tenta novamente.
- **Observação executada:** a chamada local ao RAG com o **valor real da tela** retornou `null`; portanto, nesta área o serviço segue sem referências recuperadas (`backend/services/enemRagService.js:177-186`). As outras três áreas, testadas com seus rótulos correspondentes, retornaram fontes da disciplina correta. A geração valida 5 alternativas, gabarito e explicação (`backend/services/geminiService.js:49-70`), o que reduz questões malformadas, mas a qualidade pedagógica não foi testada com respostas do modelo.
- **Observação por inspeção:** o estado de espera diz “Isso pode levar alguns segundos” e não oferece cancelamento (`Simulado.jsx:126-140`); há timeout de até 45 s no backend (`geminiService.js:23-31`) e 60 s no cliente (`frontend/src/lib/api.js:11-15`). Após falha, o aluno retorna à configuração com alerta e o botão de gerar disponível (`Simulado.jsx:282-299,363-364`). Não há CTA de retry separado ou orientação de espera além da mensagem do backend.
- **Inferência da persona, não teste humano:** “Pedi Linguagens, mas não sei que a referência falhou. Se demorar quase um minuto, ‘alguns segundos’ me faria pensar que travou.”
- **Avaliação sintética:** Usabilidade ★★★☆☆ | Clareza ★★★☆☆ | Confiança visual ★★★★☆. **Fricções:** P2 para RAG ausente em Linguagens; P2 para espera sem saída/expectativa realista.
- **Melhoria:** alinhar o mapa de áreas ao valor real enviado pela UI e testar com os quatro rótulos da tela; permitir cancelar a geração, comunicar prazo sem prometer “alguns segundos” e preservar seleção ao falhar.

### Síntese entre personas e regressões

- **Sinais positivos repetidos:** restauração agora é comunicada no local da ação; digitação é permitida antes do fim; ações indisponíveis usam `disabled` e estilo distinto. A configuração do Simulado e o erro têm rótulos/feedback semântico.
- **Fricções repetidas como hipótese:** Ana e Bruno podem interpretar esperas longas como travamento; Rafael e Ana precisam distinguir “ainda carregando” de “não foi possível recuperar”.
- **Achado isolado e reproduzido localmente:** ausência de contexto RAG para o rótulo real “Linguagens e Códigos”. Não decorre de preferência da persona.
- **Reteste de achados antigos:** o foco visível das alternativas e o contexto persistido do Tutor aparecem implementados na árvore atual; o funcionamento em navegador autenticado continua pendente. O Simulado ainda não dá cancelamento durante a geração.

## Classificação de Severidade dos Achados

| ID | Severidade | Tipo de evidência | Achado |
| --- | --- | --- | --- |
| MOR-20260921-01 | **P2 — média** | Execução local + código | “Linguagens e Códigos” retorna RAG `null` por falta de mapeamento; geração segue sem referências oficiais dessa área. |
| MOR-20260921-02 | **P2 — média** | Inspeção estática + inferência | Falha de restauração recebe aviso genérico que sugere nova pergunta mesmo quando a causa pode impedir o próprio Tutor; não há retry de histórico. |
| MOR-20260921-03 | **P2 — média** | Inspeção estática + inferência | Geração do Simulado não permite cancelar e a cópia “alguns segundos” pode ser enganosa diante dos limites de 45–60 s. |
| MOR-20260921-04 | **P3 — melhoria** | Inspeção estática | Foco/semântica indicam progresso, mas responsividade, contraste e leitor de tela não foram testados dinamicamente. |

Nenhum P0/P1 foi **confirmado** nesta rodada. Acessibilidade legal, tempo real de resposta e qualidade da IA não podem ser concluídos a partir destes testes.

## Ações Executadas ou Recomendadas

- **Executado por Morpheus:** leitura de instruções e rodada anterior, inspeção dos fluxos, 32 testes locais no total, consulta local ao RAG e este relatório. **Nenhum código ou README foi alterado** nesta rodada.
- **Minerva — antes do deploy:** corrigir o mapeamento de “Linguagens e Códigos” e adicionar teste com os quatro valores exatos de `MATERIAS` da UI. É a única falha funcional reproduzida nesta rodada.
- **Minerva — UX:** revisar a mensagem de falha do histórico e o estado de espera/cancelamento do Simulado. Verificar se a causa `503` do Tutor exige instrução diferente da falha de rede.
- **Reteste recomendado:** autenticar com conta de teste, simular restauração lenta/falha, enviar a primeira pergunta digitada antes da conclusão, gerar 3/5/10 questões nas quatro áreas, testar teclado, 375 px, zoom e leitor de tela. Não aplicar carga em produção.

## Validações e Limitações

- Testes locais passaram **somente** no modo sem isolamento; `npm test` padrão encontrou restrição `spawn EPERM` do ambiente. Não foi executado build, navegação autenticada ou teste com pessoas reais.
- As notas das personas são **inferências estruturadas**; não são métricas de satisfação nem evidência de conformidade WCAG.
- O RAG foi testado sobre o corpus local versionado. Não se verificou a geração ao vivo, fallback real entre modelos, persistência real no Supabase ou tempo de resposta em produção.
- Critérios de revisão de interface consultados em [Vercel Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md); os achados foram ancorados no código local e não assumem conformidade integral.
