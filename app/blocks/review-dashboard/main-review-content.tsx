import { useState, useEffect } from 'react';
import classnames from 'classnames';
import {
  IconChevronDown,
  IconAlertTriangle,
  IconBulb,
  IconInfoCircle,
  IconCheckbox,
  IconCheck,
} from '@tabler/icons-react';
import type { ReviewIssue, ReviewResult } from '../../data/types';
import type { FilterValue } from './issue-filter-bar';
import style from './main-review-content.module.css';

function scoreColor(s: number) {
  if (s >= 75) return 'var(--color-score-high)';
  if (s >= 50) return 'var(--color-score-mid)';
  return 'var(--color-score-low)';
}

const CIRCUMFERENCE = 2 * Math.PI * 54;

function ScoreMeter({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0);
  const color = scoreColor(score);

  useEffect(() => {
    const timer = setTimeout(() => setDisplayed(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const offset = CIRCUMFERENCE - (displayed / 100) * CIRCUMFERENCE;

  return (
    <div className={style.scoreMeter}>
      <svg className={style.scoreSvg} width="140" height="140" viewBox="0 0 140 140">
        <circle className={style.scoreTrack} cx="70" cy="70" r="54" />
        <circle
          className={style.scoreFill}
          cx="70"
          cy="70"
          r="54"
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
  );
}

const SEVERITY_BADGE: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
  critical: { cls: style.badgeCritical, label: 'Critical', icon: <IconAlertTriangle size={10} /> },
  warning: { cls: style.badgeWarning, label: 'Warning', icon: <IconAlertTriangle size={10} /> },
  suggestion: { cls: style.badgeSuggestion, label: 'Hint', icon: <IconBulb size={10} /> },
  info: { cls: style.badgeInfo, label: 'Info', icon: <IconInfoCircle size={10} /> },
};

const CARD_BORDER: Record<string, string> = {
  critical: style.issueCardCritical,
  warning: style.issueCardWarning,
  suggestion: style.issueCardSuggestion,
  info: style.issueCardInfo,
};

function IssueCard({ issue }: { issue: ReviewIssue }) {
  const [open, setOpen] = useState(false);
  const badge = SEVERITY_BADGE[issue.severity];

  return (
    <div className={classnames(style.issueCard, CARD_BORDER[issue.severity])}>
      <div className={style.issueHeader} onClick={() => setOpen((v) => !v)}>
        <span className={classnames(style.severityBadge, badge?.cls)}>
          {badge?.icon}
          {badge?.label}
        </span>
        <span className={style.issueTitle}>{issue.title}</span>
        <span className={style.issueFile}>
          {issue.file.split('/').pop()}{issue.line ? `:${issue.line}` : ''}
        </span>
        <IconChevronDown size={16} className={classnames(style.chevron, { [style.open]: open })} />
      </div>

      {open && (
        <div className={style.issueBody}>
          <p className={style.issueDesc}>{issue.description}</p>
          {issue.codeSnippet && (
            <pre className={style.codeBlock}>{issue.codeSnippet}</pre>
          )}
          <div className={style.recBox}>
            <span className={style.recIcon}><IconCheckbox size={16} /></span>
            <p className={style.recText}>{issue.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export interface MainReviewContentProps {
  className?: string;
  result: ReviewResult;
  filter: FilterValue;
  searchQuery: string;
}

export function MainReviewContent({ className, result, filter, searchQuery }: MainReviewContentProps) {
  const q = searchQuery.toLowerCase();
  const filtered = result.issues.filter((issue) => {
    const matchesSeverity = filter === 'all' || issue.severity === filter;
    const matchesSearch =
      !q ||
      issue.title.toLowerCase().includes(q) ||
      issue.file.toLowerCase().includes(q) ||
      issue.description.toLowerCase().includes(q);
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className={classnames(style.root, className)}>
      <div className={style.scoreCard}>
        <ScoreMeter score={result.healthScore.overall} />
        <p className={style.summary}>{result.summary}</p>
      </div>

      <div className={style.issueList}>
        {filtered.length === 0 ? (
          <div className={style.noIssues}>
            <div className={style.noIssuesIcon}><IconCheck size={28} /></div>
            <div className={style.noIssuesTitle}>No issues found</div>
            <div className={style.noIssuesDesc}>
              {searchQuery ? 'Try a different search term or filter.' : 'Great code! No issues detected.'}
            </div>
          </div>
        ) : (
          filtered.map((issue) => <IssueCard key={issue.id} issue={issue} />)
        )}
      </div>
    </div>
  );
}
