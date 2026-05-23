import { useState } from 'react';
import { NavLink, Link, useRouteLoaderData } from 'react-router';
import classnames from 'classnames';
import {
  IconBrandGithub,
  IconMenu2,
  IconX,
  IconArrowRight,
  IconHistory,
  IconLayoutDashboard,
  IconInfoCircle,
  IconLogout,
  IconSettings,
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

  const rootData = useRouteLoaderData('root') as { user?: any; anonymousCredits?: number } | undefined;
  const user = rootData?.user;
  const credits = rootData?.anonymousCredits ?? 2;

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
            <NavLink
              to="/settings"
              className={({ isActive }) => classnames(style.navLink, { [style.active]: isActive })}
            >
              Settings
            </NavLink>
          </div>
        </div>

        <div className={style.actions}>
          {!user ? (
            <>
              <div className={style.ghostButton} style={{ opacity: 0.8, cursor: 'default' }}>
                <span style={{ color: 'var(--color-warning)' }}>{credits}/2 Free Credits</span>
              </div>
              <a href="/auth/github" className={style.ctaButton} style={{ background: '#24292e', color: '#fff' }}>
                <IconBrandGithub size={16} />
                Login with GitHub
              </a>
            </>
          ) : (
            <>
              <div className={style.ghostButton} style={{ gap: '8px', cursor: 'default' }}>
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  style={{ width: 24, height: 24, borderRadius: '50%' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{user.username}</span>
              </div>
              <form action="/logout" method="post">
                <button type="submit" className={style.ghostButton} aria-label="Logout">
                  <IconLogout size={16} />
                </button>
              </form>
            </>
          )}

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
        <Link to="/settings" className={style.mobileNavLink} onClick={close}>
          <IconSettings size={18} /> Settings
        </Link>
        
        {!user ? (
          <a href="/auth/github" className={style.mobileCtaButton} onClick={close} style={{ background: '#24292e', color: '#fff', marginTop: 16 }}>
            <IconBrandGithub size={18} /> Login with GitHub
          </a>
        ) : (
          <form action="/logout" method="post" style={{ width: '100%', marginTop: 16 }}>
            <button type="submit" className={style.mobileCtaButton} onClick={close} style={{ background: 'var(--color-critical-bg)', color: 'var(--color-critical)' }}>
              <IconLogout size={18} /> Logout
            </button>
          </form>
        )}
      </div>
    </>
  );
}
