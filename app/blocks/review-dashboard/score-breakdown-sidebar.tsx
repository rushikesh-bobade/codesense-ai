import { useState, useEffect } from 'react';
import classnames from 'classnames';
import {
  IconCopy,
  IconBrandGithub,
  IconRefresh,
  IconCheck,
  IconDownload,
  IconLoader2,
  IconFileText,
} from '@tabler/icons-react';
import type { ReviewResult } from '../../data/types';
import {
  generateMarkdownReport,
  downloadFile,
  safeFilename,
} from '../../data/review-store';
import style from './score-breakdown-sidebar.module.css';

function scoreColor(s: number) {
  if (s >= 75) return 'var(--color-score-high)';
  if (s >= 50) return 'var(--color-score-mid)';
  return 'var(--color-score-low)';
}

export interface ScoreBreakdownSidebarProps {
  className?: string;
  result: ReviewResult;
  onReanalyze?: () => void;
  isReanalyzing?: boolean;
}

export function ScoreBreakdownSidebar({
  className,
  result,
  onReanalyze,
  isReanalyzing,
}: ScoreBreakdownSidebarProps) {
  const [copied, setCopied] = useState(false);
  const [barWidths, setBarWidths] = useState({ security: 0, performance: 0, maintainability: 0 });

  useEffect(() => {
    const t = setTimeout(() => {
      setBarWidths({
        security: result.healthScore.security,
        performance: result.healthScore.performance,
        maintainability: result.healthScore.maintainability,
      });
    }, 200);
    return () => clearTimeout(t);
  }, [result]);

  const baseFilename = `codesense-${safeFilename(result.prData.repo)}-pr-${result.prData.id}`;

  const handleCopy = async () => {
    try {
      const report = generateMarkdownReport(result);
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard might be unavailable */
    }
  };

  const handleDownloadMd = () => {
    downloadFile(`${baseFilename}.md`, generateMarkdownReport(result), 'text/markdown');
  };

  const handleDownloadJson = () => {
    downloadFile(`${baseFilename}.json`, JSON.stringify(result, null, 2), 'application/json');
  };

  const scores = [
    { label: 'Security', value: result.healthScore.security, width: barWidths.security },
    { label: 'Performance', value: result.healthScore.performance, width: barWidths.performance },
    { label: 'Maintainability', value: result.healthScore.maintainability, width: barWidths.maintainability },
  ];

  const { breakdown } = result.healthScore;

  return (
    <aside className={classnames(style.root, className)}>
      <div className={style.card}>
        <div className={style.cardHeader}>Score Breakdown</div>
        <div className={style.cardBody}>
          {scores.map((s) => (
            <div key={s.label} className={style.scoreRow}>
              <div className={style.scoreRowTop}>
                <span className={style.scoreName}>{s.label}</span>
                <span className={style.scoreVal}>{s.value}/100</span>
              </div>
              <div className={style.bar}>
                <div
                  className={style.barFill}
                  style={{ width: `${s.width}%`, background: scoreColor(s.value) }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={style.card}>
        <div className={style.cardHeader}>Issue Summary</div>
        <div className={style.cardBody}>
          <div className={style.statsGrid}>
            <div className={classnames(style.statCard, style.statCardCritical)}>
              <span className={classnames(style.statNum, style.statNumCritical)}>{breakdown.criticalIssues}</span>
              <span className={style.statLabel}>Critical</span>
            </div>
            <div className={classnames(style.statCard, style.statCardWarning)}>
              <span className={classnames(style.statNum, style.statNumWarning)}>{breakdown.warnings}</span>
              <span className={style.statLabel}>Warnings</span>
            </div>
            <div className={classnames(style.statCard, style.statCardSuggestion)}>
              <span className={classnames(style.statNum, style.statNumSuggestion)}>{breakdown.suggestions}</span>
              <span className={style.statLabel}>Suggestions</span>
            </div>
          </div>
        </div>
      </div>

      <div className={style.card}>
        <div className={style.cardHeader}>Export & Share</div>
        <div className={classnames(style.cardBody, style.actions)}>
          <button onClick={handleCopy} className={classnames(style.actionBtn, { [style.copySuccess]: copied })}>
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            {copied ? 'Copied!' : 'Copy Markdown'}
          </button>
          <button onClick={handleDownloadMd} className={style.actionBtn}>
            <IconFileText size={16} />
            Download .md
          </button>
          <button onClick={handleDownloadJson} className={style.actionBtn}>
            <IconDownload size={16} />
            Download .json
          </button>
          <a
            href={result.prData.url}
            target="_blank"
            rel="noopener noreferrer"
            className={style.actionBtn}
          >
            <IconBrandGithub size={16} />
            View on GitHub
          </a>
          {onReanalyze && (
            <button
              onClick={onReanalyze}
              className={classnames(style.actionBtn, style.actionBtnPrimary)}
              disabled={isReanalyzing}
            >
              {isReanalyzing ? (
                <>
                  <IconLoader2 size={16} className={style.spin} />
                  Analyzing…
                </>
              ) : (
                <>
                  <IconRefresh size={16} />
                  Re-analyze
                </>
              )}
            </button>
          )}
        </div>
        {result.tokensUsed && (
          <div className={style.tokenFootnote}>
            ⚡ {result.tokensUsed.toLocaleString()} tokens · {result.analyzedFiles} files
          </div>
        )}
      </div>
    </aside>
  );
}
