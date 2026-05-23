import classnames from 'classnames';
import { useNavigate, Link } from 'react-router';
import { IconPlayerPlayFilled, IconArrowRight } from '@tabler/icons-react';
import { DEMO_RESULT } from '../../data/demo-data';
import { saveReviewResult } from '../../data/review-store';
import style from './demo-section.module.css';

export interface DemoSectionProps {
  className?: string;
}

export function DemoSection({ className }: DemoSectionProps) {
  const navigate = useNavigate();

  const handleDemo = () => {
    saveReviewResult(DEMO_RESULT);
    navigate('/dashboard');
  };

  return (
    <section className={classnames(style.root, className)}>
      <div className={style.bg} />
      <div className={style.inner}>
        <h2 className={style.title}>Ready to review your first PR?</h2>
        <p className={style.subtitle}>
          Try CodeSense with a sample report, or paste your own GitHub PR URL above. No account needed.
        </p>
        <div className={style.actions}>
          <button className={style.primaryBtn} onClick={handleDemo}>
            <IconPlayerPlayFilled size={16} />
            Explore a sample report
          </button>
          <Link to="/about" className={style.secondaryBtn}>
            Learn more
            <IconArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
