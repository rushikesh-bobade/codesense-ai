import { useState } from 'react';
import { useRouteLoaderData } from 'react-router';
import {
  IconBrandGithub,
  IconCheck,
  IconLoader2,
  IconExternalLink,
  IconRefresh,
  IconLock,
} from '@tabler/icons-react';
import type { ReviewResult, InlineComment } from '../../data/types';
import style from './post-to-github-button.module.css';

export interface PostToGitHubButtonProps {
  prUrl: string;
  reviewResult: ReviewResult;
  inlineComments: InlineComment[];
}

type ButtonState = 'idle' | 'loading' | 'success' | 'error';

export function PostToGitHubButton({ prUrl, reviewResult, inlineComments }: PostToGitHubButtonProps) {
  const [state, setState] = useState<ButtonState>('idle');
  const [reviewUrl, setReviewUrl] = useState('');
  const [commentCount, setCommentCount] = useState(0);
  const [error, setError] = useState('');

  const rootData = useRouteLoaderData('root') as { user?: any } | undefined;
  const user = rootData?.user;

  async function handlePost() {
    if (!user) return;
    setState('loading');
    setError('');
    try {
      const res = await fetch('/api/post-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prUrl, reviewResult, inlineComments }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to post review');
      }

      setReviewUrl(data.reviewUrl || '');
      setCommentCount(data.commentCount || 0);
      setState('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to post review');
      setState('error');
    }
  }

  // ── IDLE STATE
  if (state === 'idle') {
    return (
      <div className={style.root}>
        <button 
          onClick={handlePost} 
          className={style.postBtn}
          disabled={!user}
          style={!user ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          title={!user ? "Login with GitHub to post reviews" : "Post Review to GitHub"}
        >
          {!user ? <IconLock size={16} /> : <IconBrandGithub size={16} />}
          {!user ? 'For this feature login to GitHub account' : 'Post Review to GitHub'}
        </button>
      </div>
    );
  }

  // ── LOADING STATE
  if (state === 'loading') {
    return (
      <div className={style.root}>
        <button disabled className={style.postBtnLoading}>
          <IconLoader2 size={16} className={style.spin} />
          Posting to GitHub…
        </button>
      </div>
    );
  }

  // ── SUCCESS STATE
  if (state === 'success') {
    return (
      <div className={style.root}>
        <div className={style.successBadge}>
          <IconCheck size={14} />
          <span>Posted!{commentCount > 0 ? ` ${commentCount} inline comments added` : ''}</span>
        </div>
        {reviewUrl && (
          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={style.viewLink}
          >
            View on GitHub
            <IconExternalLink size={12} />
          </a>
        )}
      </div>
    );
  }

  // ── ERROR STATE
  return (
    <div className={style.root}>
      <div className={style.errorBadge}>❌ {error}</div>
      <button onClick={() => setState('idle')} className={style.retryBtn}>
        <IconRefresh size={14} />
        Retry
      </button>
    </div>
  );
}
