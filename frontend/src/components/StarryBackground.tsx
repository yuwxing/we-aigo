import React from 'react';

// 星空动画背景组件
const StarryBackground: React.FC = () => (
  <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0f0f2f 100%)' }} />
    {[...Array(100)].map((_, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${1 + Math.random() * 2}px`,
          height: `${1 + Math.random() * 2}px`,
          borderRadius: '50%',
          background: 'white',
          opacity: 0.3 + Math.random() * 0.7,
          animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 3}s`
        }}
      />
    ))}
    <style>{`
      @keyframes twinkle {
        0%, 100% { opacity: 0.2; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
      }
    `}</style>
  </div>
);

export default StarryBackground;
