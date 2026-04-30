import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ProductDescriptionProps {
  markdown: string;
}

export const ProductDescription = ({ markdown }: ProductDescriptionProps) => {
  if (!markdown.trim()) return null;
  return (
    <article
      aria-labelledby="pdp-description-title"
      className="py-4"
      style={{ borderTop: '1px dashed var(--color-line)' }}
    >
      <span
        id="pdp-description-eyebrow"
        className="inline-flex items-center gap-2 mb-3"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-cobre)',
        }}
      >
        <span aria-hidden="true" style={{ color: 'var(--color-ambar)', letterSpacing: '0.2em' }}>
          ○ ○ ○
        </span>
        Sobre essa peça
      </span>
      <h2
        id="pdp-description-title"
        className="mb-4"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          color: 'var(--color-cedro)',
          lineHeight: 1.2,
        }}
      >
        Detalhes editoriais da peça
      </h2>
      <div className="pdp-md">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
      <style>{`
        .pdp-md p {
          font-size: 1rem;
          line-height: 1.7;
          color: var(--color-ink-soft);
          margin-bottom: 1rem;
        }
        .pdp-md p:last-child { margin-bottom: 0; }
        .pdp-md p strong { color: var(--color-cedro); font-weight: 600; }
        .pdp-md ul, .pdp-md ol {
          padding-left: 1.25rem;
          margin-bottom: 1rem;
          color: var(--color-ink-soft);
        }
        .pdp-md li { margin-bottom: 0.35rem; line-height: 1.65; }
        .pdp-md a {
          color: var(--color-cobre);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .pdp-md h2 {
          font-family: var(--font-display);
          font-size: 1.35rem;
          color: var(--color-cedro);
          margin-top: 1.5rem;
          margin-bottom: 0.6rem;
          line-height: 1.2;
        }
        .pdp-md h3 {
          font-family: var(--font-display);
          font-size: 1.15rem;
          color: var(--color-cedro);
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .pdp-md h4 {
          font-family: var(--font-display);
          font-size: 1rem;
          color: var(--color-cedro);
          margin-top: 1rem;
          margin-bottom: 0.4rem;
        }
        .pdp-md h2:first-child,
        .pdp-md h3:first-child,
        .pdp-md h4:first-child { margin-top: 0; }

        /* Tabelas (GFM) */
        .pdp-md table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0 1.25rem;
          font-size: 0.95rem;
          color: var(--color-ink-soft);
          border: 1px solid var(--color-line);
          border-radius: 8px;
          overflow: hidden;
        }
        .pdp-md thead { background: var(--color-surface-warm); }
        .pdp-md th {
          text-align: left;
          font-family: var(--font-mono);
          font-size: 0.78rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--color-cedro);
          padding: 0.6rem 0.85rem;
          border-bottom: 1px solid var(--color-line);
        }
        .pdp-md td {
          padding: 0.6rem 0.85rem;
          border-bottom: 1px solid var(--color-line);
          vertical-align: top;
        }
        .pdp-md tbody tr:last-child td { border-bottom: none; }
        .pdp-md tbody tr:nth-child(even) { background: rgba(245, 236, 229, 0.35); }

        /* Citações */
        .pdp-md blockquote {
          margin: 1rem 0;
          padding: 0.6rem 1rem;
          border-left: 3px solid var(--color-ambar);
          background: var(--color-surface-warm);
          color: var(--color-cedro);
          border-radius: 0 6px 6px 0;
        }
        .pdp-md blockquote p { margin: 0; }
        .pdp-md blockquote em { font-style: italic; }

        /* Código */
        .pdp-md code {
          font-family: var(--font-mono);
          font-size: 0.88em;
          background: var(--color-surface-warm);
          color: var(--color-cedro);
          padding: 0.1em 0.35em;
          border-radius: 4px;
        }
        .pdp-md pre {
          background: var(--color-surface-warm);
          border: 1px solid var(--color-line);
          border-radius: 8px;
          padding: 0.85rem 1rem;
          overflow-x: auto;
          margin: 1rem 0;
          font-size: 0.9rem;
          line-height: 1.55;
        }
        .pdp-md pre code {
          background: transparent;
          padding: 0;
          font-size: inherit;
        }

        /* Misc */
        .pdp-md hr {
          border: none;
          border-top: 1px dashed var(--color-line);
          margin: 1.5rem 0;
        }
        .pdp-md img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 0.75rem 0;
        }
      `}</style>
    </article>
  );
};
