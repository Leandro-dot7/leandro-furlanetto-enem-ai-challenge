# Minerva — cancelamento do Tutor e avaliação de RAG com acervo do INEP

**Data:** 19/09/2026  
**Escopo:** cancelar a geração do Tutor no frontend e no backend; avaliar a viabilidade de usar provas e gabaritos oficiais do ENEM como corpus de recuperação.  
**Ambiente:** código local; validação dinâmica com uma conta autenticada e uma chamada real ao Gemini ainda depende do ambiente do usuário.

## 1. Correção da persona Bruno — cancelamento ponta a ponta

### Problema

O botão “Parar” cancelava o `AbortController` do Axios no navegador, mas o endpoint continuava aguardando o Gemini e poderia gravar uma resposta tardia no histórico da conversa.

### Alterações

- `backend/controllers/aiController.js`
  - cria um `AbortController` por requisição do Tutor;
  - escuta `req.aborted` e o fechamento prematuro da resposta;
  - propaga o sinal para o serviço Gemini;
  - verifica o sinal antes de gravar a resposta no histórico;
  - não retorna erro 500, não executa fallback e não persiste turno quando a requisição foi cancelada.
- `backend/services/geminiService.js`
  - `chatWithTutor` recebe `{ signal }`;
  - envia `config.abortSignal` ao `chat.sendMessage` do SDK instalado;
  - preserva o `systemInstruction` no config por requisição;
  - não tenta o segundo modelo após cancelamento.
- `frontend/src/TutorAI.jsx`
  - permanece usando `AbortController` no botão “Parar”; o fechamento da requisição agora é observado pelo backend.

### Limitação importante

O [SDK `@google/genai`](https://googleapis.github.io/js-genai/release_docs/interfaces/types.GenerateContentConfig.html) documenta `AbortSignal` como cancelamento do lado cliente: ele interrompe a espera e o processamento local, mas não promete cancelar uma inferência já aceita pelo serviço Gemini nem reverter eventual cobrança. A aplicação passa a cancelar toda a cadeia sob seu controle e impede histórico fora de ordem; a interrupção remota da inferência depende de uma API de cancelamento do provedor, que o fluxo `chats.sendMessage` atual não expõe.

### Validação executada

- `node --check backend/controllers/aiController.js`: aprovado.
- `node --check backend/services/geminiService.js`: aprovado.
- preflight com `AbortController` já abortado em `chatWithTutor`: aprovado (`AbortError`).
- `git diff --check`: aprovado; apenas avisos de normalização LF/CRLF do Git.
- Pendente: teste autenticado em rede lenta: iniciar pergunta, clicar “Parar”, enviar nova pergunta e confirmar que nenhum turno tardio da primeira chamada é salvo.

## 2. Viabilidade do RAG com o INEP

### Acesso ao acervo

O catálogo oficial de [Provas e Gabaritos do ENEM](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos) é público e lista edições de 1998 a 2025; a página informa atualização em 03/07/2026. Os arquivos efetivos são PDFs hospedados em `download.inep.gov.br`, por exemplo o [caderno/gabarito de 2024](https://download.inep.gov.br/enem/provas_e_gabaritos/2024_GB_impresso_D1_CD1.pdf) e o [caderno/gabarito de 2025](https://download.inep.gov.br/enem/provas_e_gabaritos/2025_GB_impresso_D1_CD1.pdf).

**Conclusão:** não é necessário que o usuário envie manualmente as provas. O sistema consegue baixá-las por um job de ingestão autorizado, mantendo a URL original, data de coleta e hash do arquivo.

### Forma recomendada

Não consultar o site ao vivo a cada pergunta. Criar uma ingestão versionada:

1. manter um manifesto de URLs oficiais por ano, aplicação, dia, caderno/cor, idioma e tipo de arquivo;
2. baixar PDFs para armazenamento privado, com checksum e data de atualização;
3. extrair texto preservando página, questão, alternativas, imagens e tabelas; usar OCR/layout quando o PDF for escaneado;
4. separar enunciado, alternativas, gabarito e explicação em registros estruturados;
5. indexar com busca híbrida (metadados + texto + vetor), filtrando primeiro por área/tema/habilidade;
6. recuperar somente 2–4 trechos curtos para o Tutor e mostrar a fonte/ano/caderno na resposta;
7. reprocessar apenas arquivos novos ou cujo hash mudou.

### Separação Tutor × gerador de simulados

- **Tutor:** RAG para explicar uma questão, conceito, habilidade ou gabarito, sempre com fonte oficial.
- **Simulados:** banco estruturado de questões aprovadas e não respondidas; geração livre só quando não houver item adequado. Evitar enviar PDFs inteiros ao modelo.
- **Matriz de Referência:** incluir como [fonte normativa separada](https://www.gov.br/inep/pt-br/centrais-de-conteudo/acervo-linha-editorial/publicacoes-institucionais/avaliacoes-e-exames-da-educacao-basica/matrizes-de-referencia-enem); ela descreve eixos, competências, habilidades e objetos de conhecimento do ENEM.

### Riscos e cuidados

- Um mesmo ano possui cadernos, cores, idiomas, reaplicações e PPL; não misturar gabaritos nem duplicar a mesma questão sem metadados.
- Questões com imagens, mapas, gráficos e fórmulas exigem preservar o recorte visual; texto extraído sozinho pode perder informação essencial.
- A disponibilidade pública no portal não deve ser tratada automaticamente como licença irrestrita de redistribuição. Manter atribuição ao INEP, links de origem e validar os termos de uso antes de expor cópias integrais no produto.
- Restringir o contexto recuperado e aplicar cache por consulta/questão para controlar tokens e latência.

### Próximo passo recomendado

Começar com um piloto de 2024–2025: manifesto de URLs, ingestão de um caderno por área, extração estruturada e avaliação manual de 50 questões. Só depois criar a migração `questoes_base`/`questoes_fontes` e conectar o endpoint do Tutor ao índice.
