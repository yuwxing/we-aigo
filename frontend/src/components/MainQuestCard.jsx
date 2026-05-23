import React from 'react';
import { useGame } from '../store/gameStore';

const badgeColors = {
  'MAIN QUEST': '#7c3aed',
  'SIDE QUEST': '#f59e0b',
  'DAILY QUEST': '#06b6d4',
};

export default function MainQuestCard() {
  const { state, selectQuest, startTask } = useGame();

  const nextQuest = state.quests.find((q) => !state.completedQuestIds.includes(q.id));
  if (!nextQuest) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>🎉 所有任务已完成！</div>
      </div>
    );
  }

  const zone = state.zones.find((z) => z.id === nextQuest.zoneId);
  const locked = !state.unlockedZones.includes(nextQuest.zoneId);
  const selected = state.currentQuestId === nextQuest.id;
  const bannerColor = badgeColors[nextQuest.type] || '#555';

  const handleClick = () => {
    if (locked) return;
    if (!selected) {
      selectQuest(nextQuest.id);
    }
  };

  const handleEnter = () => {
    if (locked) return;
    if (!selected) selectQuest(nextQuest.id);
    startTask(nextQuest.id, [
      { role: 'ai', text: `收到指令。正在加载 ${nextQuest.title}...` },
      { role: 'ai', text: `区域：${zone?.label}。目标：${nextQuest.description}` },
      { role: 'ai', text: '准备好就开始吧。' },
    ]);
  };

  return (
    <div style={styles.container}>
      {locked ? (
        <div style={styles.locked}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
          <div style={{ opacity: 0.5 }}>此区域尚未解锁</div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          style={{
            ...styles.card,
            borderColor: selected ? bannerColor : 'rgba(255,255,255,0.15)',
            boxShadow: selected
              ? `0 0 30px ${bannerColor}44, 0 0 60px ${bannerColor}22`
              : '0 0 20px rgba(124,58,237,0.2)',
          }}
        >
          <div style={styles.banner}>
            <span style={{ ...styles.badge, background: bannerColor }}>{nextQuest.type}</span>
            <span style={styles.zoneTag}>{zone?.icon} {zone?.label}</span>
          </div>
          <div style={styles.title}>{nextQuest.title}</div>
          <div style={styles.desc}>{nextQuest.description}</div>
          <div style={styles.footer}>
            <span style={styles.xp}>⚡ +{nextQuest.xp} XP</span>
            <button
              onClick={(e) => { e.stopPropagation(); handleEnter(); }}
              style={styles.enterBtn}
            >
              进入任务 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: 500, margin: '0 auto' },
  card: {
    padding: 20, borderRadius: 16,
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(16px)',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  locked: {
    textAlign: 'center', padding: 40, opacity: 0.6,
  },
  banner: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  badge: { fontSize: 10, color: '#fff', padding: '3px 10px', borderRadius: 4, letterSpacing: 1 },
  zoneTag: { fontSize: 12, opacity: 0.6 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  desc: { fontSize: 14, opacity: 0.7, lineHeight: 1.5 },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  xp: { fontSize: 14, color: '#c084fc', fontWeight: 'bold' },
  enterBtn: {
    padding: '10px 24px', borderRadius: 10, border: 'none',
    color: '#fff', cursor: 'pointer', fontWeight: 'bold',
    background: 'linear-gradient(90deg,#7c3aed,#4f46e5)',
    boxShadow: '0 0 20px rgba(124,58,237,0.4)',
    fontSize: 14,
  },
  empty: { textAlign: 'center', padding: 40, opacity: 0.6, fontSize: 16 },
};
