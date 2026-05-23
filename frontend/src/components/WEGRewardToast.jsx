import React, { useEffect, useRef } from 'react';
import { useGame } from '../store/gameStore';

export default function WEGRewardToast() {
  const { state, setRewardPhase, clearReward, addXp, unlockZone } = useGame();
  const { reward, rewardPhase } = state;
  const timerRef = useRef(null);

  useEffect(() => {
    if (rewardPhase === 'freeze' && reward) {
      timerRef.current = setTimeout(() => {
        setRewardPhase('explode');
        addXp(reward.wegAmount);

        timerRef.current = setTimeout(() => {
          setRewardPhase('unlock');

          if (reward.unlockText) {
            const zone = state.zones.find((z) => z.label === reward.unlockText);
            if (zone) unlockZone(zone.id);
          }

          timerRef.current = setTimeout(() => {
            setRewardPhase('retreat');
            timerRef.current = setTimeout(() => {
              clearReward();
            }, 800);
          }, 2000);
        }, 1800);
      }, 400);
    }
    return () => clearTimeout(timerRef.current);
  }, [rewardPhase, reward]);

  if (rewardPhase === 'idle') return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.backdrop} />

      {rewardPhase === 'freeze' && (
        <div style={styles.center}>
          <div style={styles.freezeText}>任务完成</div>
          <div style={styles.subText}>正在结算奖励...</div>
        </div>
      )}

      {rewardPhase === 'explode' && reward && (
        <div style={styles.center}>
          <div style={styles.wegAmount}>+{reward.wegAmount}</div>
          <div style={styles.wegLabel}>WEG 币</div>
          <div style={styles.coinRain}>
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                style={{
                  ...styles.coin,
                  left: `${(i / 12) * 100}%`,
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                🪙
              </span>
            ))}
          </div>
        </div>
      )}

      {rewardPhase === 'unlock' && reward && (
        <div style={styles.center}>
          <div style={styles.unlockIcon}>🔓</div>
          <div style={styles.unlockText}>
            {reward.unlockText} 已解锁
          </div>
          <div style={styles.skills}>
            {reward.skills.map((s, i) => (
              <div key={s.label} style={styles.skillRow}>
                <span style={styles.skillLabel}>{s.label}</span>
                <div style={styles.skillBarBg}>
                  <div style={{ ...styles.skillBarFill, width: `${s.to * 100}%` }} />
                </div>
                <span style={styles.skillVal}>+{((s.to - s.from) * 100).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {rewardPhase === 'retreat' && (
        <div style={styles.center}>
          <div style={{ fontSize: 18, opacity: 0.5 }}>返回大厅...</div>
        </div>
      )}
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 99999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  backdrop: {
    position: 'absolute', inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
  },
  center: {
    position: 'relative', zIndex: 1,
    textAlign: 'center', color: '#fff',
  },
  freezeText: {
    fontSize: 28, fontWeight: 'bold', letterSpacing: 4,
    textShadow: '0 0 30px rgba(168,85,247,0.5)',
  },
  subText: { fontSize: 14, opacity: 0.5, marginTop: 8 },
  wegAmount: {
    fontSize: 80, fontWeight: 900,
    color: '#fbbf24',
    textShadow: '0 0 50px rgba(251,191,36,0.8), 0 0 100px rgba(251,191,36,0.4)',
  },
  wegLabel: { fontSize: 24, color: 'rgba(251,191,36,0.7)', marginTop: -8 },
  coinRain: {
    position: 'relative', height: 60, marginTop: 20, overflow: 'hidden',
  },
  coin: {
    position: 'absolute', fontSize: 24,
    animation: 'coinFall 1.2s ease-out forwards',
    top: -30,
  },
  unlockIcon: { fontSize: 56, marginBottom: 12 },
  unlockText: {
    fontSize: 26, fontWeight: 'bold', color: '#34d399',
    textShadow: '0 0 30px rgba(52,211,153,0.5)',
  },
  skills: { marginTop: 24, width: 260, marginLeft: 'auto', marginRight: 'auto' },
  skillRow: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  skillLabel: { fontSize: 12, width: 60, textAlign: 'right', opacity: 0.7 },
  skillBarBg: {
    flex: 1, height: 8, borderRadius: 4,
    background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
  },
  skillBarFill: {
    height: '100%', borderRadius: 4,
    background: 'linear-gradient(90deg,#22d3ee,#06b6d4)',
    transition: 'width 0.8s ease-out',
  },
  skillVal: { fontSize: 12, width: 30, textAlign: 'left', color: '#22d3ee' },
};
