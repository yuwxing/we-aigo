import React, { useEffect, useRef } from 'react';
import { useGame } from '../store/gameStore';

export default function GameLoading() {
  const { state, setLoadProgress, setScreen } = useGame();
  const raf = useRef(null);
  const startTime = useRef(null);

  useEffect(() => {
    const dur = 2000;
    const step = (now) => {
      if (!startTime.current) startTime.current = now;
      const t = Math.min((now - startTime.current) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setLoadProgress(eased);
      if (t < 1) {
        raf.current = requestAnimationFrame(step);
      } else {
        setScreen('lobby');
      }
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const pct = Math.round(state.loadProgress * 100);

  return (
    <div style={styles.container}>
      <div style={styles.glow} />
      <div style={styles.content}>
        <div style={styles.logo}>🚀 火星基地</div>
        <div style={styles.loaderRow}>
          <div style={styles.track}>
            <div style={{ ...styles.fill, width: `${pct}%` }} />
          </div>
          <span style={styles.pct}>{pct}%</span>
        </div>
        <div style={styles.hint}>正在同步神经链接...</div>
        <div style={styles.dots}>
          {['⬤', '⬤', '⬤'].map((d, i) => (
            <span key={i} style={{ ...styles.dot, animationDelay: `${i * 0.3}s` }}>{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed', inset: 0, zIndex: 99999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(ellipse at center, #1a0b3e 0%, #0d061e 100%)',
  },
  glow: {
    position: 'absolute', width: 400, height: 400,
    top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    background: 'rgba(124,58,237,0.15)',
    filter: 'blur(80px)', borderRadius: '50%',
  },
  content: { position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff' },
  logo: { fontSize: 32, fontWeight: 'bold', marginBottom: 30, letterSpacing: 4 },
  loaderRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  track: {
    width: 240, height: 6, borderRadius: 3,
    background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
  },
  fill: {
    height: '100%', borderRadius: 3,
    background: 'linear-gradient(90deg,#7c3aed,#a855f7)',
    transition: 'width 0.1s linear',
    boxShadow: '0 0 12px rgba(124,58,237,0.5)',
  },
  pct: { fontSize: 14, fontVariantNumeric: 'tabular-nums', width: 32, textAlign: 'left' },
  hint: { fontSize: 13, opacity: 0.5, marginBottom: 16 },
  dots: { display: 'flex', justifyContent: 'center', gap: 8 },
  dot: {
    fontSize: 8, opacity: 0.3, color: '#a855f7',
    animation: 'pulse 1.2s infinite',
  },
};
