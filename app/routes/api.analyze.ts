import type { Route } from './+types/api.analyze';
import Groq from 'groq-sdk';
import { Octokit } from '@octokit/rest';
import type { ReviewIssue, ReviewResult, Severity } from '../data/types';

/* --------------------------- helpers --------------------------- */

function parsePRUrl(url: string): { owner: string; repo: string; pull_number: number } | null {
  const match = url.trim().match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, ''), pull_number: parseInt(match[3], 10) };
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

function extractJSON(raw: string): string {
  // Strip code fences if present
  let s = raw.replace(/```json|```/g, '').trim();
  // Find first { and last } to be lenient
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

const SEVERITIES: Severity[] = ['critical', 'warning', 'suggestion', 'info'];
const TYPES = ['bug', 'security', 'performance', 'code_smell', 'suggestion'] as const;

function normalizeIssues(arr: unknown): ReviewIssue[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((it: any, idx: number): ReviewIssue | null => {
      if (!it || typeof it !== 'object') return null;
      const severity: Severity = SEVERITIES.includes(it.severity) ? it.severity : 'suggestion';
      const type = TYPES.includes(it.type) ? it.type : 'suggestion';
      const title = typeof it.title === 'string' && it.title.trim() ? it.title.trim() : 'Issue';
      const description = typeof it.description === 'string' ? it.description : '';
      const file = typeof it.file === 'string' ? it.file : 'unknown';
      const line = typeof it.line === 'number' && it.line > 0 ? it.line : undefined;
      return {
        id: typeof it.id === 'string' && it.id ? it.id : `issue_${idx + 1}`,
        type: type as ReviewIssue['type'],
        severity,
        title,
        description,
        file,
        line,
        codeSnippet: typeof it.codeSnippet === 'string' ? it.codeSnippet : undefined,
        recommendation: typeof it.recommendation === 'string' ? it.recommendation : '',
      };
    })
    .filter((x): x is ReviewIssue => x !== null);
}

async function callGroqWithRetry(
  groq: Groq,
  prompt: string,
  maxRetries = 2,
): Promise<{ analysis: any; usage?: { total_tokens?: number } }> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are a senior software engineer and security expert. You ALWAYS respond with valid JSON only. Never include markdown code blocks or any text outside the JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      });
      const raw = completion.choices[0]?.message?.content || '{}';
      const cleaned = extractJSON(raw);
      const analysis = JSON.parse(cleaned);
      return { analysis, usage: completion.usage };
    } catch (err) {
      lastErr = err;
      // brief backoff
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw lastErr ?? new Error('Groq analysis failed');
}

/* --------------------------- action --------------------------- */

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { prUrl?: string };
    const prUrl = body.prUrl;
    if (!prUrl) return Response.json({ error: 'PR URL is required' }, { status: 400 });

    const parsed = parsePRUrl(prUrl);
    if (!parsed) {
      return Response.json(
        { error: 'Invalid GitHub PR URL. Format: https://github.com/owner/repo/pull/123' },
        { status: 400 },
      );
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return Response.json(
        { error: 'AI service not configured. The GROQ_API_KEY environment variable is missing.' },
        { status: 500 },
      );
    }

    // GitHub token is optional — public PRs work unauthenticated (lower rate limit).
    const githubToken = process.env.GITHUB_TOKEN;
    const octokit = new Octokit(githubToken ? { auth: githubToken } : {});
    const { owner, repo, pull_number } = parsed;

    let pr;
    let filesData;
    try {
      const [prResponse, filesResponse] = await Promise.all([
        octokit.pulls.get({ owner, repo, pull_number }),
        octokit.pulls.listFiles({ owner, repo, pull_number, per_page: 30 }),
      ]);
      pr = prResponse.data;
      filesData = filesResponse.data;
    } catch (ghErr: any) {
      const status = ghErr?.status;
      if (status === 404) {
        return Response.json(
          { error: 'PR not found. Make sure the URL is correct and the repository is public.' },
          { status: 404 },
        );
      }
      if (status === 401 || status === 403) {
        return Response.json(
          {
            error: githubToken
              ? 'GitHub API access denied. Check your GITHUB_TOKEN permissions.'
              : 'GitHub rate limit reached for anonymous requests. Add a GITHUB_TOKEN environment variable to increase the limit.',
          },
          { status: 403 },
        );
      }
      throw ghErr;
    }

    const files = filesData.map((f) => ({
      filename: f.filename,
      status: f.status as 'added' | 'modified' | 'deleted' | 'renamed',
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch,
      raw_url: f.raw_url,
    }));

    const analyzable = files
      .filter((f) => f.patch && !f.filename.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|lock|sum|bin|woff2?|ttf|eot|mp4|mp3|pdf|zip)$/i))
      .map((f) => ({ filename: f.filename, patch: f.patch! }));

    if (analyzable.length === 0) {
      return Response.json(
        { error: 'No analyzable code files found in this PR (only binary files or empty patches).' },
        { status: 400 },
      );
    }

    const groq = new Groq({ apiKey: groqKey });
    let analysisResult: { analysis: any; usage?: { total_tokens?: number } };
    try {
      analysisResult = await callGroqWithRetry(groq, buildPrompt(analyzable));
    } catch (aiErr: any) {
      return Response.json(
        { error: 'AI analysis failed: ' + (aiErr?.message || 'unknown error') },
        { status: 502 },
      );
    }

    const { analysis, usage } = analysisResult;
    const issues = normalizeIssues(analysis?.issues);

    const overall = clampScore(analysis?.healthScore?.overall, 75);
    const security = clampScore(analysis?.healthScore?.security, 75);
    const performance = clampScore(analysis?.healthScore?.performance, 75);
    const maintainability = clampScore(analysis?.healthScore?.maintainability, 75);

    const result: ReviewResult = {
      prData: {
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
      },
      issues,
      healthScore: {
        overall,
        security,
        performance,
        maintainability,
        breakdown: {
          criticalIssues: issues.filter((i) => i.severity === 'critical').length,
          warnings: issues.filter((i) => i.severity === 'warning').length,
          suggestions: issues.filter((i) => i.severity === 'suggestion').length,
        },
      },
      summary:
        typeof analysis?.summary === 'string' && analysis.summary.trim()
          ? analysis.summary.trim()
          : 'Review completed.',
      reviewedAt: new Date().toISOString(),
      analyzedFiles: analyzable.length,
      tokensUsed: usage?.total_tokens,
    };

    return Response.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return Response.json(
      { error: error?.message || 'Analysis failed unexpectedly' },
      { status: 500 },
    );
  }
}
