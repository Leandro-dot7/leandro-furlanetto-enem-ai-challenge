# Minerva — modo claro e modo escuro

**Data:** 19/09/2026  
**Escopo:** frontend completo da Minerva ENEM, incluindo telas públicas, área autenticada, Tutor, simulados, redação e histórico.

## Implementação

- Criado `ThemeProvider`, com preferência persistida em `localStorage` pela chave `minerva-theme`.
- O modo claro continua sendo o padrão quando não existe preferência salva.
- Criado botão global acessível para alternar entre claro e escuro, disponível também nas telas de login e recuperação de senha.
- Adicionados tokens de contraste para superfícies, textos, bordas, inputs, avisos, alternativas, respostas formatadas do Tutor e scrollbars.
- A escolha atualiza `color-scheme`, permitindo que controles nativos acompanhem o tema.

## Arquivos

- `frontend/src/context/ThemeContext.jsx`
- `frontend/src/context/themeContext.js`
- `frontend/src/context/useTheme.js`
- `frontend/src/components/ThemeToggle.jsx`
- `frontend/src/App.jsx`
- `frontend/src/index.css`

## Validação

- `npm run lint`: aprovado; apenas quatro avisos preexistentes do projeto.
- `npm run build`: aprovado; permanece apenas o aviso não bloqueante de bundle acima de 500 kB.
- `git diff --check`: aprovado, com avisos conhecidos de conversão LF/CRLF do Windows.

## Limitações

- A validação visual foi feita por build e inspeção dos estilos; ainda é recomendável conferir manualmente desktop/mobile e estados de foco em navegador real.
- Componentes que usam cores dinâmicas do Tailwind devem continuar sendo revisados quando novas telas forem adicionadas.
