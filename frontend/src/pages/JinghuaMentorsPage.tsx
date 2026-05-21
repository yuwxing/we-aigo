import React from 'react';
import { ArrowLeft, Users, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StarryBackground from '../components/StarryBackground';

// 5位导师数据
const MENTORS = [
  { 
    id: 'mentor-math', 
    name: '陈景元教授', 
    avatar: '/mentors/math.jpg', 
    specialty: '拓扑学与AI推理', 
    personality: '严谨精确',
    stage: '选题设计',
    color: '#3b82f6',
    teachingStyle: '苏格拉底式追问'
  },
  { 
    id: 'mentor-research', 
    name: '林纳德博士', 
    avatar: '/mentors/research.jpg', 
    specialty: '跨学科研究方法论', 
    personality: '温和鼓励',
    stage: '文献综述',
    color: '#10b981',
    teachingStyle: '项目驱动指导'
  },
  { 
    id: 'mentor-paper', 
    name: '张维真教授', 
    avatar: '/mentors/paper.jpg', 
    specialty: '学术写作与传播', 
    personality: '犀利直接',
    stage: '论文写作',
    color: '#f59e0b',
    teachingStyle: '批改式打磨'
  },
  { 
    id: 'mentor-startup', 
    name: '马云飞导师', 
    avatar: '/mentors/startup.jpg', 
    specialty: '科技创业与商业化', 
    personality: '果断务实',
    stage: '投稿发表',
    color: '#f43f5e',
    teachingStyle: '实战模拟'
  },
  { 
    id: 'mentor-philosophy', 
    name: '何怀宏教授', 
    avatar: '/mentors/philosophy.jpg', 
    specialty: 'AI伦理与学术规范', 
    personality: '深邃开放',
    stage: '学术规范',
    color: '#8b5cf6',
    teachingStyle: '对话式追问'
  }
];

const JinghuaMentorsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleMentorClick = (mentorId: string) => {
    navigate(`/jinghua/chat?mentor=${mentorId}`);
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
            <Users style={{ width: 20, height: 20, color: '#fbbf24' }} />
            <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>核心导师</h1>
          </div>
        </div>

        {/* 介绍文字 */}
        <div style={{ textAlign: 'center', padding: '24px 20px 16px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>
            点击卡片，与心仪的AI导师开始对话
          </p>
        </div>

        {/* 导师卡片网格 */}
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', maxWidth: '600px', margin: '0 auto' }}>
          {MENTORS.map((mentor) => (
            <div
              key={mentor.id}
              onClick={() => handleMentorClick(mentor.id)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {/* 头像 */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                overflow: 'hidden',
                margin: '0 auto 12px',
                border: `2px solid ${mentor.color}50`
              }}>
                <img 
                  src={mentor.avatar} 
                  alt={mentor.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              
              {/* 姓名 */}
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', margin: '0 0 4px' }}>
                {mentor.name}
              </h3>
              
              {/* 专长 */}
              <p style={{ color: mentor.color, fontSize: '12px', textAlign: 'center', margin: '0 0 8px' }}>
                {mentor.specialty}
              </p>
              
              {/* 标签 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '11px'
                }}>
                  {mentor.personality}
                </span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: `${mentor.color}20`,
                  color: mentor.color,
                  fontSize: '11px'
                }}>
                  {mentor.stage}
                </span>
              </div>
              
              {/* 开始对话按钮 */}
              <div style={{
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '8px',
                borderRadius: '10px',
                background: `${mentor.color}15`,
                color: mentor.color,
                fontSize: '12px',
                fontWeight: 500
              }}>
                <MessageCircle style={{ width: 14, height: 14 }} />
                开始对话
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default JinghuaMentorsPage;
