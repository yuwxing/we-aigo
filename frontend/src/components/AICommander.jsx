import React, { useState } from 'react';
import { useGame } from '../store/gameStore';

export default function AICommander() {
  const { state, completeQuest, setRewardPhase, clearReward, addXp } = useGame();
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState('');

  const quest = state.quests.find((q) => q.id === state.currentQuestId);

  const handleStart = () => {
    setResult('');
    setAnswer('');
  };

  const handleSubmit = () => {
    if (!answer) return;
    const score = Math.floor(Math.random() * 30) + 70;
    setResult(`🎉 评分：${score}/100`);

    const reward = {
      wegAmount: quest.xp,
      skills: [
        { label: '听说能力', from: 0.38, to: 0.42 },
        { label: '语法能力', from: 0.32, to: 0.36 },
        { label: '阅读能力', from: 0.40, to: 0.43 },
      ],
      unlockText: quest.zoneId || '写作舱',
    };

    completeQuest(quest.id, reward);
  };

  if (!quest) {
    return (
      <div style={styles.container}>
        <div style={styles.heading}>🤖 AI 指挥官</div>
        <div style={styles.empty}>← 点击任务启动 AI 学习</div>
      </div>
    );
  }

  const done = state.completedQuestIds.includes(quest.id);

  return (
    <div style={styles.container}>
      <div style={styles.heading}>🤖 AI 指挥官</div>
      <div style={styles.questTitle}>{quest.title}</div>
      <div style={styles.desc}>{quest.description}</div>

      {done ? (
        <div style={styles.doneText}>✅ 已完成</div>
      ) : result ? (
        <div>
          <div style={styles.result}>{result}</div>
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.5 }}>结算动画即将播放...</div>
        </div>
      ) : (
        <div>
          <textarea
            style={styles.textarea}
            placeholder="输入你的答案..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <div style={styles.btnRow}>
            <button style={styles.btnOutline} onClick={handleStart}>重新开始</button>
            <button style={styles.btn} onClick={handleSubmit}>🚀 AI评分</button>
          </div>
        </div>
      )}
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
  heading: { fontWeight: 'bold', marginBottom: 8 },
  questTitle: { fontWeight: 'bold', fontSize: 15 },
  desc: { fontSize: 13, opacity: 0.7, marginTop: 6 },
  empty: { marginTop: 30, textAlign: 'center', opacity: 0.5, fontSize: 13 },
  textarea: {
    width: '100%', height: 80, marginTop: 10, padding: 8,
    borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(0,0,0,0.2)', color: '#fff',
    resize: 'none', fontSize: 13,
  },
  btnRow: { display: 'flex', gap: 8, marginTop: 10 },
  btn: {
    flex: 1, padding: '10px', borderRadius: 8, border: 'none',
    color: '#fff', cursor: 'pointer',
    background: 'linear-gradient(90deg,#7c3aed,#4f46e5)',
    boxShadow: '0 0 16px rgba(124,58,237,0.3)',
    fontSize: 13,
  },
  btnOutline: {
    padding: '10px 16px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'transparent', color: '#fff', cursor: 'pointer',
    fontSize: 13,
  },
  result: {
    marginTop: 10, padding: 10,
    background: 'rgba(16,185,129,0.15)', borderRadius: 8,
    fontSize: 14,
  },
  doneText: { marginTop: 12, color: '#34d399', fontWeight: 'bold' },
};
