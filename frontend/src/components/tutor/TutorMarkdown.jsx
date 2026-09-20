import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';

const markdownComponents = {
  a: ({ node: _node, ...props }) => (
    <a {...props} target="_blank" rel="noreferrer" className="tutor-markdown-link" />
  ),
  img: ({ alt }) => <span className="tutor-markdown-image">[Imagem: {alt || 'conteúdo visual'}]</span>,
  table: ({ node: _node, children }) => (
    <div className="tutor-table-wrapper" role="region" aria-label="Tabela da resposta" tabIndex="0">
      <table>{children}</table>
    </div>
  ),
  th: ({ node: _node, ...props }) => <th scope="col" {...props} />,
  pre: ({ node: _node, ...props }) => <pre className="tutor-markdown-pre" {...props} />,
};

export default function TutorMarkdown({ children }) {
  return (
    <div className="tutor-markdown prose-ai">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeSanitize, rehypeKatex]}
        skipHtml
        components={markdownComponents}
      >
        {String(children ?? '')}
      </ReactMarkdown>
    </div>
  );
}
