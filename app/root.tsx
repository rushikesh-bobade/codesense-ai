import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import type { Route } from './+types/root';
import { ErrorBoundary as ErrorBoundaryRoot } from '~/components/error-boundary/error-boundary';
import favicon from '/favicon.svg';

import { getSession, getUser } from './data/session.server';

import './styles/reset.css';
import './styles/global.css';
import './styles/theme.css';

import { NavigationBar } from './blocks/__global/navigation-bar';
import { Footer } from './blocks/__global/footer';

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  return {
    user: await getUser(request),
    anonymousCredits: session.get('anonymousCredits') ?? 1,
    trialStartDate: session.get('trialStartDate'),
  };
}

export const links: Route.LinksFunction = () => [
  { rel: 'icon', href: favicon, type: 'image/svg+xml' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark-theme" style={{ colorScheme: 'dark' }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <header>
          <NavigationBar />
        </header>
        {children}
        <footer>
          <Footer />
        </footer>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export const ErrorBoundary = ErrorBoundaryRoot;
