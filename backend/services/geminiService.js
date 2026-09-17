import { GoogleGenAI } from '@google/genai';

// ─── Inicialização do cliente Gemini ─────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemini-2.0-flash';

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
 * Envia mensagens ao tutor ENEM e retorna a resposta textual.
 *
 * @param {Array<{role: 'user'|'model', parts: [{text: string}]}>} messages
 *   Histórico completo da conversa, incluindo a mensagem atual do usuário.
 * @returns {Promise<string>} Texto de resposta gerado pelo modelo.
 */
export async function chatWithTutor(messages) {
  // Separa o histórico anterior da mensagem atual (última da lista)
  const history = messages.slice(0, -1);
  const lastMessage = messages[messages.length - 1];

  const chat = ai.chats.create({
    model: MODEL,
    config: {
      systemInstruction: TUTOR_SYSTEM_PROMPT,
    },
    history,
  });

  const response = await chat.sendMessage({
    message: lastMessage.parts,
  });

  return response.text;
}

/**
 * Gera questões de simulado ENEM em formato JSON estruturado.
 *
 * @param {string} materia  — Área/matéria (ex: "Matemática", "História")
 * @param {number} numQuestoes — Número de questões a gerar (1–20)
 * @returns {Promise<Object>} Objeto com { materia, questoes: [...] }
 */
export async function gerarSimulado(materia, numQuestoes) {
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

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: 'application/json',
    },
  });

  const rawText = response.text;

  // Tenta fazer parse do JSON retornado pela IA
  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error(
      `A IA retornou um JSON inválido. Tente novamente. Resposta bruta: ${rawText.slice(0, 200)}`
    );
  }
}

/**
 * Corrige uma redação ENEM e retorna avaliação por competência em JSON.
 *
 * @param {string} tema   — Tema da redação
 * @param {string} texto  — Texto completo da redação do aluno
 * @returns {Promise<Object>} Objeto com { notaTotal, competencias, comentarioGeral }
 */
export async function corrigirRedacao(tema, texto) {
  const prompt = `Você é um corretor especialista em redações do ENEM. Corrija a redação abaixo seguindo rigorosamente as 5 competências da grade de correção do ENEM.

TEMA: ${tema}

REDAÇÃO:
${texto}

INSTRUÇÕES DE CORREÇÃO:
- Cada competência vale de 0 a 200 pontos (em intervalos de 40: 0, 40, 80, 120, 160, 200).
- A nota total é a soma das 5 competências (máximo 1000 pontos).
- Forneça feedback específico, construtivo e detalhado para cada competência, apontando pontos positivos e o que pode melhorar.
- O comentário geral deve ser encorajador e trazer as principais orientações para evolução.

Retorne APENAS o JSON válido, sem markdown, sem texto extra, seguindo EXATAMENTE este schema:
{
  "notaTotal": 820,
  "competencias": {
    "C1": { "nota": 160, "titulo": "Domínio da norma culta", "feedback": "..." },
    "C2": { "nota": 180, "titulo": "Compreensão e proposta temática", "feedback": "..." },
    "C3": { "nota": 160, "titulo": "Seleção de argumentos", "feedback": "..." },
    "C4": { "nota": 160, "titulo": "Mecanismos linguísticos", "feedback": "..." },
    "C5": { "nota": 160, "titulo": "Proposta de intervenção", "feedback": "..." }
  },
  "comentarioGeral": "..."
}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: 'application/json',
    },
  });

  const rawText = response.text;

  // Tenta fazer parse do JSON retornado pela IA
  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error(
      `A IA retornou um JSON inválido. Tente novamente. Resposta bruta: ${rawText.slice(0, 200)}`
    );
  }
}
