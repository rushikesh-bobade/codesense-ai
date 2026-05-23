import classnames from 'classnames';
import { IconSearch } from '@tabler/icons-react';
import type { Severity } from '../../data/types';
import style from './issue-filter-bar.module.css';

export type FilterValue = 'all' | Severity;

export interface IssueFilterBarProps {
  className?: string;
  activeFilter: FilterValue;
  onFilterChange: (filter: FilterValue) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  counts: { all: number; critical: number; warning: number; suggestion: number };
}

export function IssueFilterBar({
  className,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  counts,
}: IssueFilterBarProps) {
  const tabs: { key: FilterValue; label: string; badgeCls: string }[] = [
    { key: 'all', label: 'All Issues', badgeCls: style.badgeDefault },
    { key: 'critical', label: 'Critical', badgeCls: style.badgeCritical },
    { key: 'warning', label: 'Warnings', badgeCls: style.badgeWarning },
    { key: 'suggestion', label: 'Suggestions', badgeCls: style.badgeSuggestion },
  ];

  const countFor = (k: FilterValue) =>
    k === 'all' ? counts.all : counts[k as keyof typeof counts];

  return (
    <div className={classnames(style.root, className)}>
      <div className={style.inner}>
        <div className={style.tabs}>
          {tabs.map((t) => (
            <button
              key={t.key}
              className={classnames(style.tab, { [style.active]: activeFilter === t.key })}
              onClick={() => onFilterChange(t.key)}
            >
              {t.label}
              <span className={classnames(style.badge, t.badgeCls)}>{countFor(t.key)}</span>
            </button>
          ))}
        </div>

        <div className={style.searchWrap}>
          <span className={style.searchIcon}>
            <IconSearch size={14} />
          </span>
          <input
            type="text"
            className={style.search}
            placeholder="Search by file or keyword…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
