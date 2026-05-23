import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import classnames from 'classnames';
import { IconHistory, IconTrash, IconX, IconAlertTriangle } from '@tabler/icons-react';
import { loadHistory, removeFromHistory, clearHistory, type HistoryEntry } from '../../data/review-store';
import style from './history-panel.module.css';

export interface HistoryPanelProps {
  className?: string;
  onSelect?: (entry: HistoryEntry) => void;
  activeUrl?: string;
  showViewAll?: boolean;
  maxItems?: number;
}

function scoreColor(s: number): string {
  if (s >= 75) return 'var(--color-score-high)';
  if (s >= 50) return 'var(--color-score-mid)';
  return 'var(--color-score-low)';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function HistoryPanel({
  className,
  onSelect,
  activeUrl,
  showViewAll = true,
  maxItems = 5,
}: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const refresh = useCallback(() => setHistory(loadHistory()), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRemove = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromHistory(url);
    refresh();
  };

  const handleClear = () => {
    if (confirm('Clear all review history? This cannot be undone.')) {
      clearHistory();
      refresh();
    }
  };

  const visible = history.slice(0, maxItems);

  return (
    <div className={classnames(style.root, className)}>
      <div className={style.header}>
        <span className={style.title}>
          <IconHistory size={16} />
          Recent Reviews
          {history.length > 0 && <span className={style.count}>{history.length}</span>}
        </span>
        {history.length > 0 && (
          <button className={style.clearBtn} onClick={handleClear} title="Clear history" aria-label="Clear history">
            <IconTrash size={14} />
          </button>
        )}
      </div>

      <div className={style.body}>
        {visible.length === 0 ? (
          <div className={style.empty}>
            No reviews yet.
            <br />
            Analyzed PRs will appear here.
          </div>
        ) : (
          visible.map((entry) => (
            <Link
              to={`/review/${entry.id}`}
              key={entry.url}
              className={style.item}
              onClick={() => onSelect?.(entry)}
              data-active={activeUrl === entry.url}
            >
              <span className={style.scoreBadge} style={{ color: scoreColor(entry.score), borderColor: scoreColor(entry.score) }}>
                {entry.score}
              </span>
              <div className={style.info}>
                <div className={style.itemTitle}>{entry.title}</div>
                <div className={style.itemMeta}>
                  <span>{entry.repo.split('/')[1] || entry.repo}</span>
                  <span className={style.metaDivider}>·</span>
                  <span>{relativeTime(entry.reviewedAt)}</span>
                  {entry.criticalIssues > 0 && (
                    <>
                      <span className={style.metaDivider}>·</span>
                      <span className={style.critPill}>
                        <IconAlertTriangle size={10} />
                        {entry.criticalIssues}
                      </span>
                    </>
                  )}
                  {entry.warnings > 0 && (
                    <span className={style.warnPill}>
                      <IconAlertTriangle size={10} />
                      {entry.warnings}
                    </span>
                  )}
                </div>
              </div>
              <button
                className={style.removeBtn}
                onClick={(e) => handleRemove(e, entry.url)}
                aria-label={`Remove ${entry.title} from history`}
              >
                <IconX size={14} />
              </button>
            </Link>
          ))
        )}
      </div>

      {showViewAll && history.length > maxItems && (
        <Link to="/history" className={style.viewAll}>
          View all {history.length} reviews →
        </Link>
      )}
    </div>
  );
}
