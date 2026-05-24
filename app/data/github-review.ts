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
  const { issues, healthScore, summary, preMergeChecks, prData, analyzedFiles, reviewedAt } = result;
  const { changelog, walkthrough, fileSummaries, poem, estimatedEffort } = result;

  const criticals = issues.filter((i) => i.severity === 'critical');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const suggestions = issues.filter((i) => i.severity === 'suggestion');
  const infos = issues.filter((i) => i.severity === 'info');

  const appUrl = process.env.APP_URL || 'https://codesense-ai-two.vercel.app/';

  // ── Score emoji helper ──
  function scoreEmoji(score: number): string {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    if (score >= 50) return '🟠';
    return '🔴';
  }

  function scoreBar(score: number): string {
    const filled = Math.round(score / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  // ── Blocking issues banner ──
  const blockingCount = criticals.length;
  const blockingBanner = blockingCount > 0
    ? `\n> 🚫 **${blockingCount} blocking issue(s) must be resolved before merging.**\n`
    : `\n> ✅ **No blocking issues found — this PR is ready to merge.**\n`;

  // ── Health Score Dashboard ──
  const healthDashboard = `
### ${scoreEmoji(healthScore.overall)} Health Score: ${healthScore.overall}/100

| Metric | Score | |
|:---|:---:|:---|
| ${scoreEmoji(healthScore.overall)} **Overall Health** | **${healthScore.overall}**/100 | \`${scoreBar(healthScore.overall)}\` |
| 🔒 Security | ${healthScore.security}/100 | \`${scoreBar(healthScore.security)}\` |
| ⚡ Performance | ${healthScore.performance}/100 | \`${scoreBar(healthScore.performance)}\` |
| 🔧 Maintainability | ${healthScore.maintainability}/100 | \`${scoreBar(healthScore.maintainability)}\` |
`;

  // ── Issue Breakdown ──
  const issueBreakdown = `
| Severity | Count |
|:---|:---:|
| 🔴 Critical | ${criticals.length} |
| ⚠️ Warning | ${warnings.length} |
| 💡 Suggestion | ${suggestions.length} |
| ℹ️ Info | ${infos.length} |
| **Total** | **${issues.length}** |
`;

  // ── Summary Section ──
  const summarySection = `### 📋 Summary\n\n${summary}`;

  // ── Pre-Merge Checks Table ──
  let preMergeSection = '';
  if (preMergeChecks && preMergeChecks.length > 0) {
    const rows = preMergeChecks.map((c) => {
      const icon = c.status === 'passed' ? '✅' : c.status === 'failed' ? '❌' : '⚠️';
      const blocker = c.blocking ? '🔒' : '';
      return `| ${icon} | ${c.name} | ${c.details} | ${blocker} |`;
    }).join('\n');
    preMergeSection = `
<details>
<summary><b>🛡️ Pre-Merge Checks (${preMergeChecks.filter(c => c.status === 'passed').length}/${preMergeChecks.length} passed)</b></summary>

| Status | Check | Details | Blocking |
|:---:|:---|:---|:---:|
${rows}

</details>
`;
  }

  // ── Walkthrough Section ──
  let walkthroughSection = '';
  if (walkthrough) {
    walkthroughSection = `
<details>
<summary><b>📝 Walkthrough</b></summary>

${walkthrough}

</details>
`;
  }

  // ── Changelog Section ──
  let changelogSection = '';
  if (changelog && changelog.length > 0) {
    const changelogItems = changelog.map((c) => {
      const icon = c.category === 'New Features' ? '✨'
        : c.category === 'Bug Fixes' ? '🐛'
        : c.category === 'Refactoring' ? '♻️'
        : '🔧';
      return `**${icon} ${c.category}**\n${c.description}`;
    }).join('\n\n');

    changelogSection = `
<details>
<summary><b>📦 Changelog</b></summary>

${changelogItems}

</details>
`;
  }

  // ── File Changes Table ──
  let filesSection = '';
  if (fileSummaries && fileSummaries.length > 0) {
    const fileRows = fileSummaries.map((fs) => `| \`${fs.file}\` | ${fs.summary} |`).join('\n');
    filesSection = `
<details>
<summary><b>📒 Files reviewed (${fileSummaries.length})</b></summary>

| File | Summary |
|:---|:---|
${fileRows}

</details>
`;
  } else if (prData) {
    const fileRows = prData.files.map((f) => {
      const statusIcon = f.status === 'added' ? '🆕' : f.status === 'deleted' ? '🗑️' : f.status === 'renamed' ? '📝' : '📄';
      return `| ${statusIcon} \`${f.filename}\` | +${f.additions} / -${f.deletions} |`;
    }).join('\n');
    filesSection = `
<details>
<summary><b>📒 Files changed (${prData.files.length})</b></summary>

| File | Changes |
|:---|:---:|
${fileRows}

</details>
`;
  }

  // ── Estimated Effort ──
  let effortSection = '';
  if (estimatedEffort) {
    effortSection = `
<details>
<summary><b>⏱️ Estimated Review Effort</b></summary>

${estimatedEffort}

</details>
`;
  }

  // ── Critical Issues (expanded, detailed) ──
  let criticalSection = '';
  if (criticals.length > 0) {
    const criticalItems = criticals.map((i) => {
      const locationStr = i.line ? `\`${i.file}:${i.line}\`` : `\`${i.file}\``;
      const codeBlock = i.codeSnippet ? `\n\n**Problematic code:**\n\`\`\`\n${i.codeSnippet}\n\`\`\`` : '';
      return `<details>
<summary>🔴 <b>${i.title}</b> — ${locationStr}</summary>

${i.description}${codeBlock}

**💡 Recommendation:**
> ${i.recommendation}

</details>`;
    }).join('\n\n');
    criticalSection = `\n### 🔴 Critical Issues — Must Fix (${criticals.length})\n\n${criticalItems}\n`;
  }

  // ── Warnings ──
  let warningSection = '';
  if (warnings.length > 0) {
    const warningItems = warnings.map((i) => {
      const locationStr = i.line ? `\`${i.file}:${i.line}\`` : `\`${i.file}\``;
      const codeBlock = i.codeSnippet ? `\n\n\`\`\`\n${i.codeSnippet}\n\`\`\`` : '';
      return `<details>
<summary>⚠️ <b>${i.title}</b> — ${locationStr}</summary>

${i.description}${codeBlock}

**💡 Recommendation:** ${i.recommendation}

</details>`;
    }).join('\n\n');
    warningSection = `\n### ⚠️ Warnings (${warnings.length})\n\n${warningItems}\n`;
  }

  // ── Suggestions ──
  let suggestionSection = '';
  if (suggestions.length > 0) {
    const suggestionItems = suggestions.map((i) => {
      const locationStr = i.line ? `\`${i.file}:${i.line}\`` : `\`${i.file}\``;
      return `- 💡 **${i.title}** (${locationStr}): ${i.description}`;
    }).join('\n');
    suggestionSection = `\n### 💡 Suggestions (${suggestions.length})\n\n${suggestionItems}\n`;
  }

  // ── Info ──
  let infoSection = '';
  if (infos.length > 0) {
    const infoItems = infos.map((i) => `- ℹ️ **${i.title}** (\`${i.file}\`): ${i.description}`).join('\n');
    infoSection = `\n### ℹ️ Notes (${infos.length})\n\n${infoItems}\n`;
  }

  // ── Poem (fun, like CodeRabbit) ──
  let poemSection = '';
  if (poem) {
    poemSection = `
<details>
<summary><b>🎵 Poem</b></summary>

> ${poem.split('\n').join('\n> ')}

</details>
`;
  }

  // ── Review Meta ──
  const reviewDate = reviewedAt ? new Date(reviewedAt).toUTCString() : new Date().toUTCString();
  const prStats = prData
    ? `**${prData.changedFiles} files** changed (+${prData.additions} / -${prData.deletions})`
    : '';

  const metaSection = `
<details>
<summary><b>⚙️ Review details</b></summary>

| Detail | Value |
|:---|:---|
| Reviewed at | ${reviewDate} |
| Files analyzed | ${analyzedFiles || 'N/A'} |
| PR stats | ${prStats} |
| Configuration | defaults |
| Review engine | CodeSense AI (Llama 3.3 70B) |

</details>
`;

  // ── Assemble the final markdown ──
  return `## 🔍 CodeSense AI — Automated Code Review

${blockingBanner}
${healthDashboard}
${issueBreakdown}
---

${summarySection}

---

${preMergeSection}${walkthroughSection}${changelogSection}${filesSection}${effortSection}
---
${criticalSection}${warningSection}${suggestionSection}${infoSection}
---
${poemSection}${metaSection}
---
<sub>🤖 Reviewed by <a href="${appUrl}">CodeSense AI</a> — Automated code review for every PR. • ${reviewDate}</sub>`;
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
