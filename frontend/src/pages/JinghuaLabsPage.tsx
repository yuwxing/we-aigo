import React from 'react';
import { ArrowLeft, FlaskConical, Cpu, Globe, Microscope, Lightbulb, MessageCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StarryBackground from '../components/StarryBackground';

// 6个实验室数据
const LABS = [
  { 
    id: 'ai-engineering', 
    name: 'AI协同文明工程', 
    topics: ['AI编程', '系统设计', '文明模拟'], 
    icon: Cpu, 
    color: '#3b82f6', 
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    desc: '探索AI与人类文明的协同进化'
  },
  { 
    id: 'global-communication', 
    name: '全球AI传播', 
    topics: ['多语言内容生成', '跨文化传播'], 
    icon: Globe, 
    color: '#10b981', 
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    desc: '用AI打破语言与文化的边界'
  },
  { 
    id: 'digital-life', 
    name: '数字生命系统', 
    topics: ['生物数据AI分析', '数字孪生模拟'], 
    icon: Microscope, 
    color: '#f59e0b', 
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    desc: '数据驱动的生命科学新范式'
  },
  { 
    id: 'human-ai-education', 
    name: '人机共生教育', 
    topics: ['自适应学习设计', '教育AI评测'], 
    icon: Lightbulb, 
    color: '#f43f5e', 
    gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
    desc: 'AI赋能个性化教育'
  },
  { 
    id: 'ai-narrative', 
    name: 'AI叙事工程', 
    topics: ['AI辅助新闻写作', '叙事策略'], 
    icon: MessageCircle, 
    color: '#8b5cf6', 
    gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    desc: 'AI时代的叙事革命'
  },
  { 
    id: 'multi-agent', 
    name: '多智能体组织学', 
    topics: ['多Agent协作', '组织优化'], 
    icon: Users, 
    color: '#6366f1', 
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    desc: '多智能体协作的未来组织形态'
  }
];

const JinghuaLabsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLabClick = (labId: string) => {
    navigate(`/jinghua/chat?lab=${labId}`);
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: '#0a0a1a' }}>
      <StarryBackground />
      
      {/* 内容层 */}
      <div style={{ position: 'relative', zIndex: 10, paddingBottom: '40px' }}>
        
        {/* 顶部导航 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '16px 20px', 
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button 
            onClick={() => navigate('/jinghua')}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginRight: '12px'
            }}
          >
            <ArrowLeft style={{ width: 20, height: 20, color: 'white' }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FlaskConical style={{ width: 20, height: 20, color: '#fbbf24' }} />
            <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>实验室</h1>
          </div>
        </div>

        {/* 介绍文字 */}
        <div style={{ textAlign: 'center', padding: '24px 20px 16px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>
            点击卡片，进入对应的研究领域开始探索
          </p>
        </div>

        {/* 实验室卡片列表 */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px', margin: '0 auto' }}>
          {LABS.map((lab) => {
            const Icon = lab.icon;
            return (
              <div
                key={lab.id}
                onClick={() => handleLabClick(lab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '20px',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                {/* 图标 */}
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: lab.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  flexShrink: 0,
                  boxShadow: `0 4px 20px ${lab.color}40`
                }}>
                  <Icon style={{ width: 28, height: 28, color: 'white' }} />
                </div>
                
                {/* 内容 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ color: 'white', fontSize: '17px', fontWeight: 'bold', margin: '0 0 4px' }}>
                    {lab.name}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '0 0 10px', lineHeight: 1.4 }}>
                    {lab.desc}
                  </p>
                  
                  {/* 研究方向标签 */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {lab.topics.map((topic, idx) => (
                      <span 
                        key={idx}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          background: `${lab.color}20`,
                          color: lab.color,
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default JinghuaLabsPage;
