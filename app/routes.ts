import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('/dashboard', 'routes/review-dashboard.tsx'),
  route('/review/:prId', 'routes/review-detail-page.tsx'),
  route('/history', 'routes/history.tsx'),
  route('/about', 'routes/about.tsx'),
  route('/api/analyze', 'routes/api.analyze.ts'),
  route('/api/post-review', 'routes/api.post-review.ts'),
  route('/api/webhook', 'routes/api.webhook.ts'),
  route('/auth/github', 'routes/auth.github.ts'),
  route('/auth/github/callback', 'routes/auth.github.callback.ts'),
  route('/logout', 'routes/logout.ts'),
] satisfies RouteConfig;
