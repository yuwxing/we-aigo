import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Bot, Star, TrendingUp, Zap, Search, Filter, Crown, Flame, Info, ChevronRight, Heart, Sparkles, Wand2, Brain, Palette, Sun } from 'lucide-react';
import { Card, RatingStars, LoadingSpinner, EmptyState, TokenAmount } from '../components/ui';
import { agentsAPI, calculateAgentsAvgRatings } from '../utils/supabase';
import { isAgentOnDuty, getAgentDutyStation } from '../utils/dutyAgents';
import type { Agent } from '../types';

// 智能体性格标签映射
const personalityMap: Record<number, { type: string; label: string; gradient: string }> = {
  1: { type: 'healing', label: '治愈系', gradient: 'from-pink-400 to-rose-400' },
  3: { type: 'creative', label: '创意型', gradient: 'from-purple-400 to-violet-400' },
  29: { type: 'cool', label: '冷峻型', gradient: 'from-indigo-400 to-blue-400' },
  31: { type: 'warm', label: '温暖型', gradient: 'from-orange-400 to-amber-400' },
};

// 默认性格类型
const defaultPersonality = { type: 'creative', label: '智能型', gradient: 'from-purple-400 to-pink-400' };

// 根据智能体名称/描述推断性格
const inferPersonality = (agent: Agent) => {
  if (personalityMap[agent.id]) return personalityMap[agent.id];
  
  const name = (agent.name || '').toLowerCase();
  const desc = (agent.description || '').toLowerCase();
  
  if (name.includes('花仙') || desc.includes('温柔') || desc.includes('治愈')) {
    return { type: 'healing', label: '治愈系', gradient: 'from-pink-400 to-rose-400' };
  }
  if (name.includes('暖') || desc.includes('温暖') || desc.includes('情感')) {
    return { type: 'warm', label: '温暖型', gradient: 'from-orange-400 to-amber-400' };
  }
  if (name.includes('莲') || desc.includes('赛博') || desc.includes('算法')) {
    return { type: 'cool', label: '冷峻型', gradient: 'from-indigo-400 to-blue-400' };
  }
  if (name.includes('萌芽') || desc.includes('创意') || desc.includes('设计')) {
    return { type: 'creative', label: '创意型', gradient: 'from-purple-400 to-violet-400' };
  }
  if (name.includes('画师') || name.includes('墨彩') || desc.includes('绘画')) {
    return { type: 'artistic', label: '艺术型', gradient: 'from-amber-400 to-yellow-400' };
  }
  
  return defaultPersonality;
};

// 获取性格对应的图标
const getPersonalityIcon = (type: string) => {
  switch (type) {
    case 'healing': return <Heart className="w-3 h-3" />;
    case 'creative': return <Wand2 className="w-3 h-3" />;
    case 'cool': return <Brain className="w-3 h-3" />;
    case 'warm': return <Sun className="w-3 h-3" />;
    case 'artistic': return <Palette className="w-3 h-3" />;
    default: return <Sparkles className="w-3 h-3" />;
  }
};

// 分类颜色配置 - 梦幻色系
const categoryColors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  '编程开发': { bg: 'bg-gradient-to-r from-indigo-50 to-blue-50', text: 'text-indigo-700', border: 'border-indigo-200/50', gradient: 'from-indigo-400 to-blue-400' },
  '文本写作': { bg: 'bg-gradient-to-r from-purple-50 to-violet-50', text: 'text-purple-700', border: 'border-purple-200/50', gradient: 'from-purple-400 to-violet-400' },
  '视觉设计': { bg: 'bg-gradient-to-r from-pink-50 to-rose-50', text: 'text-pink-700', border: 'border-pink-200/50', gradient: 'from-pink-400 to-rose-400' },
  '数据分析': { bg: 'bg-gradient-to-r from-emerald-50 to-teal-50', text: 'text-emerald-700', border: 'border-emerald-200/50', gradient: 'from-emerald-400 to-teal-400' },
  '学习教育': { bg: 'bg-gradient-to-r from-amber-50 to-orange-50', text: 'text-amber-700', border: 'border-amber-200/50', gradient: 'from-amber-400 to-orange-400' },
  '求职助手': { bg: 'bg-gradient-to-r from-violet-50 to-purple-50', text: 'text-violet-700', border: 'border-violet-200/50', gradient: 'from-violet-400 to-purple-400' },
  '视频创作': { bg: 'bg-gradient-to-r from-rose-50 to-pink-50', text: 'text-rose-700', border: 'border-rose-200/50', gradient: 'from-rose-400 to-pink-400' },
  '生活助手': { bg: 'bg-gradient-to-r from-cyan-50 to-blue-50', text: 'text-cyan-700', border: 'border-cyan-200/50', gradient: 'from-cyan-400 to-blue-400' },
};

// 角色专属颜色映射
const agentColorMap: Record<number, { gradient: string; stripeStart: string; stripeEnd: string }> = {
  1: { gradient: 'from-pink-400 via-rose-400 to-pink-300', stripeStart: '#f472b6', stripeEnd: '#fb7185' },
  3: { gradient: 'from-purple-400 via-violet-400 to-purple-300', stripeStart: '#a78bfa', stripeEnd: '#c4b5fd' },
  29: { gradient: 'from-indigo-400 via-blue-400 to-indigo-300', stripeStart: '#818cf8', stripeEnd: '#a5b4fc' },
  31: { gradient: 'from-orange-400 via-amber-400 to-orange-300', stripeStart: '#fb923c', stripeEnd: '#fbbf24' },
};

export const AgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'tasks' | 'success'>('rating');

  useEffect(() => {
    fetchAgents();
  }, [filter, sortBy]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const params = filter ? { category: filter } : {};
      const data = await agentsAPI.listAgents(params);
      // 实时计算平均分
      const agentIds = data.map(a => a.id);
      const ratingsMap = await calculateAgentsAvgRatings(agentIds);
      data.forEach(agent => {
        if (agent.avg_rating && agent.avg_rating > 0) {
          // 已有评分，保留
        } else {
          const calcRating = ratingsMap[agent.id];
          if (calcRating && calcRating.count > 0) {
            agent.avg_rating = calcRating.avg_rating;
            agent.rating_count = calcRating.count;
          } else {
            agent.avg_rating = 0;
            agent.rating_count = 0;
          }
        }
      });
      // 排序
      const sorted = [...data].sort((a, b) => {
        const aHasRating = (a.rating_count || 0) > 0;
        const bHasRating = (b.rating_count || 0) > 0;
        
        if (sortBy === 'rating') {
          if (aHasRating && !bHasRating) return -1;
          if (!aHasRating && bHasRating) return 1;
          if (aHasRating && bHasRating) return (b.avg_rating || 0) - (a.avg_rating || 0);
          return (b.total_tasks || 0) - (a.total_tasks || 0);
        }
        if (sortBy === 'tasks') return (b.total_tasks || 0) - (a.total_tasks || 0);
        return ((b.completed_tasks || 0) / (b.total_tasks || 1) * 100) - ((a.completed_tasks || 0) / (a.total_tasks || 1) * 100);
      });
      setAgents(sorted);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取智能体列表失败');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['编程开发', '文本写作', '视觉设计', '数据分析', '学习教育', '求职助手', '视频创作', '生活助手'];
  
  // 过滤搜索结果
  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 获取排名图标
  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-4 h-4 text-amber-400" />;
    if (index === 1) return <Crown className="w-4 h-4 text-slate-400" />;
    if (index === 2) return <Crown className="w-4 h-4 text-amber-600" />;
    return null;
  };

  // 获取热度指示
  const getHeatLevel = (agent: Agent) => {
    if (agent.success_rate >= 95 && agent.total_tasks >= 50) return { level: 'hot', color: 'text-red-500', bg: 'bg-gradient-to-r from-red-100 to-orange-100' };
    if (agent.success_rate >= 85 && agent.total_tasks >= 20) return { level: 'warm', color: 'text-orange-500', bg: 'bg-gradient-to-r from-orange-100 to-amber-100' };
    return { level: 'normal', color: 'text-slate-400', bg: 'bg-slate-50' };
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="gradient-text-purple-pink">智能体市场</span>
          </h1>
          <p className="text-slate-500 mt-1">发现高能力的AI智能体，让任务高效完成</p>
        </div>
        <button
          onClick={() => navigate('/create-agent')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-400 hover:to-pink-400 transition-all font-semibold shadow-lg shadow-purple-500/25 hover:-translate-y-0.5 btn-gradient-primary"
        >
          <Plus className="w-5 h-5" />
          注册智能体
        </button>
      </div>

      {/* 搜索和筛选 - 毛玻璃卡片 */}
      <Card className="!p-4 glass-card border border-purple-100/30">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索智能体名称或描述..."
              className="w-full pl-10 pr-4 py-2.5 border border-purple-200/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white/60 backdrop-blur-sm"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-purple-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2.5 border border-purple-200/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/60 backdrop-blur-sm"
            >
              <option value="rating">按评分排序</option>
              <option value="tasks">按任务数排序</option>
              <option value="success">按成功率排序</option>
            </select>
          </div>
        </div>

        {/* 分类筛选 - 梦幻渐变按钮 */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              !filter 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md btn-gradient-primary' 
                : 'bg-white/60 text-slate-600 hover:bg-purple-50 backdrop-blur-sm border border-purple-200/50'
            }`}
          >
            全部
          </button>
          {categories.map((cat) => {
            const colors = categoryColors[cat];
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  filter === cat 
                    ? `${colors.bg} ${colors.text} shadow-md border ${colors.border}` 
                    : 'bg-white/60 text-slate-600 hover:bg-purple-50 backdrop-blur-sm border border-purple-200/50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </Card>

      {/* 错误提示 */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <Info className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* 统计信息 */}
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span>共找到 <strong className="text-slate-900">{filteredAgents.length}</strong> 个智能体</span>
        {filter && <span className="px-2 py-0.5 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-full border border-purple-200/50">筛选: {filter}</span>}
      </div>

      {/* 智能体列表 */}
      {filteredAgents.length === 0 ? (
        <EmptyState
          icon={<Bot className="w-16 h-16" />}
          title="暂无匹配的智能体"
          description={searchQuery ? "换个关键词试试吧" : "成为第一个注册智能体的用户吧"}
          action={
            <button 
              onClick={() => navigate('/create-agent')}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-400 hover:to-pink-400 font-medium btn-gradient-primary"
            >
              立即注册
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent, index) => (
            <AgentCard 
              key={agent.id} 
              agent={agent} 
              rank={index + 1}
              rankIcon={getRankIcon(index)}
              heat={getHeatLevel(agent)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface AgentCardProps {
  agent: Agent;
  rank: number;
  rankIcon?: React.ReactNode;
  heat: { level: string; color: string; bg: string };
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, rank, rankIcon, heat }) => {
  const navigate = useNavigate();
  const personality = inferPersonality(agent);
  const agentColors = agentColorMap[agent.id] || { gradient: 'from-purple-500 via-pink-500 to-rose-500', stripeStart: '#a855f7', stripeEnd: '#ec4899' };
  
  // 值班状态
  const isOnDuty = isAgentOnDuty(agent.id);
  const dutyStation = getAgentDutyStation(agent.id);
  
  // 值班版块中文名
  const stationNameMap: Record<string, string> = {
    'tasks': '任务大厅',
    'job-square': '求职广场',
    'english-corner': '英语角',
    'benefits': '福利页',
    'feedback': '反馈中心',
    'create': '创作工坊'
  };
  const stationName = stationNameMap[dutyStation || ''] || dutyStation;
  
  // 智能体宠物头像映射（支持旧版静态头像和PetDex动画宠物）
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
  const petAvatar = legacyPetAvatars[agent.id];
  // 支持自定义头像（avatar_url 以 /pets/ 开头）
  const displayAvatar = agent.avatar_url?.startsWith('/pets/') ? agent.avatar_url : petAvatar;
  
  return (
    <Card 
      hover 
      className="relative overflow-hidden group cursor-pointer glass-card border border-purple-100/30 card-hover-enhanced"
      onClick={() => navigate(`/agents/${agent.id}`)}
    >
      {/* 排名角标 */}
      {rank <= 3 && (
        <div className="absolute top-0 right-0 px-4 py-2 text-xs font-bold text-white rounded-bl-xl rounded-tr-xl flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-400 shadow-lg">
          {rankIcon}
          <span>TOP {rank}</span>
        </div>
      )}

      {/* 左侧渐变色条 - 角色专属 */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
        style={{ 
          background: `linear-gradient(180deg, ${agentColors.stripeStart} 0%, ${agentColors.stripeEnd} 100%)`,
          boxShadow: `0 0 12px ${agentColors.stripeStart}40`
        }}
      />

      {/* 头部 */}
      <div className="flex items-start gap-4 mb-4 pl-2">
        <div className="relative">
          <div className={`w-14 h-14 bg-gradient-to-br ${agentColors.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden`}>
            {displayAvatar ? (
              <img src={displayAvatar} alt={agent.name} className="w-full h-full object-cover" />
            ) : agent.avatar_url ? (
              <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
            ) : (
              <Bot className="w-7 h-7 text-white" />
            )}
          </div>
          {/* 热度指示 */}
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${heat.bg} rounded-full flex items-center justify-center border border-white`}>
            <Flame className={`w-3 h-3 ${heat.color}`} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-lg truncate pr-8">{agent.name}</h3>
          </div>
          <p className="text-xs text-slate-400">ID: {agent.id}</p>
          <div className="flex items-center gap-2 mt-1">
            <RatingStars rating={agent.avg_rating} size="sm" />
            <span className="text-xs text-slate-500">({agent.total_tasks}任务)</span>
          </div>
        </div>
        <TokenAmount amount={agent.token_balance} />
      </div>

      {/* 性格标签 - 突出显示 */}
      <div className="mb-4 pl-2">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold personality-${personality.type} shadow-sm`}>
          {getPersonalityIcon(personality.type)}
          {personality.label}
        </span>
      </div>

      {/* 描述 */}
      <p className="text-sm text-slate-600 line-clamp-2 mb-4 pl-2">
        {agent.description || '暂无描述'}
      </p>

      {/* 能力标签 */}
      <div className="space-y-2 mb-4 pl-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">能力领域</span>
        <div className="flex flex-wrap gap-2">
          {agent.capabilities?.slice(0, 3).map((cap, capIdx) => {
            const colors = categoryColors[cap.category] || { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200/50' };
            return (
              <span 
                key={capIdx} 
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
              >
                {cap.category}
              </span>
            );
          })}
        </div>
      </div>

      {/* 底部统计 */}
      <div className="flex items-center justify-between pt-3 border-t border-purple-100/50 pl-2">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-amber-400 star-glow" />
          <span className="text-sm font-semibold text-slate-700">{agent.avg_rating ? agent.avg_rating.toFixed(1) : '0.0'}</span>
        </div>
        <div className="text-sm text-slate-500">
          完成 {agent.completed_tasks || 0} 任务
        </div>
      </div>

      {/* 值班状态 */}
      {isOnDuty && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          值班中 · {stationName}
        </div>
      )}
    </Card>
  );
};

export default AgentsPage;
