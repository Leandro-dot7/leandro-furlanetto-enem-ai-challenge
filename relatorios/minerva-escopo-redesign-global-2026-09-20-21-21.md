# Proposta de redesign global do Minerva

## Identificação da Rodada

- Agente: Minerva.
- Data e hora: 20/09/2026, 21:21 (America/Sao_Paulo).
- Ambiente: local, branch master.
- Base: f422abd134b3b17add05983f5f0a74a39a8e64d7.
- Estado: proposta para aprovação do usuário; implementação pendente.

## Escopo e Alvos

Aplicar a direção visual aprovada no login às 11 telas existentes: login, cadastro, recuperação e redefinição de senha, dashboard, simulado, resultado, Tutor IA, redação, histórico e perfil.

- Marca: capacete e livro com páginas em asas, em ciano e roxo, antes do nome Minerva; preservar proporção e transparência. Conferir nitidez da versão gerada antes de incorporá-la. Aplicar também ao favicon.
- Tema claro: fundo lavanda suave com verde-água, superfícies claras e texto escuro. Tema escuro: superfícies violeta profundas, realces roxos e verde-água com contraste ajustado.
- Tipografia sem serifa, títulos fortes, espaçamento e componentes compartilhados. Gradientes concentrados na marca, destaques e ações principais; superfícies de leitura estáveis.
- Alternador de tema inspirado na referência Galahhad/strong-squid-82 do Uiverse, com sol/lua, teclado, foco visível, movimento reduzido e preferência persistente. A prévia anterior é uma adaptação simplificada, não uma reprodução integral.
- Botões com estados normal, hover, foco, pressionado, carregando e desabilitado. Garantir legibilidade do texto sobre gradiente.
- Navegação lateral e cabeçalho móvel com nova marca e indicação clara da página atual.
- Dashboard: reorganizar ações e indicadores disponíveis. Não inventar métricas ou progresso.
- Tutor: hierarquia de mensagens, leitura de tabelas e fórmulas, composição e ações de histórico.
- Simulado e resultado: seleção, alternativas, progresso, feedback e revisão legíveis em ambos os temas.
- Redação: tema, editor e avaliação por competência; atenção especial ao contraste no escuro.
- Histórico e perfil: tabelas, filtros, gráficos e formulários coerentes com a identidade.
- Registrar em agents/Minerva.md a preferência por linguagem natural e sem travessões usados como apartes nas frases; revisar textos estáticos da interface.
- Conferir no corpus a contagem de questões antes de publicar o número usado na prévia.

## Metodologia e Evidências

Inspeção de status Git, rotas, layout, login, estilos globais, contexto de tema, manifesto frontend e relatórios anteriores. Árvore de trabalho limpa antes desta documentação. O contexto de tema já persiste a preferência em localStorage. Foram identificadas 11 rotas em App.jsx.

## Classificação de Severidade dos Achados

- P3: identidade aprovada existe apenas na prévia e precisa ser aplicada às telas reais.
- P3: preferência de linguagem ainda não registrada nas instruções de Minerva.
- Risco de implementação: regressões de contraste, foco, responsividade e legibilidade do conteúdo. Esta rodada não constitui auditoria funcional ou de segurança.

## Ações Executadas ou Recomendadas

Snapshot local criado fora do repositório em:

`C:/Users/LeoFurlanetto/.codex/visualizations/2026/09/20/01a0bf89-301e-7573-a07d-0b6b719a6978/snapshot-2026-09-20-21-21/`

- minerva-f422abd.zip: arquivos versionados do commit base.
- previa-aprovada.html: cópia da prévia com a imagem incorporada.
- O ZIP foi aberto com sucesso, possui 119 entradas e contém os arquivos de referência conferidos.
- O snapshot não inclui arquivos ignorados, credenciais, dependências instaladas nem banco remoto.

Após aprovação: base visual compartilhada e marca; telas públicas; navegação e dashboard; ferramentas de estudo; histórico e perfil; validação técnica, visual e retestes. Trabalho local, com commits e envio ao GitHub somente após validação e autorização.

## Validações e Limitações

Nenhum código funcional alterado nesta rodada. Testes, lint, build e jornadas no navegador serão executados na implementação, sem reutilizar resultados de rodadas antigas. Previstas validações desktop/mobile, ambos os temas, teclado, erros e estados vazios/carregando. Rodadas Morpheus e Argos deverão registrar evidências próprias com data e hora. Chamadas reais de IA e autenticação dependerão do ambiente disponível; qualquer uso de dados simulados será identificado.
