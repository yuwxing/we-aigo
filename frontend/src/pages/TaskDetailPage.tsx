import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function TaskDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const task = location.state;

  const [step, setStep] = useState(1);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState("");

  if (!task) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>❌ 没有任务数据</div>
        <button style={styles.btn} onClick={() => navigate("/tasks")}>
          返回火星基地
        </button>
      </div>
    );
  }

  const aiContent = `
🧠 AI讲解（火星基地）

任务：${task.title}
区域：${task.zone}

学习目标：
${task.description}

学习路径：
1️⃣ 理解核心概念
2️⃣ 阅读示例
3️⃣ 完成练习
4️⃣ AI检查理解

提示：
先理解结构，再做题。
`;

  const handleSubmit = () => {
    if (!answer) {
      setResult("❌ 请先输入答案");
      return;
    }

    const score = Math.floor(Math.random() * 30) + 70;

    setResult(
      `🎉 完成任务！\n评分：${score}/100\nXP +${task.xp}`
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.glow}></div>

      <div style={styles.header}>
        <div style={styles.title}>🚀 任务执行器</div>
        <div style={styles.sub}>{task.zone}</div>
      </div>

      <div style={styles.card}>
        <h2>{task.title}</h2>
        <p>{task.description}</p>
        <p>⚡ XP：{task.xp}</p>
      </div>

      <div style={styles.aiBox}>
        <h3>🤖 AI讲解</h3>
        <pre style={styles.pre}>{aiContent}</pre>
      </div>

      <div style={styles.card}>
        <h3>📡 学习步骤</h3>

        <div style={styles.steps}>
          <div style={step >= 1 ? styles.active : styles.step}>理解</div>
          <div style={step >= 2 ? styles.active : styles.step}>练习</div>
          <div style={step >= 3 ? styles.active : styles.step}>作答</div>
        </div>

        <button style={styles.btn} onClick={() => setStep(step + 1)}>
          下一步
        </button>
      </div>

      {step >= 3 && (
        <div style={styles.card}>
          <textarea
            style={styles.textarea}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          <button style={styles.btn} onClick={handleSubmit}>
            🚀 AI评分
          </button>

          {result && <pre>{result}</pre>}
        </div>
      )}

      <button
        style={styles.back}
        onClick={() => navigate("/tasks")}
      >
        ← 返回火星基地
      </button>
    </div>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    color: "#fff",
    fontFamily: "Inter, PingFang SC",
    background:
      "linear-gradient(135deg,#120a2a,#2a1458,#1a0b2e)",
    backgroundSize: "300% 300%",
    animation: "bgFlow 12s ease infinite",
    padding: "20px",
    position: "relative",
  },

  glow: {
    position: "absolute",
    width: "500px",
    height: "500px",
    top: "-150px",
    right: "-150px",
    background: "rgba(168,85,247,0.25)",
    filter: "blur(100px)",
    borderRadius: "50%",
  },

  header: { textAlign: "center", marginBottom: "20px" },
  title: { fontSize: "28px", fontWeight: "bold" },
  sub: { opacity: 0.7 },

  card: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "15px",
    borderRadius: "12px",
    marginBottom: "15px",
  },

  aiBox: {
    background: "rgba(124,58,237,0.12)",
    padding: "15px",
    borderRadius: "12px",
    marginBottom: "15px",
  },

  pre: { whiteSpace: "pre-wrap", fontSize: "13px" },

  steps: { display: "flex", gap: "10px" },

  step: {
    padding: "5px 10px",
    background: "#222",
    borderRadius: "6px",
  },

  active: {
    padding: "5px 10px",
    background: "#7c3aed",
    borderRadius: "6px",
  },

  textarea: {
    width: "100%",
    height: "100px",
    marginTop: "10px",
  },

  btn: {
    marginTop: "10px",
    width: "100%",
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    color: "#fff",
    background: "linear-gradient(90deg,#7c3aed,#4f46e5)",
    boxShadow: "0 0 20px rgba(124,58,237,0.4)",
  },

  back: {
    marginTop: "20px",
    width: "100%",
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "#fff",
  },
};