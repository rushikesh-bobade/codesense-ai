import { useState, useEffect } from 'react';
import classnames from 'classnames';
import style from './large-health-score-display.module.css';

const CIRCUMFERENCE = 2 * Math.PI * 80;

function scoreColor(s: number) {
  if (s >= 75) return 'var(--color-score-high)';
  if (s >= 50) return 'var(--color-score-mid)';
  return 'var(--color-score-low)';
}

function scoreQuality(s: number) {
  if (s >= 90) return 'Excellent';
  if (s >= 75) return 'Good';
  if (s >= 50) return 'Needs Work';
  return 'Poor';
}

export interface LargeHealthScoreDisplayProps {
  className?: string;
  score: number;
}

export function LargeHealthScoreDisplay({ className, score }: LargeHealthScoreDisplayProps) {
  const [displayed, setDisplayed] = useState(0);
  const color = scoreColor(score);

  useEffect(() => {
    const t = setTimeout(() => setDisplayed(score), 150);
    return () => clearTimeout(t);
  }, [score]);

  const offset = CIRCUMFERENCE - (displayed / 100) * CIRCUMFERENCE;

  return (
    <div className={classnames(style.root, className)}>
      <div className={style.scoreMeter}>
        <svg className={style.scoreSvg} width="200" height="200" viewBox="0 0 200 200">
          <circle className={style.scoreTrack} cx="100" cy="100" r="80" />
          <circle
            className={style.scoreFill}
            cx="100" cy="100" r="80"
            stroke={color}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <div className={style.scoreCenter}>
          <span className={style.scoreNumber} style={{ color }}>{score}</span>
          <span className={style.scoreLabel}>Health Score</span>
        </div>
      </div>
      <div className={style.scoreQuality}>{scoreQuality(score)}</div>
    </div>
  );
}
