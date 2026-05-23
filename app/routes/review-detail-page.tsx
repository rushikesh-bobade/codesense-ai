import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ReviewHeader } from '../blocks/review-detail-page/review-header';
import { LargeHealthScoreDisplay } from '../blocks/review-detail-page/large-health-score-display';
import { AISummarySection } from '../blocks/review-detail-page/ai-summary-section';
import { FilesChangedList } from '../blocks/review-detail-page/files-changed-list';
import { DetailedIssuesList } from '../blocks/review-detail-page/detailed-issues-list';
import { UnifiedDiffViewer } from '../blocks/review-detail-page/unified-diff-viewer';
import { loadReviewResult } from '../data/review-store';
import type { ReviewResult } from '../data/types';
import styles from './review-detail-page.module.css';

export default function ReviewDetailPage() {
  const [result, setResult] = useState<ReviewResult | null>(null);

  useEffect(() => {
    const loaded = loadReviewResult();
    setResult(loaded);
  }, []);

  if (!result) {
    return (
      <div className={styles.root}>
        <div className={styles.emptyState}>
          <h1 className={styles.emptyTitle}>No review data</h1>
          <Link to="/" className={styles.emptyBtn}>Analyze a PR</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <ReviewHeader result={result} />
      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <LargeHealthScoreDisplay score={result.healthScore.overall} />
          <FilesChangedList files={result.prData.files} />
        </div>
        <div className={styles.rightCol}>
          <AISummarySection result={result} />
          <DetailedIssuesList issues={result.issues} />
          {result.prData.files.some((f) => f.patch) && (
            <UnifiedDiffViewer
              files={result.prData.files.filter((f) => f.patch)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
