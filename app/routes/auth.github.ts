import { redirect } from 'react-router';
import type { Route } from './+types/auth.github';

export async function loader({ request }: Route.LoaderArgs) {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  
  if (!clientId || clientId === 'your_client_id_here') {
    throw new Error('GITHUB_CLIENT_ID is not configured in .env');
  }

  // Redirect to GitHub OAuth
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  // We need repo scope to fetch PRs and post reviews
  url.searchParams.set('scope', 'repo user');
  url.searchParams.set('prompt', 'consent');
  
  // We should ideally generate and pass a state parameter here for CSRF protection
  // and store it in session, but keeping it simple for now.
  
  return redirect(url.toString());
}
