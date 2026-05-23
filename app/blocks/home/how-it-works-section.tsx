import classnames from 'classnames';
import { IconLink, IconBrain, IconListCheck } from '@tabler/icons-react';
import style from './how-it-works-section.module.css';

const STEPS = [
  {
    icon: <IconLink size={16} />,
    title: 'Paste your PR URL',
    desc: 'Drop any public GitHub Pull Request link. No installation, no signup, no GitHub app to authorize.',
  },
  {
    icon: <IconBrain size={16} />,
    title: 'AI reads the diff',
    desc: "Llama 3.3 70B on Groq parses every changed file in parallel, scoring security, performance, and code quality.",
  },
  {
    icon: <IconListCheck size={16} />,
    title: 'Act on the review',
    desc: 'Get a ranked report with line-level issues, copy-paste fixes, and a downloadable Markdown summary.',
  },
];

export interface HowItWorksSectionProps {
  className?: string;
}

export function HowItWorksSection({ className }: HowItWorksSectionProps) {
  return (
    <section id="how-it-works" className={classnames(style.root, className)}>
      <div className={style.inner}>
        <div className={style.header}>
          <span className={style.eyebrow}>Workflow</span>
          <h2 className={style.title}>From PR to insight in seconds</h2>
          <p className={style.subtitle}>No setup. No code changes. Just paste and review.</p>
        </div>
        <div className={style.steps}>
          {STEPS.map((step, i) => (
            <div key={step.title} className={style.step}>
              <div className={style.stepHeader}>
                <div className={style.stepNum}>{String(i + 1).padStart(2, '0')}</div>
                <div className={style.stepIcon}>{step.icon}</div>
              </div>
              <h3 className={style.stepTitle}>{step.title}</h3>
              <p className={style.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
