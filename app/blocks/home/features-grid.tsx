import classnames from 'classnames';
import { IconShieldLock, IconZoomCode, IconBolt } from '@tabler/icons-react';
import style from './features-grid.module.css';

const FEATURES = [
  {
    icon: <IconShieldLock size={18} />,
    iconColor: 'var(--color-critical)',
    title: 'Security Scanner',
    desc: 'Catches SQL injection, XSS, hardcoded secrets, weak auth, insecure dependencies, and race conditions before they reach production.',
    tags: ['SQLi', 'XSS', 'Secrets', 'Auth', 'Deps'],
  },
  {
    icon: <IconBolt size={18} />,
    iconColor: 'var(--color-warning)',
    title: 'Performance Analyzer',
    desc: 'Detects N+1 queries, memory leaks, blocking operations, and inefficient algorithms with targeted optimization suggestions.',
    tags: ['N+1', 'Memory', 'Blocking', 'Big-O'],
  },
  {
    icon: <IconZoomCode size={18} />,
    iconColor: 'var(--color-suggestion)',
    title: 'Bug Detector',
    desc: 'Surfaces null pointer risks, missing error handling, logic errors, dead code, and type mismatches across your full diff.',
    tags: ['Nullability', 'Errors', 'Logic', 'Types'],
  },
];

export interface FeaturesGridProps {
  className?: string;
}

export function FeaturesGrid({ className }: FeaturesGridProps) {
  return (
    <section className={classnames(style.root, className)}>
      <div className={style.inner}>
        <div className={style.header}>
          <span className={style.eyebrow}>What we detect</span>
          <h2 className={style.title}>A senior engineer in every PR</h2>
          <p className={style.subtitle}>
            Three specialized analysis engines work in parallel on every diff, producing a single ranked report.
          </p>
        </div>
        <div className={style.grid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={style.card}>
              <div className={style.iconWrap} style={{ color: f.iconColor }}>
                {f.icon}
              </div>
              <h3 className={style.cardTitle}>{f.title}</h3>
              <p className={style.cardDesc}>{f.desc}</p>
              <div className={style.tagList}>
                {f.tags.map((t) => (
                  <span key={t} className={style.tag}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
