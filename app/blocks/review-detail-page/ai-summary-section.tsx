import classnames from 'classnames';
import { IconBrain, IconBolt } from '@tabler/icons-react';
import type { ReviewResult } from '../../data/types';
import style from './ai-summary-section.module.css';

export interface AISummarySectionProps {
  className?: string;
  result: ReviewResult;
}

export function AISummarySection({ className, result }: AISummarySectionProps) {
  return (
    <div className={classnames(style.root, className)}>
      <div className={style.header}>
        <div className={style.headerLeft}>
          <IconBrain size={16} />
          AI Summary
        </div>
        <div className={style.modelBadge}>
          <span className={style.modelDot} />
          Llama 3.3 70B via Groq
        </div>
      </div>
      <div className={style.body}>
        <p className={style.summary}>{result.summary}</p>
        {result.tokensUsed && (
          <div className={style.tokens}>
            <IconBolt size={12} />
            {result.tokensUsed.toLocaleString()} tokens used
          </div>
        )}
      </div>
    </div>
  );
}
