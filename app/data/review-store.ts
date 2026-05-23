import type { ReviewResult } from './types';

const STORAGE_KEY = 'codesense_review_result';
const HISTORY_KEY = 'codesense_review_history';
const MAX_HISTORY = 10;

export interface HistoryEntry {
  id: number;
  title: string;
  repo: string;
  url: string;
  score: number;
  reviewedAt: string;
  criticalIssues: number;
  warnings: number;
  totalIssues: number;
}

export function saveReviewResult(result: ReviewResult): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    addToHistory(result);
  } catch {
    /* storage unavailable */
  }
}

export function loadReviewResult(): ReviewResult | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReviewResult) : null;
  } catch {
    return null;
  }
}

export function clearCurrentResult(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

export function addToHistory(result: ReviewResult): void {
  try {
    const history = loadHistory();
    const entry: HistoryEntry = {
      id: result.prData.id,
      title: result.prData.title,
      repo: result.prData.repo,
      url: result.prData.url,
      score: result.healthScore.overall,
      reviewedAt: result.reviewedAt,
      criticalIssues: result.healthScore.breakdown.criticalIssues,
      warnings: result.healthScore.breakdown.warnings,
      totalIssues: result.issues.length,
    };
    const filtered = history.filter((h) => h.url !== entry.url);
    const updated = [entry, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    /* noop */
  }
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function removeFromHistory(url: string): void {
  try {
    const history = loadHistory().filter((h) => h.url !== url);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    /* noop */
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* noop */
  }
}

export function generateMarkdownReport(result: ReviewResult): string {
  const { prData, healthScore, summary, issues } = result;
  const criticals = issues.filter((i) => i.severity === 'critical');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const suggestions = issues.filter((i) => i.severity === 'suggestion');

  const severityEmoji: Record<string, string> = {
    critical: '🔴',
    warning: '⚠️',
    suggestion: '💡',
    info: 'ℹ️',
  };

  let report = `# CodeSense AI — Code Review Report\n\n`;
  report += `**PR:** [${prData.title}](${prData.url})\n`;
  report += `**Repository:** ${prData.repo}\n`;
  report += `**Author:** ${prData.author}\n`;
  report += `**Branch:** \`${prData.branch}\` → \`${prData.baseBranch}\`\n`;
  report += `**Reviewed:** ${new Date(result.reviewedAt).toLocaleString()}\n\n`;
  report += `---\n\n`;
  report += `## 🏆 Health Score: ${healthScore.overall}/100\n\n`;
  report += `| Dimension | Score |\n|---|---|\n`;
  report += `| Security | ${healthScore.security}/100 |\n`;
  report += `| Performance | ${healthScore.performance}/100 |\n`;
  report += `| Maintainability | ${healthScore.maintainability}/100 |\n\n`;
  report += `## 📝 AI Summary\n\n${summary}\n\n`;
  report += `---\n\n`;
  report += `## 🔍 Issues Found\n\n`;
  report += `- 🔴 **Critical:** ${criticals.length}\n`;
  report += `- ⚠️ **Warnings:** ${warnings.length}\n`;
  report += `- 💡 **Suggestions:** ${suggestions.length}\n\n`;

  for (const issue of issues) {
    report += `### ${severityEmoji[issue.severity]} ${issue.title}\n\n`;
    report += `**File:** \`${issue.file}\`${issue.line ? ` (line ${issue.line})` : ''}\n\n`;
    report += `${issue.description}\n\n`;
    if (issue.codeSnippet) {
      report += `\`\`\`\n${issue.codeSnippet}\n\`\`\`\n\n`;
    }
    report += `**Recommendation:** ${issue.recommendation}\n\n`;
    report += `---\n\n`;
  }

  report += `*Analyzed by Llama 3.3 70B via Groq · CodeSense AI*\n`;
  return report;
}

export function downloadFile(filename: string, content: string, mimeType: string): void {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    /* noop */
  }
}

export function safeFilename(s: string): string {
  return s.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'report';
}
