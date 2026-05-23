import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  IconHistory,
  IconTrash,
  IconBrandGithub,
  IconExternalLink,
  IconArrowRight,
  IconX,
} from '@tabler/icons-react';
import {
  loadHistory,
  clearHistory,
  removeFromHistory,
  type HistoryEntry,
} from '../data/review-store';
import style from './history.module.css';

function scoreColor(s: number): string {
  if (s >= 75) return 'var(--color-score-high)';
  if (s >= 50) return 'var(--color-score-mid)';
  return 'var(--color-score-low)';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function meta() {
  return [
    { title: 'Review History — CodeSense AI' },
    { name: 'description', content: 'Browse your past code review analyses.' },
  ];
}

export default function HistoryRoute() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
    setMounted(true);
  }, []);

  const handleRemove = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromHistory(url);
    setHistory(loadHistory());
  };

  const handleClearAll = () => {
    if (confirm('Clear all review history? This cannot be undone.')) {
      clearHistory();
      setHistory([]);
    }
  };

  return (
    <div className={style.root}>
      <div className={style.inner}>
        <div className={style.header}>
          <div className={style.titleBlock}>
            <h1 className={style.title}>Review History</h1>
            <span className={style.subtitle}>
              {mounted
                ? history.length === 0
                  ? 'No reviews yet'
                  : `${history.length} review${history.length === 1 ? '' : 's'} saved locally in your browser`
                : 'Loading…'}
            </span>
          </div>
          <div className={style.actions}>
            <Link to="/" className={`${style.actionBtn} ${style.actionBtnPrimary}`}>
              Analyze new PR
              <IconArrowRight size={14} />
            </Link>
            {mounted && history.length > 0 && (
              <button
                className={`${style.actionBtn} ${style.actionBtnDanger}`}
                onClick={handleClearAll}
              >
                <IconTrash size={14} />
                Clear all
              </button>
            )}
          </div>
        </div>

        {mounted && history.length === 0 ? (
          <div className={style.emptyState}>
            <div className={style.emptyIcon}><IconHistory size={24} /></div>
            <h2 className={style.emptyTitle}>No reviews yet</h2>
            <p className={style.emptyDesc}>
              Once you analyze a Pull Request it will appear here for quick access. Everything is stored locally in your
              browser — nothing is sent to a server.
            </p>
            <Link to="/" className={`${style.actionBtn} ${style.actionBtnPrimary}`}>
              Analyze your first PR
              <IconArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className={style.list}>
            {history.map((entry) => (
              <Link
                key={entry.url}
                to={`/review/${entry.id}`}
                className={style.card}
              >
                <span
                  className={style.scoreBig}
                  style={{ color: scoreColor(entry.score), borderColor: scoreColor(entry.score) }}
                >
                  {entry.score}
                </span>
                <div className={style.content}>
                  <div className={style.itemTitle}>{entry.title}</div>
                  <div className={style.itemMeta}>
                    <span>
                      <IconBrandGithub size={11} /> {entry.repo}
                    </span>
                    <span className={style.divider}>·</span>
                    <span>{formatDate(entry.reviewedAt)}</span>
                    {entry.criticalIssues > 0 && (
                      <>
                        <span className={style.divider}>·</span>
                        <span className={`${style.pill} ${style.pillCritical}`}>
                          {entry.criticalIssues} critical
                        </span>
                      </>
                    )}
                    {entry.warnings > 0 && (
                      <span className={`${style.pill} ${style.pillWarning}`}>
                        {entry.warnings} warning{entry.warnings === 1 ? '' : 's'}
                      </span>
                    )}
                    <span className={style.divider}>·</span>
                    <span>{entry.totalIssues} total</span>
                  </div>
                </div>
                <div className={style.itemActions}>
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={style.iconBtn}
                    onClick={(e) => e.stopPropagation()}
                    title="Open PR on GitHub"
                  >
                    <IconExternalLink size={14} />
                  </a>
                  <button
                    className={`${style.iconBtn} ${style.danger}`}
                    onClick={(e) => handleRemove(e, entry.url)}
                    title="Remove from history"
                    aria-label="Remove from history"
                  >
                    <IconX size={14} />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
