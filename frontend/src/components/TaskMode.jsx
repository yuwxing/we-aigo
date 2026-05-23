import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../store/gameStore';

export default function TaskMode() {
  const { state, addAiMessage, completeQuest, setScreen } = useGame();
  const [phase, setPhase] = useState('enter'); // enter | briefing | active | done
  const [answer, setAnswer] = useState('');
  const [enterDone, setEnterDone] = useState(false);
  const chatEnd = useRef(null);

  const quest = state.quests.find((q) => q.id === state.currentQuestId);
  const zone = state.zones.find((z) => z.id === quest?.zoneId);

  // 1️⃣ Entry animation (2s)
  useEffect(() => {
    if (phase !== 'enter') return;
    const t = setTimeout(() => {
      setEnterDone(true);
      const t2 = setTimeout(() => {
        setPhase('briefing');
      }, 400);
      return () => clearTimeout(t2);
    }, 2000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.aiMessages]);

  const handleStartMission = () => {
    setPhase('active');
    addAiMessage({ role: 'ai', text: `任务已启动。${quest.description}` });
    addAiMessage({ role: 'ai', text: '准备好后开始。' });
  };

  const handleSubmit = () => {
    if (!answer.trim()) return;
    addAiMessage({ role: 'user', text: answer });
    setAnswer('');

    setTimeout(() => {
      addAiMessage({ role: 'ai', text: '正在分析...' });
      setTimeout(() => {
        addAiMessage({ role: 'ai', text: '评估完成。准备结算。' });
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
          setTimeout(() => completeQuest(quest.id, reward), 600);
        }, 1000);
      }, 800);
    }, 400);
  };

  // ── 1️⃣ Entry animation ──
  if (phase === 'enter') {
    return (
      <div style={styles.enterContainer}>
        <div style={styles.enterOverlay} />
        <div style={{
          ...styles.enterTitle,
          opacity: enterDone ? 1 : 0,
          transform: enterDone ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease-out',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', letterSpacing: 4 }}>
            {quest?.title || '任务加载中'}
          </div>
          <div style={{ fontSize: 14, opacity: 0.5, marginTop: 10 }}>
            正在进入任务区域...
          </div>
        </div>
      </div>
    );
  }

  // ── 2️⃣ Briefing ──
  if (phase === 'briefing') {
    return (
      <div style={{
        ...styles.page,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: 30,
      }}>
        <div style={styles.glow} />

        <div style={styles.briefCard}>
          <div style={styles.zoneBadge}>{zone?.icon} {zone?.label}</div>
          <div style={styles.story}>{quest?.story}</div>
        </div>

        <div style={styles.briefCard}>
          <div style={styles.objective}>{quest?.objectives}</div>
        </div>

        <button style={styles.launchBtn} onClick={handleStartMission}>
          开始执行 🚀
        </button>
      </div>
    );
  }

  // ── 3️⃣ Active ──
  return (
    <div style={styles.page}>
      {phase === 'done' && (
        <div style={styles.doneBar}>
          结算中...
        </div>
      )}

      <div style={styles.chatHeader}>
        🤖 AI 指挥官 · {quest?.title}
      </div>

      <div style={styles.chat}>
        {state.aiMessages.map((msg, i) => (
          <div key={i} style={{
            ...styles.msgRow,
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              ...styles.bubble,
              background: msg.role === 'user'
                ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
                : 'rgba(255,255,255,0.07)',
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
        <textarea
          style={styles.input}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="输入你的回答..."
          disabled={phase === 'done'}
        />
        <button
          style={styles.sendBtn}
          onClick={handleSubmit}
          disabled={phase === 'done' || !answer.trim()}
        >
          发送 📨
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'radial-gradient(ellipse at center, #120a2a 0%, #0d061e 100%)',
    color: '#fff', fontFamily: 'Inter, PingFang SC',
  },
  glow: {
    position: 'absolute', width: 400, height: 400,
    top: '20%', left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(124,58,237,0.15)',
    filter: 'blur(100px)', borderRadius: '50%',
  },

  // 1️⃣ Entry
  enterContainer: {
    position: 'fixed', inset: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(ellipse at center, #120a2a 0%, #0d061e 100%)',
  },
  enterOverlay: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.08) 0%, transparent 70%)',
  },
  enterTitle: {
    position: 'relative', zIndex: 1,
    textAlign: 'center', color: '#fff',
  },

  // 2️⃣ Briefing
  briefCard: {
    position: 'relative', zIndex: 1,
    maxWidth: 520, width: '100%',
    padding: 24, marginBottom: 16,
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    whiteSpace: 'pre-wrap',
    fontSize: 14,
    lineHeight: 1.8,
  },
  zoneBadge: {
    marginBottom: 12, fontWeight: 'bold', fontSize: 16,
    color: '#c084fc',
  },
  story: { opacity: 0.85 },
  objective: { opacity: 0.85 },
  launchBtn: {
    position: 'relative', zIndex: 1,
    marginTop: 8, padding: '14px 48px',
    borderRadius: 12, border: 'none',
    color: '#fff', fontWeight: 'bold', fontSize: 16,
    background: 'linear-gradient(90deg,#7c3aed,#4f46e5)',
    boxShadow: '0 0 30px rgba(124,58,237,0.4)',
    cursor: 'pointer',
  },

  // 3️⃣ Active
  chatHeader: {
    padding: '14px 20px', fontSize: 14, fontWeight: 'bold',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.2)',
  },
  chat: {
    flex: 1, overflow: 'auto', padding: 20,
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  msgRow: { display: 'flex', maxWidth: '80%' },
  bubble: {
    padding: '12px 16px', borderRadius: 12,
    color: '#fff', fontSize: 14, lineHeight: 1.6,
  },
  inputBar: {
    display: 'flex', gap: 10,
    padding: 16, borderTop: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.3)',
  },
  input: {
    flex: 1, minHeight: 44, padding: '10px 14px',
    borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)', color: '#fff',
    fontSize: 14, resize: 'none',
  },
  sendBtn: {
    padding: '10px 20px', borderRadius: 10, border: 'none',
    color: '#fff', fontWeight: 'bold', cursor: 'pointer',
    background: 'linear-gradient(90deg,#7c3aed,#4f46e5)',
    fontSize: 13,
  },
  doneBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    textAlign: 'center', padding: 10,
    background: 'rgba(16,185,129,0.2)',
    fontSize: 13, color: '#34d399',
  },
};
