# Minerva: recuperação do Tutor, RAG e geração de simulados

## Identificação da Rodada

- Agente responsável: Minerva (engenharia e arquitetura).
- Data e hora de início do registro: 21/09/2026, 13:44 (America/Sao_Paulo).
- Ambiente: código local no Windows; base `552524f` da branch `master`.
- Versão avaliada: alterações locais desta rodada, antes do commit e do deploy.

## Escopo e Alvos

- `frontend/src/TutorAI.jsx`: recuperação do histórico, campo de pergunta e sugestões.
- `backend/services/enemRagService.js`: recuperação de questões por tema e área.
- `backend/services/geminiService.js`: preferência de modelos e estrutura da resposta do Simulado.
- Testes de regressão, README e build do frontend.

## Metodologia e Evidências

- Reproduzido por teste local: uma solicitação de Ciências da Natureza recuperava duas questões de `ciencias-humanas`. A pergunta “Qual a diferença entre mitose e meiose?” recuperava uma questão de Hobbes por causa do termo genérico “diferença”. Os testes falharam antes da correção e passaram depois.
- O Morpheus e a revisão independente encontraram uma regressão no valor real do seletor: “Linguagens e Códigos” ficava sem RAG. A revisão também reproduziu referências de áreas erradas para “equações do 2º grau” e “função quadrática”. Esses casos foram adicionados aos testes (falharam antes) e corrigidos localmente.
- Inspeção do Tutor: o campo estava desabilitado durante `/ai/tutor/latest`, e as sugestões pareciam acionáveis embora o envio fosse descartado. Foi adicionado aviso visível, com estado semântico; digitação é permitida, mas o envio e as sugestões aguardam a restauração. Falha de recuperação passa a ser comunicada ao estudante.
- Preferência de modelo por tarefa: Tutor tenta `gemini-3.6-flash` antes de `gemini-3.5-flash-lite`; Simulado faz o inverso. Não foi criado um modelo adicional para roteamento.
- Validação estrutural do Simulado: quantidade de questões, IDs sequenciais, enunciados, cinco alternativas preenchidas, gabarito A–E e explicação. A estrutura inválida aciona o fallback já existente.
- Suítes completas: backend `npm test` 12/12 e frontend `npm test` 20/20, executadas fora da restrição local de subprocessos do sandbox. O teste legado que procurava `docs/README.md` foi ajustado para o README principal, coerente com a limpeza anterior da pasta `docs`.
- Frontend: `npm run build` concluiu; `npm run lint` terminou sem erros, com um aviso preexistente em `AuthContext.jsx`.

## Classificação de Severidade dos Achados

- P1: recuperação de questões da área errada no Simulado e referências desconexas no Tutor (Biologia/Matemática). Corrigido localmente e coberto por testes.
- P2: a opção padrão “Linguagens e Códigos” não acionava RAG após o filtro inicial; corrigida antes do commit.
- P2: campo bloqueado sem explicação suficiente durante a restauração do histórico; sugestões aparentavam funcionar, mas não enviavam. Corrigido localmente e coberto por teste estático de interface.
- P2: retorno de Simulado com alternativas/gabarito incompletos podia alcançar a interface. Agora rejeitado com teste de regressão.
- P3: aviso de lint preexistente em `AuthContext.jsx`; não alterado nesta rodada.

## Ações Executadas ou Recomendadas

- Filtragem explícita da disciplina do corpus conforme a área escolhida, incluindo o valor exato “Linguagens e Códigos”; sem contexto RAG se a área não for reconhecida.
- Remoção de palavras genéricas da busca do Tutor, exigência de dois termos em comum e inferência conservadora de área por pistas temáticas para reduzir falsos positivos.
- Preferência de modelos diferenciada por operação, sem chamada extra de classificação.
- Validação estrutural do JSON do Simulado antes de responder à interface.
- Estado de recuperação do Tutor comunicado junto ao formulário; campo utilizável durante a espera e aviso de falha.
- README atualizado para refletir os comportamentos e limitações reais.

## Validações e Limitações

- Verificação final: 13 testes backend e 21 frontend passaram; build Vite passou; lint terminou sem erros. Permanece um aviso preexistente de Fast Refresh em `AuthContext.jsx`. O build em sandbox falhou inicialmente por `spawn EPERM`/módulo nativo, mas passou fora dessa restrição.
- Não foram executadas nesta rodada chamadas reais ao Gemini, conexão autenticada ao Supabase, testes de carga em produção nem testes com estudantes reais. Logo, a redução de latência, a capacidade sob usuários simultâneos e a persistência ao vivo ainda dependem de validação online autorizada.
- A validação de estrutura não comprova correção factual ou pedagógica das questões. A busca RAG continua lexical e pode deixar de encontrar referências relevantes.
- Quando um modelo falha ou devolve JSON estruturalmente inválido, o serviço ainda tenta o modelo alternativo; isso privilegia a disponibilidade, mas pode ampliar o tempo total e o consumo de quota. Não houve medição online nesta rodada.
- O serviço online não foi suspenso nesta rodada; a suspensão deve ocorrer somente após os testes online finais.
