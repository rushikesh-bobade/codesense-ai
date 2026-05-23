import classnames from 'classnames';
import {
  IconBrandGithub,
  IconBrandTypescript,
  IconBrandReact,
  IconBrandNodejs,
  IconBrandPython,
  IconBrandGolang,
} from '@tabler/icons-react';
import style from './trust-badge.module.css';

const LANGUAGES = [
  { name: 'TypeScript', icon: <IconBrandTypescript size={20} /> },
  { name: 'React', icon: <IconBrandReact size={20} /> },
  { name: 'Node.js', icon: <IconBrandNodejs size={20} /> },
  { name: 'Python', icon: <IconBrandPython size={20} /> },
  { name: 'Go', icon: <IconBrandGolang size={20} /> },
  { name: 'GitHub', icon: <IconBrandGithub size={20} /> },
];

export interface TrustBadgeProps {
  className?: string;
}

export function TrustBadge({ className }: TrustBadgeProps) {
  return (
    <div className={classnames(style.root, className)}>
      <span className={style.label}>Reviews code in any language · Optimized for</span>
      <div className={style.logos}>
        {LANGUAGES.map((l) => (
          <div key={l.name} className={style.logo}>
            <span className={style.logoIcon}>{l.icon}</span>
            {l.name}
          </div>
        ))}
      </div>
    </div>
  );
}
