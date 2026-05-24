import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import classnames from 'classnames';
import { IconArrowRight, IconLoader2, IconSearch, IconSparkles, IconBrandGithub } from '@tabler/icons-react';
import { saveReviewResult } from '../../data/review-store';
import { DEMO_RESULT } from '../../data/demo-data';
import style from './hero-section.module.css';

export interface HeroSectionProps {
  className?: string;
  initialUrl?: string;
}

function ProductPreview() {
  const score = 72;
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={style.preview} aria-hidden>
      <div className={style.previewGlow} />
      <div className={style.previewFrame}>
        <div className={style.previewBar}>
          <span className={style.previewDot} />
          <span className={style.previewDot} />
          <span className={style.previewDot} />
          <div className={style.previewUrl}>codesense.ai/dashboard</div>
        </div>
        <div className={style.previewBody}>
          <aside className={style.previewSidebar}>
            <div className={style.previewSidebarTitle}>Pull Request</div>
            <div className={style.previewMeta}>
              <div className={style.previewMetaRow}>
                <span className={style.previewMetaKey}>Repo</span>
                <span className={style.previewMetaVal}>vercel/next.js</span>
              </div>
              <div className={style.previewMetaRow}>
                <span className={style.previewMetaKey}>PR</span>
                <span className={style.previewMetaVal}>#72104</span>
              </div>
              <div className={style.previewMetaRow}>
                <span className={style.previewMetaKey}>Files</span>
                <span className={style.previewMetaVal}>12</span>
              </div>
              <div className={style.previewMetaRow}>
                <span className={style.previewMetaKey}>Changes</span>
                <span className={style.previewMetaVal} style={{ color: 'var(--color-info)' }}>+428 / -67</span>
              </div>
            </div>
            <div className={style.previewSidebarTitle} style={{ marginTop: 8 }}>Author</div>
            <div className={style.previewMeta}>
              <div className={style.previewMetaRow}>
                <span className={style.previewMetaKey}>User</span>
                <span className={style.previewMetaVal}>@huozhi</span>
              </div>
              <div className={style.previewMetaRow}>
                <span className={style.previewMetaKey}>Opened</span>
                <span className={style.previewMetaVal}>2h ago</span>
              </div>
            </div>
          </aside>

          <div className={style.previewMain}>
            <div className={style.previewHero}>
              <div className={style.previewRing}>
                <svg className={style.previewRingSvg} width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="var(--color-bg-input)" strokeWidth="6" />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="var(--color-warning)"
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className={style.previewRingNum}>{score}</div>
              </div>
              <div className={style.previewHeroText}>
                <span className={style.previewHeroLabel}>Health Score</span>
                <span className={style.previewHeroTitle}>Needs attention · 3 critical issues</span>
              </div>
            </div>

            <div className={style.previewIssues}>
              <div className={style.previewIssue}>
                <span className={style.previewIssueBadge} style={{ background: 'var(--color-critical-bg)', color: 'var(--color-critical)' }}>CRITICAL</span>
                <span className={style.previewIssueTitle}>Hardcoded API key in auth handler</span>
                <span className={style.previewIssueFile}>auth.ts:42</span>
              </div>
              <div className={style.previewIssue}>
                <span className={style.previewIssueBadge} style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>WARNING</span>
                <span className={style.previewIssueTitle}>N+1 query in user dashboard loader</span>
                <span className={style.previewIssueFile}>users.ts:118</span>
              </div>
              <div className={style.previewIssue}>
                <span className={style.previewIssueBadge} style={{ background: 'var(--color-suggestion-bg)', color: 'var(--color-suggestion)' }}>HINT</span>
                <span className={style.previewIssueTitle}>Extract repeated validation into util</span>
                <span className={style.previewIssueFile}>schema.ts:64</span>
              </div>
            </div>
          </div>

          <aside className={style.previewRight}>
            <div className={style.previewSidebarTitle}>Breakdown</div>
            {[
              { label: 'Security', val: 64, color: 'var(--color-warning)' },
              { label: 'Performance', val: 78, color: 'var(--color-info)' },
              { label: 'Quality', val: 81, color: 'var(--color-info)' },
              { label: 'Best Practices', val: 70, color: 'var(--color-warning)' },
            ].map((b) => (
              <div key={b.label} className={style.previewBarRow}>
                <div className={style.previewBarRowLabel}>
                  <span>{b.label}</span>
                  <span className={style.previewBarRowVal}>{b.val}</span>
                </div>
                <div className={style.previewBarTrack}>
                  <div className={style.previewBarFill} style={{ width: `${b.val}%`, background: b.color }} />
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}

export function HeroSection({ className, initialUrl }: HeroSectionProps) {
  const [prUrl, setPrUrl] = useState(initialUrl ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validateUrl = (url: string) =>
    /github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(url);

  const handleAnalyze = useCallback(async () => {
    setError('');
    if (!prUrl.trim()) {
      setError('Please enter a GitHub PR URL.');
      return;
    }
    if (!validateUrl(prUrl)) {
      setError('Please enter a valid GitHub PR URL (e.g., github.com/owner/repo/pull/123)');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Analysis failed');
      }
      const result = await res.json();
      saveReviewResult(result);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [prUrl, navigate]);

  const handleDemo = () => {
    saveReviewResult(DEMO_RESULT);
    navigate('/dashboard');
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleAnalyze();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleAnalyze]);

  return (
    <section className={classnames(style.root, className)}>
      <div className={style.bg} />
      <div className={style.dots} />

      <div className={style.inner}>
        <div className={style.eyebrow}>
          <IconSparkles size={13} />
          Built with Llama 3.3 70B on Groq
          <span className={style.eyebrowPill}>Beta</span>
        </div>

        <div className={style.headlineWrap}>
          <h1 className={style.headline}>
            Ship code with confidence.{' '}
            <span className={style.headlineAccent}>Let AI catch what reviewers miss.</span>
          </h1>
          <p className={style.subheadline}>
            CodeSense scans every line of your pull request for security flaws, performance bottlenecks,
            and subtle bugs — delivering an actionable review in under 10 seconds.
          </p>
        </div>

        <div className={style.inputCard}>
          <div className={style.inputGroup}>
            <span className={style.inputIcon}>
              <IconSearch size={18} />
            </span>
            <input
              type="url"
              className={style.input}
              placeholder="https://github.com/owner/repo/pull/123"
              value={prUrl}
              onChange={(e) => { setPrUrl(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              disabled={isLoading}
              aria-label="GitHub PR URL"
            />
            <button className={style.ctaButton} onClick={handleAnalyze} disabled={isLoading}>
              {isLoading ? (
                <><IconLoader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing</>
              ) : (
                <>Analyze <IconArrowRight size={14} /></>
              )}
            </button>
          </div>

          {error && (
            <div className={style.errorMsg}>
              {error}
              {error.includes('log in') && (
                <div style={{ marginTop: 12 }}>
                  <a href="/auth/github" className={style.ctaButton} style={{ background: '#24292e', color: '#fff', display: 'inline-flex', padding: '8px 16px', borderRadius: '6px' }}>
                    <IconBrandGithub size={16} /> Login with GitHub
                  </a>
                </div>
              )}
            </div>
          )}

          <p className={style.hint}>
            Works on any public PR
            <span className={style.hintDot} />
            <kbd>⌘</kbd> <kbd>↵</kbd> to analyze
            <span className={style.hintDot} />
            <button className={style.demoLink} onClick={handleDemo}>Try a sample review</button>
          </p>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}
