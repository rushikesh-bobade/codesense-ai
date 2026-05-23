import { Link } from 'react-router';
import {
  IconCheck,
  IconShieldLock,
  IconBolt,
  IconBrain,
  IconArrowRight,
} from '@tabler/icons-react';
import style from './about.module.css';

export function meta() {
  return [
    { title: 'About — CodeSense AI' },
    { name: 'description', content: 'How CodeSense AI works and what powers it.' },
  ];
}

export default function AboutRoute() {
  return (
    <div className={style.root}>
      <div className={style.inner}>
        <div className={style.eyebrow}>About</div>
        <h1 className={style.title}>
          A reviewer that <span className={style.titleAccent}>never sleeps.</span>
        </h1>
        <p className={style.lead}>
          CodeSense AI scans GitHub Pull Requests in seconds. It surfaces security flaws, performance regressions,
          and subtle bugs before they ship — no installation, no signup, no GitHub app to authorize.
        </p>

        <section className={style.section}>
          <h2 className={style.sectionTitle}>
            <span className={style.sectionIcon}><IconBrain size={16} /></span>
            How it works
          </h2>
          <p className={style.sectionText}>
            When you paste a PR URL, CodeSense fetches the diff via the GitHub API, sends it to Llama 3.3 70B running
            on Groq's inference platform, and returns a structured report covering security, performance,
            maintainability, and overall quality.
          </p>
          <ul className={style.list}>
            <li className={style.listItem}>
              <IconCheck size={16} className={style.checkIcon} />
              Fetches PR metadata and file diffs from the GitHub API
            </li>
            <li className={style.listItem}>
              <IconCheck size={16} className={style.checkIcon} />
              Sends code to Llama 3.3 70B via Groq for analysis
            </li>
            <li className={style.listItem}>
              <IconCheck size={16} className={style.checkIcon} />
              Returns structured JSON with issues, severities, and recommendations
            </li>
            <li className={style.listItem}>
              <IconCheck size={16} className={style.checkIcon} />
              History is stored locally in your browser — never on a server
            </li>
          </ul>
        </section>

        <section className={style.section}>
          <h2 className={style.sectionTitle}>
            <span className={style.sectionIcon}><IconShieldLock size={16} /></span>
            Privacy & Security
          </h2>
          <p className={style.sectionText}>
            CodeSense does not store code or analysis results on its servers. Reviews are processed in real time and
            results live exclusively in your browser's local storage. The only data sent to third parties is the PR
            diff itself, transmitted to Groq for analysis under their{' '}
            <a href="https://groq.com/privacy" target="_blank" rel="noopener noreferrer">privacy policy</a>.
          </p>
        </section>

        <section className={style.section}>
          <h2 className={style.sectionTitle}>
            <span className={style.sectionIcon}><IconBolt size={16} /></span>
            Tech Stack
          </h2>
          <div className={style.stack}>
            <div className={style.stackItem}>
              <span className={style.stackLabel}>AI Model</span>
              <span className={style.stackValue}>Llama 3.3 70B</span>
            </div>
            <div className={style.stackItem}>
              <span className={style.stackLabel}>Inference</span>
              <span className={style.stackValue}>Groq API</span>
            </div>
            <div className={style.stackItem}>
              <span className={style.stackLabel}>Frontend</span>
              <span className={style.stackValue}>React 19</span>
            </div>
            <div className={style.stackItem}>
              <span className={style.stackLabel}>Routing</span>
              <span className={style.stackValue}>React Router 7</span>
            </div>
            <div className={style.stackItem}>
              <span className={style.stackLabel}>Source</span>
              <span className={style.stackValue}>GitHub API</span>
            </div>
            <div className={style.stackItem}>
              <span className={style.stackLabel}>Language</span>
              <span className={style.stackValue}>TypeScript</span>
            </div>
          </div>
        </section>

        <div className={style.cta}>
          <h3 className={style.ctaTitle}>Ready to review your first PR?</h3>
          <p className={style.ctaSub}>Paste a public GitHub PR URL and get insights in seconds.</p>
          <Link to="/" className={style.ctaBtn}>
            Start analyzing
            <IconArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
