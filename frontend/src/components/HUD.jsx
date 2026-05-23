import React from 'react';
import { useGame } from '../store/gameStore';

export default function HUD() {
  const { state } = useGame();
  const { player } = state;
  const xpNeeded = player.level * 100;
  const progress = player.xp / xpNeeded;

  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <span style={styles.level}>Lv.{player.level}</span>
        <span style={styles.title}>{player.title}</span>
      </div>
      <div style={styles.center}>
        <div style={styles.barBg}>
          <div style={{ ...styles.barFill, width: `${Math.min(progress * 100, 100)}%` }} />
        </div>
        <span style={styles.xpText}>{player.xp} / {xpNeeded} XP</span>
      </div>
      <div style={styles.right}>
        <span style={styles.skillTag}>👂 {(player.skills.listening * 100).toFixed(0)}</span>
        <span style={styles.skillTag}>📖 {(player.skills.reading * 100).toFixed(0)}</span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 16px', borderRadius: 12,
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  left: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 },
  level: { fontWeight: 'bold', fontSize: 16, color: '#c084fc' },
  title: { fontSize: 12, opacity: 0.7 },
  center: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  barBg: {
    width: '100%', height: 8, borderRadius: 4,
    background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
  },
  barFill: {
    height: '100%', borderRadius: 4,
    background: 'linear-gradient(90deg,#7c3aed,#4f46e5)',
    transition: 'width 0.5s',
  },
  xpText: { fontSize: 11, opacity: 0.5 },
  right: { display: 'flex', gap: 8 },
  skillTag: { fontSize: 11, opacity: 0.7, whiteSpace: 'nowrap' },
};
