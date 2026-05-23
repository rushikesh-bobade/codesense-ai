import { redirect, useLoaderData, Form, useNavigation } from 'react-router';
import type { Route } from './+types/settings';
import { getSession, commitSession } from '../data/session.server';
import { IconSettings, IconDeviceFloppy, IconLoader2 } from '@tabler/icons-react';

export function meta() {
  return [{ title: 'Settings — CodeSense AI' }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  return {
    companyRules: session.get('companyRules') || '',
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const companyRules = formData.get('companyRules') as string;

  const session = await getSession(request);
  session.set('companyRules', companyRules);

  return redirect('/settings', {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  });
}

export default function SettingsPage() {
  const { companyRules } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSaving = navigation.state === 'submitting';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 20px', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12 }}>
          <IconSettings size={32} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, color: '#fff' }}>Settings</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '4px 0 0 0' }}>Configure CodeSense AI preferences</p>
        </div>
      </div>

      <div style={{ 
        background: 'rgba(255, 255, 255, 0.02)', 
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: 32
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#fff', margin: '0 0 16px 0' }}>Custom Company Rules</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6, marginBottom: 24, fontSize: 15 }}>
          Define specific coding standards, stylistic preferences, or architectural rules for your team. 
          CodeSense AI will strictly enforce these rules during every Pull Request analysis.
        </p>

        <Form method="post">
          <textarea
            name="companyRules"
            defaultValue={companyRules}
            placeholder="e.g. 1. All React components must be functional components.\n2. Do not use 'var', strictly use 'const' or 'let'.\n3. Prefer async/await over raw Promises."
            style={{
              width: '100%',
              minHeight: 200,
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              padding: 16,
              color: '#fff',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: 14,
              lineHeight: 1.6,
              resize: 'vertical',
              marginBottom: 24,
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#4D4DFF',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              {isSaving ? <IconLoader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <IconDeviceFloppy size={18} />}
              {isSaving ? 'Saving...' : 'Save Rules'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
