# Minerva — avaliação da API enem.dev para o RAG do Tutor

**Data:** 19/09/2026  
**Escopo:** comparar a API ENEM (`api.enem.dev`) com a ingestão direta dos PDFs do INEP.

## Veredito

Sim, a API deixa o primeiro RAG significativamente mais simples porque já entrega questões em JSON estruturado. Ela deve ser usada como fonte de ingestão e normalização, não como dependência síncrona do Tutor em cada pergunta.

## Evidências verificadas

- A documentação descreve a API como um projeto comunitário open source para consulta de provas e questões e informa licença GNU GPL-2.0 para o projeto/dados disponibilizados.
- `GET /v1/exams` retorna ano, disciplinas e idiomas.
- `GET /v1/exams/{year}/questions` retorna paginação (`limit`, `offset`, `total`, `hasMore`) e itens com `context`, `alternativesIntroduction`, alternativas, `correctAlternative`, disciplina, idioma e arquivos de apoio.
- A consulta pública feita nesta rodada retornou provas de 2009 a 2023; não foram listados 2024 e 2025 na resposta atual.
- A API limita endpoints sem cache a 1 requisição por segundo e recomenda fila, obtenção dos dados brutos no repositório ou self-hosting.

## Comparação

| Critério | API enem.dev | PDFs do INEP |
|---|---|---|
| Ingestão inicial | Mais simples: JSON pronto | Exige download, extração/OCR e segmentação |
| Questão/alternativas/gabarito | Já estruturados | Precisam ser reconstruídos |
| Imagens e gráficos | Referências `files`/arquivos de apoio | Preservados no documento original |
| Cobertura observada | 2009–2023 | Catálogo oficial mais amplo, incluindo edições recentes |
| Autoridade | Projeto comunitário | Fonte institucional do INEP |
| Dependência operacional | Rate limit e disponibilidade externa | Controle próprio após baixar e versionar |

## Arquitetura recomendada

1. Rodar um job de ingestão paginado da API, respeitando o limite de 1 req/s.
2. Persistir localmente no banco `questoes_base`, nunca consultar a API durante a resposta do Tutor.
3. Guardar `source_provider`, `source_url`, ano, disciplina, idioma, índice, hash, data de coleta e versão da API.
4. Manter `context` original e uma versão normalizada para busca; o contexto retornado pode conter Markdown e referências a imagens.
5. Criar embeddings somente na ingestão/reindexação e usar busca híbrida por metadados + texto + vetor.
6. Usar o INEP para 2024/2025, conferência de gabarito e documentos normativos; manter a fonte original associada a cada item.
7. Fazer o Tutor recuperar 2–4 trechos curtos e exibir ano, questão e fonte na resposta.

## Cuidados

- A API não deve ser tratada como fonte oficial do governo sem conferir cada item contra o INEP.
- A declaração de licença da API deve ser revisada para o uso comercial do SaaS; manter atribuição/proveniência mesmo quando a documentação disser que ela não é exigida.
- Não indexar somente o texto: imagens, gráficos, mapas e fórmulas podem ser essenciais para resolver a questão.
- A API retorna conteúdo com Markdown; a camada de ingestão deve preservar o original e gerar texto limpo para o embedding, sem perder a apresentação rica no Tutor.
- Implementar retry com backoff, cache e checksum; se a API ficar indisponível, o Tutor deve continuar usando o índice local.

## Próximo passo

Fazer um piloto com um ano (2023), importar todas as páginas por fila, comparar 50 itens com os PDFs oficiais e medir: cobertura, gabarito, perda de imagens, qualidade da busca, latência e custo. Depois expandir para os anos anteriores e complementar 2024/2025 diretamente pelo INEP.
