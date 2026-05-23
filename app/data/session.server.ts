import { createCookieSessionStorage, redirect } from 'react-router';

export type SessionData = {
  githubToken?: string;
  username?: string;
  avatarUrl?: string;
  anonymousCredits?: number;
  companyRules?: string;
};

export type SessionFlashData = {
  error?: string;
};

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set');
}

export const sessionStorage = createCookieSessionStorage<SessionData, SessionFlashData>({
  cookie: {
    name: '__codesense_session',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'lax',
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === 'production',
  },
});

export async function getSession(request: Request) {
  const cookie = request.headers.get('Cookie');
  return sessionStorage.getSession(cookie);
}

export async function commitSession(session: any) {
  return sessionStorage.commitSession(session);
}

export async function destroySession(session: any) {
  return sessionStorage.destroySession(session);
}

/**
 * Returns the current authenticated user, or null if anonymous.
 */
export async function getUser(request: Request) {
  const session = await getSession(request);
  const githubToken = session.get('githubToken');
  if (!githubToken) return null;
  
  return {
    githubToken,
    username: session.get('username'),
    avatarUrl: session.get('avatarUrl'),
  };
}

/**
 * Requires a user to be authenticated, otherwise redirects to home.
 */
export async function requireUser(request: Request) {
  const user = await getUser(request);
  if (!user) {
    throw redirect('/');
  }
  return user;
}
