import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabaseFetch } from '../utils/supabase';
import StarryBackground from '../components/StarryBackground';

interface Agent {
  id: string;
  name: string;
  description: string;
  icon_emoji?: string;
  category?: string;
}

const JinghuaAgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      // 使用已有的 supabaseFetch 工具
      const data = await supabaseFetch('agents?is_public=eq.true&select=*&limit=20');
      if (Array.isArray(data)) {
        setAgents(data);
      } else {
        setAgents([]);
      }
    } catch (error) {
      console.error('加载智能体失败', error);
      // 降级：使用默认数据
      setAgents([
        { id: '1', name: '数学导师', description: '专业的数学辅导助手', icon_emoji: '📐' },
        { id: '2', name: '写作助手', description: '帮助你提升写作能力', icon_emoji: '✍️' },
        { id: '3', name: '编程导师', description: '编程问题解答与指导', icon_emoji: '💻' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentClick = (agent: Agent) => {
    const params = new URLSearchParams({
      agent_name: agent.name || 'AI导师',
      agent_prompt: `你是${agent.name}，一个智能学术助手。${agent.description || '我可以回答各种问题，帮助你解决问题。'}`
    });
    navigate(`/jinghua/chat?${params.toString()}`);
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
            <Bot style={{ width: 20, height: 20, color: '#fbbf24' }} />
            <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>智能体教师分身</h1>
          </div>
        </div>

        {/* 介绍文字 */}
        <div style={{ textAlign: 'center', padding: '24px 20px 16px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>
            点击卡片，与AI教师分身开始对话
          </p>
        </div>

        {/* 加载状态 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid rgba(255,255,255,0.1)', 
              borderTopColor: '#fbbf24', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : agents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>暂无智能体分身</p>
          </div>
        ) : (
          /* 智能体卡片列表 */
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px', margin: '0 auto' }}>
            {agents.map((agent, index) => {
              // 预设颜色
              const colors = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#6366f1'];
              const color = colors[index % colors.length];
              
              return (
                <div
                  key={agent.id}
                  onClick={() => handleAgentClick(agent)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px 20px',
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
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    marginRight: '16px',
                    flexShrink: 0,
                    boxShadow: `0 4px 20px ${color}40`
                  }}>
                    {agent.icon_emoji || '🤖'}
                  </div>
                  
                  {/* 内容 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px' }}>
                      {agent.name}
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0, lineHeight: 1.4 }}>
                      {agent.description}
                    </p>
                  </div>
                  
                  {/* 箭头 */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: `${color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '12px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default JinghuaAgentsPage;
