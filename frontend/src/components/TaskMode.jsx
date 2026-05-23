import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../store/gameStore';

export default function TaskMode() {
  const { state, addAiMessage, completeQuest, setScreen } = useGame();
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState('dialogue'); // dialogue | answering | done
  const chatEnd = useRef(null);

  const quest = state.quests.find((q) => q.id === state.currentQuestId);
  const zone = state.zones.find((z) => z.id === quest?.zoneId);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.aiMessages]);

  const handleReply = () => {
    addAiMessage({ role: 'user', text: answer });
    setAnswer('');

    setTimeout(() => {
      addAiMessage({ role: 'ai', text: '正在分析你的回答...' });

      setTimeout(() => {
        addAiMessage({ role: 'ai', text: '评估完成！准备结算奖励...' });

        setTimeout(() => {
          setPhase('done');

          const reward = {
            wegAmount: quest.xp,
            skills: [
              { label: '听说能力', from: 0.38, to: 0.42 },
              { label: '语法能力', from: 0.32, to: 0.36 },
              { label: '阅读能力', from: 0.40, to: 0.43 },
            ],
            unlockText: zone?.id === 'english' ? '语法实验室' : '写作舱',
          };

          setTimeout(() => {
            completeQuest(quest.id, reward);
          }, 800);
        }, 1200);
      }, 1000);
    }, 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (phase === 'dialogue' && answer.trim()) handleReply();
    }
  };

  const handleStartAnswer = () => {
    addAiMessage({ role: 'ai', text: '请开始你的回答。' });
    setPhase('answering');
  };

  return (
    <div style={styles.container}>
      <div style={styles.chat}>
        {state.aiMessages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.msg,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}
          >
            <div style={{
              ...styles.bubble,
              background: msg.role === 'user'
                ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
                : 'rgba(255,255,255,0.08)',
              borderBottomRightRadius: msg.role === 'user' ? 4 : 12,
              borderBottomLeftRadius: msg.role === 'ai' ? 4 : 12,
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEnd} />
      </div>

      <div style={styles.inputBar}>
        {phase === 'dialogue' && (
          <>
            <textarea
              style={styles.input}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的回答..."
            />
            <div style={styles.btnRow}>
              <button
                style={styles.btnOutline}
                onClick={() => setScreen('lobby')}
              >
                ← 退出
              </button>
              <button
                style={styles.btn}
                onClick={handleStartAnswer}
                disabled={!answer.trim()}
              >
                提交回答 🚀
              </button>
            </div>
          </>
        )}
        {phase === 'answering' && (
          <>
            <textarea
              style={styles.input}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="详细回答..."
              autoFocus
            />
            <div style={styles.btnRow}>
              <button
                style={styles.btn}
                onClick={handleReply}
                disabled={!answer.trim()}
              >
                发送 📨
              </button>
            </div>
          </>
        )}
        {phase === 'done' && (
          <div style={{ textAlign: 'center', padding: 20, opacity: 0.6 }}>
            结算中...
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed', inset: 0, zIndex: 100,
    display: 'flex', flexDirection: 'column',
    background: 'radial-gradient(ellipse at center, #120a2a 0%, #0d061e 100%)',
  },
  chat: {
    flex: 1, overflow: 'auto', padding: 20,
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  msg: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: '12px 16px', borderRadius: 12,
    color: '#fff', fontSize: 14, lineHeight: 1.6,
  },
  inputBar: {
    padding: 16, borderTop: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.3)',
  },
  input: {
    width: '100%', minHeight: 60, padding: 12,
    borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)', color: '#fff',
    fontSize: 14, resize: 'none',
  },
  btnRow: { display: 'flex', gap: 10, marginTop: 10 },
  btn: {
    flex: 1, padding: '12px', borderRadius: 10, border: 'none',
    color: '#fff', fontWeight: 'bold', cursor: 'pointer',
    background: 'linear-gradient(90deg,#7c3aed,#4f46e5)',
    boxShadow: '0 0 16px rgba(124,58,237,0.3)',
    fontSize: 14,
  },
  btnOutline: {
    padding: '12px 20px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'transparent', color: '#fff', cursor: 'pointer',
    fontSize: 14,
  },
};
