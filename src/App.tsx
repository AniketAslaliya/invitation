import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';
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

// Colour each screen ends on. The next screen begins from the same colour, so neighbours join
// seamlessly without overlapping each other's content.
const HERO_EDGE = '#2a060d'; // dark rose foliage at the foot of the palace scene
const PARCHMENT_EDGE = '#efdcb4';
const DEEP = '#26050e';

interface Screen {
  id: string;
  label: string;
  edge: string;
  node: ReactNode;
}

/**
 * One continuous story: the envelope is the only pinned moment; every later screen follows directly
 * on, joined to its neighbours by matching edge colours.
 */
function Experience() {
  const screens: Screen[] = [
    { id: 'invitation', label: 'Wedding invitation', edge: PARCHMENT_EDGE, node: <InvitationLetter /> },
    { id: 'story', label: 'Our story', edge: PARCHMENT_EDGE, node: <CoupleStory /> },
    { id: 'countdown', label: 'Countdown', edge: PARCHMENT_EDGE, node: <Countdown /> },
    { id: 'celebrations', label: 'The celebrations', edge: '#3a0a24', node: <WeddingTimeline /> },
    ...ceremonies.map((c) => ({ id: `event-${c.id}`, label: c.title, edge: c.theme.deep, node: <CeremonySection ceremony={c} /> })),
    { id: 'location', label: 'Venue', edge: DEEP, node: <LocationSection /> },
    { id: 'closing', label: 'With love', edge: '', node: <ClosingInvitation /> },
  ];
  return (
    <>
      <LoadingScreen />
      <ScrollProgress />
      <main className="app">
        <section id="top" className="hero-track" aria-label="Opening the invitation" style={{ height: `${(1 + HERO_HOLD) * 100}svh` }}>
          <div className="hero-pin">
            <RoyalHero />
            <div className="seam seam-bottom" style={{ background: `linear-gradient(to top, ${HERO_EDGE}, transparent)` }} aria-hidden="true" />
          </div>
        </section>
        {screens.map((sc, i) => (
          <FlowSection key={sc.id} id={sc.id} label={sc.label} from={i === 0 ? HERO_EDGE : screens[i - 1].edge} edge={sc.edge || undefined}>
            {sc.node}
          </FlowSection>
        ))}
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
