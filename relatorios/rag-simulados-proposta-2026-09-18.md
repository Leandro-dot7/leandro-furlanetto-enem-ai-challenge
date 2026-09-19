# Proposta — RAG para simulados: qualidade, custo e latência

## Decisão

Não usar RAG como substituto direto do gerador. Para a tela atual, em que o aluno escolhe apenas área e quantidade, a melhor primeira camada é um **banco de questões com cache e metadados**. RAG entra para recuperar fontes e itens por habilidade/tópico, não para anexar texto indiscriminadamente ao prompt.

RAG melhora embasamento, mas pode aumentar tokens: cada geração ainda exige o prompt e a saída, mais o embedding da consulta e os trechos recuperados. A economia relevante vem de cache/reuso controlado, pré-geração e contexto curto.

## Arquitetura recomendada

```text
Pedido (área, habilidade, dificuldade, usuário)
  -> filtro por metadados + cache por usuário
  -> banco de questões aprovadas
  -> se faltar cobertura: recuperação híbrida do corpus curado
  -> Gemini gera somente a lacuna, usando 2–3 trechos curtos
  -> valida JSON e qualidade
  -> salva questão, metadados, fonte e embedding
```

## Fases

1. **Banco e cache primeiro**
   - Tabelas `questoes_base` e `tentativas_questao`.
   - Metadados obrigatórios: área, habilidade da matriz, tema, dificuldade, ano/versão, fonte, status de revisão e hash do enunciado.
   - Cache exato por combinação de filtros; excluir questões já respondidas pelo aluno.
   - Pré-gerar lotes offline por habilidade e revisar antes de publicar.

2. **RAG curado**
   - Indexar somente material com licença e procedência verificadas: Matriz de Referência, competências, textos próprios ou de domínio/licença compatível.
   - Fragmentos de aproximadamente 150–300 tokens, com título, área, habilidade e fonte.
   - Filtrar por área/habilidade antes da busca vetorial; recuperar no máximo 2–3 trechos.

3. **Busca híbrida no Supabase**
   - Usar `pgvector` mais busca textual em português (`tsvector`) e fusionar resultados com RRF.
   - Usar `gemini-embedding-2` em 768 dimensões inicialmente. A dimensão e o modelo devem permanecer fixos por índice; trocar modelo exige reindexação.
   - Fazer embedding em lote na ingestão. O request do usuário só gera embedding quando a busca realmente for necessária.

4. **Métricas antes de expandir**
   - Cache-hit rate, latência p50/p95, tokens de entrada/saída, custo por questão, taxa de JSON inválido, repetição por aluno e avaliação pedagógica humana.

## Regras de custo

- Não usar busca vetorial quando `area + habilidade` já identifica um conjunto suficiente de questões.
- Não reenviar Matriz ENEM inteira; passar IDs, metadados e no máximo 2–3 evidências curtas.
- Priorizar retorno de questão existente e não respondida sobre nova geração, quando o produto permitir reuso de banco.
- Separar geração offline do caminho síncrono do aluno.

## Próximo passo técnico

Definir a taxonomia de habilidades e a fonte licenciada do corpus. Em seguida, criar a migração SQL e um job de ingestão/embedding; não alterar o endpoint atual até ter esse corpus e métricas de baseline.
