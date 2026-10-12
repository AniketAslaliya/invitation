import { MotionConfig } from 'framer-motion';
import { CeremonySection } from './components/CeremonySection/CeremonySection';
import { ClosingInvitation } from './components/ClosingInvitation/ClosingInvitation';
import { CoupleStory } from './components/CoupleStory/CoupleStory';
import { Countdown } from './components/Countdown/Countdown';
import { InvitationLetter } from './components/InvitationLetter/InvitationLetter';
import { LoadingScreen } from './components/LoadingScreen/LoadingScreen';
import { LocationSection } from './components/LocationSection/LocationSection';
import { MusicController } from './components/MusicController/MusicController';
import { ScrollProgress } from './components/Navigation/Navigation';
import { FlowSection } from './components/FlowSection/FlowSection';
import { HERO_HOLD, RoyalHero } from './components/RoyalHero/RoyalHero';
import { WeddingTimeline } from './components/WeddingTimeline/WeddingTimeline';
import { ceremonies } from './data/ceremonies';
import { CapabilitiesProvider } from './lib/capabilities';

/**
 * One continuous story: the envelope is the only pinned moment; every later screen dissolves into
 * the next through a feathered overlap instead of sliding over it like a separate card.
 */
function Experience() {
  let i = 1;
  return (
    <>
      <LoadingScreen />
      <ScrollProgress />
      <main className="app">
        <section id="top" className="hero-track" aria-label="Opening the invitation" style={{ height: `${(1 + HERO_HOLD) * 100}svh` }}>
          <div className="hero-pin">
            <RoyalHero />
          </div>
        </section>
        <FlowSection id="invitation" index={i++} label="Wedding invitation">
          <InvitationLetter />
        </FlowSection>
        <FlowSection id="story" index={i++} label="Our story">
          <CoupleStory />
        </FlowSection>
        <FlowSection id="countdown" index={i++} label="Countdown">
          <Countdown />
        </FlowSection>
        <FlowSection id="celebrations" index={i++} label="The celebrations">
          <WeddingTimeline />
        </FlowSection>
        {ceremonies.map((c) => (
          <FlowSection key={c.id} id={`event-${c.id}`} index={i++} label={c.title}>
            <CeremonySection ceremony={c} />
          </FlowSection>
        ))}
        <FlowSection id="location" index={i++} label="Venue">
          <LocationSection />
        </FlowSection>
        <FlowSection id="closing" index={i++} label="With love">
          <ClosingInvitation />
        </FlowSection>
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
