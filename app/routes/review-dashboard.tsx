import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { IconLoader2, IconSearch, IconBrandGithub } from '@tabler/icons-react';
import { IssueFilterBar, type FilterValue } from '../blocks/review-dashboard/issue-filter-bar';
import { PRInformationSidebar } from '../blocks/review-dashboard/pr-information-sidebar';
import { MainReviewContent } from '../blocks/review-dashboard/main-review-content';
import { ScoreBreakdownSidebar } from '../blocks/review-dashboard/score-breakdown-sidebar';
import { HistoryPanel } from '../blocks/review-dashboard/history-panel';
import { FloatingChat } from '../blocks/review-dashboard/floating-chat';
import { loadReviewResult, saveReviewResult } from '../data/review-store';
import type { ReviewResult } from '../data/types';
import style from './review-dashboard.module.css';

export function meta() {
  return [{ title: 'Review Dashboard — CodeSense AI' }];
}

export default function ReviewDashboard() {
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [reanalyzeError, setReanalyzeError] = useState('');

  useEffect(() => {
    setResult(loadReviewResult());
  }, []);

  const handleReanalyze = useCallback(async () => {
    if (!result?.prData?.url) return;
    setIsReanalyzing(true);
    setReanalyzeError('');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prUrl: result.prData.url }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Re-analysis failed');
      }
      const next = (await res.json()) as ReviewResult;
      saveReviewResult(next);
      setResult(next);
    } catch (err: unknown) {
      setReanalyzeError(err instanceof Error ? err.message : 'Re-analysis failed');
    } finally {
      setIsReanalyzing(false);
    }
  }, [result]);

  if (!result) {
    return (
      <div className={style.root}>
        <div className={style.emptyState}>
          <div className={style.emptyIcon}><IconSearch size={28} /></div>
          <h1 className={style.emptyTitle}>No analysis yet</h1>
          <p className={style.emptyDesc}>
            Paste a GitHub PR URL on the home page to analyze it, or pick one of your recent reviews below.
          </p>
          <Link to="/" className={style.emptyBtn}>
            Analyze a PR
          </Link>
          <div className={style.emptyHistory}>
            <HistoryPanel showViewAll />
          </div>
        </div>
      </div>
    );
  }

  const counts = {
    all: result.issues.length,
    critical: result.issues.filter((i) => i.severity === 'critical').length,
    warning: result.issues.filter((i) => i.severity === 'warning').length,
    suggestion: result.issues.filter((i) => i.severity === 'suggestion').length,
  };

  return (
    <div className={style.root}>
      {isReanalyzing && (
        <div className={style.reanalyzeBanner}>
          <IconLoader2 size={16} className={style.spin} />
          Re-analyzing PR… this usually takes 5–15 seconds.
        </div>
      )}
      {reanalyzeError && (
        <div className={style.errorBanner}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <span>{reanalyzeError}</span>
            {reanalyzeError.includes('log in') && (
              <a href="/auth/github" style={{ marginLeft: 16, background: '#24292e', color: '#fff', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 13, fontWeight: 500 }}>
                <IconBrandGithub size={14} /> Login with GitHub
              </a>
            )}
          </div>
          <button onClick={() => setReanalyzeError('')} className={style.errorClose} aria-label="Dismiss">×</button>
        </div>
      )}
      <IssueFilterBar
        activeFilter={filter}
        onFilterChange={setFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        counts={counts}
      />
      <div className={style.layout}>
        <div className={style.leftSidebar}>
          <PRInformationSidebar prData={result.prData} />
          <HistoryPanel activeUrl={result.prData.url} />
        </div>
        <MainReviewContent
          filter={filter}
          searchQuery={searchQuery}
          result={result}
        />
        <ScoreBreakdownSidebar
          className={style.scoreBreakdownSidebar}
          result={result}
          onReanalyze={handleReanalyze}
          isReanalyzing={isReanalyzing}
        />
      </div>
      <FloatingChat result={result} />
    </div>
  );
}
