# Relatório Morpheus — Rodada de UX do redesign do frontend

## Identificação da Rodada

- **Agente responsável:** Morpheus
- **Data:** 2026-09-20
- **Ambiente avaliado:** local, frontend Vite em `http://127.0.0.1:5173/`
- **Versão/commit de referência:** `ac980e6` + alterações locais não commitadas
- **Método:** inspeção estática, leitura dos fluxos e smoke HTTP; navegação visual dinâmica pendente por indisponibilidade de browser
- **Produto:** Minerva ENEM
- **Público:** estudantes brasileiros em preparação para o ENEM
- **Fase:** pré-lançamento/local
- **Idioma:** português brasileiro

## Escopo e Alvos

- Shell, navegação mobile, skip link, tema claro/escuro e foco.
- Login, cadastro, recuperação e redefinição de senha.
- Dashboard, simulado, resultado, Tutor IA, redação, histórico e perfil.
- Estados de carregamento, vazio, erro e sucesso.

## Metodologia e Evidências

Personas geradas uma vez para esta rodada e reutilizadas:

1. **Ana, 17 anos:** estudante mobile, conexão instável e pressão de tempo.
2. **Rafael, 18 anos:** estudante que aprende por diálogo e depende da continuidade do Tutor.
3. **Luana, 19 anos:** usuária que navega exclusivamente por teclado.
4. **Carlos, 23 anos:** estudante que esqueceu a senha e possui baixa tolerância a fluxos ambíguos.

### Ana — mobile e conexão instável

- **Fluxo percorrido em inspeção:** dashboard → simulado → estados de geração/erro; redação → envio/feedback.
- **Observação:** a tela de geração do simulado informa que a IA está criando questões e usa `role="status"`/`aria-live`, mas não oferece cancelamento nem previsão. O formulário de redação mantém contador, mínimo de caracteres e mensagem de erro junto à ação.
- **Inferência da persona:** sob conexão instável, Ana pode interpretar a espera como travamento porque não há ação alternativa durante a geração.
- **Reação provável:** “Não sei se ainda está carregando ou se travou.”
- **Avaliação:** Usabilidade ★★★☆☆ | Clareza ★★★★☆ | Confiança visual ★★★★☆
- **Severidade:** Média / P2, achado pré-existente mantido no redesign.
- **Sugestão:** adicionar cancelamento/repetição e uma orientação de espera sem prometer tempo preciso.

### Rafael — aprendizagem por diálogo

- **Fluxo percorrido em inspeção:** abertura do Tutor → restauração de conversa → envio → cancelamento/nova conversa.
- **Observação:** o redesign preserva `role="log"`, `aria-live="polite"`, o campo nomeado `message`, os endpoints `/api/ai/tutor` e `/api/ai/tutor/latest` e a ação de nova conversa.
- **Inferência da persona:** quando a persistência do Supabase estiver configurada, a distinção visual entre estudante e Tutor favorece a leitura sequencial; sem persistência configurada, a mensagem de indisponibilidade do backend continua sendo necessária.
- **Reação provável:** “Consigo entender quem falou e continuar a pergunta.”
- **Avaliação:** Usabilidade ★★★★☆ | Clareza ★★★★☆ | Confiança visual ★★★★☆
- **Severidade:** Baixa / P3 nesta rodada; validação de continuidade real depende de conta e schema Supabase de teste.
- **Sugestão:** testar restauração após recarregar a página com duas mensagens reais antes do commit.

### Luana — teclado

- **Fluxo percorrido em inspeção:** skip link → menu → simulado → alternativas → ações → Tutor/redação.
- **Observação:** o shell agora possui skip link, `:focus-visible`, fechamento do menu por Escape e alternativas com `focus-within`; botões e links usam elementos semânticos. A automação visual não pôde confirmar a aparência do anel no browser.
- **Inferência da persona:** o caminho de teclado está mais previsível, mas o resultado visual do foco permanece uma hipótese até a navegação real.
- **Reação provável:** “Se o anel aparecer em cada etapa, consigo saber onde estou.”
- **Avaliação:** Usabilidade ★★★★☆ | Clareza ★★★★☆ | Confiança visual ★★★☆☆
- **Severidade:** Média / P2 pendente de reteste dinâmico.
- **Sugestão:** repetir com Tab/Shift+Tab em browser e registrar o primeiro elemento que perder foco visível.

### Carlos — recuperação de senha

- **Fluxo percorrido em inspeção:** login → recuperação → redefinição.
- **Observação:** o login possui link para recuperação; os campos têm label, `name`, autocomplete e tipo adequado; mensagens de sucesso e erro usam o padrão de feedback.
- **Inferência da persona:** o fluxo agora comunica melhor o próximo passo, mas a conclusão do envio de e-mail exige ambiente Supabase autenticado/configurado.
- **Reação provável:** “Se a mensagem explicar o próximo passo, sei que não preciso criar outra conta.”
- **Avaliação:** Usabilidade ★★★★☆ | Clareza ★★★★☆ | Confiança visual ★★★★☆
- **Severidade:** Baixa / P3 até o envio real ser validado.
- **Sugestão:** executar uma recuperação com conta sintética e confirmar o retorno sem expor o endereço no relatório.

## Classificação de Severidade dos Achados

### [MOR-FRONT-001] [Severidade: Média / P2]

- **Título:** Contraste do eyebrow do `PageHeader` em tema escuro depende de variante não validada.
- **Componente afetado:** `frontend/src/components/ui/PageHeader.jsx`.
- **Descrição:** o componente usa `text-indigo-600 theme-dark:text-indigo-300`. A variante `theme-dark:` não foi declarada como variante customizada do Tailwind; portanto, o texto pode permanecer em índigo escuro sobre fundo escuro.
- **Evidência:** inspeção estática do className; não houve browser disponível para confirmação visual.
- **Impacto:** títulos de seção podem perder legibilidade no modo escuro.
- **Recomendação:** usar classe semântica já coberta pelo CSS global ou declarar explicitamente o seletor `.theme-dark` e retestar contraste.

### [MOR-FRONT-002] [Severidade: Média / P2]

- **Título:** Geração de simulado sem cancelamento ou nova tentativa durante a espera.
- **Componente afetado:** `frontend/src/Simulado.jsx`.
- **Descrição:** o redesign melhora o anúncio do carregamento, mas mantém o estado sem cancelamento e sem CTA de recuperação.
- **Evidência:** `LoadingScreen` somente exibe mensagem e spinner.
- **Impacto:** frustração em conexão instável e baixa previsibilidade do fluxo.
- **Recomendação:** adicionar cancelamento/retentativa em etapa posterior, com teste de abort sem alterar o payload da geração.

## Ações Executadas ou Recomendadas

- Registrados os fluxos e personas acima sem inventar evidência visual não observada.
- Recomendado corrigir `MOR-FRONT-001` antes do commit.
- Mantido `MOR-FRONT-002` como melhoria separada, pois exige comportamento adicional e teste de cancelamento.
- Recomendado reteste navegando em browser real antes do commit final.

## Validações e Limitações

- Guardrails frontend: 6 testes aprovados.
- Smoke HTTP: frontend `200` e backend health `200`.
- Lint/build concluídos sem erros.
- Nenhuma conta Supabase foi usada; persistência real do Tutor e envio de e-mail permanecem fora do alcance.
- Nenhum browser estava disponível na ferramenta de automação; foco, contraste, viewport e interação foram classificados como observação estática ou validação pendente.
- Nenhuma possível falha de segurança foi explorada; riscos de segurança foram reservados ao Argos.

## Reteste pós-correção

- `MOR-FRONT-001` foi corrigido: o `PageHeader` passou a usar `app-text-accent`, token semântico com valores distintos para claro/escuro, e deixou de depender da variante não declarada `theme-dark:`.
- Teste de regressão: `PageHeader usa acento semântico compatível com os dois temas` passou em RED→GREEN.
- O contraste visual em browser continua pendente de navegação dinâmica, pois a superfície de browser não estava disponível.
- `MOR-FRONT-002` permanece como melhoria P2 separada: geração de simulado ainda não possui cancelamento/retentativa.
