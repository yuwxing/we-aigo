import React from 'react';
import { GameProvider, useGame } from '../store/gameStore';
import GameLoading from '../components/GameLoading';
import MainQuestCard from '../components/MainQuestCard';
import TaskMode from '../components/TaskMode';
import WEGRewardToast from '../components/WEGRewardToast';

function Lobby() {
  const { state } = useGame();
  const { player } = state;

  return (
    <div style={styles.page}>
      <div style={styles.glow} />
      <WEGRewardToast />

      <div style={styles.header}>
        <div style={styles.title}>🚀 火星基地</div>
        <div style={styles.sub}>AI Learning RPG System</div>
        <div style={styles.playerInfo}>
          <span style={styles.level}>Lv.{player.level}</span>
          <span style={styles.titleTag}>{player.title}</span>
          <span style={styles.xp}>⚡ {player.xp} XP</span>
        </div>
      </div>

      <div style={styles.questSection}>
        <MainQuestCard />
      </div>
    </div>
  );
}

function Content() {
  const { state } = useGame();

  if (state.screen === 'loading') return <GameLoading />;
  if (state.screen === 'task') return <TaskMode />;
  return <Lobby />;
}

export default function MarsBase() {
  return (
    <GameProvider>
      <Content />
    </GameProvider>
  );
}

const styles = {
  page: {
    minHeight: '100vh', color: '#fff',
    fontFamily: 'Inter, PingFang SC, sans-serif',
    background: 'radial-gradient(ellipse at 50% 0%, #1a0b3e 0%, #0d061e 100%)',
    position: 'relative',
    padding: 20,
  },
  glow: {
    position: 'absolute', width: 500, height: 500,
    top: -100, left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(124,58,237,0.2)',
    filter: 'blur(120px)', borderRadius: '50%',
  },
  header: { textAlign: 'center', padding: '30px 0 20px', position: 'relative', zIndex: 1 },
  title: { fontSize: 36, fontWeight: 'bold', letterSpacing: 2 },
  sub: { opacity: 0.5, fontSize: 13, marginTop: 4 },
  playerInfo: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 12, marginTop: 14,
  },
  level: { fontWeight: 'bold', color: '#c084fc' },
  titleTag: { fontSize: 13, opacity: 0.7 },
  xp: { fontSize: 13, color: '#fbbf24' },
  questSection: {
    position: 'relative', zIndex: 1,
    padding: '20px 0',
  },
};
