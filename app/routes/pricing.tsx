import { useRouteLoaderData } from 'react-router';
import { IconCheck, IconX, IconBrandGithub } from '@tabler/icons-react';
import style from './pricing.module.css';

export function meta() {
  return [{ title: 'Pricing & Subscriptions — CodeSense AI' }];
}

export default function Pricing() {
  const rootData = useRouteLoaderData('root') as { user?: any; trialStartDate?: number } | undefined;
  const user = rootData?.user;
  
  let isTrialExpired = false;
  if (user && rootData?.trialStartDate) {
    const trialDurationMs = 7 * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - rootData.trialStartDate;
    if (elapsed > trialDurationMs) {
      isTrialExpired = true;
    }
  }

  return (
    <div className={style.page}>
      
      <main className={style.main}>
        <div className={style.header}>
          <h1 className={style.title}>Simple, transparent pricing</h1>
          <p className={style.subtitle}>
            Start for free. Upgrade when you need more power.
          </p>
        </div>

        <div className={style.grid}>
          {/* Trial / Free Tier */}
          <div className={style.card}>
            <div className={style.cardHeader}>
              <h2 className={style.planName}>7-Day Trial</h2>
              <div className={style.price}>
                $0<span className={style.period}>/for 7 days</span>
              </div>
              <p className={style.description}>
                Experience the full power of CodeSense for a week, completely free.
              </p>
            </div>
            
            <div className={style.cardBody}>
              <ul className={style.featureList}>
                <li><IconCheck size={18} className={style.check} /> Unlimited PR Analyses</li>
                <li><IconCheck size={18} className={style.check} /> Direct GitHub Integration</li>
                <li><IconCheck size={18} className={style.check} /> Chat with PR Code</li>
                <li><IconCheck size={18} className={style.check} /> Custom Company Rules</li>
              </ul>
              
              {!user ? (
                <a href="/auth/github" className={style.btnOutline}>
                  <IconBrandGithub size={18} /> Start Free Trial
                </a>
              ) : isTrialExpired ? (
                <button className={style.btnOutline} disabled style={{ opacity: 0.5 }}>
                  Trial Expired
                </button>
              ) : (
                <button className={style.btnOutline} disabled style={{ opacity: 0.5 }}>
                  Active Plan
                </button>
              )}
            </div>
          </div>

          {/* Pro Tier */}
          <div className={`${style.card} ${style.cardPopular}`}>
            <div className={style.popularBadge}>Most Popular</div>
            <div className={style.cardHeader}>
              <h2 className={style.planName}>Pro</h2>
              <div className={style.price}>
                $15<span className={style.period}>/user/month</span>
              </div>
              <p className={style.description}>
                For professional developers and small teams shipping faster.
              </p>
            </div>
            
            <div className={style.cardBody}>
              <ul className={style.featureList}>
                <li><IconCheck size={18} className={style.check} /> Everything in Free Trial</li>
                <li><IconCheck size={18} className={style.check} /> Automated webhook reviews</li>
                <li><IconCheck size={18} className={style.check} /> priority support</li>
                <li><IconCheck size={18} className={style.check} /> Advanced Security Scans</li>
              </ul>
              
              <button className={style.btnPrimary}>
                Subscribe to Pro
              </button>
            </div>
          </div>

          {/* Enterprise Tier */}
          <div className={style.card}>
            <div className={style.cardHeader}>
              <h2 className={style.planName}>Enterprise</h2>
              <div className={style.price}>
                Custom
              </div>
              <p className={style.description}>
                For large organizations with strict compliance requirements.
              </p>
            </div>
            
            <div className={style.cardBody}>
              <ul className={style.featureList}>
                <li><IconCheck size={18} className={style.check} /> Everything in Pro</li>
                <li><IconCheck size={18} className={style.check} /> Self-hosted models</li>
                <li><IconCheck size={18} className={style.check} /> SOC2 Compliance</li>
                <li><IconCheck size={18} className={style.check} /> Dedicated Account Manager</li>
              </ul>
              
              <button className={style.btnOutline}>
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
