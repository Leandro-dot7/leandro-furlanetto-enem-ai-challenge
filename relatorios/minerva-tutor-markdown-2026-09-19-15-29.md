# Minerva — normalização da resposta Markdown do Tutor

**Data:** 19/09/2026  
**Escopo:** corrigir a leitura das respostas do Tutor ENEM quando o Gemini retorna Markdown.

## Problema observado

O Tutor retornava marcadores Markdown diretamente na bolha de conversa. Apenas `**negrito**` era interpretado; títulos, listas, código, citações e links permaneciam com a sintaxe crua, prejudicando a leitura.

## Correção aplicada

Em `frontend/src/TutorAI.jsx`:

- respostas do Tutor agora são convertidas para componentes React sem `dangerouslySetInnerHTML`;
- títulos Markdown (`#` até `######`) viram cabeçalhos;
- listas ordenadas e não ordenadas viram `<ol>`/`<ul>`;
- parágrafos e quebras de linha são preservados;
- negrito, itálico, código inline, blocos de código, citações e separadores recebem formatação;
- links só são abertos quando usam `http` ou `https`;
- imagens Markdown não são carregadas remotamente: são apresentadas como indicação textual;
- mensagens do estudante continuam como texto literal, sem interpretar marcações digitadas por ele.

Em `frontend/src/index.css`, foram adicionados estilos de hierarquia, listas, código, citações, links e separadores para manter contraste e espaçamento adequados dentro da bolha.

## Validação

- `npm run lint`: aprovado; somente avisos preexistentes em outros componentes.
- `npm run build`: aprovado; permanece o aviso conhecido de bundle principal acima de 500 kB.
- `git diff --check`: aprovado; somente avisos de normalização LF/CRLF do Git.

## Limitação

O parser cobre a formatação Markdown mais comum produzida pelo Tutor. Tabelas Markdown complexas, HTML arbitrário e extensões específicas não são renderizados como HTML; isso é intencional para manter segurança e legibilidade. Se o Tutor passar a usar tabelas com frequência, elas devem receber um renderer dedicado e validado.
