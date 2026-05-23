import { HeroSection } from '../blocks/home/hero-section';
import { TrustBadge } from '../blocks/home/trust-badge';
import { FeaturesGrid } from '../blocks/home/features-grid';
import { HowItWorksSection } from '../blocks/home/how-it-works-section';
import { StatisticsBar } from '../blocks/home/statistics-bar';
import { DemoSection } from '../blocks/home/demo-section';
import styles from './home.module.css';

export default function Home() {
  return (
    <div className={styles.root}>
      <HeroSection />
      <TrustBadge />
      <FeaturesGrid />
      <HowItWorksSection />
      <StatisticsBar />
      <DemoSection />
    </div>
  );
}
