import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../src/components/Layout.jsx', import.meta.url), 'utf8');

function readSource(path) {
  try {
    return fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  } catch {
    return '';
  }
}

test('fundação visual não bloqueia movimento, zoom ou foco', () => {
  assert.equal(css.includes('transition: all'), false);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /color-scheme/);
  assert.match(css, /focus-visible/);
  assert.doesNotMatch(html, /user-scalable=no|maximum-scale=1/);
});

test('shell oferece salto para o conteúdo e feedback semântico', () => {
  const pageHeader = readSource('../src/components/ui/PageHeader.jsx');
  const feedbackMessage = readSource('../src/components/ui/FeedbackMessage.jsx');

  assert.match(layout, /href="#main-content"/);
  assert.match(layout, /<main[^>]+id="main-content"/);
  assert.match(layout, /aria-label="Navegação principal"/);
  assert.match(layout, /aria-current=/);
  assert.match(pageHeader, /function PageHeader|export default function PageHeader/);
  assert.match(feedbackMessage, /aria-live|role="alert"/);
});

test('formulários públicos nomeiam e configuram corretamente seus campos', () => {
  const publicForms = ['Login.jsx', 'Cadastro.jsx', 'RecuperarSenha.jsx', 'RedefinirSenha.jsx'];

  for (const file of publicForms) {
    const source = readSource(`../src/${file}`);
    const inputs = source.match(/<input[\s\S]*?>/g) || [];
    assert.ok(inputs.length > 0, `${file} deve conter campos de formulário`);
    for (const input of inputs) {
      assert.match(input, /\bname=/, `${file} possui input sem name`);
      assert.match(input, /\btype=/, `${file} possui input sem type`);
      assert.match(input, /\bautoComplete=/, `${file} possui input sem autocomplete`);
    }
  }

  assert.match(readSource('../src/Login.jsx'), /inputMode="email"/);
  assert.match(readSource('../src/RecuperarSenha.jsx'), /inputMode="email"/);
});

test('fluxos de estudo preservam hierarquia e feedback acessível', () => {
  const studyPages = ['Dashboard.jsx', 'Simulado.jsx', 'Resultado.jsx'];

  for (const file of studyPages) {
    const source = readSource(`../src/${file}`);
    assert.ok((source.match(/<h1\b/g) || []).length === 1 || /<PageHeader\b/.test(source), `${file} deve ter um h1`);
    assert.match(source, /role="alert"|<FeedbackMessage/, `${file} deve ter feedback de erro`);
    assert.match(source, /aria-live="polite"|<FeedbackMessage/, `${file} deve anunciar feedback assíncrono`);
    assert.doesNotMatch(source, /<(?:div|span)[^>]*onClick=/, `${file} não deve navegar por div/span`);
  }
});

test('Tutor e redação expõem composição, log e feedback acessíveis', () => {
  const tutor = readSource('../src/TutorAI.jsx');
  const redacao = readSource('../src/Redacao.jsx');

  assert.match(tutor, /role="log"/);
  assert.match(tutor, /aria-live="polite"/);
  assert.match(tutor, /id="chat-input"/);
  assert.match(tutor, /name="message"/);
  assert.match(tutor, /autoComplete="off"/);
  assert.match(redacao, /htmlFor="redacao-tema"/);
  assert.match(redacao, /htmlFor="redacao-texto"/);
  assert.match(redacao, /role="alert"/);
  assert.match(redacao, /bg-amber-50\/80/);
});

test('histórico e perfil cobrem vazio, salvamento e controles nomeados', () => {
  const historico = readSource('../src/Historico.jsx');
  const perfil = readSource('../src/Perfil.jsx');
  const protectedRoute = readSource('../src/components/ProtectedRoute.jsx');

  assert.match(historico, /Nenhum simulado ainda/);
  assert.match(historico, /Nenhuma redação ainda/);
  assert.match(historico, /Intl\.DateTimeFormat/);
  assert.match(perfil, /autoComplete="name"/);
  assert.match(perfil, /inputMode="numeric"/);
  assert.match(perfil, /aria-live="polite"|<FeedbackMessage/);
  assert.match(protectedRoute, /role="status"/);
});

test('PageHeader usa acento semântico compatível com os dois temas', () => {
  const pageHeader = readSource('../src/components/ui/PageHeader.jsx');

  assert.match(pageHeader, /app-text-accent/);
  assert.doesNotMatch(pageHeader, /theme-dark:/);
});

test('Tutor oferece limpeza persistente com confirmacao destrutiva', () => {
  const tutor = readSource('../src/TutorAI.jsx');

  assert.match(tutor, /Limpar histórico/);
  assert.match(tutor, /api\.delete\(['"]\/ai\/tutor\/history['"]\)/);
  assert.match(tutor, /aria-modal="true"/);
  assert.match(tutor, /role="dialog"/);
  assert.match(tutor, /Cancelar/);
});

test('modo claro usa superficies sem branco puro', () => {
  const lightTokens = css.match(/--app-(?:bg|surface|surface-muted):\s*([^;]+)/g) || [];
  assert.equal(lightTokens.length >= 3, true);
  assert.doesNotMatch(css, /--app-surface:\s*#ffffff/);
  assert.match(css, /tutor-markdown|prose-ai/);
});

test('estrutura de documentacao e relatorios declara timestamps', () => {
  const reportReadme = fs.readFileSync(new URL('../../relatorios/README.md', import.meta.url), 'utf8');
  const docsReadme = readSource('../../docs/README.md');

  assert.match(reportReadme, /AAAA-MM-DD-HH-mm/);
  assert.match(docsReadme, /spec\.md/);
  assert.doesNotMatch(docsReadme, /superpowers/);
});
