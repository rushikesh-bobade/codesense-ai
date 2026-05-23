import Groq from 'groq-sdk';
import type { InlineComment, PreMergeCheck, ReviewIssue, PRData } from './types';

// ─────────────────────────────────────────────────
// Rate-limit helper — wait between Groq calls
// ─────────────────────────────────────────────────
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Model selection — use lighter model for non-critical features
const MODEL_LARGE = 'llama-3.3-70b-versatile'; // main analysis (used by existing api.analyze)
const MODEL_FAST = 'llama-3.1-8b-instant'; // inline comments, chat, docs, slop detection

function getGroqClient(): Groq {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY is not configured');
  return new Groq({ apiKey: key });
}

function extractJSON(raw: string): string {
  let s = raw.replace(/```json|```/g, '').trim();
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    s = s.slice(first, last + 1);
  }
  // Also try array extraction
  if (!s.startsWith('{')) {
    const arrFirst = s.indexOf('[');
    const arrLast = s.lastIndexOf(']');
    if (arrFirst !== -1 && arrLast !== -1 && arrLast > arrFirst) {
      s = s.slice(arrFirst, arrLast + 1);
    }
  }
  return s;
}

// ─────────────────────────────────────────────────
// Generate inline comments for specific files
// Uses the lighter/faster model to save tokens
// ─────────────────────────────────────────────────
export async function generateInlineComments(
  files: { filename: string; patch: string }[],
): Promise<InlineComment[]> {
  if (files.length === 0) return [];

  const groq = getGroqClient();

  const fileContents = files
    .map((f) => `### FILE: ${f.filename}\n\`\`\`diff\n${f.patch.slice(0, 2500)}\n\`\`\``)
    .join('\n\n');

  const prompt = `You are an expert code reviewer. Analyze these code diffs and generate inline review comments for the most important issues found.

${fileContents}

Return ONLY a valid JSON object with this structure:
{
  "comments": [
    {
      "filename": "exact/file/path.ts",
      "lineNumber": 42,
      "comment": "Clear explanation of the issue",
      "suggestion": "The corrected code (optional, only if you have a concrete fix)",
      "severity": "critical|warning|suggestion|info",
      "type": "bug|security|performance|code_smell|suggestion"
    }
  ]
}

Rules:
- Only comment on REAL issues — do not invent problems.
- lineNumber must be a line that appears in the ADDED (+) lines of the diff.
- Maximum 8 comments total.
- Focus on the most impactful issues.
- "suggestion" field is optional — only include if you have a concrete code fix.`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL_FAST,
      messages: [
        {
          role: 'system',
          content: 'You are a code reviewer. Respond ONLY with valid JSON. No markdown fences or extra text.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(extractJSON(raw));
    const comments: InlineComment[] = (parsed.comments || [])
      .filter(
        (c: any) =>
          c &&
          typeof c.filename === 'string' &&
          typeof c.lineNumber === 'number' &&
          typeof c.comment === 'string',
      )
      .map((c: any) => ({
        filename: c.filename,
        lineNumber: c.lineNumber,
        comment: c.comment,
        suggestion: typeof c.suggestion === 'string' ? c.suggestion : undefined,
        severity: ['critical', 'warning', 'suggestion', 'info'].includes(c.severity)
          ? c.severity
          : 'suggestion',
        type: ['bug', 'security', 'performance', 'code_smell', 'suggestion'].includes(c.type)
          ? c.type
          : 'suggestion',
      }));

    return comments;
  } catch (err) {
    console.error('Failed to generate inline comments:', err);
    return []; // Silent fallback — inline comments are a bonus feature
  }
}

// ─────────────────────────────────────────────────
// Pre-Merge Checks — pure logic, no AI needed
// ─────────────────────────────────────────────────
export function runPreMergeChecks(
  issues: ReviewIssue[],
  healthScore: { overall: number; security: number },
  prData: PRData,
): PreMergeCheck[] {
  const checks: PreMergeCheck[] = [];

  // 1. Security vulnerabilities check
  const securityIssues = issues.filter((i) => i.type === 'security');
  checks.push({
    name: 'No Security Vulnerabilities',
    status: securityIssues.length === 0 ? 'passed' : 'failed',
    details:
      securityIssues.length === 0
        ? 'No security issues found'
        : `${securityIssues.length} security issue(s) found`,
    blocking: true,
  });

  // 2. Critical bugs check
  const criticals = issues.filter((i) => i.severity === 'critical' && i.type !== 'security');
  checks.push({
    name: 'No Critical Bugs',
    status: criticals.length === 0 ? 'passed' : 'failed',
    details:
      criticals.length === 0 ? 'No critical bugs found' : `${criticals.length} critical bug(s) found`,
    blocking: true,
  });

  // 3. Health score threshold
  checks.push({
    name: 'Health Score Above 50',
    status: healthScore.overall >= 50 ? 'passed' : 'failed',
    details: `Health score: ${healthScore.overall}/100`,
    blocking: false,
  });

  // 4. Test files included
  const testFiles = prData.files.filter((f) =>
    f.filename.match(/\.(test|spec|tests)\.(ts|tsx|js|jsx)$|__tests__/),
  );
  checks.push({
    name: 'Tests Included',
    status: testFiles.length > 0 ? 'passed' : 'warning',
    details:
      testFiles.length > 0 ? `${testFiles.length} test file(s) modified` : 'No test files found in this PR',
    blocking: false,
  });

  // 5. Large file check — warn if any single file has too many changes
  const largeFiles = prData.files.filter((f) => f.additions + f.deletions > 500);
  checks.push({
    name: 'No Oversized Files',
    status: largeFiles.length === 0 ? 'passed' : 'warning',
    details:
      largeFiles.length === 0
        ? 'All files are reasonably sized'
        : `${largeFiles.length} file(s) have 500+ line changes`,
    blocking: false,
  });

  return checks;
}
