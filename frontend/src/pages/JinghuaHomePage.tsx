import React, { useState, useEffect } from 'react';
import { GraduationCap, Sparkles, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StarryBackground from '../components/StarryBackground';

// 宣言文字
const HERO_DECLARATION_LINES = [
  '文明真正的方向',
  '从来不只是更强大的技术',
  '而是',
  '更自由的思想',
  '更丰富的灵魂',
  '更广阔的人类可能性',
];

// 入口卡片数据
const ENTRY_CARDS = [
  { 
    id: 'mentors', 
    emoji: '🎓', 
    title: '核心导师', 
    subtitle: '5位AI数字人格导师',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
  },
  { 
    id: 'labs', 
    emoji: '🔬', 
    title: '实验室', 
    subtitle: '6大前沿研究方向',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)'
  },
  { 
    id: 'library', 
    emoji: '📚', 
    title: 'AI图书馆', 
    subtitle: '智能学术资源库',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
  },
];

const JinghuaHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [heroVisibleLines, setHeroVisibleLines] = useState(0);
  const [heroFadingOut, setHeroFadingOut] = useState(false);

  // 宣言逐行淡入
  useEffect(() => {
    if (heroVisibleLines < HERO_DECLARATION_LINES.length) {
      const timer = setTimeout(() => setHeroVisibleLines(v => v + 1), 1200);
      return () => clearTimeout(timer);
    }
    const pauseTimer = setTimeout(() => setHeroFadingOut(true), 3000);
    return () => clearTimeout(pauseTimer);
  }, [heroVisibleLines, heroFadingOut]);

  useEffect(() => {
    if (heroFadingOut) {
      const timer = setTimeout(() => {
        setHeroVisibleLines(0);
        setHeroFadingOut(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [heroFadingOut]);

  const handleCardClick = (cardId: string) => {
    navigate(`/jinghua/${cardId}`);
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: '#0a0a1a' }}>
      <StarryBackground />
      
      {/* 内容层 */}
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Hero Section - 顶部 */}
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px 40px', textAlign: 'center' }}>
          {/* 标签 */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '8px 16px', 
            borderRadius: '999px', 
            background: 'rgba(245, 158, 11, 0.2)', 
            border: '1px solid rgba(245, 158, 11, 0.3)',
            marginBottom: '24px'
          }}>
            <GraduationCap style={{ width: 16, height: 16, color: '#fbbf24' }} />
            <span style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 500 }}>面向未来文明的灯塔</span>
          </div>
          
          {/* 主标题 */}
          <h1 style={{ fontSize: 'clamp(36px, 8vw, 64px)', fontWeight: 'bold', color: 'white', marginBottom: '16px', letterSpacing: '0.05em' }}>
            菁华大学
          </h1>
          <p style={{ fontSize: 'clamp(16px, 4vw, 24px)', color: 'rgba(255,255,255,0.7)', marginBottom: '24px', letterSpacing: '0.3em' }}>
            JINGHUA UNIVERSITY
          </p>
          
          {/* 宣言动画 */}
          <div style={{ maxWidth: '600px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: '32px' }}>
            {HERO_DECLARATION_LINES.map((line, i) => (
              <p
                key={i}
                style={{
                  opacity: i < heroVisibleLines ? (heroFadingOut ? 0 : 1) : 0,
                  transform: i < heroVisibleLines && !heroFadingOut ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'opacity 1s, transform 1s',
                  minHeight: '1.5em',
                  margin: 0,
                }}
              >
                {line}
              </p>
            ))}
          </div>
          
          {/* 分隔线 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
            <div style={{ width: '64px', height: '1px', background: 'linear-gradient(to right, transparent, rgba(245, 158, 11, 0.5))' }} />
            <Sparkles style={{ width: 20, height: 20, color: 'rgba(245, 158, 11, 0.5)' }} />
            <div style={{ width: '64px', height: '1px', background: 'linear-gradient(to left, transparent, rgba(245, 158, 11, 0.5))' }} />
          </div>
        </section>

        {/* 入口卡片 - 底部 */}
        <section style={{ padding: '0 20px 60px' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {ENTRY_CARDS.map((card) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '20px 24px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.boxShadow = `0 0 30px ${card.color}33`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* 图标 */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: card.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  marginRight: '16px',
                  boxShadow: `0 4px 20px ${card.color}40`
                }}>
                  {card.emoji}
                </div>
                
                {/* 文字 */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{card.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '4px 0 0' }}>{card.subtitle}</p>
                </div>
                
                {/* 箭头 */}
                <ChevronRight style={{ width: 24, height: 24, color: 'rgba(255,255,255,0.3)' }} />
              </div>
            ))}
          </div>
        </section>
        
      </div>
    </div>
  );
};

export default JinghuaHomePage;
