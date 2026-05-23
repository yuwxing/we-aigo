import React from 'react';

const CyberBanner: React.FC = () => {
  return (
    <div style={styles.container}>
      {/* 渐变色天空 */}
      <div style={styles.sky} />

      {/* 星空 */}
      <div style={styles.stars}>
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.star,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              opacity: 0.3 + Math.random() * 0.7,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* 远景建筑 */}
      <div style={styles.bgBuildings}>
        {buildings.map((b, i) => (
          <div
            key={i}
            style={{
              ...styles.building,
              height: `${b.h}px`,
              width: `${b.w}px`,
              left: `${b.left}%`,
              bottom: 0,
              opacity: 0.15 + b.opacity * 0.1,
            }}
          >
            {Array.from({ length: b.windows }).map((_, wi) => (
              <div
                key={wi}
                style={{
                  ...styles.window,
                  left: `${10 + (wi % 3) * 30}%`,
                  top: `${15 + Math.floor(wi / 3) * 22}%`,
                  opacity: Math.random() > 0.3 ? 0.6 + Math.random() * 0.4 : 0.05,
                  background: Math.random() > 0.5 ? '#00d4ff' : '#a78bfa',
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* 中景建筑 */}
      <div style={styles.midBuildings}>
        {midBuildings.map((b, i) => (
          <div
            key={i}
            style={{
              ...styles.building,
              height: `${b.h}px`,
              width: `${b.w}px`,
              left: `${b.left}%`,
              bottom: 0,
              opacity: 0.25 + b.opacity * 0.15,
            }}
          >
            {Array.from({ length: b.windows }).map((_, wi) => (
              <div
                key={wi}
                style={{
                  ...styles.window,
                  left: `${8 + (wi % 4) * 22}%`,
                  top: `${12 + Math.floor(wi / 4) * 18}%`,
                  opacity: Math.random() > 0.25 ? 0.5 + Math.random() * 0.5 : 0.03,
                  background: Math.random() > 0.5 ? '#00d4ff' : '#a78bfa',
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* 发光道路 */}
      <div style={styles.road} />
      <div style={styles.roadLine} />
      <div style={styles.roadGlow} />

      {/* 光轨 */}
      <div style={styles.lightTrail1} />
      <div style={styles.lightTrail2} />

      {/* VR 人物侧影 */}
      <div style={styles.vrPerson}>
        <div style={styles.personHead}>
          <div style={styles.vrHeadset} />
        </div>
        <div style={styles.personBody} />
      </div>

      {/* UI 界面元素 */}
      <div style={styles.uiFrame1} />
      <div style={styles.uiFrame2} />
      <div style={styles.uiLine1} />
      <div style={styles.uiLine2} />
      <div style={styles.uiDot} />

      {/* 镜头光晕 */}
      <div style={styles.lensFlare1} />
      <div style={styles.lensFlare2} />

      {/* 底部渐变遮罩 - 可叠加文字 */}
      <div style={styles.overlay} />
    </div>
  );
};

const buildings = [
  { h: 80, w: 30, left: 2, opacity: 0.6, windows: 9 },
  { h: 55, w: 22, left: 8, opacity: 0.5, windows: 6 },
  { h: 100, w: 28, left: 14, opacity: 0.7, windows: 12 },
  { h: 65, w: 18, left: 20, opacity: 0.4, windows: 6 },
  { h: 120, w: 32, left: 25, opacity: 0.8, windows: 15 },
  { h: 50, w: 20, left: 32, opacity: 0.5, windows: 6 },
  { h: 90, w: 26, left: 38, opacity: 0.6, windows: 9 },
  { h: 70, w: 18, left: 44, opacity: 0.5, windows: 6 },
  { h: 110, w: 30, left: 50, opacity: 0.7, windows: 12 },
  { h: 55, w: 20, left: 56, opacity: 0.4, windows: 6 },
  { h: 130, w: 35, left: 62, opacity: 0.8, windows: 15 },
  { h: 60, w: 22, left: 70, opacity: 0.5, windows: 6 },
  { h: 75, w: 24, left: 76, opacity: 0.6, windows: 9 },
  { h: 95, w: 28, left: 82, opacity: 0.7, windows: 12 },
  { h: 45, w: 16, left: 90, opacity: 0.4, windows: 4 },
];

const midBuildings = [
  { h: 40, w: 40, left: 0, opacity: 0.7, windows: 12 },
  { h: 50, w: 35, left: 10, opacity: 0.8, windows: 16 },
  { h: 35, w: 30, left: 22, opacity: 0.6, windows: 8 },
  { h: 55, w: 38, left: 33, opacity: 0.8, windows: 16 },
  { h: 38, w: 32, left: 45, opacity: 0.6, windows: 8 },
  { h: 48, w: 36, left: 55, opacity: 0.7, windows: 12 },
  { h: 40, w: 28, left: 66, opacity: 0.6, windows: 8 },
  { h: 55, w: 34, left: 75, opacity: 0.8, windows: 16 },
  { h: 30, w: 26, left: 85, opacity: 0.5, windows: 6 },
];

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '240px',
    overflow: 'hidden',
    background: '#070714',
    borderRadius: '16px',
  },
  sky: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, #020024 0%, #0a0a3a 20%, #0f0f4a 40%, #1a0a3a 60%, #0d0d2b 80%, #070714 100%)',
  },
  stars: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  star: {
    position: 'absolute',
    borderRadius: '50%',
    background: '#fff',
    animation: 'glow-pulse 3s ease-in-out infinite',
    boxShadow: '0 0 4px rgba(0, 212, 255, 0.3)',
  },
  bgBuildings: {
    position: 'absolute',
    inset: 0,
  },
  midBuildings: {
    position: 'absolute',
    inset: 0,
  },
  building: {
    position: 'absolute',
    background: 'linear-gradient(180deg, rgba(20, 20, 60, 0.9), rgba(10, 10, 30, 0.95))',
    borderTop: '1px solid rgba(0, 212, 255, 0.08)',
    borderLeft: '1px solid rgba(0, 212, 255, 0.04)',
    borderRight: '1px solid rgba(0, 212, 255, 0.04)',
  },
  window: {
    position: 'absolute',
    width: '4px',
    height: '5px',
    borderRadius: '1px',
    transition: 'opacity 0.5s',
  },
  road: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '22%',
    background: 'linear-gradient(180deg, rgba(10, 10, 30, 0.95) 0%, #0a0a20 40%, #0a0a1a 100%)',
    borderTop: '2px solid rgba(0, 212, 255, 0.1)',
  },
  roadLine: {
    position: 'absolute',
    bottom: '11%',
    left: '5%',
    right: '5%',
    height: '1px',
    background: 'repeating-linear-gradient(90deg, rgba(0, 212, 255, 0.4) 0px, rgba(0, 212, 255, 0.4) 30px, transparent 30px, transparent 50px)',
    boxShadow: '0 0 10px rgba(0, 212, 255, 0.2)',
  },
  roadGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '12%',
    background: 'linear-gradient(90deg, transparent 0%, rgba(0, 212, 255, 0.03) 20%, rgba(124, 58, 237, 0.03) 50%, rgba(0, 212, 255, 0.03) 80%, transparent 100%)',
  },
  lightTrail1: {
    position: 'absolute',
    bottom: '16%',
    left: '-5%',
    width: '40%',
    height: '2px',
    background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), transparent)',
    boxShadow: '0 0 15px rgba(0, 212, 255, 0.15)',
    animation: 'float-gentle 3s ease-in-out infinite',
    transform: 'rotate(-2deg)',
  },
  lightTrail2: {
    position: 'absolute',
    bottom: '8%',
    right: '-5%',
    width: '50%',
    height: '2px',
    background: 'linear-gradient(270deg, transparent, rgba(168, 133, 250, 0.25), transparent)',
    boxShadow: '0 0 15px rgba(168, 133, 250, 0.1)',
    animation: 'float-gentle 4s ease-in-out infinite',
    transform: 'rotate(1deg)',
  },
  vrPerson: {
    position: 'absolute',
    bottom: '20%',
    right: '15%',
    width: '60px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    animation: 'float-gentle 5s ease-in-out infinite',
  },
  personHead: {
    width: '28px',
    height: '32px',
    background: 'linear-gradient(135deg, rgba(20, 20, 60, 0.9), rgba(10, 10, 30, 0.95))',
    borderRadius: '50% 50% 45% 45%',
    position: 'relative',
    border: '1px solid rgba(0, 212, 255, 0.15)',
  },
  vrHeadset: {
    position: 'absolute',
    top: '6px',
    left: '-2px',
    right: '-2px',
    height: '14px',
    background: 'linear-gradient(90deg, rgba(0, 212, 255, 0.15), rgba(124, 58, 237, 0.2), rgba(0, 212, 255, 0.15))',
    borderRadius: '4px',
    boxShadow: '0 0 12px rgba(0, 212, 255, 0.15)',
  },
  personBody: {
    width: '36px',
    height: '50px',
    background: 'linear-gradient(180deg, rgba(15, 15, 50, 0.9), rgba(10, 10, 30, 0.95))',
    borderRadius: '8px 8px 4px 4px',
    marginTop: '-4px',
    border: '1px solid rgba(0, 212, 255, 0.1)',
    borderTop: 'none',
  },
  uiFrame1: {
    position: 'absolute',
    top: '12%',
    right: '5%',
    width: '80px',
    height: '50px',
    border: '1px solid rgba(0, 212, 255, 0.12)',
    borderRadius: '8px',
    background: 'rgba(0, 212, 255, 0.02)',
    boxShadow: '0 0 10px rgba(0, 212, 255, 0.03), inset 0 0 10px rgba(0, 212, 255, 0.02)',
  },
  uiFrame2: {
    position: 'absolute',
    top: '8%',
    right: '20%',
    width: '60px',
    height: '35px',
    border: '1px solid rgba(124, 58, 237, 0.1)',
    borderRadius: '6px',
    background: 'rgba(124, 58, 237, 0.02)',
  },
  uiLine1: {
    position: 'absolute',
    top: '28%',
    right: '5%',
    left: '70%',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.15), transparent)',
  },
  uiLine2: {
    position: 'absolute',
    top: '34%',
    right: '5%',
    left: '75%',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.1), transparent)',
  },
  uiDot: {
    position: 'absolute',
    top: '15%',
    left: '48%',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: '#00d4ff',
    boxShadow: '0 0 8px rgba(0, 212, 255, 0.5)',
    opacity: 0.6,
    animation: 'glow-pulse 2s ease-in-out infinite',
  },
  lensFlare1: {
    position: 'absolute',
    top: '-5%',
    left: '20%',
    width: '200px',
    height: '200px',
    background: 'radial-gradient(circle, rgba(0, 212, 255, 0.04) 0%, transparent 60%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  lensFlare2: {
    position: 'absolute',
    bottom: '10%',
    right: '30%',
    width: '150px',
    height: '150px',
    background: 'radial-gradient(circle, rgba(124, 58, 237, 0.03) 0%, transparent 60%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    background: 'linear-gradient(0deg, rgba(7, 7, 20, 0.6) 0%, transparent 100%)',
    pointerEvents: 'none',
  },
};

export default CyberBanner;
