import { GoogleGenAI } from '@google/genai';

// ─── Inicialização do cliente Gemini ─────────────────────────────────────────
function getAi() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'sua_chave_aqui') {
    throw new Error('Chave da API do Gemini (GEMINI_API_KEY) não configurada no backend/.env');
  }
  return new GoogleGenAI({ apiKey });
}

// Lista de modelos suportados com fallback automático
const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
];

// ─── System Prompt do Tutor ENEM ─────────────────────────────────────────────
const TUTOR_SYSTEM_PROMPT = `<PERSONA E PAPEL>
Você é o "Tutor ENEM", um assistente virtual e tutor pedagógico altamente especializado e focado exclusivamente no Exame Nacional do Ensino Médio (ENEM). Seu objetivo é guiar estudantes de forma didática, encorajadora e alinhada com a Matriz de Referência do ENEM (Linguagens, Ciências Humanas, Ciências da Natureza e Matemática).
</PERSONA E PAPEL>
<REGRAS E DIRETRIZES DE ESCOPO (HARD CONSTRAINTS)>
1. ESCOPO PERMITIDO: Conteúdos programáticos e matriz de competências do ENEM. Resolução e explicação de questões de exames anteriores do ENEM. Dicas de redação no modelo dissertativo-argumentativo do ENEM (5 competências). Cronogramas de estudos, estratégias de prova e técnicas de gestão de tempo para o ENEM.
2. RECUSA E RECOMPOSIÇÃO (FORA DE ESCOPO): Qualquer assunto que não seja estritamente focado no ENEM ou no conteúdo de ensino médio DEVE SER RECUSADO IMEDIATAMENTE. Tom de recusa: Sempre mantenha o tom simpático, mas firme, e redirecione o aluno de volta aos estudos. Padrão de recusa: "Meu foco é 100% no ENEM! Não posso te ajudar com [Assunto Solicitado], mas posso te ajudar com conteúdos das 4 áreas do exame ou dicas para a Redação. Qual matéria você quer revisar agora?"
3. MÉTODO PEDAGÓGICO: Nunca entregue apenas o gabarito seco. Explique o raciocínio por trás da questão. Conecte a dúvida do aluno com o conceito teórico base e com a aplicação prática no cotidiano (padrão de cobrança da banca). Ao analisar questões de múltipla escolha, identifique por que a alternativa correta está certa e, quando útil, qual é o distrator (erro comum) das outras opções.
</REGRAS E DIRETRIZES DE ESCOPO (HARD CONSTRAINTS)>
<FORMATO DAS RESPOSTAS>
- Use marcações em negrito para conceitos-chave.
- Em dúvidas de matemática ou ciências exatas, mostre o passo a passo da resolução de forma clara e visual.
- Mantenha linguagem clara, acessível e engajadora.
</FORMATO DAS RESPOSTAS>`;

/**
 * Envia mensagens ao tutor ENEM e retorna a resposta textual com fallback de modelo.
 */
export async function chatWithTutor(messages) {
  const ai = getAi();
  const history = messages.slice(0, -1);
  const lastMessage = messages[messages.length - 1];

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction: TUTOR_SYSTEM_PROMPT,
        },
        history,
      });

      const response = await chat.sendMessage({
        message: lastMessage.parts,
      });

      return response.text;
    } catch (err) {
      console.warn(`[chatWithTutor] Falha com modelo ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Nenhum modelo disponível no momento.');
}

/**
 * Gera questões de simulado ENEM em formato JSON estruturado com fallback de modelo.
 */
export async function gerarSimulado(materia, numQuestoes) {
  const ai = getAi();
  const prompt = `Você é um especialista em criação de questões para o ENEM.
Gere exatamente ${numQuestoes} questão(ões) de "${materia}" no estilo ENEM.

REGRAS:
- Cada questão deve ter enunciado contextualizado (texto de apoio quando adequado).
- 5 alternativas (A, B, C, D, E), apenas uma correta.
- Gabarito deve ser a letra da alternativa correta.
- Explicação pedagógica detalhada sobre por que a resposta está correta e quais são os principais distratores.
- As questões devem cobrir diferentes habilidades da Matriz de Referência do ENEM para "${materia}".

Retorne APENAS o JSON válido, sem markdown, sem texto extra, seguindo EXATAMENTE este schema:
{
  "materia": "${materia}",
  "questoes": [
    {
      "id": 1,
      "enunciado": "Texto completo da questão...",
      "alternativas": {
        "A": "...",
        "B": "...",
        "C": "...",
        "D": "...",
        "E": "..."
      },
      "gabarito": "C",
      "explicacao": "Explicação detalhada do raciocínio..."
    }
  ]
}`;

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text;
      return JSON.parse(rawText);
    } catch (err) {
      console.warn(`[gerarSimulado] Falha com modelo ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Erro ao gerar simulado com os modelos disponíveis.');
}

/**
 * Gera uma proposta de tema inédita para redação estilo ENEM com contexto motivador.
 */
export async function gerarTemaRedacao() {
  const ai = getAi();
  const prompt = `Você é um elaborador de propostas de redação para o ENEM.
Crie uma proposta de tema inédita e relevante para o cenário brasileiro atual, seguindo a estrutura padrão do INEP/ENEM.

Eixos temáticos possíveis: Social, Cultural, Científico/Tecnológico, Ambiental ou Educacional.

Retorne APENAS o JSON no seguinte schema:
{
  "tema": "Título do tema no padrão ENEM (ex: 'Caminhos para combater a evasão escolar no Brasil contemporâneo')",
  "eixo": "Eixo Temático (ex: 'Educação e Sociedade')",
  "contexto": "Breve resumo do problema e contextualização para inspirar os argumentos do aluno (2 a 3 frases)."
}`;

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text;
      return JSON.parse(rawText);
    } catch (err) {
      console.warn(`[gerarTemaRedacao] Falha com modelo ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Erro ao gerar tema de redação.');
}

/**
 * Corrige uma redação ENEM com rigor e calibração estrita da grade oficial do INEP.
 */
export async function corrigirRedacao(tema, texto) {
  const ai = getAi();
  const prompt = `Você é um avaliador oficial extremamente rigoroso de redações do ENEM (INEP).
Sua missão é avaliar a redação do aluno de forma JUSTA, TÉCNICA e RÍGIDA, sem benevolência artificial.
Notas permitidas por competência: APENAS múltiplos de 40 (0, 40, 80, 120, 160, 200).

TEMA: "${tema}"

TEXTO DO ESTUDANTE:
"""
${texto}
"""

DIRETRIZES DE PONTUAÇÃO RÍGIDAS (GRADE INEP):

1. COMPETÊNCIA 1 (Domínio da norma culta):
   - 200 pts: No máximo 1 desvio gramatical leve e 1 falha de concordância/regência.
   - 160 pts: Poucos desvios gramaticais (2 a 3).
   - 120 pts: Desvios regulares de pontuação, acentuação, concordância ou ortografia (4 a 6).
   - 80 pts: Muitos desvios gramaticais recorrentes.
   - 40 pts: Domínio precário da norma culta.
   - 0 pts: Desconhecimento total da língua portuguesa escrita.

2. COMPETÊNCIA 2 (Compreensão do tema e tipo textual dissertativo-argumentativo):
   - ATENÇÃO: Se o texto for escrito em apenas 1 ou 2 parágrafos, a nota MÁXIMA é 80 pts.
   - Se não apresentar repertório sociocultural legitimado e produtivo (filósofos, dados, história, leis), a nota MÁXIMA é 120 pts.
   - Se tangenciar o tema: nota máxima 40 pts. Se fugir do tema: nota 0.

3. COMPETÊNCIA 3 (Seleção, relação e organização de argumentos):
   - Se apenas lista problemas sem explicar causas e consequências (projeto de texto falho): nota máxima 80 a 120 pts.
   - 200 pts: Argumentação consistente, autoral e com projeto de texto estratégico evidente.

4. COMPETÊNCIA 4 (Mecanismos linguísticos e coesão):
   - ATENÇÃO: Se não há conectivos interparágrafos (início dos parágrafos de desenvolvimento e conclusão), nota MÁXIMA 80 a 120 pts.
   - 200 pts: Repertório diversificado de conectivos inter e intraparágrafos sem repetições viciosas.

5. COMPETÊNCIA 5 (Proposta de Intervenção):
   - Conte obrigatoriamente a presença dos 5 ELEMENTOS:
     1. Agente (quem?)
     2. Ação (o quê?)
     3. Modo/Meio (como?)
     4. Efeito/Finalidade (para quê?)
     5. Detalhamento (explicação extra de um dos itens acima)
   - 200 pts: Todos os 5 elementos válidos e articulados.
   - 160 pts: Contém 4 elementos.
   - 120 pts: Contém 3 elementos.
   - 80 pts: Contém 2 elementos.
   - 40 pts: Contém 1 elemento ou proposta vaga.
   - 0 pts: Sem proposta ou desrespeito aos direitos humanos.

IMPORTANTE: Se o texto tiver menos de 15 linhas ou for excessivamente curto, seja severo na avaliação proporcional.

Retorne APENAS um JSON válido no seguinte formato:
{
  "notaTotal": 640,
  "competencias": {
    "C1": { "nota": 120, "titulo": "Domínio da norma culta", "feedback": "Análise clara dos erros com exemplos do texto." },
    "C2": { "nota": 80, "titulo": "Compreensão e proposta temática", "feedback": "Análise sobre estrutura de parágrafos e repertório." },
    "C3": { "nota": 120, "titulo": "Seleção de argumentos", "feedback": "Análise sobre a profundidade argumentativa." },
    "C4": { "nota": 120, "titulo": "Mecanismos linguísticos", "feedback": "Análise sobre conectivos e coesão." },
    "C5": { "nota": 160, "titulo": "Proposta de intervenção", "feedback": "Detalhamento dos elementos encontrados e faltantes." }
  },
  "comentarioGeral": "Diagnóstico construtivo apontando os principais pontos de atenção para a próxima redação."
}`;

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text;
      return JSON.parse(rawText);
    } catch (err) {
      console.warn(`[corrigirRedacao] Falha com modelo ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Erro ao corrigir redação com os modelos disponíveis.');
}
