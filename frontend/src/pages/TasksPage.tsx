import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TasksPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<any>(null);

  const user = {
    level: 6,
    xp: 320,
    title: "语言探索者",
  };

  const quests = [
    {
      id: 1,
      title: "英语阅读主线任务",
      type: "MAIN QUEST",
      zone: "🔴 英语核心区",
      xp: 50,
      description: "提升英语阅读理解能力",
    },
    {
      id: 2,
      title: "语法强化支线任务",
      type: "SIDE QUEST",
      zone: "🟠 语法实验室",
      xp: 30,
      description: "掌握英语语法结构",
    },
    {
      id: 3,
      title: "听力挑战任务",
      type: "DAILY QUEST",
      zone: "🔵 听力站",
      xp: 40,
      description: "训练英语听力理解",
    },
    {
      id: 4,
      title: "写作进化任务",
      type: "SIDE QUEST",
      zone: "🟢 写作舱",
      xp: 60,
      description: "提升英语写作能力",
    },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.glow}></div>

      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.title}>🚀 火星基地</div>
        <div style={styles.sub}>AI Learning RPG System</div>
        <div style={styles.user}>
          Lv.{user.level} {user.title} ｜ XP {user.xp}
        </div>
      </div>

      <div style={styles.container}>
        {/* LEFT */}
        <div style={styles.left}>
          <div style={styles.block}>🪐 世界地图</div>
          <div>🔴 英语核心区</div>
          <div>🟠 语法实验室</div>
          <div>🔵 听力站</div>
          <div>🟢 写作舱</div>
        </div>

        {/* CENTER */}
        <div style={styles.center}>
          <div style={styles.block}>🎯 任务系统</div>

          {quests.map((q) => (
            <div
              key={q.id}
              style={styles.card}
              onClick={() => setSelected(q)}
            >
              <div style={styles.type}>{q.type}</div>
              <div style={styles.cardTitle}>{q.title}</div>
              <div style={styles.zone}>{q.zone}</div>
              <div style={styles.meta}>⚡ +{q.xp} XP</div>
            </div>
          ))}
        </div>

        {/* RIGHT */}
        <div style={styles.right}>
          <div style={styles.block}>🤖 AI指挥官</div>

          {selected ? (
            <div>
              <div style={styles.aiTitle}>{selected.title}</div>
              <div style={styles.aiBox}>{selected.description}</div>

              <button
                style={styles.btn}
                onClick={() =>
                  navigate(`/tasks/${selected.id}`, {
                    state: selected,
                  })
                }
              >
                🚀 开始任务
              </button>
            </div>
          ) : (
            <div style={styles.empty}>点击任务启动AI学习</div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    color: "#fff",
    fontFamily: "Inter, PingFang SC, sans-serif",
    background:
      "linear-gradient(135deg,#120a2a,#2a1458,#1a0b2e)",
    backgroundSize: "300% 300%",
    animation: "bgFlow 12s ease infinite",
    overflow: "hidden",
    position: "relative",
  },

  glow: {
    position: "absolute",
    width: "600px",
    height: "600px",
    top: "-200px",
    left: "-200px",
    background: "rgba(168,85,247,0.25)",
    filter: "blur(120px)",
    borderRadius: "50%",
  },

  header: { textAlign: "center", padding: "20px" },
  title: { fontSize: "34px", fontWeight: "bold" },
  sub: { opacity: 0.7 },
  user: { marginTop: "10px", opacity: 0.8 },

  container: {
    display: "flex",
    gap: "12px",
    padding: "10px",
  },

  left: {
    width: "18%",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(10px)",
    padding: "10px",
    borderRadius: "12px",
  },

  center: {
    width: "52%",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(10px)",
    padding: "10px",
    borderRadius: "12px",
  },

  right: {
    width: "30%",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(10px)",
    padding: "10px",
    borderRadius: "12px",
  },

  block: { marginBottom: "10px", fontWeight: "bold" },

  card: {
    padding: "12px",
    marginBottom: "10px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    cursor: "pointer",
  },

  type: { fontSize: "10px", opacity: 0.6 },
  cardTitle: { fontWeight: "bold" },
  zone: { fontSize: "12px", opacity: 0.7 },
  meta: { marginTop: "5px", color: "#c084fc" },

  aiTitle: { fontWeight: "bold" },
  aiBox: { marginTop: "10px", fontSize: "13px", opacity: 0.8 },

  btn: {
    marginTop: "10px",
    width: "100%",
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    color: "#fff",
    background: "linear-gradient(90deg,#7c3aed,#4f46e5)",
    boxShadow: "0 0 20px rgba(124,58,237,0.4)",
    cursor: "pointer",
  },

  empty: { marginTop: "40px", textAlign: "center", opacity: 0.6 },
};