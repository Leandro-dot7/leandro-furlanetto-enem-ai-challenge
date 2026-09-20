# Relatório Morpheus — Tutor, leitura e acessibilidade

## Identificação da Rodada

- Agente responsável: Morpheus
- Data e hora: 2026-09-20 17:40 (America/Sao_Paulo)
- Ambiente: local, working tree baseado no commit `2fedfb6`
- Persona principal: estudante do ENEM em tela pequena, com pouco tempo, alternando entre modo claro/escuro e leitura de respostas longas.

## Escopo e Alvos

- Jornada do Tutor com resposta contendo tabela, fórmula, links e texto longo.
- Estado vazio, restauração do histórico e limpeza do histórico.
- Contraste/superfícies do modo claro e legibilidade do modo escuro.
- Navegação por teclado, foco do diálogo de confirmação e mensagens de erro.

## Metodologia e Evidências

- Foram criados testes estáticos para garantir o uso do renderer seguro, GFM, matemática KaTeX, tabela responsiva e componentes sem HTML arbitrário.
- Foram criados testes para a confirmação de **Limpar histórico**, incluindo `aria-modal`, descrição, cancelamento e chamada da API.
- O diálogo retorna o foco ao botão de cancelamento e fecha com Escape; o conteúdo da conversa usa largura máxima e quebra de palavras para evitar overflow em mobile.
- A paleta clara usa fundo levemente esverdeado/cinza e superfície quente, evitando o branco absoluto. A decisão segue a literatura consultada sem afirmar que uma cor é universalmente superior.

## Classificação de Severidade dos Achados

- **P2 — corrigido:** estudante via `$2n$`, pipes de tabela e separadores em vez de conteúdo formatado.
- **P2 — corrigido:** histórico acumulava conteúdo sem uma ação explícita de limpeza.
- **P2 — mitigado:** modo claro excessivamente branco, com risco de desconforto em sessões prolongadas.
- **P3 — limitação de validação:** a rodada não incluiu teste visual interativo com leitor de tela/navegador real por indisponibilidade da superfície CUA.

## Ações Executadas ou Recomendadas

- Validar manualmente no navegador: resposta com tabela e fórmula, troca claro/escuro, viewport mobile, Tab/Escape no diálogo e feedback de sucesso/erro.
- Preservar o aviso de exclusão permanente e evitar limpeza por clique acidental.
- Em uma rodada futura, complementar com teste de leitor de tela e foco completo no modal.

## Validações e Limitações

- `frontend npm test`: 12/12 testes aprovados.
- Lint e build do frontend aprovados; o build registra apenas o aviso de bundle principal acima de 500 kB.
- A ausência de navegador conectado impede afirmar equivalência visual final em todos os dispositivos. A validação atual combina guardrails automatizados e inspeção de código.
