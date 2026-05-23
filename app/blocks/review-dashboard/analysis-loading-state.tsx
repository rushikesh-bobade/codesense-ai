import classnames from 'classnames';
import { IconLoader2, IconCheck, IconGitPullRequest, IconFileCode, IconBrain, IconChartBar } from '@tabler/icons-react';
import style from './analysis-loading-state.module.css';

const STEPS = [
  { icon: <IconGitPullRequest size={14} />, label: 'Fetching PR from GitHub…' },
  { icon: <IconFileCode size={14} />, label: 'Reading changed files…' },
  { icon: <IconBrain size={14} />, label: 'Running AI analysis…' },
  { icon: <IconChartBar size={14} />, label: 'Generating health score…' },
];

export interface AnalysisLoadingStateProps {
  className?: string;
  currentStep?: number;
}

export function AnalysisLoadingState({ className, currentStep = 0 }: AnalysisLoadingStateProps) {
  const progress = Math.min(((currentStep + 1) / STEPS.length) * 100, 100);

  return (
    <div className={classnames(style.overlay, className)}>
      <div className={style.card}>
        <h2 className={style.title}>Analyzing Pull Request…</h2>
        <p className={style.subtitle}>Usually takes 8–15 seconds</p>

        <div className={style.steps}>
          {STEPS.map((step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;
            return (
              <div
                key={i}
                className={classnames(style.step, {
                  [style.active]: isActive,
                  [style.done]: isDone,
                })}
              >
                <div
                  className={classnames(style.stepIcon, {
                    [style.stepIconPending]: !isActive && !isDone,
                    [style.stepIconActive]: isActive,
                    [style.stepIconDone]: isDone,
                  })}
                >
                  {isDone ? (
                    <IconCheck size={14} color="white" />
                  ) : isActive ? (
                    <IconLoader2 size={14} color="white" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span
                  className={classnames(style.stepLabel, {
                    [style.stepLabelActive]: isActive,
                    [style.stepLabelDone]: isDone,
                  })}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className={style.progressWrap}>
          <div className={style.progressBar}>
            <div className={style.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <p className={style.progressLabel}>Usually takes 8–15 seconds · Powered by Groq AI</p>
        </div>
      </div>
    </div>
  );
}
