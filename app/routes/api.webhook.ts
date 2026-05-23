import type { Route } from './+types/api.webhook';
import crypto from 'crypto';
import Groq from 'groq-sdk';
import { Octokit } from '@octokit/rest';
import { parsePRUrl, postReviewToGitHub, deletePreviousReviews } from '../data/github-review';
import { generateInlineComments, runPreMergeChecks, sleep } from '../data/groq-helpers';
import type { ReviewResult, ReviewIssue, Severity } from '../data/types';

/* ─── Helpers ─── */

const SEVERITIES: Severity[] = ['critical', 'warning', 'suggestion', 'info'];
const TYPES = ['bug', 'security', 'performance', 'code_smell', 'suggestion'] as const;

function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return false;
  const expectedSignature =
    'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}

function extractJSON(raw: string): string {
  let s = raw.replace(/```json|```/g, '').trim();
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    s = s.slice(first, last + 1);
  }
  return s;
}

function clampScore(n: unknown, fallback: number): number {
  const num = typeof n === 'number' ? n : parseFloat(String(n));
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function normalizeIssues(arr: unknown): ReviewIssue[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((it: any, idx: number): ReviewIssue | null => {
      if (!it || typeof it !== 'object') return null;
      const severity: Severity = SEVERITIES.includes(it.severity) ? it.severity : 'suggestion';
      const type = TYPES.includes(it.type) ? it.type : 'suggestion';
      return {
        id: typeof it.id === 'string' && it.id ? it.id : `issue_${idx + 1}`,
        type: type as ReviewIssue['type'],
        severity,
        title: typeof it.title === 'string' && it.title.trim() ? it.title.trim() : 'Issue',
        description: typeof it.description === 'string' ? it.description : '',
        file: typeof it.file === 'string' ? it.file : 'unknown',
        line: typeof it.line === 'number' && it.line > 0 ? it.line : undefined,
        codeSnippet: typeof it.codeSnippet === 'string' ? it.codeSnippet : undefined,
        recommendation: typeof it.recommendation === 'string' ? it.recommendation : '',
      };
    })
    .filter((x): x is ReviewIssue => x !== null);
}

function buildPrompt(files: { filename: string; patch: string }[]): string {
  const fileContents = files
    .filter((f) => f.patch)
    .map((f) => `\n### FILE: ${f.filename}\n\`\`\`diff\n${f.patch.slice(0, 3500)}\n\`\`\``)
    .join('\n');

  return `You are an expert senior software engineer performing a thorough code review. Analyze the following code changes from a GitHub Pull Request and identify ALL issues.

${fileContents}

Respond ONLY with a valid JSON object. No markdown, no explanation outside the JSON.

Return this EXACT structure:
{
  "summary": "2-3 sentence overall assessment of the PR",
  "healthScore": {
    "overall": <number 0-100>,
    "security": <number 0-100>,
    "performance": <number 0-100>,
    "maintainability": <number 0-100>
  },
  "issues": [
    {
      "id": "issue_1",
      "type": "<bug|security|performance|code_smell|suggestion>",
      "severity": "<critical|warning|suggestion|info>",
      "title": "Short issue title",
      "description": "Detailed explanation",
      "file": "filename.ext",
      "line": <number or null>,
      "codeSnippet": "the problematic code snippet",
      "recommendation": "Specific actionable fix"
    }
  ]
}

Rules:
- severity critical = security vulnerabilities, crashes, data loss risks
- severity warning = bugs, performance issues, bad practices
- severity suggestion = improvements, readability, best practices
- severity info = nitpicks, minor style remarks
- healthScore: 90-100 = excellent, 70-89 = good, 50-69 = needs work, below 50 = poor
- If no real issues, return an empty issues array — DO NOT invent problems.
- Use exact filenames from the diff above.`;
}

/* ─── Webhook Handler ─── */

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Read raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256') || '';

  // 1. Verify the request is genuinely from GitHub
  if (process.env.GITHUB_WEBHOOK_SECRET && !verifyWebhookSignature(rawBody, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = request.headers.get('x-github-event');
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // 2. Only process pull_request events
  if (event !== 'pull_request') {
    return Response.json({ message: 'Event ignored — not a pull_request event' });
  }

  const action = payload.action;
  if (!['opened', 'synchronize', 'reopened'].includes(action)) {
    return Response.json({ message: `Action "${action}" ignored` });
  }

  // Check required env vars
  const groqKey = process.env.GROQ_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;
  if (!groqKey) {
    return Response.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
  }
  if (!githubToken || githubToken === 'your_github_pat_here') {
    return Response.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 });
  }

  const prUrl = payload.pull_request.html_url;
  const { owner, repo, pull_number } = parsePRUrl(prUrl);
  const octokit = new Octokit({ auth: githubToken });
  const appUrl = process.env.APP_URL || 'https://codesense-ai.vercel.app';

  // 3. Post a "pending" comment immediately
  let pendingCommentId: number | null = null;
  try {
    const { data: pendingComment } = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: pull_number,
      body: `## 🔍 CodeSense AI — Review In Progress\n\n⏳ Analyzing your PR... results will appear here in ~15–30 seconds.\n\n<sub>Powered by <a href="${appUrl}">CodeSense AI</a></sub>`,
    });
    pendingCommentId = pendingComment.id;
  } catch (err) {
    console.error('Failed to post pending comment:', err);
  }

  try {
    // 4. Fetch PR data from GitHub
    const [prResponse, filesResponse] = await Promise.all([
      octokit.pulls.get({ owner, repo, pull_number }),
      octokit.pulls.listFiles({ owner, repo, pull_number, per_page: 30 }),
    ]);

    const pr = prResponse.data;
    const filesData = filesResponse.data;

    const files = filesData.map((f) => ({
      filename: f.filename,
      status: f.status as 'added' | 'modified' | 'deleted' | 'renamed',
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch,
      raw_url: f.raw_url,
    }));

    const analyzable = files
      .filter(
        (f) =>
          f.patch &&
          !f.filename.match(
            /\.(png|jpg|jpeg|gif|svg|webp|ico|lock|sum|bin|woff2?|ttf|eot|mp4|mp3|pdf|zip)$/i,
          ),
      )
      .map((f) => ({ filename: f.filename, patch: f.patch! }));

    if (analyzable.length === 0) {
      // Clean up pending comment
      if (pendingCommentId) {
        await octokit.issues.deleteComment({ owner, repo, comment_id: pendingCommentId }).catch(() => {});
      }
      return Response.json({ message: 'No analyzable code files in this PR' });
    }

    // 5. Run the analysis — SEQUENTIAL with delays to respect Groq rate limits
    const groq = new Groq({ apiKey: groqKey });

    // Step A: Main analysis (big model)
    let analysis: any;
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are a senior software engineer and security expert. You ALWAYS respond with valid JSON only. Never include markdown code blocks or any text outside the JSON.',
          },
          { role: 'user', content: buildPrompt(analyzable) },
        ],
        temperature: 0.2,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      });
      const raw = completion.choices[0]?.message?.content || '{}';
      analysis = JSON.parse(extractJSON(raw));
    } catch (err) {
      console.error('Groq analysis failed:', err);
      analysis = { summary: 'Analysis could not be completed.', issues: [], healthScore: {} };
    }

    // Rate limit pause
    await sleep(2000);

    // Step B: Generate inline comments (fast model)
    const inlineComments = await generateInlineComments(analyzable.slice(0, 5));

    const issues = normalizeIssues(analysis.issues);
    const healthScore = {
      overall: clampScore(analysis.healthScore?.overall, 70),
      security: clampScore(analysis.healthScore?.security, 70),
      performance: clampScore(analysis.healthScore?.performance, 70),
      maintainability: clampScore(analysis.healthScore?.maintainability, 70),
      breakdown: {
        criticalIssues: issues.filter((i) => i.severity === 'critical').length,
        warnings: issues.filter((i) => i.severity === 'warning').length,
        suggestions: issues.filter((i) => i.severity === 'suggestion').length,
      },
    };

    const prData = {
      id: pr.number,
      title: pr.title,
      description: pr.body || 'No description provided',
      author: pr.user?.login || 'unknown',
      authorAvatar: pr.user?.avatar_url || '',
      repo: `${owner}/${repo}`,
      branch: pr.head.ref,
      baseBranch: pr.base.ref,
      files,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changed_files,
      createdAt: pr.created_at,
      url: pr.html_url,
    };

    const preMergeChecks = runPreMergeChecks(issues, healthScore, prData);

    const reviewResult: ReviewResult = {
      prData,
      issues,
      healthScore,
      summary:
        typeof analysis.summary === 'string' && analysis.summary.trim()
          ? analysis.summary.trim()
          : 'Review completed.',
      reviewedAt: new Date().toISOString(),
      analyzedFiles: analyzable.length,
      preMergeChecks,
      inlineComments,
    };

    // 6. Delete the "pending" comment
    if (pendingCommentId) {
      await octokit.issues.deleteComment({ owner, repo, comment_id: pendingCommentId }).catch(() => {});
    }

    // 7. Delete any previous CodeSense reviews (avoid duplicates on re-push)
    await deletePreviousReviews(owner, repo, pull_number);

    // 8. Post the full review to GitHub
    const { reviewUrl, commentCount } = await postReviewToGitHub(prUrl, reviewResult, inlineComments);

    return Response.json({
      success: true,
      message: `Review posted to GitHub with ${commentCount} inline comments`,
      reviewUrl,
    });
  } catch (error: any) {
    // Clean up pending comment on error
    if (pendingCommentId) {
      await octokit.issues.deleteComment({ owner, repo, comment_id: pendingCommentId }).catch(() => {});
    }
    console.error('Webhook processing error:', error);
    return Response.json(
      { error: error?.message || 'Webhook processing failed' },
      { status: 500 },
    );
  }
}
