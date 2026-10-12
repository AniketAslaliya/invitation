import { MotionConfig } from 'framer-motion';
import { useEffect } from 'react';
import { CeremonySection } from './components/CeremonySection/CeremonySection';
import { ClosingInvitation } from './components/ClosingInvitation/ClosingInvitation';
import { CoupleStory } from './components/CoupleStory/CoupleStory';
import { Countdown } from './components/Countdown/Countdown';
import { InvitationLetter } from './components/InvitationLetter/InvitationLetter';
import { LoadingScreen } from './components/LoadingScreen/LoadingScreen';
import { LocationSection } from './components/LocationSection/LocationSection';
import { MusicController } from './components/MusicController/MusicController';
import { Navigation, ScrollProgress } from './components/Navigation/Navigation';
import { RoyalHero } from './components/RoyalHero/RoyalHero';
import { WeddingTimeline } from './components/WeddingTimeline/WeddingTimeline';
import { ceremonies } from './data/ceremonies';
import { CapabilitiesProvider, useCaps } from './lib/capabilities';
import { disableSmoothScroll, enableSmoothScroll } from './lib/scroll';

function SmoothScroll() {
  const { mode } = useCaps();
  useEffect(() => {
    if (mode !== 'webgl') return;
    enableSmoothScroll();
    return disableSmoothScroll;
  }, [mode]);
  return null;
}

function Experience() {
  const bookends = { before: '#4a0c26', after: '#2c0510' };
  return (
    <>
      <a className="skip-link" href="#invitation">
        Skip to invitation
      </a>
      <LoadingScreen />
      <SmoothScroll />
      <ScrollProgress />
      <Navigation />
      <main>
        <RoyalHero />
        <InvitationLetter />
        <CoupleStory />
        <Countdown />
        <WeddingTimeline />
        {ceremonies.map((c, i) => (
          <CeremonySection
            key={c.id}
            ceremony={c}
            index={i}
            prevDeep={i === 0 ? bookends.before : ceremonies[i - 1].theme.deep}
            nextDeep={i === ceremonies.length - 1 ? bookends.after : ceremonies[i + 1].theme.deep}
          />
        ))}
        <LocationSection />
        <ClosingInvitation />
      </main>
      <MusicController />
    </>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <CapabilitiesProvider>
        <Experience />
      </CapabilitiesProvider>
    </MotionConfig>
  );
}
