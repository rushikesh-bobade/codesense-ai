import { redirect } from 'react-router';
import type { Route } from './+types/auth.github.callback';
import { getSession, commitSession } from '../data/session.server';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return redirect('/?error=No code provided by GitHub');
  }

  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret || clientId === 'your_client_id_here') {
    throw new Error('GitHub Client ID or Secret is not configured in .env');
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('No access token returned from GitHub');
    }

    // 2. Fetch user profile from GitHub to get username and avatar
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const userData = await userResponse.json();

    // 3. Store in session
    const session = await getSession(request);
    session.set('githubToken', accessToken);
    session.set('username', userData.login);
    session.set('avatarUrl', userData.avatar_url);

    const existingTrialStart = session.get('trialStartDate');
    if (existingTrialStart === undefined) {
      session.set('trialStartDate', Date.now());
    }

    return redirect('/dashboard', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  } catch (error: any) {
    console.error('OAuth Callback Error:', error);
    return redirect(`/?error=${encodeURIComponent(error.message || 'OAuth failed')}`);
  }
}
