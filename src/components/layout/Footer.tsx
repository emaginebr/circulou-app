import { Link } from 'react-router-dom';

interface FooterColumnProps {
  title: string;
  links: { to: string; label: string }[];
}

const FooterColumn = ({ title, links }: FooterColumnProps) => (
  <nav>
    <h3
      style={{
        color: 'var(--color-cru)',
        fontSize: '0.85rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {title}
    </h3>
    <ul className="list-none p-0 mt-4 flex flex-col gap-2.5">
      {links.map(l => (
        <li key={l.label}>
          {/* TODO rotas reais — placeholders apontando para o que já existe */}
          <Link
            to={l.to}
            className="no-underline hover:text-[var(--color-ambar)] transition-colors"
            style={{ color: 'var(--color-areia)', fontSize: '0.9rem' }}
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);

export const Footer = () => (
  <footer
    style={{
      background: 'var(--color-tinta)',
      color: 'var(--color-cru)',
    }}
  >
    <div
      className="mx-auto w-full max-w-[1280px] px-6 lg:px-10"
      style={{
        paddingTop: 'var(--space-section-tight)',
        paddingBottom: 'var(--space-section-tight)',
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-ambar)',
              fontSize: '1.4rem',
            }}
          >
            Circulou
          </span>
          <p
            className="mt-3 max-w-[28ch]"
            style={{ color: 'var(--color-areia)', fontSize: '0.9rem' }}
          >
            Brechó online que conecta moda circular, propósito e gente que se importa.
          </p>
          <div className="flex gap-4 mt-6" aria-label="Redes sociais">
            <a
              href="https://instagram.com"
              className="no-underline hover:text-[var(--color-ambar)] transition-colors"
              style={{ color: 'var(--color-areia)', fontSize: '0.9rem' }}
              aria-label="Instagram"
            >
              Instagram
            </a>
            <a
              href="https://tiktok.com"
              className="no-underline hover:text-[var(--color-ambar)] transition-colors"
              style={{ color: 'var(--color-areia)', fontSize: '0.9rem' }}
              aria-label="TikTok"
            >
              TikTok
            </a>
            <a
              href="https://pinterest.com"
              className="no-underline hover:text-[var(--color-ambar)] transition-colors"
              style={{ color: 'var(--color-areia)', fontSize: '0.9rem' }}
              aria-label="Pinterest"
            >
              Pinterest
            </a>
          </div>
        </div>

        <FooterColumn
          title="Úteis"
          links={[
            { to: '/', label: 'Home' },
            { to: '/quero-vender', label: 'Quero vender' },
            { to: '/curadoria-do-bem', label: 'Curadoria do Bem' },
            { to: '/ongs', label: 'ONGs parceiras' },
            { to: '/blog', label: 'Blog' },
            { to: '/trabalhe-conosco', label: 'Trabalhe conosco' },
          ]}
        />
        <FooterColumn
          title="Meu Perfil"
          links={[
            { to: '/profile', label: 'Meus pedidos' },
            { to: '/profile', label: 'Minhas sacolas' },
            { to: '/profile', label: 'Meu saldo' },
            { to: '/profile', label: 'Favoritos' },
            { to: '/search', label: 'Promoções' },
          ]}
        />
        <FooterColumn
          title="Ajuda"
          links={[
            { to: '/ajuda', label: 'Central de ajuda' },
            { to: '/ajuda/devolucao', label: 'Devolução e reembolso' },
            { to: '/ajuda/frete', label: 'Frete e entrega' },
            { to: '/ajuda/privacidade', label: 'Política de privacidade' },
            { to: '/ajuda/contato', label: 'Fale conosco' },
          ]}
        />
      </div>

      <div
        className="pt-8 flex justify-between flex-wrap gap-4"
        style={{ borderTop: '1px solid rgba(245,236,229,0.1)' }}
      >
        <p style={{ color: 'var(--color-mute)', fontSize: '0.8rem' }}>
          © {new Date().getFullYear()} Circulou Brechó do Juntos · CNPJ
          00.000.000/0001-00 · contato@circulou.com.br
        </p>
        <p style={{ color: 'var(--color-mute)', fontSize: '0.8rem' }}>
          Pagamentos: Visa · Master · Elo · PIX · Boleto
        </p>
      </div>
    </div>
  </footer>
);
