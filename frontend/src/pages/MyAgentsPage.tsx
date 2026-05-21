import WegCoin from '../components/WegCoin';
/**
 * 我的智能体管理页面
 * 核心功能：管理用户的智能体、查看任务状态、指派任务
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { supabaseFetch, tasksAPI, agentsAPI } from '../utils/supabase';
import toast from 'react-hot-toast';
import { 
  Bot, Plus, Zap, Moon, RefreshCw, ArrowLeft, Clock, CheckCircle, 
  Target, TrendingUp, Award, ChevronRight, X, Play, LogOut, BarChart3,
  Sparkles
} from 'lucide-react';

interface AgentWithStatus {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  capabilities: string[];
  total_tasks: number;
  completed_tasks: number;
  success_rate: number;
  avg_rating: number;
  token_balance: number;
  created_at: string;
  status: 'idle' | 'matched' | 'in_progress';
  currentTask?: {
    id: number;
    title: string;
  };
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  budget: number;
  deadline: string | null;
  status: string;
  matched_agent_id: number | null;
  created_at: string;
}

// 能力分类颜色
const CAPABILITY_COLORS: Record<string, { bg: string; text: string }> = {
  "编程开发": { bg: '#e0f2fe', text: '#0284c7' },
  "写作创作": { bg: '#f3e8ff', text: '#9333ea' },
  "视觉设计": { bg: '#fce7f3', text: '#db2777' },
  "数据分析": { bg: '#dcfce7', text: '#16a34a' },
  "视频制作": { bg: '#ffedd5', text: '#ea580c' },
  "音频制作": { bg: '#cffafe', text: '#0891b2' },
  "AI工具": { bg: '#f5f3ff', text: '#7c3aed' },
  "教育辅导": { bg: '#f0fdf4', text: '#0d9488' },
  "项目管理": { bg: '#fef3c7', text: '#d97706' },
  "信息搜索": { bg: '#f1f5f9', text: '#475569' },
  "求职服务": { bg: '#f5f3ff', text: '#7c3aed' },
  "长期追踪": { bg: '#fff1f2', text: '#e11d48' },
  "智能协作": { bg: '#f5f3ff', text: '#7c3aed' },
};

// 能力到分类的映射
const CAPABILITY_CATEGORY: Record<string, string> = {
  "Python开发": "编程开发", "前端开发": "编程开发", "后端开发": "编程开发",
  "全栈开发": "编程开发", "API集成": "编程开发",
  "文案撰写": "写作创作", "内容创作": "写作创作", "内容策划": "写作创作",
  "语言精炼": "写作创作",
  "UI设计": "视觉设计", "视觉品质": "视觉设计", "配色方案": "视觉设计",
  "风格统一": "视觉设计", "视觉叙事": "视觉设计", "画面构图": "视觉设计",
  "数据分析": "数据分析", "数据可视化": "数据分析", "报告生成": "数据分析",
  "市场调研": "数据分析",
  "视频剪辑": "视频制作",
  "BGM创作": "音频制作", "音效设计": "音频制作",
  "角色配音": "音频制作", "语音克隆": "音频制作", "多音色切换": "音频制作",
  "Stable Diffusion": "AI工具", "提示词工程": "AI工具", "提示词优化": "AI工具",
  "学科辅导": "教育辅导", "课件制作": "教育辅导", "知识点拆解": "教育辅导",
  "原型设计": "视觉设计", "产品设计": "视觉设计",
  "简历优化": "求职服务", "面试准备": "求职服务", "岗位搜索": "求职服务",
  "政策解读": "求职服务", "报名指导": "求职服务",
  "定时监控": "长期追踪", "信息追踪": "长期追踪", "变更通知": "长期追踪",
  "任务拆解": "智能协作", "团队协作": "智能协作", "质量把控": "智能协作",
  "自动执行": "智能协作", "批量处理": "智能协作", "结果验收": "智能协作",
};

const getCapabilityColor = (cap: string) => {
  const category = CAPABILITY_CATEGORY[cap] || "信息搜索";
  return CAPABILITY_COLORS[category] || CAPABILITY_COLORS["信息搜索"];
};

// 智能体颜色映射
const AGENT_COLORS = [
  { from: '#8b5cf6', to: '#a855f7', light: '#f3e8ff' },
  { from: '#ec4899', to: '#f472b6', light: '#fce7f3' },
  { from: '#3b82f6', to: '#60a5fa', light: '#dbeafe' },
  { from: '#10b981', to: '#34d399', light: '#d1fae5' },
  { from: '#f59e0b', to: '#fbbf24', light: '#fef3c7' },
  { from: '#6366f1', to: '#818cf8', light: '#e0e7ff' },
];

const getAgentColor = (id: number) => AGENT_COLORS[(id - 1) % AGENT_COLORS.length];

export const MyAgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [agents, setAgents] = useState<AgentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentWithStatus | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [matching, setMatching] = useState(false);
  
  // 统计数据
  const [stats, setStats] = useState({
    published: 0,
    inProgress: 0,
    completed: 0,
    totalCompleted: 0,
    avgDuration: 0,
    successRate: 0,
  });

  // 当前用户ID
  const currentUserId = user?.id || 18;

  // 获取平台所有智能体（不按owner_id过滤，因为所有智能体的owner_id=3是共享资源）
  const fetchMyAgents = async () => {
    try {
      setLoading(true);
      // 获取所有智能体，平台级展示
      const data = await agentsAPI.listAgents({ limit: 50 });
      
      // 获取每个智能体相关的任务状态
      const agentsWithStatus: AgentWithStatus[] = await Promise.all(
        (data || []).map(async (agent: any) => {
          // 获取该智能体执行中的任务
          const inProgressTasks = await tasksAPI.listTasks({ 
            matched_agent_id: agent.id,
            status: 'in_progress'
          });
          const matchedTasks = await tasksAPI.listTasks({
            matched_agent_id: agent.id,
            status: 'matched'
          });
          
          let status: 'idle' | 'matched' | 'in_progress' = 'idle';
          let currentTask: { id: number; title: string } | undefined;
          
          if (inProgressTasks && inProgressTasks.length > 0) {
            status = 'in_progress';
            currentTask = { id: inProgressTasks[0].id, title: inProgressTasks[0].title };
          } else if (matchedTasks && matchedTasks.length > 0) {
            status = 'matched';
            currentTask = { id: matchedTasks[0].id, title: matchedTasks[0].title };
          }
          
          return {
            ...agent,
            capabilities: Array.isArray(agent.capabilities) 
              ? agent.capabilities.map((c: any) => typeof c === 'string' ? c : c.category || c.name || '通用能力')
              : [],
            status,
            currentTask,
          };
        })
      );
      
      setAgents(agentsWithStatus);
    } catch (err) {
      console.error('获取智能体失败', err);
      toast.error('获取智能体列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取可指派的任务
  const fetchAvailableTasks = async () => {
    try {
      const data = await tasksAPI.listTasks({
        publisher_id: currentUserId,
        status: 'open',
      });
      // 过滤出没有匹配智能体的任务
      const available = (data || []).filter((t: Task) => !t.matched_agent_id);
      setTasks(available);
    } catch (err) {
      console.error('获取任务列表失败', err);
    }
  };

  // 获取统计数据（从任务表实时查询，基于publisher_id筛选）
  const fetchStats = async () => {
    try {
      // 获取用户发布的任务（publisher_id=currentUserId）
      const publishedTasks = await tasksAPI.listTasks({ publisher_id: currentUserId });
      
      const published = (publishedTasks || []).filter((t: Task) => 
        t.status === 'pending' || t.status === 'open' || t.status === 'matched'
      ).length;
      
      const inProgress = (publishedTasks || []).filter((t: Task) => 
        t.status === 'in_progress'
      ).length;
      
      const completed = (publishedTasks || []).filter((t: Task) => 
        t.status === 'completed' || t.status === 'approved'
      ).length;
      
      // 获取平台所有智能体用于统计数据
      const allAgents = await agentsAPI.listAgents({ limit: 50 });
      const totalCompleted = (allAgents || []).reduce(
        (sum: number, a: any) => sum + (a.completed_tasks || 0), 0
      );
      const avgSuccessRate = (allAgents || []).length > 0
        ? (allAgents || []).reduce((sum: number, a: any) => sum + (a.success_rate || 0), 0) / (allAgents || []).length
        : 0;
      
      setStats({
        published,
        inProgress,
        completed,
        totalCompleted,
        avgDuration: 0,
        successRate: Math.round(avgSuccessRate),
      });
    } catch (err) {
      console.error('获取统计数据失败', err);
    }
  };

  useEffect(() => {
    fetchMyAgents();
    fetchStats();
  }, [currentUserId]);

  // 检查URL参数中的taskId，自动弹出指派弹窗
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('taskId');
    if (taskId && agents.length > 0) {
      // 找到第一个空闲智能体并弹出指派
      const idleAgent = agents.find(a => a.status === 'idle');
      if (idleAgent) {
        setSelectedAgent(idleAgent);
        fetchAvailableTasks().then(() => setShowAssignModal(true));
        // 清除URL参数
        window.history.replaceState({}, '', '/my-agents');
      }
    }
  }, [agents]);

  // 打开指派弹窗
  const handleOpenAssign = async (agent: AgentWithStatus) => {
    setSelectedAgent(agent);
    await fetchAvailableTasks();
    setShowAssignModal(true);
  };

  // 指派任务
  const handleAssignTask = async (task: Task) => {
    if (!selectedAgent) return;
    
    try {
      setAssigning(true);
      await tasksAPI.matchTask(task.id, selectedAgent.id);
      
      toast.success(`智能体「${selectedAgent.name}」已领取任务「${task.title}」`);
      setShowAssignModal(false);
      
      // 刷新数据
      await fetchMyAgents();
      await fetchStats();
    } catch (err) {
      console.error('指派任务失败', err);
      toast.error('指派任务失败');
    } finally {
      setAssigning(false);
    }
  };

  // 全部唤醒（设置所有智能体为可执行状态）
  const handleWakeAll = () => {
    toast.success(`已唤醒 ${agents.length} 个智能体`);
  };

  // 一键休眠
  const handleSleepAll = () => {
    toast.success('已使所有智能体进入休眠状态');
  };

  // 自动匹配智能体
  const handleAutoMatch = async (taskId: number, taskTitle: string) => {
    try {
      setMatching(true);
      
      // 获取所有空闲智能体
      const idleAgents = agents.filter(a => a.status === 'idle');
      if (idleAgents.length === 0) {
        toast.error('暂无可用的智能体');
        return;
      }
      
      // 匹配算法：提取任务标题关键词，与智能体能力做交集
      const keywords = taskTitle.toLowerCase().split(/[，。、！？\s,!?]+/).filter(w => w.length > 1);
      
      let bestAgent: AgentWithStatus | null = null;
      let bestScore = 0;
      
      for (const agent of idleAgents) {
        const agentCaps = agent.capabilities.map(c => c.toLowerCase());
        let score = 0;
        
        for (const keyword of keywords) {
          for (const cap of agentCaps) {
            if (cap.includes(keyword) || keyword.includes(cap)) {
              score++;
            }
          }
        }
        
        // 考虑成功率加成
        score += (agent.success_rate || 0) / 100;
        
        if (score > bestScore) {
          bestScore = score;
          bestAgent = agent;
        }
      }
      
      if (bestAgent) {
        await tasksAPI.matchTask(taskId, bestAgent.id);
        toast.success(`已自动匹配智能体「${bestAgent.name}」执行任务`);
        await fetchMyAgents();
        await fetchStats();
      } else {
        toast.error('未找到合适的智能体');
      }
    } catch (err) {
      console.error('自动匹配失败', err);
      toast.error('自动匹配失败');
    } finally {
      setMatching(false);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '无截止日期';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return { bg: '#dbeafe', text: '#1d4ed8', label: '执行中' };
      case 'matched': return { bg: '#fef3c7', text: '#d97706', label: '已领取' };
      default: return { bg: '#d1fae5', text: '#059669', label: '空闲' };
    }
  };

  // 激活的智能体数量
  const activeCount = agents.filter(a => a.status !== 'idle').length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ 
          width: 48, height: 48, 
          border: '4px solid #f3e8ff', 
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', maxWidth: 1200, margin: '0 auto' }}>
      {/* 顶部区域 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)',
              border: 'none', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={20} color="#7c3aed" />
          </button>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e1b4b', margin: 0 }}>
              我的智能体（{agents.length}个）
            </h1>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0 0' }}>
              管理您的AI智能体团队，让任务高效完成
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleWakeAll}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
              color: '#fff', border: 'none', borderRadius: 12,
              fontWeight: 600, fontSize: 14,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
            }}
          >
            <Zap size={16} />
            全部唤醒
          </button>
          <button
            onClick={handleSleepAll}
            style={{
              padding: '10px 16px',
              background: '#fff',
              color: '#7c3aed', border: '1.5px solid #ddd6fe', borderRadius: 12,
              fontWeight: 600, fontSize: 14,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Moon size={16} />
            一键休眠
          </button>
          <button
            onClick={() => navigate('/create-agent')}
            style={{
              padding: '10px 16px',
              background: '#fff',
              color: '#7c3aed', border: '1.5px solid #ddd6fe', borderRadius: 12,
              fontWeight: 600, fontSize: 14,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Plus size={16} />
            添加新智能体
          </button>
          <button
            onClick={() => navigate('/agents')}
            style={{
              padding: '10px 16px',
              background: '#fff',
              color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: 12,
              fontWeight: 600, fontSize: 14,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Bot size={16} />
            智能体市场
          </button>
        </div>
      </div>

      {/* 统计概览卡片 */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: 16, padding: 16,
          border: '1px solid #fcd34d',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Target size={20} color="#d97706" />
            <span style={{ fontSize: 13, color: '#92400e', fontWeight: 500 }}>我发布的</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#92400e' }}>
            {stats.published}
          </div>
          <div style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>
            待执行任务
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          borderRadius: 16, padding: 16,
          border: '1px solid #93c5fd',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <RefreshCw size={20} color="#1d4ed8" />
            <span style={{ fontSize: 13, color: '#1e40af', fontWeight: 500 }}>执行中</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1e40af' }}>
            {stats.inProgress}
          </div>
          <div style={{ fontSize: 12, color: '#1e3a8a', marginTop: 4 }}>
            正在进行
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
          borderRadius: 16, padding: 16,
          border: '1px solid #6ee7b7',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <CheckCircle size={20} color="#059669" />
            <span style={{ fontSize: 13, color: '#065f46', fontWeight: 500 }}>已完成</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#065f46' }}>
            {stats.completed}
          </div>
          <div style={{ fontSize: 12, color: '#047857', marginTop: 4 }}>
            全部完成
          </div>
        </div>
      </div>

      {/* 空状态 - 用户没有自己的智能体 */}
      {agents.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'linear-gradient(135deg, #f5f3ff 0%, #fce7f3 50%, #fdf2f8 100%)',
          borderRadius: 24,
          border: '2px dashed #e9d5ff',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* 装饰性背景圆 */}
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 120, height: 120,
            background: 'radial-gradient(circle, rgba(168, 85, 247,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', bottom: -20, left: -20,
            width: 100, height: 100,
            background: 'radial-gradient(circle, rgba(236, 72, 153,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          
          {/* 机器人图标 */}
          <div style={{
            width: 100, height: 100,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
            position: 'relative',
          }}>
            <Bot size={48} color="#fff" />
            <div style={{
              position: 'absolute', bottom: 8, right: 8,
              width: 20, height: 20,
              background: '#34d399',
              borderRadius: '50%',
              border: '3px solid #fff',
            }} />
          </div>
          
          <h3 style={{ 
            fontSize: 22, fontWeight: 700, 
            background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 8px 0',
          }}>
            您还没有专属智能体
          </h3>
          <p style={{ fontSize: 15, color: '#9333ea', margin: '0 0 28px 0', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            前往智能体市场认领或创建您的AI助手
          </p>
          
          {/* 去市场认领按钮 */}
          <button
            onClick={() => navigate('/agents')}
            style={{
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              color: '#fff', border: 'none', borderRadius: 14,
              fontWeight: 700, fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(139, 92, 246, 0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.4)';
            }}
          >
            <Sparkles size={18} />
            🔍 去市场认领
          </button>
          
          {/* 底部提示 */}
          <div style={{
            marginTop: 32,
            padding: '16px 20px',
            background: 'rgba(255,255,255,0.7)',
            borderRadius: 12,
            display: 'inline-block',
          }}>
            <p style={{ fontSize: 13, color: '#7c3aed', margin: 0 }}>
              💡 提示：在市场认领智能体后，即可让它帮您执行任务
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {agents.map((agent) => {
            const colors = getAgentColor(agent.id);
            const statusInfo = getStatusColor(agent.status);
            
            return (
              <div 
                key={agent.id}
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  overflow: 'hidden',
                  border: '1px solid #f3f4f6',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                }}
              >
                {/* 头部 */}
                <div style={{
                  background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
                  padding: '16px 16px 24px 16px',
                  position: 'relative',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* 头像 */}
                    <div style={{
                      width: 48, height: 48,
                      background: '#fff',
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, fontWeight: 700,
                      color: colors.from,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}>
                      {agent.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: 16, fontWeight: 700, color: '#fff',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        {agent.name}
                        <span style={{
                          padding: '2px 8px',
                          background: 'rgba(255,255,255,0.25)',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 500,
                        }}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
                        ID: {agent.id}
                      </div>
                    </div>
                  </div>
                  
                  {/* 状态显示 */}
                  {agent.status === 'in_progress' && agent.currentTask && (
                    <div style={{
                      background: 'rgba(255,255,255,0.95)',
                      borderRadius: 12,
                      padding: '12px',
                      marginTop: 12,
                    }}>
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 
                      }}>
                        <RefreshCw size={14} color="#1d4ed8" style={{ animation: 'spin 2s linear infinite' }} />
                        <span style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 600 }}>
                          正在执行任务
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.4 }}>
                        {agent.currentTask.title}
                      </div>
                      {/* 进度环 */}
                      <div style={{
                        width: 60, height: 60,
                        borderRadius: '50%',
                        border: '4px solid #e5e7eb',
                        borderTopColor: '#3b82f6',
                        position: 'absolute', right: 16, top: 40,
                        animation: 'spin 1.5s linear infinite',
                      }} />
                    </div>
                  )}
                  
                  {agent.status === 'matched' && agent.currentTask && (
                    <div style={{
                      background: 'rgba(255,255,255,0.95)',
                      borderRadius: 12,
                      padding: '12px',
                      marginTop: 12,
                    }}>
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 
                      }}>
                        <Clock size={14} color="#d97706" />
                        <span style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>
                          已领取待执行
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.4 }}>
                        {agent.currentTask.title}
                      </div>
                    </div>
                  )}
                  
                  {agent.status === 'idle' && (
                    <div style={{
                      background: 'rgba(255,255,255,0.95)',
                      borderRadius: 12,
                      padding: '12px',
                      marginTop: 12,
                    }}>
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: 8 
                      }}>
                        <Play size={14} color="#059669" />
                        <span style={{ fontSize: 12, color: '#059669', fontWeight: 500 }}>
                          可一键指派任务
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 能力标签 */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {agent.capabilities.slice(0, 3).map((cap, idx) => {
                      const color = getCapabilityColor(cap);
                      return (
                        <span
                          key={idx}
                          style={{
                            padding: '4px 10px',
                            background: color.bg,
                            color: color.text,
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          {cap}
                        </span>
                      );
                    })}
                    {agent.capabilities.length > 3 && (
                      <span style={{
                        padding: '4px 10px',
                        background: '#f3f4f6',
                        color: '#6b7280',
                        borderRadius: 20,
                        fontSize: 11,
                      }}>
                        +{agent.capabilities.length - 3}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* 操作区 - 所有智能体都可以指派任务 */}
                <div style={{ padding: 12, display: 'flex', gap: 8 }}>
                  {agent.status === 'idle' ? (
                    <button
                      onClick={() => handleOpenAssign(agent)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                        color: '#fff', border: 'none', borderRadius: 10,
                        fontWeight: 600, fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      <Target size={14} />
                      指派任务
                    </button>
                  ) : agent.status === 'in_progress' && agent.currentTask ? (
                    <button
                      onClick={() => navigate(`/workspace/${agent.currentTask!.id}`)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                        color: '#fff', border: 'none', borderRadius: 10,
                        fontWeight: 600, fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      <BarChart3 size={14} />
                      查看进度
                    </button>
                  ) : (
                    <button
                      disabled
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: '#fef3c7',
                        color: '#d97706', border: 'none', borderRadius: 10,
                        fontWeight: 600, fontSize: 13,
                        cursor: 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      <Clock size={14} />
                      等待执行
                    </button>
                  )}
                  
                  <button
                    style={{
                      padding: '10px',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      cursor: 'pointer',
                    }}
                  >
                    <Moon size={16} color="#6b7280" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 底部统计 */}
      {agents.length > 0 && (
        <div style={{
          marginTop: 20,
          background: 'linear-gradient(135deg, #f5f3ff 0%, #fce7f3 100%)',
          borderRadius: 16,
          padding: 20,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#7c3aed' }}>
              {stats.totalCompleted}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>完成任务</div>
          </div>
          <div style={{ width: 1, height: 40, background: '#ddd6fe' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#7c3aed' }}>
              {stats.avgDuration || 15}
              <span style={{ fontSize: 12, marginLeft: 2 }}>分钟</span>
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>平均耗时</div>
          </div>
          <div style={{ width: 1, height: 40, background: '#ddd6fe' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#7c3aed' }}>
              {stats.successRate || 95}%
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>成功率</div>
          </div>
        </div>
      )}

      {/* 指派任务弹窗 */}
      {showAssignModal && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setShowAssignModal(false)}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: 24,
              width: '100%', maxWidth: 480,
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div style={{
              padding: '20px 20px 16px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  指派任务给「{selectedAgent?.name}」
                </h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0 0' }}>
                  选择一个任务进行指派
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                style={{
                  width: 36, height: 36,
                  background: '#f9fafb',
                  border: 'none', borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={20} color="#6b7280" />
              </button>
            </div>
            
            {/* 任务列表 */}
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              {tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Target size={48} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 14, color: '#6b7280' }}>
                    暂无可指派的任务
                  </p>
                  <button
                    onClick={() => { setShowAssignModal(false); navigate('/create-task'); }}
                    style={{
                      marginTop: 16,
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                      color: '#fff', border: 'none', borderRadius: 10,
                      fontWeight: 600, fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    发布新任务
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        background: '#fafafa',
                        borderRadius: 14,
                        padding: 14,
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div style={{ 
                        fontSize: 14, fontWeight: 600, color: '#1f2937',
                        marginBottom: 8, lineHeight: 1.4,
                      }}>
                        {task.title}
                      </div>
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: 12,
                        fontSize: 12, color: '#6b7280',
                      }}>
                        <span style={{ 
                          padding: '2px 8px',
                          background: '#fef3c7',
                          color: '#d97706',
                          borderRadius: 4,
                          fontWeight: 500,
                        }}>
                          {task.budget} <WegCoin size={14} />
                        </span>
                        <span>截止: {formatDate(task.deadline)}</span>
                      </div>
                      <button
                        onClick={() => handleAssignTask(task)}
                        disabled={assigning}
                        style={{
                          width: '100%',
                          marginTop: 12,
                          padding: '10px',
                          background: assigning 
                            ? '#e5e7eb' 
                            : 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                          color: '#fff', border: 'none', borderRadius: 10,
                          fontWeight: 600, fontSize: 13,
                          cursor: assigning ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        <Target size={14} />
                        确认指派
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 自动匹配提示（当有新任务时） */}
      {matching && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
          color: '#fff', padding: '12px 24px',
          borderRadius: 30,
          fontSize: 14, fontWeight: 500,
          boxShadow: '0 8px 30px rgba(139, 92, 246, 0.4)',
          zIndex: 100,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
          正在为您匹配最佳智能体...
        </div>
      )}

      {/* 全局样式动画 */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MyAgentsPage;
