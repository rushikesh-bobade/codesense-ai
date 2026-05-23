import { useState } from 'react';
import classnames from 'classnames';
import {
  IconChevronDown,
  IconAlertTriangle,
  IconBulb,
  IconInfoCircle,
  IconCheckbox,
} from '@tabler/icons-react';
import type { ReviewIssue } from '../../data/types';
import style from './detailed-issues-list.module.css';

const SEVERITY_BADGE: Record<string, { cls: string; label: string }> = {
  critical: { cls: style.badgeCritical, label: 'Critical' },
  warning: { cls: style.badgeWarning, label: 'Warning' },
  suggestion: { cls: style.badgeSuggestion, label: 'Suggestion' },
  info: { cls: style.badgeInfo, label: 'Info' },
};

const CARD_BORDER: Record<string, string> = {
  critical: style.issueCardCritical,
  warning: style.issueCardWarning,
  suggestion: style.issueCardSuggestion,
  info: style.issueCardInfo,
};

const SEV_ICON: Record<string, React.ReactNode> = {
  critical: <IconAlertTriangle size={12} />,
  warning: <IconAlertTriangle size={12} />,
  suggestion: <IconBulb size={12} />,
  info: <IconInfoCircle size={12} />,
};

function IssueCard({ issue }: { issue: ReviewIssue }) {
  const [open, setOpen] = useState(false);
  const badge = SEVERITY_BADGE[issue.severity];

  return (
    <div className={classnames(style.issueCard, CARD_BORDER[issue.severity])}>
      <div className={style.issueHeader} onClick={() => setOpen((v) => !v)}>
        <span className={classnames(style.severityBadge, badge?.cls)}>
          {SEV_ICON[issue.severity]}
          {badge?.label}
        </span>
        <div className={style.issueMeta}>
          <span className={style.issueTitle}>{issue.title}</span>
          <span className={style.issueFileLine}>
            {issue.file}{issue.line ? `:${issue.line}` : ''}
          </span>
        </div>
        <IconChevronDown size={18} className={classnames(style.chevron, { [style.open]: open })} />
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

export interface DetailedIssuesListProps {
  className?: string;
  issues: ReviewIssue[];
}

export function DetailedIssuesList({ className, issues }: DetailedIssuesListProps) {
  const grouped = {
    critical: issues.filter((i) => i.severity === 'critical'),
    warning: issues.filter((i) => i.severity === 'warning'),
    suggestion: issues.filter((i) => i.severity === 'suggestion'),
    info: issues.filter((i) => i.severity === 'info'),
  };

  return (
    <div className={classnames(style.root, className)}>
      {Object.entries(grouped).map(
        ([sev, group]) =>
          group.length > 0 && (
            <div key={sev}>
              <div className={style.sectionTitle}>{sev} ({group.length})</div>
              {group.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          )
      )}
    </div>
  );
}
