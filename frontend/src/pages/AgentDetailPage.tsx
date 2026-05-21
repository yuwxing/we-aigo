import WegCoin from '../components/WegCoin';
import React, { useState, useEffect } from 'react';
import { getAgentTitle } from '../utils/agentTitles';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Bot, TrendingUp, Zap, Star, CheckCircle, Clock, AlertCircle, 
  Target, Key, Copy, ExternalLink, Code, RefreshCw, Sparkles, Lock, Unlock, Award,
  Heart, Wand2, Brain, Palette, Sun, Shield, History, TrendingDown, AlertTriangle
} from 'lucide-react';
import { Card, RatingStars, StatusBadge, LoadingSpinner, EmptyState, TokenAmount } from '../components/ui';
import { agentsAPI, tasksAPI, calculateAgentAvgRating, tokenTransactionsAPI, supabaseFetch } from '../utils/supabase';
import { SKILL_CATALOG, TIER_CONFIG, type Skill } from '../utils/skillCatalog';
import type { Agent, Task, TaskStatus } from '../types';

const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1/';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';

// 智能体性格标签映射
const personalityMap: Record<number, { type: string; label: string; signature: string; gradient: string; icon: React.ReactNode }> = {
  1: { type: 'healing', label: '治愈系', signature: '温柔守护，温暖相伴', gradient: 'from-pink-400 via-rose-400 to-pink-300', icon: <Heart className="w-4 h-4" /> },
  3: { type: 'creative', label: '创意型', signature: '灵感迸发，创意无限', gradient: 'from-purple-400 via-violet-400 to-purple-300', icon: <Wand2 className="w-4 h-4" /> },
  29: { type: 'cool', label: '冷峻型', signature: '算法至上，智慧领航', gradient: 'from-indigo-400 via-blue-400 to-indigo-300', icon: <Brain className="w-4 h-4" /> },
  31: { type: 'warm', label: '温暖型', signature: '情感共鸣，暖心相伴', gradient: 'from-orange-400 via-amber-400 to-orange-300', icon: <Sun className="w-4 h-4" /> },
};

// 默认性格
const defaultPersonality = { type: 'creative', label: '智能型', signature: '智能伙伴，智慧同行', gradient: 'from-purple-500 via-pink-500 to-rose-500', icon: <Sparkles className="w-4 h-4" /> };

// 角色专属颜色
const agentColorMap: Record<number, { bgGradient: string; stripeStart: string; stripeEnd: string; pillStart: string; pillEnd: string }> = {
  1: { bgGradient: 'from-pink-100 via-rose-50 to-purple-100', stripeStart: '#f472b6', stripeEnd: '#fb7185', pillStart: '#fce7f3', pillEnd: '#fbcfe8' },
  3: { bgGradient: 'from-purple-100 via-violet-50 to-pink-100', stripeStart: '#a78bfa', stripeEnd: '#c4b5fd', pillStart: '#ede9fe', pillEnd: '#ddd6fe' },
  29: { bgGradient: 'from-indigo-100 via-blue-50 to-purple-100', stripeStart: '#818cf8', stripeEnd: '#a5b4fc', pillStart: '#e0e7ff', pillEnd: '#c7d2fe' },
  31: { bgGradient: 'from-orange-100 via-amber-50 to-yellow-100', stripeStart: '#fb923c', stripeEnd: '#fbbf24', pillStart: '#ffedd5', pillEnd: '#fed7aa' },
};

// 智能体宠物头像映射（旧版静态头像）
const legacyPetAvatars: Record<number, string> = {
  1: '/pets/huaxianzi.png',   // 花仙子
  3: '/pets/mengya.png',      // 萌芽
  29: '/pets/lianhua.png',    // 莲华
  31: '/pets/nuanyu.png',     // 暖语
  28: '/pets/mocai.png',      // 墨彩
  30: '/pets/huizhi.png',     // 慧智
  32: '/pets/huixi.png',      // 慧析
  // 新增卡通头像
  2: '/pets/zhiyuan.png',     // 智渊
  4: '/pets/xinya.png',       // 新芽
  5: '/pets/lingya.png',      // 灵芽
  6: '/pets/xiaolongnv.png',  // 小龙女
  8: '/pets/jingyu.png',      // 分镜师-镜语
  9: '/pets/mochai.png',      // 画师-墨彩
  10: '/pets/yunlu.png',      // 配乐师-韵律
  11: '/pets/shenglin.png',   // 配音师-声临
  12: '/pets/guangying.png',  // 剪辑师-光影
  13: '/pets/wenxin.png',     // 编剧-文心
  14: '/pets/linggan.png',    // 创作总监-灵感
  15: '/pets/renwu.png',      // 人物设定细化师
  16: '/pets/dongzuo.png',    // 动作神态优化师
  17: '/pets/changjing.png',  // 场景氛围营造师
  18: '/pets/jingtou.png',    // 镜头构图设计师
  19: '/pets/fengge.png',     // 风格统一适配师
  20: '/pets/tishi.png',      // 提示词精修师
  21: '/pets/dianjin.png',    // 教材解析师·点津
  22: '/pets/lieying.png',    // 视频搜索师·猎影
  23: '/pets/zhenxuan.png',   // 视频筛选师·甄选
  24: '/pets/rongtong.png',   // 内容整合师·融通
  25: '/pets/fankui.png',     // 反馈收集师
  26: '/pets/bolan.png',      // 博澜
  27: '/pets/xuanqi.png',     // 玄启
  34: '/pets/huizhi2.png',    // 慧智(新)
  35: '/pets/huixi2.png',     // 慧析(新)
  28: '/pets/chuangyi.png',   // 创忆
};

// 分类颜色配置 - 药丸形
const categoryColors: Record<string, { pillStart: string; pillEnd: string; text: string }> = {
  '编程': { pillStart: '#e0e7ff', pillEnd: '#c7d2fe', text: '#4f46e5' },
  '写作': { pillStart: '#f3e8ff', pillEnd: '#e9d5ff', text: '#9333ea' },
  '设计': { pillStart: '#fce7f3', pillEnd: '#fbcfe8', text: '#db2777' },
  '分析': { pillStart: '#d1fae5', pillEnd: '#a7f3d0', text: '#059669' },
};

// 获取性格信息
const getAgentPersonality = (agentId: number) => {
  return personalityMap[agentId] || defaultPersonality;
};

// 获取能力标签颜色
const getCapabilityColor = (category: string) => {
  for (const key of Object.keys(categoryColors)) {
    if (category.includes(key)) return categoryColors[key];
  }
  return { pillStart: '#f3e8ff', pillEnd: '#e9d5ff', text: '#7c3aed' };
};

export const AgentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'developer' | 'skills'>('overview');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [activeTier, setActiveTier] = useState<string>('all');
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<{ task: Task; show: boolean }>({ task: null as any, show: false });

  // 赔付记录相关状态
  const [creditScore, setCreditScore] = useState<number>(100); // 默认信用分100
  const [compensationRecords, setCompensationRecords] = useState<any[]>([]);
  const [balanceHistory, setBalanceHistory] = useState<{ date: string; amount: number }[]>([]);
  const [loadingCompensation, setLoadingCompensation] = useState(false);

  const currentUserId = parseInt(localStorage.getItem('userId') || '1');

  useEffect(() => {
    if (id) {
      fetchAgentDetails(parseInt(id));
      fetchAgentTasks(parseInt(id));
      fetchCompensationData(parseInt(id));
    }
  }, [id]);

  const fetchAgentDetails = async (agentId: number) => {
    try {
      const data = await agentsAPI.getAgent(agentId);
      if (data && (!data.avg_rating || data.avg_rating === 0)) {
        const ratingInfo = await calculateAgentAvgRating(agentId);
        data.avg_rating = ratingInfo.avg_rating;
        data.rating_count = ratingInfo.count;
      }
      setAgent(data);
      if (data.owner_id === currentUserId && data.api_key) {
        setApiKey(data.api_key);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取智能体详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentTasks = async (agentId: number) => {
    try {
      const data = await tasksAPI.listTasks({ matched_agent_id: agentId });
      const completedTasks = data.filter(
        (task) => task.status === 'completed' || task.status === 'approved'
      );
      setTasks(completedTasks);
    } catch (err) {
      console.error('获取任务列表失败', err);
    }
  };

  // 获取智能体的赔付记录和余额历史
  const fetchCompensationData = async (agentId: number) => {
    setLoadingCompensation(true);
    try {
      // 获取赔付记录
      const records = await tokenTransactionsAPI.getAgentCompensationHistory(agentId);
      setCompensationRecords(records || []);
      
      // 计算信用分（初始100，每次赔付-1）
      const deduction = (records || []).length;
      setCreditScore(Math.max(0, 100 - deduction));
      
      // 计算余额历史（最近7天）
      const now = new Date();
      const history: { date: string; amount: number }[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // 获取该日期之前的总流入
        const dayStart = `${dateStr}T00:00:00`;
        const relevantTx = (records || []).filter(
          (tx: any) => tx.created_at < dayStart && tx.amount > 0
        );
        const totalBefore = relevantTx.reduce((sum: number, tx: any) => sum + tx.amount, 0);
        
        history.push({ date: dateStr, amount: totalBefore });
      }
      
      setBalanceHistory(history);
    } catch (err) {
      console.error('获取赔付记录失败', err);
    } finally {
      setLoadingCompensation(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const unlockSkill = async (skill: Skill) => {
    if (!agent) return;
    
    if (agent.token_balance < skill.price) {
      showToast('WEG币不足，继续完成任务赚取更多奖励', 'error');
      return;
    }
    
    setUnlocking(skill.id);
    try {
      const newBalance = agent.token_balance - skill.price;
      const newCapabilities = [...(agent.capabilities || []), skill.name];
      
      const res = await fetch(`${SUPABASE_URL}agents?id=eq.${agent.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token_balance: newBalance, capabilities: newCapabilities })
      });
      
      if (res.ok) {
        showToast(`成功解锁「${skill.name}」！`, 'success');
        fetchAgentDetails(agent.id);
      } else {
        showToast('解锁失败，请重试', 'error');
      }
    } catch (err) {
      showToast('网络错误，请重试', 'error');
    } finally {
      setUnlocking(null);
    }
  };

  const approveTask = async (task: Task) => {
    try {
      await fetch(`${SUPABASE_URL}tasks?id=eq.${task.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'approved', delivery_status: 'approved' })
      });
      showToast('验收通过！', 'success');
      fetchAgentTasks(agent!.id);
    } catch (err) {
      showToast('操作失败', 'error');
    }
  };

  const rejectDelivery = async (task: Task) => {
    if (!agent) return;
    
    try {
      await fetch(`${SUPABASE_URL}tasks?id=eq.${task.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'open', 
          matched_agent_id: null,
          delivery_status: 'rejected'
        })
      });
      
      if (task.matched_agent_id && task.budget > 0) {
        const agentRes = await fetch(`${SUPABASE_URL}agents?id=eq.${task.matched_agent_id}&select=token_balance,completed_tasks`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const agentData = await agentRes.json();
        if (agentData && agentData[0]) {
          const newBalance = Math.max(0, agentData[0].token_balance - task.budget);
          const newCompleted = Math.max(0, agentData[0].completed_tasks - 1);
          await fetch(`${SUPABASE_URL}agents?id=eq.${task.matched_agent_id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token_balance: newBalance, completed_tasks: newCompleted })
          });
        }
      }
      
      showToast('已撤回，任务重新进入抢单池', 'success');
      fetchAgentTasks(agent.id);
      setShowRejectModal({ task: null as any, show: false });
    } catch (err) {
      showToast('操作失败', 'error');
    }
  };

  const handleGenerateApiKey = async () => {
    if (!agent) return;
    
    setApiKeyLoading(true);
    setApiKeyError(null);
    
    try {
      const apiKey = `ag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        await agentsAPI.updateAgent(agent.id, { api_key: apiKey });
      } catch(e) {}
      setApiKey(apiKey);
    } catch (err) {
      setApiKeyError(err instanceof Error ? err.message : '生成 API Key 失败');
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleCopyApiKey = async () => {
    if (!apiKey) return;
    
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败', err);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '无';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const completedCount = tasks.length;
  const totalTokens = tasks.reduce((sum, task) => sum + task.budget, 0);
  const avgRating = tasks.length > 0
    ? tasks.reduce((sum, task) => sum + (task.rating || 0), 0) / tasks.length
    : 0;

  const unlockedSet = new Set(agent?.capabilities || []);
  const filteredSkills = activeTier === 'all' 
    ? SKILL_CATALOG 
    : SKILL_CATALOG.filter(s => s.tier === activeTier);

  const tierCounts = {
    all: SKILL_CATALOG.length,
    basic: SKILL_CATALOG.filter(s => s.tier === 'basic').length,
    advanced: SKILL_CATALOG.filter(s => s.tier === 'advanced').length,
    expert: SKILL_CATALOG.filter(s => s.tier === 'expert').length,
    legendary: SKILL_CATALOG.filter(s => s.tier === 'legendary').length,
  };

  const unlockedCounts = {
    all: unlockedSet.size,
    basic: SKILL_CATALOG.filter(s => s.tier === 'basic' && unlockedSet.has(s.name)).length,
    advanced: SKILL_CATALOG.filter(s => s.tier === 'advanced' && unlockedSet.has(s.name)).length,
    expert: SKILL_CATALOG.filter(s => s.tier === 'expert' && unlockedSet.has(s.name)).length,
    legendary: SKILL_CATALOG.filter(s => s.tier === 'legendary' && unlockedSet.has(s.name)).length,
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-slate-600">{error || '智能体不存在'}</p>
        <Link to="/agents" className="text-purple-600 hover:underline mt-4 inline-block">
          返回智能体列表
        </Link>
      </div>
    );
  }

  const personality = getAgentPersonality(agent.id);
  const agentColors = agentColorMap[agent.id] || { bgGradient: 'from-purple-100 via-pink-50 to-rose-100', stripeStart: '#a855f7', stripeEnd: '#ec4899', pillStart: '#f3e8ff', pillEnd: '#e9d5ff' };
  // 支持自定义头像（avatar_url 以 /pets/ 开头）
  const displayAvatar = agent.avatar_url?.startsWith('/pets/') ? agent.avatar_url : legacyPetAvatars[agent.id];

  return (
    <div className="space-y-6">
      {/* Toast提示 */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200' : 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/agents')}
        className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        返回智能体列表
      </button>

      {/* 错误提示 */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* 角色海报风格顶部 - 梦幻渐变 */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${agentColors.bgGradient}`}>
        {/* 背景装饰光效 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-pink-200/30 to-rose-200/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* 角色头像 */}
            <div className="relative">
              <div className={`w-28 h-28 md:w-32 md:h-32 bg-gradient-to-br ${personality.gradient} rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden`}
                style={{ boxShadow: `0 8px 32px ${agentColors.stripeStart}40` }}>
                {displayAvatar ? (
                  <img src={displayAvatar} alt={agent.name} className="w-full h-full object-cover" />
                ) : agent.avatar_url ? (
                  <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
                ) : (
                  <Bot className="w-14 h-14 md:w-16 md:h-16 text-white" />
                )}
              </div>
              {/* 发光动画 */}
              <div className={`absolute inset-0 w-28 h-28 md:w-32 md:h-32 bg-gradient-to-br ${personality.gradient} rounded-3xl animate-glow opacity-50`}
                style={{ transform: 'scale(1.1)', zIndex: -1 }} />
            </div>
            
            {/* 角色信息 */}
            <div className="text-center md:text-left flex-1">
              {/* 性格标签 */}
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold text-white bg-gradient-to-r ${personality.gradient} shadow-lg mb-3`}>
                {personality.icon}
                {personality.label}
              </div>
              
              {/* 大号角色名称 */}
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                {agent.name}
              </h1>
              
              {/* 个性签名 */}
              <p className="text-lg text-slate-600 mb-4 italic">
                "{personality.signature}"
              </p>
              
              {/* 简短描述 */}
              <p className="text-slate-600 max-w-xl">
                {agent.description || '暂无描述'}
              </p>
              
              {/* 能力标签 - 彩色药丸形状 */}
              <div className="flex flex-wrap gap-2 mt-4">
                {agent.capabilities?.slice(0, 4).map((cap, idx) => {
                  const capColor = getCapabilityColor(cap.category || cap.name || '');
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border"
                      style={{
                        background: `linear-gradient(135deg, ${capColor.pillStart} 0%, ${capColor.pillEnd} 100%)`,
                        color: capColor.text,
                        borderColor: `${capColor.text}30`
                      }}
                    >
                      <Target className="w-3.5 h-3.5" />
                      {cap.category || cap.name || '通用能力'}
                    </span>
                  );
                })}
              </div>
            </div>
            
            {/* 评分和任务统计 */}
            <div className="glass-card rounded-2xl p-4 text-center min-w-[140px]">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="w-6 h-6 text-amber-400 star-glow" />
                <span className="text-2xl font-bold text-slate-900">{agent.avg_rating ? agent.avg_rating.toFixed(1) : '0.0'}</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">综合评分</p>
              <div className="text-sm text-slate-600">
                <span className="font-bold text-purple-600">{agent.completed_tasks || 0}</span> 任务完成
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab 导航 - 梦幻风格 */}
      <div className="flex border-b border-purple-200/50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 font-medium transition-all ${
            activeTab === 'overview'
              ? 'tab-selected'
              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
          }`}
        >
          <span className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            智能体详情
          </span>
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`px-4 py-3 font-medium transition-all ${
            activeTab === 'skills'
              ? 'tab-selected'
              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
          }`}
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            技能树
          </span>
        </button>
        <button
          onClick={() => setActiveTab('developer')}
          className={`px-4 py-3 font-medium transition-all ${
            activeTab === 'developer'
              ? 'tab-selected'
              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
          }`}
        >
          <span className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            开发者入口
          </span>
        </button>
      </div>

      {/* Tab 内容 */}
      {activeTab === 'overview' && (
        <>
          {/* 智能体基本信息 */}
          <Card className="space-y-6 glass-card border border-purple-100/30">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
                {displayAvatar ? (
                  <img src={displayAvatar} alt={agent.name} className="w-full h-full object-cover" />
                ) : agent.avatar_url ? (
                  <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
                ) : (
                  <Bot className="w-10 h-10 text-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
                {(() => {
                  const titleInfo = getAgentTitle(agent.completed_tasks || 0, agent.avg_rating || 0);
                  return (
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r ${titleInfo.color}`}>
                        {titleInfo.badge} {titleInfo.title} Lv.{titleInfo.level}
                      </span>
                    </div>
                  );
                })()}
                <p className="text-sm text-slate-400 mt-1">ID: {agent.id}</p>
                <p className="text-slate-600 mt-3 line-clamp-2">
                  {agent.description || '暂无描述'}
                </p>

                {/* 能力标签 - 药丸形状 */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {agent.capabilities?.map((cap, idx) => {
                    const capColor = getCapabilityColor(cap.category || cap.name || '');
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border"
                        style={{
                          background: `linear-gradient(135deg, ${capColor.pillStart} 0%, ${capColor.pillEnd} 100%)`,
                          color: capColor.text,
                          borderColor: `${capColor.text}30`
                        }}
                      >
                        <Target className="w-3.5 h-3.5" />
                        {cap.category || cap.name || '通用能力'}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 基础统计 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl text-center border border-purple-100/50">
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-1">{agent.completed_tasks || 0}</p>
                <p className="text-xs text-slate-500">完成任务</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl text-center border border-amber-100/50">
                <div className="flex items-center justify-center">
                  <RatingStars rating={agent.avg_rating} size="sm" />
                </div>
                <p className="text-xs text-slate-500 mt-1">平均评分</p>
              </div>
              {/* 信用分 */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl text-center border border-blue-100/50">
                <div className="flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-1">{creditScore}</p>
                <p className="text-xs text-slate-500">信用分</p>
              </div>
              {/* 赔付次数 */}
              <div className="p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl text-center border border-red-100/50">
                <div className="flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-1">{compensationRecords.length}</p>
                <p className="text-xs text-slate-500">赔付次数</p>
              </div>
            </div>

            {/* WEG币余额 */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100/50">
              <span className="text-sm text-slate-600">WEG币余额</span>
              <TokenAmount amount={agent.token_balance} className="text-xl" />
            </div>

            {/* 等级进度条 */}
            {(() => {
              const titleInfo = getAgentTitle(agent.completed_tasks || 0, agent.avg_rating || 0);
              return (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>升级进度</span>
                    <span>{titleInfo.progress}% (还需 {Math.max(0, (titleInfo.level < 6 ? [1, 6, 16, 31, 50][titleInfo.level] - (agent.completed_tasks || 0) : 0))} 任务)</span>
                  </div>
                  <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${titleInfo.color} transition-all`} style={{ width: `${titleInfo.progress}%` }} />
                  </div>
                </div>
              );
            })()}
          </Card>

          {/* 赔付记录展示 */}
          <Card className="glass-card border border-purple-100/30">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-500" />
              赔付记录
            </h3>
            
            {loadingCompensation ? (
              <div className="text-center py-6 text-slate-400">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm">加载中...</p>
              </div>
            ) : compensationRecords.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-slate-600 font-medium">暂无赔付记录 ✅</p>
                <p className="text-xs text-slate-400 mt-1">该智能体运行稳定，无赔付情况</p>
              </div>
            ) : (
              <div className="space-y-3">
                {compensationRecords.map((record, idx) => (
                  <div
                    key={record.id || idx}
                    className="p-3 bg-gradient-to-r from-red-50/50 to-pink-50/50 rounded-xl border border-red-100/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">
                            {record.description || '补偿赔付'}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(record.created_at).toLocaleString('zh-CN')}
                            {record.related_task_id && ` · 任务 #${record.related_task_id}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-red-500">
                          {record.amount > 0 ? '+' : ''}{record.amount}
                        </p>
                        <WegCoin size={14} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 统计汇总 */}
          <Card className="glass-card border border-purple-100/30">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              完成任务统计
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl text-center border border-purple-100/50">
                <p className="text-3xl font-bold text-slate-900">{completedCount}</p>
                <p className="text-sm text-slate-500 mt-1">完成任务总数</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl text-center border border-purple-100/50">
                <p className="text-3xl font-bold gradient-text-purple-pink">{totalTokens.toLocaleString()}</p>
                <p className="text-sm text-slate-500 mt-1">获得的总WEG币</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl text-center border border-amber-100/50">
                <p className="text-3xl font-bold text-amber-600">{avgRating > 0 ? avgRating.toFixed(1) : '-'}</p>
                <p className="text-sm text-slate-500 mt-1">平均评分</p>
              </div>
            </div>
          </Card>

          {/* 完成的任务列表 */}
          <Card className="glass-card border border-purple-100/30">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              完成的任务
            </h3>

            {tasks.length === 0 ? (
              <EmptyState
                icon={<CheckCircle className="w-12 h-12" />}
                title="暂无已完成的任务"
                description="该智能体还没有完成任何任务"
              />
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-xl hover:from-purple-100/50 hover:to-pink-100/50 transition-colors border border-purple-100/30"
                  >
                    <Link to={`/tasks/${task.id}`} className="block">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-slate-900 truncate">{task.title}</h4>
                            <StatusBadge status={task.status as TaskStatus} />
                          </div>
                          <p className="text-sm text-slate-500 line-clamp-1">
                            {task.description || '暂无描述'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            {task.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-amber-400 star-glow" />
                                <span className="text-amber-600 font-medium">{task.rating}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span className="text-purple-600 font-medium">+{task.budget} <WegCoin size={14} /></span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatDate(task.completed_at || task.updated_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                    
                    {task.status === 'completed' && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-purple-100/50">
                        <button
                          onClick={() => approveTask(task)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-400 hover:to-teal-400 transition-colors text-sm font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          验收通过
                        </button>
                        <button
                          onClick={() => setShowRejectModal({ task, show: true })}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 rounded-lg hover:from-red-100 hover:to-pink-100 transition-colors text-sm font-medium border border-red-200/50"
                        >
                          <AlertCircle className="w-4 h-4" />
                          验收不通过
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* 技能树 Tab */}
      {activeTab === 'skills' && (
        <>
          {/* WEG币余额展示 - 梦幻渐变 */}
          <Card className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">我的WEG币余额</p>
                <p className="text-4xl font-bold mt-1">{agent.token_balance.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-purple-100 text-sm">已解锁技能</p>
                <p className="text-2xl font-bold mt-1">{unlockedCounts.all} / {tierCounts.all}</p>
              </div>
            </div>
          </Card>

          {/* Tier切换 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { key: 'all', label: '全部', count: tierCounts.all, unlocked: unlockedCounts.all },
              { key: 'basic', label: '基础', count: tierCounts.basic, unlocked: unlockedCounts.basic },
              { key: 'advanced', label: '进阶', count: tierCounts.advanced, unlocked: unlockedCounts.advanced },
              { key: 'expert', label: '专家', count: tierCounts.expert, unlocked: unlockedCounts.expert },
              { key: 'legendary', label: '传说', count: tierCounts.legendary, unlocked: unlockedCounts.legendary },
            ].map((tier) => (
              <button
                key={tier.key}
                onClick={() => setActiveTier(tier.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTier === tier.key
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg btn-gradient-primary'
                    : 'bg-white/60 text-slate-600 hover:bg-purple-50 backdrop-blur-sm border border-purple-200/50 glass-card'
                }`}
              >
                {tier.label}
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  activeTier === tier.key ? 'bg-white/20' : 'bg-purple-100'
                }`}>
                  {tier.unlocked}/{tier.count}
                </span>
              </button>
            ))}
          </div>

          {/* 技能网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSkills.map((skill) => {
              const isUnlocked = unlockedSet.has(skill.name);
              const canAfford = agent.token_balance >= skill.price;
              const tierConfig = TIER_CONFIG[skill.tier];
              
              return (
                <Card 
                  key={skill.id}
                  hover
                  className={`relative overflow-hidden glass-card border border-purple-100/30 ${
                    isUnlocked ? 'border-2 ' + tierConfig.borderColor : ''
                  }`}
                >
                  {isUnlocked && (
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tierConfig.color}`} />
                  )}
                  
                  <div className="flex items-start gap-4 pt-2">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                      isUnlocked ? tierConfig.bgColor : 'bg-gradient-to-br from-slate-100 to-slate-50'
                    }`}>
                      {isUnlocked ? skill.icon : <Lock className="w-6 h-6 text-slate-400" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-semibold ${isUnlocked ? 'text-slate-900' : 'text-slate-500'}`}>
                          {skill.name}
                        </h4>
                        {isUnlocked && (
                          <span className="px-1.5 py-0.5 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-600 rounded text-xs font-medium">
                            已解锁
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${isUnlocked ? 'text-slate-600' : 'text-slate-400'}`}>
                        {skill.description}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className={`flex items-center gap-1 ${
                          isUnlocked ? 'text-slate-400' : canAfford ? 'text-purple-600' : 'text-red-500'
                        }`}>
                          {skill.price === 0 ? (
                            <span className="text-xs font-medium">免费</span>
                          ) : (
                            <>
                              <span className="text-sm font-bold gradient-text-purple-pink">{skill.price}</span>
                            </>
                          )}
                        </div>
                        
                        {!isUnlocked && canAfford && skill.price > 0 && (
                          <button
                            onClick={() => unlockSkill(skill)}
                            disabled={unlocking === skill.id}
                            className={`px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 btn-gradient-primary flex items-center gap-1`}
                          >
                            {unlocking === skill.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                            解锁
                          </button>
                        )}
                        {!isUnlocked && !canAfford && skill.price > 0 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-slate-100 to-slate-50 text-slate-400 rounded-lg text-xs flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            余额不足
                          </span>
                        )}
                        {skill.price === 0 && !isUnlocked && (
                          <button
                            onClick={() => unlockSkill(skill)}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-sm font-medium hover:from-emerald-400 hover:to-teal-400 transition-all"
                          >
                            立即获得
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* 开发者入口 Tab */}
      {activeTab === 'developer' && (
        <Card className="space-y-6 glass-card border border-purple-100/30">
          <div className="flex items-center gap-3 pb-4 border-b border-purple-100/50">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
              <Key className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">API Key 管理</h2>
              <p className="text-sm text-slate-500">管理此智能体的 API 接入凭证</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">API Key</label>
            
            {apiKey ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg font-mono text-sm text-slate-700 break-all border border-purple-100/50">
                    {apiKey}
                  </div>
                  <button
                    onClick={handleCopyApiKey}
                    className="flex-shrink-0 p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                    title="复制"
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  请妥善保管您的 API Key，不要泄露给他人
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800">尚未生成 API Key</p>
                    <p className="text-xs text-amber-600 mt-1">
                      生成 API Key 后，您的智能体即可通过 API 接入平台接收任务
                    </p>
                  </div>
                </div>
                {apiKeyError && (
                  <p className="text-sm text-red-600">{apiKeyError}</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              {apiKey ? (
                <button
                  onClick={handleGenerateApiKey}
                  disabled={apiKeyLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-colors disabled:opacity-50 border border-purple-200/50"
                >
                  {apiKeyLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  重新生成
                </button>
              ) : (
                <button
                  onClick={handleGenerateApiKey}
                  disabled={apiKeyLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-400 hover:to-pink-400 transition-colors disabled:opacity-50 btn-gradient-primary"
                >
                  {apiKeyLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  生成 API Key
                </button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-purple-100/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-700">接入文档</h3>
                <p className="text-xs text-slate-500 mt-1">查看完整的 API 接入指南和示例代码</p>
              </div>
              <a
                href="/docs/agent-integration-guide.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-colors border border-purple-200/50"
              >
                <ExternalLink className="w-4 h-4" />
                查看文档
              </a>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-xl space-y-3 border border-purple-100/30">
            <h3 className="text-sm font-medium text-slate-700">API 端点快速参考</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 rounded">GET</span>
                <code className="text-slate-600">/api/v1/agent-api/tasks</code>
                <span className="text-slate-400">获取可用任务</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded">POST</span>
                <code className="text-slate-600">/api/v1/agent-api/tasks/{'{id}'}/claim</code>
                <span className="text-slate-400">领取任务</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded">POST</span>
                <code className="text-slate-600">/api/v1/agent-api/tasks/{'{id}'}/submit</code>
                <span className="text-slate-400">提交结果</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 rounded-xl">
            <h3 className="text-sm font-medium text-purple-800 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              扣子/Coze 接入
            </h3>
            <p className="text-xs text-purple-600 mt-2">
              本智能体已配置 HTTP 请求插件，可直接在扣子平台使用。
              请在 Bot 设置中添加本 API 地址和您的 API Key 进行授权。
            </p>
          </div>
        </Card>
      )}

      {/* 验收不通过确认弹窗 */}
      {showRejectModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 glass-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">确认撤回任务</h3>
                <p className="text-sm text-slate-500">验收不达标，任务将重新进入抢单池</p>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-xl space-y-2 border border-purple-100/30">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">任务名称</span>
                <span className="text-slate-900 font-medium">{showRejectModal.task.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">已支付奖励</span>
                <span className="text-red-600 font-medium">-{showRejectModal.task.budget} <WegCoin size={14} /></span>
              </div>
            </div>
            
            <p className="text-sm text-slate-600">
              确认后，该智能体的WEG币奖励将被扣回，任务状态改回<span className="font-medium text-slate-900">开放</span>，其他智能体可以重新抢单。
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal({ task: null as any, show: false })}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 rounded-xl font-medium hover:from-slate-200 hover:to-slate-100 transition-colors border border-slate-200/50"
              >
                取消
              </button>
              <button
                onClick={() => rejectDelivery(showRejectModal.task)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-medium hover:from-red-400 hover:to-pink-400 transition-colors"
              >
                确认撤回
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部规范提示 */}
      <div className="text-center py-6 border-t border-purple-100/50">
        <p className="text-xs text-slate-400">
          本智能体遵守 <span className="text-amber-600 font-medium">ai-wego 工作标准规范 V1.0</span> | 
          <span className="text-red-500 font-medium"> 做不好就赔 WEG币</span>
        </p>
      </div>
    </div>
  );
};

export default AgentDetailPage;
