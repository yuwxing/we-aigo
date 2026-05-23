import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function TaskDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const task = location.state;
  const [step, setStep] = useState(1);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (submitted || !answer) return;
    setSubmitted(true);
  };

  if (!task) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>❌ 没有任务数据</div>
        <button style={styles.btn} onClick={() => navigate("/tasks")}>返回火星基地</button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {submitted && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.4)',
          transition: 'opacity 0.3s',
        }} />
      )}

      <div style={styles.header}>
        <div style={styles.title}>🚀 任务执行器</div>
        <div style={styles.sub}>{task.zone}</div>
      </div>

      <div style={styles.card}>
        <h2>{task.title}</h2>
        <p>{task.description}</p>
        <p>⚡ XP：{task.xp}</p>
      </div>

      <div style={styles.card}>
        <h3>📡 学习步骤</h3>
        <div style={styles.steps}>
          <div style={step >= 1 ? styles.active : styles.step}>理解</div>
          <div style={step >= 2 ? styles.active : styles.step}>练习</div>
          <div style={step >= 3 ? styles.active : styles.step}>作答</div>
        </div>
        <button
          style={styles.btn}
          onClick={() => setStep(s => s + 1)}
          disabled={submitted}
        >
          下一步
        </button>
      </div>

      {step >= 3 && (
        <div style={styles.card}>
          <textarea
            style={styles.textarea}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            disabled={submitted}
          />
          <button
            style={submitted ? { ...styles.btn, pointerEvents: 'none', opacity: 0.5 } : styles.btn}
            onClick={handleSubmit}
            disabled={submitted}
          >
            结算中...
          </button>
        </div>
      )}

      <button style={styles.back} onClick={() => navigate("/tasks")}>
        ← 返回火星基地
      </button>
    </div>
  );
}

const styles: Record<string, any> = {
  page: {
    minHeight: "100vh", color: "#fff", fontFamily: "Inter, PingFang SC",
    background: "linear-gradient(135deg,#120a2a,#2a1458,#1a0b2e)",
    padding: "20px", position: "relative",
  },
  header: { textAlign: "center", marginBottom: "20px" },
  title: { fontSize: "28px", fontWeight: "bold" },
  sub: { opacity: 0.7 },
  card: {
    background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "15px", borderRadius: "12px", marginBottom: "15px",
  },
  steps: { display: "flex", gap: "10px" },
  step: { padding: "5px 10px", background: "#222", borderRadius: "6px" },
  active: { padding: "5px 10px", background: "#7c3aed", borderRadius: "6px" },
  textarea: { width: "100%", height: "100px", marginTop: "10px" },
  btn: {
    marginTop: "10px", width: "100%", padding: "10px", borderRadius: "10px",
    border: "none", color: "#fff",
    background: "linear-gradient(90deg,#7c3aed,#4f46e5)",
    boxShadow: "0 0 20px rgba(124,58,237,0.4)", cursor: "pointer",
  },
  back: {
    marginTop: "20px", width: "100%", padding: "10px", borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent", color: "#fff", cursor: "pointer",
  },
};
