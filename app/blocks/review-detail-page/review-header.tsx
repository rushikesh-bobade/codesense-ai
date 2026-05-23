import classnames from 'classnames';
import { Link } from 'react-router';
import { IconArrowLeft, IconBrandGithub, IconCopy, IconRefresh, IconCalendar } from '@tabler/icons-react';
import type { ReviewResult } from '../../data/types';
import style from './review-header.module.css';

export interface ReviewHeaderProps {
  className?: string;
  result: ReviewResult;
}

export function ReviewHeader({ className, result }: ReviewHeaderProps) {
  const { prData, reviewedAt } = result;
  const date = new Date(reviewedAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className={classnames(style.root, className)}>
      <div className={style.inner}>
        <div className={style.topRow}>
          <Link to="/dashboard" className={style.backBtn}>
            <IconArrowLeft size={16} />
            Dashboard
          </Link>
          <h1 className={style.title}>{prData.title}</h1>
          <div className={style.actions}>
            <a href={prData.url} target="_blank" rel="noopener noreferrer" className={style.actionBtn}>
              <IconBrandGithub size={16} />
              GitHub
            </a>
            <Link to="/" className={style.actionBtn}>
              <IconRefresh size={16} />
              Re-analyze
            </Link>
          </div>
        </div>
        <div className={style.meta}>
          {prData.authorAvatar && (
            <img src={prData.authorAvatar} alt={prData.author} className={style.avatar} />
          )}
          <span className={style.metaItem}>{prData.author}</span>
          <span className={style.metaItem}>·</span>
          <a href={prData.url} target="_blank" rel="noopener noreferrer" className={style.repoLink}>
            {prData.repo}
          </a>
          <span className={style.metaItem}>·</span>
          <span className={style.metaItem}>
            <IconCalendar size={14} />
            {date}
          </span>
        </div>
      </div>
    </div>
  );
}
