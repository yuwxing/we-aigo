import React from 'react';
import { useGame } from '../store/gameStore';

export default function WorldMap() {
  const { state } = useGame();

  return (
    <div style={styles.container}>
      <div style={styles.heading}>🪐 世界地图</div>
      {state.zones.map((z) => (
        <div
          key={z.id}
          style={{
            ...styles.zone,
            opacity: z.locked ? 0.3 : 1,
          }}
        >
          <span>{z.icon}</span>
          <span>{z.label}</span>
          {z.locked && <span style={styles.lock}>🔒</span>}
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    padding: 12, borderRadius: 12,
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  heading: { fontWeight: 'bold', marginBottom: 10 },
  zone: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 10px', borderRadius: 8,
    cursor: 'pointer', transition: '0.2s',
    fontSize: 13,
  },
  lock: { marginLeft: 'auto', fontSize: 11 },
};
