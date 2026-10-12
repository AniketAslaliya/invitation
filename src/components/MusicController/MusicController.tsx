import { Music, Pause, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { siteConfig } from '../../data/siteConfig';

/**
 * Optional background music. Never autoplays; renders nothing until siteConfig.music.src is set.
 */
export function MusicController() {
  const { src, title, initialVolume } = siteConfig.music;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(initialVolume);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!src) return;
    const a = new Audio();
    a.src = src;
    a.loop = true;
    a.preload = 'none';
    a.volume = initialVolume;
    const onPause = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onError = () => setFailed(true);
    a.addEventListener('pause', onPause);
    a.addEventListener('play', onPlay);
    a.addEventListener('error', onError);
    audioRef.current = a;
    // Pause when the page is hidden (e.g. guest switches back to the messaging app).
    const onVis = () => document.hidden && a.pause();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      a.pause();
      a.removeEventListener('pause', onPause);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('error', onError);
      document.removeEventListener('visibilitychange', onVis);
      a.src = '';
      audioRef.current = null;
    };
  }, [src, initialVolume]);

  if (!src || failed) return null;

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      try {
        await a.play();
      } catch {
        setPlaying(false);
      }
    } else a.pause();
  };

  const muted = volume === 0;
  return (
    <div className="music">
      <input
        className="music-volume"
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        aria-label="Music volume"
        onChange={(e) => {
          const v = Number(e.target.value);
          setVolume(v);
          if (audioRef.current) audioRef.current.volume = v;
        }}
      />
      <button type="button" className="music-btn" aria-pressed={playing} aria-label={playing ? `Pause ${title}` : `Play ${title}`} onClick={toggle}>
        {playing ? muted ? <VolumeX size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" /> : <Music size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
