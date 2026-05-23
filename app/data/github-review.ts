import { Octokit } from '@octokit/rest';
import type { ReviewResult, InlineComment } from './types';

// ─────────────────────────────────────────────────
// Create a per-call Octokit instance
// ─────────────────────────────────────────────────
function getOctokit(token: string): Octokit {
  if (!token || token === 'your_github_pat_here') {
    throw new Error('A valid GitHub token is required to perform this action.');
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
  const { issues, healthScore, summary, preMergeChecks, changelog, walkthrough, fileSummaries, poem, estimatedEffort } = result;

  const criticals = issues.filter((i) => i.severity === 'critical');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const suggestions = issues.filter((i) => i.severity === 'suggestion');

  // Summary by CodeSense
  const summarySection = changelog && changelog.length > 0 
    ? changelog.map(c => `### ${c.category}\n\n${c.description}\n`).join('\n')
    : `### Summary\n\n${summary}`;

  const walkthroughSection = walkthrough 
    ? `## 📝 Walkthrough\n\n${walkthrough}\n`
    : '';

  const changesTable = fileSummaries && fileSummaries.length > 0
    ? `## Changes\n| File(s) | Summary |\n| --- | --- |\n${fileSummaries.map(fs => `| \`${fs.file}\` | ${fs.summary} |`).join('\n')}\n`
    : '';

  const effortSection = estimatedEffort 
    ? `## Estimated Code Review Effort\n${estimatedEffort}\n`
    : '';

  const poemSection = poem 
    ? `## Poem\n🐰 ${poem.split('\n').join('\n')}\n`
    : '';

  const criticalSection = criticals.length > 0
    ? `\n### 🔴 Critical Issues — Must Fix (${criticals.length})\n${criticals.map(i => `<details>\n<summary><b>${i.title}</b> — \`${i.file}\`${i.line ? `:${i.line}` : ''}</summary>\n\n${i.description}\n\n**Recommendation:**\n\`\`\`\n${i.recommendation}\n\`\`\`\n</details>`).join('\n')}`
    : '';

  const warningSection = warnings.length > 0
    ? `\n### ⚠️ Warnings (${warnings.length})\n${warnings.map(i => `- **${i.title}** (\`${i.file}\`${i.line ? `:${i.line}` : ''}): ${i.description}`).join('\n')}`
    : '';

  const suggestionSection = suggestions.length > 0
    ? `\n### 💡 Suggestions (${suggestions.length})\n${suggestions.map(i => `- ${i.title} (\`${i.file}\`)`).join('\n')}`
    : '';

  const appUrl = process.env.APP_URL || 'https://codesense-ai-two.vercel.app/';

  return `## Summary by CodeSense
${summarySection}

---

ℹ️ **Recent review info**

**Configuration used:** defaults
**Health Score:** ${healthScore.overall}/100

${walkthroughSection}
${changesTable}
${effortSection}
${poemSection}

---
${criticalSection}
${warningSection}
${suggestionSection}

---
<sub>🎁 Summarized by <a href="${appUrl}">CodeSense AI</a> • ${new Date().toUTCString()}</sub>`;
}

// ─────────────────────────────────────────────────
// Get the commit SHA of the PR's latest commit
// (Required by GitHub's review comment API)
// ─────────────────────────────────────────────────
export async function getLatestCommitSha(
  owner: string,
  repo: string,
  pull_number: number,
  githubToken: string,
): Promise<string> {
  const octokit = getOctokit(githubToken);
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
  githubToken: string,
): Promise<Map<string, Map<number, number>>> {
  const octokit = getOctokit(githubToken);
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
  githubToken: string,
): Promise<{ reviewUrl: string; commentCount: number }> {
  const octokit = getOctokit(githubToken);
  const { owner, repo, pull_number } = parsePRUrl(prUrl);

  // 1. Get latest commit SHA (required for review API)
  const commitId = await getLatestCommitSha(owner, repo, pull_number, githubToken);

  // 2. Get diff positions for inline comments
  const positionMap = await getDiffPositions(owner, repo, pull_number, githubToken);

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
  const event = 'COMMENT';

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
  githubToken: string,
): Promise<void> {
  const octokit = getOctokit(githubToken);

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
