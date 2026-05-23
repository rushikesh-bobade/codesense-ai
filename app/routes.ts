import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('/dashboard', 'routes/review-dashboard.tsx'),
  route('/review/:prId', 'routes/review-detail-page.tsx'),
  route('/history', 'routes/history.tsx'),
  route('/about', 'routes/about.tsx'),
  route('/api/analyze', 'routes/api.analyze.ts'),
] satisfies RouteConfig;
