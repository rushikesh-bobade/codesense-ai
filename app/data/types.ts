export type Severity = 'critical' | 'warning' | 'suggestion' | 'info';

export interface ReviewIssue {
  id: string;
  type: 'bug' | 'security' | 'performance' | 'code_smell' | 'suggestion';
  severity: Severity;
  title: string;
  description: string;
  file: string;
  line?: number;
  codeSnippet?: string;
  recommendation: string;
}

export interface PRHealthScore {
  overall: number;
  security: number;
  performance: number;
  maintainability: number;
  breakdown: {
    criticalIssues: number;
    warnings: number;
    suggestions: number;
  };
}

export interface PRFile {
  filename: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  patch?: string;
  raw_url?: string;
}

export interface PRData {
  id: number;
  title: string;
  description: string;
  author: string;
  authorAvatar: string;
  repo: string;
  branch: string;
  baseBranch: string;
  files: PRFile[];
  additions: number;
  deletions: number;
  changedFiles: number;
  createdAt: string;
  url: string;
}

export interface ReviewResult {
  prData: PRData;
  issues: ReviewIssue[];
  healthScore: PRHealthScore;
  summary: string;
  reviewedAt: string;
  analyzedFiles: number;
  tokensUsed?: number;
}
