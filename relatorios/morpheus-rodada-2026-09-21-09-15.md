# Rodada Morpheus: redesign global e modo claro

## Identificação da Rodada

- Agente responsável: Morpheus.
- Data e hora: 21/09/2026, 09:15 (America/Sao_Paulo).
- Ambiente: localhost, frontend Vite, sem conta autenticada.
- Versão: árvore de trabalho local após o redesign e o ajuste off-white; sem commit novo.

## Escopo e Alvos

- Login `/` e cadastro `/cadastro`.
- Alternador de tema e preferência persistida.
- Marca, formulário de autenticação, cartões de recursos, foco e rota protegida.
- Contextos: primeiro uso, estudante sob pressão, baixa literacia digital e leitura em tema claro/escuro.

## Metodologia e Evidências

### Persona 1: Ana, 17 anos, estudante mobile e primeira visita

- Objetivo: entender rapidamente o produto e criar uma conta.
- Observação: a tela expõe “Aprendizado com direção”, uma descrição curta e a ação “Criar conta grátis”; `/cadastro` abriu e apresentou nome, e-mail e senha com rótulos associados.
- Inferência: a proposta e o próximo passo são compreensíveis sem tutorial.
- Avaliação: Usabilidade ★★★★☆ | Clareza ★★★★★ | Confiança visual ★★★★☆.
- Severidade: P3, melhoria.
- Sugestão: validar em viewport de 375px com usuário real antes de fechar espaçamentos.

### Persona 2: João, 18 anos, sob pressão e com pouca literacia digital

- Objetivo: entrar sem procurar muito.
- Observação: o formulário mostra “Acesso do estudante”, campos nomeados, “Esqueci minha senha” e “Entrar no Minerva”. A rota direta `/dashboard` redirecionou para `/` sem sessão.
- Inferência: a hierarquia prioriza a ação principal e oferece recuperação de acesso.
- Avaliação: Usabilidade ★★★★★ | Clareza ★★★★☆ | Confiança visual ★★★★☆.
- Severidade: nenhuma falha confirmada.

### Persona 3: Lucas, usuário com baixa visão e sensibilidade a branco intenso

- Objetivo: ler o login sem desconforto.
- Observação: o tema claro foi verificado visualmente após o ajuste; as superfícies usam off-white (`#f8f4ee`) sobre fundo lavanda (`#f1edf7`), sem branco puro dominante. O modo escuro também foi alternado e manteve texto claro, bordas e campos legíveis.
- Inferência: a redução do branco intenso melhora o conforto, mas a percepção final deve ser confirmada com usuário real e medição de contraste.
- Avaliação: Usabilidade ★★★★☆ | Clareza ★★★★★ | Confiança visual ★★★★★.
- Severidade: P3, melhoria validada visualmente.

### Persona 4: Marina, estudante que alterna temas e usa teclado

- Objetivo: alternar o tema e alcançar o formulário sem mouse.
- Observação: o controle anuncia “Ativar modo escuro” e “Ativar modo claro” conforme o estado. A sequência de Tab alcançou o skip link e depois o link de recuperação; os campos possuem rótulos e foco nativo.
- Inferência: há caminho funcional por teclado no fluxo público.
- Avaliação: Usabilidade ★★★★☆ | Clareza ★★★★☆ | Confiança visual ★★★★☆.
- Severidade: P3, validação pendente para todo o fluxo de teclado em mobile/desktop.

### Fricção repetida

- Os cartões de recursos exibem uma seta e aparência de item acionável, mas são elementos informativos sem navegação associada. Isso pode gerar expectativa de clique, embora não bloqueie login ou cadastro.
- Severidade: P3. Recomenda-se remover a seta ou transformar cada cartão em ação real com destino explícito.

## Classificação de Severidade dos Achados

- P0/P1/P2: nenhum achado confirmado nesta rodada pública.
- P3: cartões informativos com affordance de navegação sem ação.
- P3: validação dinâmica em 375px, leitor de tela e zoom ainda pendente.

## Ações Executadas ou Recomendadas

- Nenhuma alteração de código realizada por esta rodada.
- Encaminhar a fricção dos cartões para Minerva decidir entre remover as setas ou adicionar destinos.

## Validações e Limitações

- Teste dinâmico local executado no navegador em login, cadastro, alternância claro/escuro, árvore de acessibilidade e redirecionamento de rota protegida.
- Não houve login real, envio de credenciais, teste de IA ou usuário real.
- Viewport móvel, leitor de tela externo, axe-core/Lighthouse e recuperação de senha por e-mail não foram executados.
- Qualquer validação legal de acessibilidade permanece pendente de ferramentas especializadas e usuários reais.
