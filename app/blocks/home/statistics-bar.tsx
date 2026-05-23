import classnames from 'classnames';
import style from './statistics-bar.module.css';

const STATS = [
  { metric: '< 10s', label: 'Average review time', accent: true },
  { metric: '15+', label: 'Issue categories' },
  { metric: '70B', label: 'Parameter model' },
  { metric: '100%', label: 'Free · No signup' },
];

export interface StatisticsBarProps {
  className?: string;
}

export function StatisticsBar({ className }: StatisticsBarProps) {
  return (
    <section className={classnames(style.root, className)}>
      <div className={style.inner}>
        {STATS.map((s) => (
          <div key={s.label} className={style.card}>
            <div className={classnames(style.metric, { [style.metricAccent]: s.accent })}>{s.metric}</div>
            <div className={style.label}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
