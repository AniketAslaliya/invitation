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
import { Page } from './components/Page/Page';
import { HERO_HOLD, RoyalHero } from './components/RoyalHero/RoyalHero';
import { WeddingTimeline } from './components/WeddingTimeline/WeddingTimeline';
import { ceremonies } from './data/ceremonies';

/**
 * One page per screen. Native scroll-snap moves exactly one page per swipe (identical on iOS and
 * Android, no scroll-jacking library). The envelope has two stops — closed, then open — and the card
 * is drawn out during the glide between them.
 */
function Experience() {
  return (
    <>
      <LoadingScreen />
      <ScrollProgress />
      <main className="app">
        <section id="top" className="hero-track" aria-label="Opening the invitation" style={{ height: `${(1 + HERO_HOLD) * 100}svh` }}>
          <span className="snap-stop" style={{ top: 0 }} aria-hidden="true" />
          <span className="snap-stop" style={{ top: `${HERO_HOLD * 100}svh` }} aria-hidden="true" />
          <div className="hero-pin">
            <RoyalHero />
          </div>
        </section>
        <Page id="invitation" label="Wedding invitation">
          <InvitationLetter />
        </Page>
        <Page id="story" label="Our story">
          <CoupleStory />
        </Page>
        <Page id="countdown" label="Countdown">
          <Countdown />
        </Page>
        <Page id="celebrations" label="The celebrations">
          <WeddingTimeline />
        </Page>
        {ceremonies.map((c) => (
          <Page key={c.id} id={`event-${c.id}`} label={c.title}>
            <CeremonySection ceremony={c} />
          </Page>
        ))}
        <Page id="location" label="Venue">
          <LocationSection />
        </Page>
        <Page id="closing" label="With love">
          <ClosingInvitation />
        </Page>
      </main>
      <MusicController />
    </>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Experience />
    </MotionConfig>
  );
}
