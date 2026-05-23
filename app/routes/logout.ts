import { redirect } from 'react-router';
import type { Route } from './+types/logout';
import { getSession, destroySession } from '../data/session.server';

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request);
  return redirect('/', {
    headers: {
      'Set-Cookie': await destroySession(session),
    },
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  // Allow GET request for simple logout links too
  const session = await getSession(request);
  return redirect('/', {
    headers: {
      'Set-Cookie': await destroySession(session),
    },
  });
}
