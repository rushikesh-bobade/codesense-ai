import classnames from 'classnames';
import { Link } from 'react-router';
import { IconBrandGithub, IconBook, IconBrandX } from '@tabler/icons-react';
import style from './footer.module.css';

export interface FooterProps {
  className?: string;
}

function LogoMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 12L9 6L11 8L7 12L11 16L9 18L3 12Z" fill="currentColor" />
      <path d="M21 12L15 18L13 16L17 12L13 8L15 6L21 12Z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={classnames(style.root, className)}>
      <div className={style.inner}>
        <div className={style.brand}>
          <Link to="/" className={style.logo}>
            <div className={style.logoMark}><LogoMark /></div>
            <span className={style.logoText}>CodeSense AI</span>
          </Link>
          <p className={style.brandDesc}>
            AI-powered code reviews that catch security flaws, performance issues, and subtle bugs before they reach
            production.
          </p>
          <div className={style.modelBadge}>
            <span className={style.modelDot} />
            Llama 3.3 70B · Groq
          </div>
        </div>

        <div className={style.linkGroup}>
          <div className={style.linkGroupTitle}>Product</div>
          <Link to="/" className={style.link}>Analyze</Link>
          <Link to="/dashboard" className={style.link}>Dashboard</Link>
          <Link to="/history" className={style.link}>History</Link>
          <Link to="/about" className={style.link}>About</Link>
        </div>

        <div className={style.linkGroup}>
          <div className={style.linkGroupTitle}>Resources</div>
          <a href="https://groq.com" target="_blank" rel="noopener noreferrer" className={style.link}>
            <IconBook size={13} /> Groq Platform
          </a>
          <a href="https://llama.meta.com" target="_blank" rel="noopener noreferrer" className={style.link}>
            <IconBook size={13} /> Llama 3.3
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={style.link}>
            <IconBrandGithub size={13} /> GitHub
          </a>
        </div>

        <div className={style.linkGroup}>
          <div className={style.linkGroupTitle}>Community</div>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={style.link}>
            <IconBrandGithub size={13} /> Star on GitHub
          </a>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer" className={style.link}>
            <IconBrandX size={13} /> Follow on X
          </a>
          <Link to="/about" className={style.link}>Changelog</Link>
        </div>
      </div>

      <div className={style.bottom}>
        <span className={style.copyright}>&copy; {new Date().getFullYear()} CodeSense AI · Built for developers</span>
        <div className={style.bottomMeta}>
          <span className={style.statusBadge}>
            <span className={style.statusDot} />
            All systems operational
          </span>
          <Link to="/about" className={style.bottomLink}>Privacy</Link>
          <Link to="/about" className={style.bottomLink}>Terms</Link>
        </div>
      </div>
    </footer>
  );
}
