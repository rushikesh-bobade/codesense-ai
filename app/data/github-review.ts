import { Octokit } from '@octokit/rest';
import type { ReviewResult, InlineComment } from './types';

// ─────────────────────────────────────────────────
// Create a per-call Octokit instance
// ─────────────────────────────────────────────────
function getOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  if (!token || token === 'your_github_pat_here') {
    throw new Error('GITHUB_TOKEN is not configured. Add a valid GitHub Personal Access Token to .env');
  }
  return new Octokit({ auth: token });
}

// ─────────────────────────────────────────────────
// HELPER: Parse owner/repo/pull_number from PR URL
// ─────────────────────────────────────────────────
export function parsePRUrl(url: string): { owner: string; repo: string; pull_number: number } {
  const match = url.trim().match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) throw new Error('Invalid GitHub PR URL');
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ''),
    pull_number: parseInt(match[3], 10),
  };
}

// ─────────────────────────────────────────────────
// Build the rich markdown summary comment body
// ─────────────────────────────────────────────────
export function buildSummaryComment(result: ReviewResult): string {
  const { issues, healthScore, summary, preMergeChecks } = result;

  const criticals = issues.filter((i) => i.severity === 'critical');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const suggestions = issues.filter((i) => i.severity === 'suggestion');

  const scoreEmoji = healthScore.overall >= 80 ? '🟢' : healthScore.overall >= 60 ? '🟡' : '🔴';

  const mergeStatus =
    criticals.length === 0
      ? '✅ **Ready to Merge**'
      : `🚫 **${criticals.length} blocking issue(s) must be fixed before merging**`;

  const criticalSection =
    criticals.length > 0
      ? `
### 🔴 Critical Issues — Must Fix (${criticals.length})
${criticals
  .map(
    (i) => `
<details>
<summary><b>${i.title}</b> — \`${i.file}\`${i.line ? `:${i.line}` : ''}</summary>

${i.description}

**Recommendation:**
\`\`\`
${i.recommendation}
\`\`\`
</details>`,
  )
  .join('\n')}`
      : '';

  const warningSection =
    warnings.length > 0
      ? `
### ⚠️ Warnings (${warnings.length})
${warnings.map((i) => `- **${i.title}** (\`${i.file}\`${i.line ? `:${i.line}` : ''}): ${i.description}`).join('\n')}`
      : '';

  const suggestionSection =
    suggestions.length > 0
      ? `
### 💡 Suggestions (${suggestions.length})
${suggestions.map((i) => `- ${i.title} (\`${i.file}\`)`).join('\n')}`
      : '';

  const checksSection =
    preMergeChecks && preMergeChecks.length > 0
      ? `
### ✅ Pre-Merge Checks
${preMergeChecks
  .map((c) => {
    const icon = c.status === 'passed' ? '✅' : c.status === 'failed' ? '❌' : '⚠️';
    const blocking = c.blocking && c.status === 'failed' ? ' **[BLOCKING]**' : '';
    return `${icon} ${c.name}${blocking} — ${c.details}`;
  })
  .join('\n')}`
      : '';

  const appUrl = process.env.APP_URL || 'https://codesense-ai.vercel.app';

  return `## 🔍 CodeSense AI — Automated Code Review

${mergeStatus}

| Metric | Score |
|--------|-------|
| ${scoreEmoji} Overall Health | **${healthScore.overall}/100** |
| 🔒 Security | ${healthScore.security}/100 |
| ⚡ Performance | ${healthScore.performance}/100 |
| 🔧 Maintainability | ${healthScore.maintainability}/100 |

### 📋 Summary
${summary}

${criticalSection}
${warningSection}
${suggestionSection}
${checksSection}

---
<sub>🤖 Reviewed by <a href="${appUrl}">CodeSense AI</a> • ${new Date().toUTCString()}</sub>`;
}

// ─────────────────────────────────────────────────
// Get the commit SHA of the PR's latest commit
// (Required by GitHub's review comment API)
// ─────────────────────────────────────────────────
export async function getLatestCommitSha(
  owner: string,
  repo: string,
  pull_number: number,
): Promise<string> {
  const octokit = getOctokit();
  const { data } = await octokit.pulls.get({ owner, repo, pull_number });
  return data.head.sha;
}

// ─────────────────────────────────────────────────
// Get valid diff positions for inline comments.
// GitHub requires a "position" in the diff, not a raw line number.
// This maps line numbers → diff positions.
// ─────────────────────────────────────────────────
export async function getDiffPositions(
  owner: string,
  repo: string,
  pull_number: number,
): Promise<Map<string, Map<number, number>>> {
  const octokit = getOctokit();
  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number,
    per_page: 100,
  });

  // Map: filename → (lineNumber → diffPosition)
  const positionMap = new Map<string, Map<number, number>>();

  for (const file of files) {
    if (!file.patch) continue;
    const lineMap = new Map<number, number>();
    const lines = file.patch.split('\n');
    let lineNumber = 0;
    let diffPosition = 0;

    for (const line of lines) {
      diffPosition++;
      if (line.startsWith('@@')) {
        // Parse the hunk header: @@ -old,count +new,start @@
        const match = line.match(/\+(\d+)/);
        if (match) lineNumber = parseInt(match[1], 10) - 1;
      } else if (line.startsWith('+')) {
        lineNumber++;
        lineMap.set(lineNumber, diffPosition);
      } else if (!line.startsWith('-')) {
        lineNumber++;
        lineMap.set(lineNumber, diffPosition);
      }
    }

    positionMap.set(file.filename, lineMap);
  }

  return positionMap;
}

// ─────────────────────────────────────────────────
// Post the full review to GitHub.
// Posts summary + inline comments + review decision.
// ─────────────────────────────────────────────────
export async function postReviewToGitHub(
  prUrl: string,
  result: ReviewResult,
  inlineComments: InlineComment[],
): Promise<{ reviewUrl: string; commentCount: number }> {
  const octokit = getOctokit();
  const { owner, repo, pull_number } = parsePRUrl(prUrl);

  // 1. Get latest commit SHA (required for review API)
  const commitId = await getLatestCommitSha(owner, repo, pull_number);

  // 2. Get diff positions for inline comments
  const positionMap = await getDiffPositions(owner, repo, pull_number);

  // 3. Build inline comment objects for GitHub API
  const validInlineComments: { path: string; position: number; body: string }[] = [];

  for (const comment of inlineComments) {
    const filePositions = positionMap.get(comment.filename);
    if (!filePositions || !comment.lineNumber) continue;

    const position = filePositions.get(comment.lineNumber);
    if (!position) continue; // Line not in diff, skip

    const severityIcon =
      comment.severity === 'critical'
        ? '🔴'
        : comment.severity === 'warning'
          ? '⚠️'
          : comment.severity === 'suggestion'
            ? '💡'
            : 'ℹ️';

    const body = [
      `${severityIcon} **${comment.type.toUpperCase()}** — ${comment.comment}`,
      comment.suggestion ? `\n**Suggested fix:**\n\`\`\`suggestion\n${comment.suggestion}\n\`\`\`` : '',
    ]
      .filter(Boolean)
      .join('\n');

    validInlineComments.push({ path: comment.filename, position, body });
  }

  // 4. Determine review decision
  const criticalCount = result.issues.filter((i) => i.severity === 'critical').length;
  const event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT' =
    criticalCount === 0 && result.healthScore.overall >= 80
      ? 'APPROVE'
      : criticalCount > 0
        ? 'REQUEST_CHANGES'
        : 'COMMENT';

  // 5. Build the main summary comment body
  const summaryBody = buildSummaryComment(result);

  // 6. POST the complete review to GitHub
  const reviewResponse = await octokit.pulls.createReview({
    owner,
    repo,
    pull_number,
    commit_id: commitId,
    body: summaryBody,
    event,
    comments: validInlineComments,
  });

  return {
    reviewUrl: reviewResponse.data.html_url,
    commentCount: validInlineComments.length,
  };
}

// ─────────────────────────────────────────────────
// Delete previous CodeSense AI review comments
// (so re-running doesn't spam the PR with duplicate reviews)
// ─────────────────────────────────────────────────
export async function deletePreviousReviews(
  owner: string,
  repo: string,
  pull_number: number,
): Promise<void> {
  const octokit = getOctokit();

  try {
    const { data: reviews } = await octokit.pulls.listReviews({
      owner,
      repo,
      pull_number,
    });

    // Find reviews posted by the authenticated user (our bot)
    const { data: authUser } = await octokit.users.getAuthenticated();

    for (const review of reviews) {
      if (review.user?.login === authUser.login && review.state !== 'DISMISSED') {
        try {
          await octokit.pulls.dismissReview({
            owner,
            repo,
            pull_number,
            review_id: review.id,
            message: 'Superseded by a new CodeSense AI review.',
          });
        } catch {
          // Some reviews can't be dismissed (e.g. COMMENTED), ignore silently
        }
      }
    }
  } catch {
    // If we can't clean up old reviews, proceed anyway
    console.warn('Could not clean up previous reviews — proceeding with new review');
  }
}
