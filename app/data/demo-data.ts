import type { ReviewResult } from './types';

export const DEMO_RESULT: ReviewResult = {
  prData: {
    id: 42,
    title: 'feat: Add user authentication with JWT tokens',
    description:
      'This PR implements JWT-based authentication, adds login/register endpoints, and protects existing API routes.',
    author: 'dev-john',
    authorAvatar: 'https://avatars.githubusercontent.com/u/1234567?v=4',
    repo: 'acme-corp/backend-api',
    branch: 'feat/auth-jwt',
    baseBranch: 'main',
    files: [
      { filename: 'src/auth/auth.service.ts', status: 'added', additions: 87, deletions: 0 },
      { filename: 'src/auth/jwt.middleware.ts', status: 'added', additions: 42, deletions: 0 },
      { filename: 'src/users/users.controller.ts', status: 'modified', additions: 34, deletions: 12 },
      { filename: 'src/database/connection.ts', status: 'modified', additions: 8, deletions: 3 },
      { filename: 'src/config/env.ts', status: 'modified', additions: 15, deletions: 2 },
      { filename: 'package.json', status: 'modified', additions: 4, deletions: 0 },
      { filename: 'README.md', status: 'modified', additions: 22, deletions: 5 },
    ],
    additions: 212,
    deletions: 22,
    changedFiles: 7,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    url: 'https://github.com/acme-corp/backend-api/pull/42',
  },
  issues: [
    {
      id: 'issue_1',
      type: 'security',
      severity: 'critical',
      title: 'Hardcoded JWT secret in source code',
      description:
        'The JWT signing secret is hardcoded directly in auth.service.ts. This is a critical security vulnerability — any attacker with repository access can forge authentication tokens, compromising all user accounts.',
      file: 'src/auth/auth.service.ts',
      line: 14,
      codeSnippet: `const JWT_SECRET = 'my-super-secret-key-123';\n\nexport function signToken(payload: object) {\n  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });\n}`,
      recommendation:
        'Move the secret to an environment variable: `const JWT_SECRET = process.env.JWT_SECRET;` and add it to your `.env` file and secrets manager. Rotate any existing tokens immediately.',
    },
    {
      id: 'issue_2',
      type: 'security',
      severity: 'critical',
      title: 'SQL injection vulnerability in user lookup',
      description:
        'User input is concatenated directly into a SQL query string without parameterization. An attacker can send crafted input like `\' OR 1=1--` to bypass authentication or extract the entire database.',
      file: 'src/users/users.controller.ts',
      line: 28,
      codeSnippet: `const query = \`SELECT * FROM users WHERE email = '\${email}'\`;\nconst result = await db.query(query);`,
      recommendation:
        'Use parameterized queries: `await db.query("SELECT * FROM users WHERE email = $1", [email])`. Never interpolate user input into SQL strings.',
    },
    {
      id: 'issue_3',
      type: 'bug',
      severity: 'warning',
      title: 'Missing error handling in JWT verification',
      description:
        'jwt.verify() can throw multiple error types (JsonWebTokenError, TokenExpiredError, NotBeforeError). Without a try/catch, an expired or malformed token will crash the middleware and return a 500 instead of a proper 401.',
      file: 'src/auth/jwt.middleware.ts',
      line: 19,
      codeSnippet: `const decoded = jwt.verify(token, process.env.JWT_SECRET);\nreq.user = decoded;\nnext();`,
      recommendation:
        'Wrap in try/catch and handle specific error types: catch `TokenExpiredError` → return 401 with "Token expired", catch `JsonWebTokenError` → return 401 with "Invalid token".',
    },
    {
      id: 'issue_4',
      type: 'performance',
      severity: 'warning',
      title: 'N+1 query pattern in user role fetching',
      description:
        'For each authenticated request, the middleware first queries the user, then makes a separate database query to fetch their roles. With 100 concurrent requests, this generates 200+ DB queries.',
      file: 'src/auth/jwt.middleware.ts',
      line: 34,
      codeSnippet: `const user = await User.findById(decoded.userId);\nconst roles = await Role.findByUserId(user.id); // N+1 here`,
      recommendation:
        'Use a JOIN query to fetch user and roles in one round-trip: `User.findByIdWithRoles(decoded.userId)`, or cache roles in the JWT payload itself.',
    },
    {
      id: 'issue_5',
      type: 'security',
      severity: 'warning',
      title: 'Password not hashed before storage',
      description:
        'The register endpoint stores the plain-text password directly. If the database is ever compromised, all user passwords will be exposed immediately.',
      file: 'src/users/users.controller.ts',
      line: 52,
      codeSnippet: `await db.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, password]);`,
      recommendation:
        'Hash passwords with bcrypt before storing: `const hashed = await bcrypt.hash(password, 12); await db.query(... [email, hashed])`.',
    },
    {
      id: 'issue_6',
      type: 'suggestion',
      severity: 'suggestion',
      title: 'Token refresh mechanism not implemented',
      description:
        '7-day JWT tokens with no refresh capability means users are either logged out frequently or tokens have very long lifespans. A refresh token pattern would improve both security and UX.',
      file: 'src/auth/auth.service.ts',
      line: 1,
      recommendation:
        'Implement short-lived access tokens (15 min) + long-lived refresh tokens (7 days) stored in httpOnly cookies. Add a /auth/refresh endpoint.',
    },
    {
      id: 'issue_7',
      type: 'code_smell',
      severity: 'suggestion',
      title: 'Missing input validation on auth endpoints',
      description:
        'Email and password fields are not validated before processing. Empty strings, invalid email formats, or passwords without minimum requirements are accepted.',
      file: 'src/users/users.controller.ts',
      line: 40,
      recommendation:
        'Add validation with Zod or class-validator: validate email format, enforce password minimum length (8+ chars), and return 400 with descriptive error messages.',
    },
    {
      id: 'issue_8',
      type: 'suggestion',
      severity: 'info',
      title: 'Consider adding rate limiting to auth endpoints',
      description:
        'Login and register endpoints have no rate limiting, making them vulnerable to brute-force attacks.',
      file: 'src/auth/auth.service.ts',
      recommendation:
        'Add express-rate-limit: limit login to 5 attempts per 15 minutes per IP, with exponential backoff.',
    },
  ],
  healthScore: {
    overall: 52,
    security: 38,
    performance: 72,
    maintainability: 68,
    breakdown: {
      criticalIssues: 2,
      warnings: 3,
      suggestions: 3,
    },
  },
  summary:
    'This PR introduces JWT authentication but contains two critical security vulnerabilities that must be fixed before merging: a hardcoded JWT secret and SQL injection risk. Additionally, passwords are stored without hashing. The overall code structure is reasonable, but the security issues are severe enough to block this PR. Address the critical issues immediately and consider the performance optimization for the middleware N+1 query pattern.',
  reviewedAt: new Date().toISOString(),
  analyzedFiles: 5,
  tokensUsed: 2847,
};

export const DEMO_PR_URL = 'https://github.com/acme-corp/backend-api/pull/42';
