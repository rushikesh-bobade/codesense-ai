import { useState } from 'react';
import { NavLink, Link } from 'react-router';
import classnames from 'classnames';
import {
  IconBrandGithub,
  IconMenu2,
  IconX,
  IconArrowRight,
  IconHistory,
  IconLayoutDashboard,
  IconInfoCircle,
} from '@tabler/icons-react';
import style from './navigation-bar.module.css';

export interface NavigationBarProps {
  className?: string;
}

function LogoMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3 12L9 6L11 8L7 12L11 16L9 18L3 12Z" fill="currentColor" />
      <path d="M21 12L15 18L13 16L17 12L13 8L15 6L21 12Z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function NavigationBar({ className }: NavigationBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <>
      <nav className={classnames(style.root, className)}>
        <div className={style.left}>
          <Link to="/" className={style.logo}>
            <div className={style.logoMark}>
              <LogoMark />
            </div>
            <span className={style.logoText}>CodeSense</span>
            <span className={style.logoSuffix}>AI</span>
          </Link>

          <div className={style.nav}>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => classnames(style.navLink, { [style.active]: isActive })}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) => classnames(style.navLink, { [style.active]: isActive })}
            >
              History
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) => classnames(style.navLink, { [style.active]: isActive })}
            >
              About
            </NavLink>
          </div>
        </div>

        <div className={style.actions}>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className={style.ghostButton}
            aria-label="GitHub"
          >
            <IconBrandGithub size={16} />
            Star
          </a>
          <Link to="/" className={style.ctaButton}>
            Analyze PR
            <IconArrowRight size={14} />
          </Link>
          <button
            className={style.mobileMenuButton}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
          </button>
        </div>
      </nav>

      <div className={classnames(style.mobileNav, { [style.open]: mobileOpen })}>
        <Link to="/dashboard" className={style.mobileNavLink} onClick={close}>
          <IconLayoutDashboard size={18} /> Dashboard
        </Link>
        <Link to="/history" className={style.mobileNavLink} onClick={close}>
          <IconHistory size={18} /> History
        </Link>
        <Link to="/about" className={style.mobileNavLink} onClick={close}>
          <IconInfoCircle size={18} /> About
        </Link>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className={style.mobileNavLink}
          onClick={close}
        >
          <IconBrandGithub size={18} />
          GitHub
        </a>
        <Link to="/" className={style.mobileCtaButton} onClick={close}>
          Analyze a PR
          <IconArrowRight size={16} />
        </Link>
      </div>
    </>
  );
}
