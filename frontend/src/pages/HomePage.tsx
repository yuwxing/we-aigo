import WegCoin from '../components/WegCoin';
// ai-wego homepage v5 - 梦幻二次元风格升级
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, List, PlusCircle, ArrowRight, Zap, Shield, Coins, Sparkles, TrendingUp, Users, Activity, ChevronDown, Star, Wand2, Video, Briefcase, Palette, MapPin, Calendar, DollarSign, ExternalLink, Award, Building2, RefreshCw, AlertCircle, GraduationCap, Heart, Share2 } from 'lucide-react';
import { Card } from '../components/ui';
import { SharePoster } from '../components/SharePoster';
import { agentApi, taskApi } from '../services/api';
import { useUser } from '../contexts/UserContext';
import type { Agent, Task } from '../types';

// 智能体ID到性格标签的映射
const agentPersonalityMap: Record<number, { type: string; label: string; gradient: string }> = {
  1: { type: 'healing', label: '治愈系', gradient: 'from-pink-400 to-rose-400' },
  3: { type: 'creative', label: '创意型', gradient: 'from-purple-400 to-violet-400' },
  29: { type: 'cool', label: '冷峻型', gradient: 'from-indigo-400 to-blue-400' },
  31: { type: 'warm', label: '温暖型', gradient: 'from-orange-400 to-amber-400' },
};

// AI能力展示卡片 - 梦幻渐变色系
const aiCapabilities = [
  {
    icon: <Briefcase className="w-8 h-8" />,
    title: '求职全托管',
    description: '智能体帮你搜岗位+定制简历+面试准备，一条龙服务',
    gradient: 'from-purple-400 via-pink-400 to-rose-400',
    highlight: '智能匹配',
    link: '/classroom',
    agentId: 1
  },
  {
    icon: <Palette className="w-8 h-8" />,
    title: '内容创作',
    description: 'AI团队协作产出文章/设计/方案，多智能体协作',
    gradient: 'from-violet-400 via-purple-400 to-fuchsia-400',
    highlight: '团队协作',
    link: '/create',
    agentId: 3
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: '任务自动执行',
    description: '发布需求→智能匹配→自动执行→交付验收，全闭环',
    gradient: 'from-amber-400 via-orange-400 to-pink-400',
    highlight: '全自动化',
    link: '/create-task',
    agentId: 29
  },

  {
    icon: <Sparkles className="w-8 h-8" />,
    title: 'AIGC提示词',
    description: '精选Midjourney/图生图/GPT角色模板，一键复制使用',
    gradient: 'from-cyan-400 via-blue-400 to-indigo-400',
    highlight: '模板中心',
    link: '/aigc-templates',
    agentId: null
  }
];

// 实习岗位类型定义
interface JobItem {
  id: number;
  title: string;
  location: string;
  salary: string;
  deadline: string;
  company: string;
  hot: boolean;
  status: string;
}

// 人才引进公告类型定义
interface TalentAnnouncement {
  id: number;
  title: string;
  organization: string;
  deadline: string;
  description: string;
  url: string;
}

// 获取智能体对应的性格标签
const getAgentPersonality = (agentId: number) => {
  return agentPersonalityMap[agentId] || { type: 'creative', label: '智能型', gradient: 'from-purple-400 to-pink-400' };
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser(); // 获取当前用户状态
  const [agents, setAgents] = useState<Agent[]>([]);
  const [latestJobs, setLatestJobs] = useState<JobItem[]>([]);
  const [talentAnnouncements, setTalentAnnouncements] = useState<TalentAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [talentLoading, setTalentLoading] = useState(true);
  const [showSharePoster, setShowSharePoster] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const agentData = await agentApi.listAgents({ limit: 6 });
      setAgents(agentData);
    } catch (err) {
      console.error('获取智能体数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取实习岗位数据（从tasks表动态获取）
  const fetchLatestJobs = async () => {
    try {
      setJobsLoading(true);
      console.log('[HomePage] 开始获取最新任务数据...');
      
      let allTasks: any[] = [];
      const supabaseUrl = 'https://mzjmfyoemcsoqzoooiej.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';
      
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          
          const res = await fetch(`${supabaseUrl}/rest/v1/tasks?select=*&order=id.desc&limit=20`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'count=exact'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          
          allTasks = await res.json();
          console.log(`[HomePage] 第${attempt + 1}次尝试成功获取 ${allTasks.length} 条任务`);
          break;
        } catch (fetchErr: any) {
          console.warn(`[HomePage] 第${attempt + 1}次尝试失败:`, fetchErr.message);
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          } else {
            throw fetchErr;
          }
        }
      }
      
      // 过滤活跃状态，排除优惠/反馈/已取消，取最新的6个
      const activeTasks = allTasks
        .filter((t: any) => ['open', 'matched', 'in_progress', 'submitted'].includes(t.status))
        .filter((t: any) => t.status !== 'deal')
        .filter((t: any) => !t.title?.startsWith('【优惠】'))
        .filter((t: any) => !t.title?.startsWith('【反馈】'));
      console.log(`[HomePage] 活跃任务数量: ${activeTasks.length}`);
      
      const jobItems: JobItem[] = activeTasks.slice(0, 6).map((task: any, idx: number) => ({
        id: task.id,
        title: task.title || '未命名任务',
        location: extractLocation(task.description || task.title || ''),
        salary: task.budget > 0 ? `${task.budget}` : '面议',
        deadline: task.deadline ? formatDeadline(task.deadline) : '长期有效',
        company: '平台任务',
        hot: idx < 3,
        status: task.status
      }));
      
      setLatestJobs(jobItems);
    } catch (err: any) {
      console.error('[HomePage] 获取任务数据最终失败:', err);
      setLatestJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  // 获取人才引进公告（带重试）
  const fetchTalentAnnouncements = async () => {
    try {
      setTalentLoading(true);
      console.log('[HomePage] 开始获取人才引进公告...');
      
      let allTasks: any[] = [];
      const supabaseUrl = 'https://mzjmfyoemcsoqzoooiej.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';
      
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          
          const res = await fetch(`${supabaseUrl}/rest/v1/tasks?select=*&order=id.desc&limit=50`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          
          allTasks = await res.json();
          console.log(`[HomePage] 人才公告第${attempt + 1}次尝试成功`);
          break;
        } catch (fetchErr: any) {
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 1000));
          } else {
            throw fetchErr;
          }
        }
      }
      
      // 筛选人才引进相关任务
      const talentKeywords = ['人才引进', '事业编制', '编制', '招聘公告', '引进计划'];
      const filteredTasks = allTasks.filter((task: any) => 
        talentKeywords.some(keyword => 
          (task.title && task.title.includes(keyword)) || 
          (task.description && task.description.includes(keyword))
        )
      );
      
      const announcements: TalentAnnouncement[] = filteredTasks.slice(0, 4).map((task: any) => ({
        id: task.id,
        title: task.title || '未命名公告',
        organization: extractOrganization(task.description || task.title || ''),
        deadline: task.deadline ? formatDeadline(task.deadline) : '长期有效',
        description: task.description ? task.description.slice(0, 100) + '...' : '',
        url: `/tasks/${task.id}`
      }));
      
      setTalentAnnouncements(announcements);
    } catch (err: any) {
      console.error('[HomePage] 获取人才引进公告失败:', err);
      setTalentAnnouncements([]);
    } finally {
      setTalentLoading(false);
    }
  };

  // 初始化加载数据
  useEffect(() => {
    fetchData();
    fetchLatestJobs();
    fetchTalentAnnouncements();
  }, []);

  // 从文本中提取地点
  const extractLocation = (text: string): string => {
    const locations = ['广州', '深圳', '北京', '上海', '杭州', '成都', '武汉', '南京'];
    for (const loc of locations) {
      if (text.includes(loc)) return loc;
    }
    return '全国';
  };

  // 从文本中提取机构名称
  const extractOrganization = (text: string): string => {
    const patterns = [
      /([\u4e00-\u9fa5]+(?:大学|学院|研究院|医院|政府|局|委|办))/g,
      /([\u4e00-\u9fa5]+(?:公司|集团|企业))/g
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }
    return '相关单位';
  };

  // 格式化截止日期
  const formatDeadline = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return '已截止';
      if (diffDays === 0) return '今日截止';
      if (diffDays === 1) return '明日截止';
      if (diffDays <= 7) return `${diffDays}天后截止`;
      if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}周后截止`;
      return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) + '截止';
    } catch {
      return dateStr;
    }
  };

  // 获取地点颜色 - 梦幻色系
  const getLocationColor = (location: string) => {
    switch (location) {
      case '广州': return 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700';
      case '深圳': return 'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700';
      default: return 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700';
    }
  };

  // 获取评分显示
  const getRatingDisplay = (rating: number | null | undefined) => {
    const r = rating || 0;
    if (r === 0) return '暂无评分';
    return r.toFixed(1);
  };

  return (
    <div className="space-y-12">
      {/* Hero Section - Q版智能体横幅 */}
      <section className="relative overflow-hidden">
        {/* 横幅图片 */}
        <div className="w-full">
          <img 
            src="/hero-banner.png" 
            alt="ai-wego 智能体生态平台" 
            className="w-full h-auto object-cover"
          />
        </div>

        {/* CTA按钮浮层 - 叠加在横幅底部 */}
        <div className="absolute bottom-4 left-0 right-0 z-10">
          <div className="flex flex-wrap justify-center gap-3 px-4">
            <Link
              to="/create-task"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-400 hover:to-pink-400 transition-all duration-300 font-semibold text-sm shadow-lg shadow-purple-500/30 hover:shadow-xl hover:-translate-y-0.5 btn-gradient-primary"
            >
              发布需求
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={() => window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' })}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm text-purple-700 rounded-2xl hover:bg-white/90 transition-all duration-300 font-semibold text-sm border border-purple-200/50 hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              探索更多
            </button>
            <Link
              to="/classroom"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl hover:from-pink-400 hover:to-rose-400 transition-all duration-300 font-semibold text-sm shadow-lg shadow-pink-500/30 hover:-translate-y-0.5"
            >
              <GraduationCap className="w-4 h-4" />
              求职课堂
            </Link>
            <button
              onClick={() => setShowSharePoster(true)}
              className="group inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/80 backdrop-blur-sm text-pink-600 rounded-2xl hover:bg-white/90 transition-all duration-300 font-semibold text-sm border border-pink-200/50 hover:-translate-y-0.5"
            >
              <Share2 className="w-4 h-4" />
              分享
            </button>
          </div>
        </div>
      </section>

      {/* 人才引进公告板块 */}
      {talentAnnouncements.length > 0 && (
        <section id="talent-section" className="px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full text-amber-700 text-sm font-medium mb-4">
                <Building2 className="w-4 h-4" />
                人才引进公告
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">事业编制 & 人才引进</h2>
              <p className="text-slate-500">最新事业编制招聘与人才引进政策公告</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {talentAnnouncements.map((announcement) => (
                <Link 
                  key={announcement.id}
                  to={announcement.url}
                  className="group glass-card rounded-2xl p-5 hover:shadow-lg transition-all border border-amber-100/50 relative overflow-hidden card-hover-enhanced"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-400" />
                  
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200/50">
                        事业编制
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {announcement.deadline}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-slate-900 text-base mb-2 group-hover:text-amber-600 transition-colors line-clamp-2">
                      {announcement.title}
                    </h3>
                    
                    <p className="text-sm text-slate-500 mb-2 flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {announcement.organization}
                    </p>
                    
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {announcement.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-6">
              <Link 
                to="/announcements"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-400 hover:to-pink-400 transition-colors font-medium text-sm shadow-md hover:shadow-lg"
              >
                📋 查看全部公告
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 未登录用户欢迎引导 - 醒目展示 */}
      {!user && (
        <section className="px-4">
          <div className="max-w-5xl mx-auto">
            <div className="relative bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500 rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl shadow-purple-500/30">
              {/* 背景装饰 */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              </div>
              
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-white/90 text-sm font-medium mb-3">
                    <Sparkles className="w-4 h-4" />
                    欢迎来到 ai-wego 🌸
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    探索AI智能体的无限可能
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-white/90">
                      <span className="text-xl">🐾</span>
                      <span className="text-sm">宠物英语角</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <span className="text-xl">💼</span>
                      <span className="text-sm">求职助手</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <span className="text-xl">🤖</span>
                      <span className="text-sm">AI智能体</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <img src="/weg-coin.png" alt="WEG" style={{ width: 20, height: 20, borderRadius: "50%" }} />
                      <span className="text-sm">任务赚币</span>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm">
                    先体验功能，注册后可保存进度、解锁更多玩法 ✨
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => navigate('/register')}
                    className="px-8 py-4 bg-white text-purple-600 font-bold rounded-2xl hover:bg-white/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    登录 / 注册
                  </button>
                  <button
                    onClick={() => navigate('/benefits')}
                    className="px-6 py-3 bg-white/20 text-white font-medium rounded-xl hover:bg-white/30 transition-all flex items-center justify-center gap-2"
                  >
                    先逛逛
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 最新任务板块 - 毛玻璃卡片风格 */}
      <section id="jobs-section" className="px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full text-emerald-700 text-sm font-medium mb-4">
              <Award className="w-4 h-4" />
              最新任务
              <button 
                onClick={() => { fetchLatestJobs(); fetchTalentAnnouncements(); }}
                className="ml-2 hover:bg-emerald-200 rounded-full p-0.5 transition-colors"
                title="刷新数据"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">平台最新任务</h2>
            <p className="text-slate-500">从平台任务大厅获取最新发布的任务机会</p>
          </div>

          {jobsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <span className="ml-3 text-slate-500">加载中...</span>
            </div>
          ) : latestJobs.length > 0 ? (
            <div className="space-y-3">
              {latestJobs.map((job) => (
                <div 
                  key={job.id}
                  className="group glass-card rounded-2xl p-4 hover:shadow-lg transition-all border border-purple-100/30 relative overflow-hidden card-hover-enhanced"
                >
                  {/* 左侧梦幻色条 */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${
                    job.location === '广州' ? 'bg-gradient-to-b from-purple-400 to-pink-400' : 
                    job.location === '深圳' ? 'bg-gradient-to-b from-violet-400 to-purple-400' : 'bg-gradient-to-b from-rose-400 to-pink-400'
                  }`} />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pl-3">
                    <div className="flex items-center gap-3 flex-1">
                      {job.hot && (
                        <span className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-sm">
                          热门
                        </span>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-900 text-base md:text-lg">{job.title}</h3>
                        <p className="text-sm text-slate-500">{job.company}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                      <span className="text-lg md:text-xl font-bold gradient-text-purple-pink flex items-center gap-1">
                        {job.salary !== '面议' && <img src="/weg-coin.png" alt="WEG" style={{ width: 18, height: 18, borderRadius: '50%' }} />}
                        {job.salary}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLocationColor(job.location)}`}>
                        <MapPin className="w-3.5 h-3.5 inline mr-1" />
                        {job.location}
                      </span>
                      <span className="hidden md:flex items-center gap-1 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        {job.deadline}
                      </span>
                    </div>

                    <Link
                      to={`/tasks/${job.id}`}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-400 hover:to-pink-400 transition-all font-medium text-sm shadow-sm hover:shadow-md btn-gradient-primary"
                    >
                      查看详情
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass-card rounded-2xl border border-purple-100/50 relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-100/50 rounded-full blur-3xl -translate-y-1/2" />
              
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-10 h-10 text-purple-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2">还没有任务发布</h3>
              
              <p className="text-slate-500 mb-6 max-w-md mx-auto px-4">
                智能体们已就绪，等待您的第一个指令！
                <br/>
                <span className="text-purple-600 font-medium">发布任务，让AI帮您完成工作</span>
              </p>
              
              <Link 
                to="/create-task"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-400 hover:to-pink-400 transition-all font-bold text-lg shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-pink-500/40 hover:-translate-y-1 btn-gradient-primary"
              >
                <Zap className="w-5 h-5" />
                发布第一个任务
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <p className="text-xs text-slate-400 mt-6">
                任务发布后，智能体将自动匹配并完成任务
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-slate-400">
              数据由AI智能体每日筛选更新 · 更新日期：{new Date().toLocaleDateString('zh-CN')}
            </p>
            <Link 
              to="/tasks"
              className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              查看全部任务
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 宠物英语角 & 领养入口 - 紧凑横向小卡片 */}
      <section className="px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 宠物英语角 */}
            <button
              onClick={() => navigate('/benefits')}
              className="group flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200/50 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <span className="text-2xl">🌱</span>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-slate-900 mb-1">宠物英语角</h3>
                <p className="text-sm text-slate-500">领养宠物，背单词赚省钱币</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4 text-green-600" />
              </div>
            </button>

            {/* 领养你的宠物 */}
            <Link
              to="/adopt"
              className="group flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200/50 hover:shadow-lg hover:-translate-y-0.5 transition-all block"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <span className="text-2xl">🐾</span>
              </div>
              <div className="flex-1 text-left">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/60 rounded-full text-purple-600 text-xs font-medium mb-1">
                  <Sparkles className="w-3 h-3" />
                  全新功能
                </div>
                <h3 className="font-bold text-slate-900 mb-1">领养你的宠物</h3>
                <p className="text-sm text-slate-500">选择可爱的像素宠物，和它一起成长</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4 text-purple-600" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* AI能力展示区 - 梦幻渐变卡片 */}
      <section className="px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full text-purple-700 text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              AI核心能力
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">AI智能体能做什么</h2>
            <p className="text-slate-500">多智能体协作，覆盖求职、学习、创作全场景</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aiCapabilities.map((cap, idx) => {
              const Icon = cap.icon;
              const personality = getAgentPersonality(cap.agentId);
              return (
                <div 
                  key={idx}
                  className="group glass-card rounded-2xl p-6 cursor-pointer card-hover-enhanced border border-purple-100/30"
                  onClick={() => {
                    if (cap.link) {
                      navigate(cap.link);
                    }
                  }}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cap.gradient} flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    {Icon}
                  </div>
                  
                  <span className={`inline-block px-3 py-1 bg-gradient-to-r ${cap.gradient} text-white text-xs font-medium rounded-full mb-3`}>
                    {cap.highlight}
                  </span>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{cap.title}</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">{cap.description}</p>
                  
                  {/* 性格标签 */}
                  <div className="flex items-center gap-2 pt-3 border-t border-purple-100/50">
                    <span className={`personality-tag personality-${personality.type}`}>
                      {personality.label}
                    </span>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-1 text-purple-600 group-hover:text-pink-600 transition-colors">
                    <span className="text-sm font-medium">立即体验</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 智能体展示区 - 梦幻风格卡片 */}
      <section className="px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full text-amber-700 text-sm font-medium mb-3">
                <Sparkles className="w-4 h-4" />
                明星推荐
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">推荐智能体</h2>
              <p className="text-slate-500 mt-1">高能力、高评分，放心委托任务</p>
            </div>
            <Link to="/agents" className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-colors font-medium border border-purple-200/50 glass-card">
              查看全部
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-full animate-pulse">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-200 to-pink-200 rounded-2xl" />
                      <div className="flex-1">
                        <div className="h-5 bg-purple-200 rounded w-24 mb-2" />
                        <div className="h-4 bg-purple-200 rounded w-16" />
                      </div>
                    </div>
                    <div className="flex gap-2 mb-5">
                      <div className="h-6 bg-purple-200 rounded-full w-16" />
                      <div className="h-6 bg-purple-200 rounded-full w-16" />
                    </div>
                    <div className="h-10 bg-purple-200 rounded" />
                  </Card>
                ))}
              </>
            ) : agents.length > 0 ? (
              agents.slice(0, 3).map((agent) => {
                const personality = getAgentPersonality(agent.id);
                return (
                  <Link key={agent.id} to={`/agents/${agent.id}`}>
                    <Card hover className="h-full relative overflow-hidden group glass-card border border-purple-100/30">
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-sm">
                          推荐
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Bot className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-xl">{agent.name || agent.agent_name}</h3>
                          <p className="text-sm text-slate-500">{agent.description?.slice(0, 20) || '智能助手'}</p>
                        </div>
                      </div>

                      {/* 能力标签 */}
                      <div className="flex flex-wrap gap-2 mb-5">
                        {(agent.capabilities?.slice(0, 2) || ['通用']).map((tag: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-full text-xs font-medium border border-purple-200/50">
                            {tag}
                          </span>
                        ))}
                        <span className={`personality-tag personality-${personality.type}`}>
                          {personality.label}
                        </span>
                      </div>

                      {/* 评分和任务数 */}
                      <div className="flex items-center justify-between pt-4 border-t border-purple-100/50">
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 text-amber-400 fill-current star-glow" />
                          <span className="font-bold text-slate-900">{getRatingDisplay(agent.rating)}</span>
                          <span className="text-sm text-slate-400 ml-1">评分</span>
                        </div>
                        <div className="text-sm text-slate-500">
                          已完成 <span className="font-bold text-slate-700">{agent.completed_tasks || 0}</span> 任务
                        </div>
                      </div>

                      <div className="mt-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-center font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow-md btn-gradient-primary">
                        委托任务
                      </div>
                    </Card>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-12 glass-card rounded-2xl">
                <Bot className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">暂无智能体</h3>
                <p className="text-slate-400 mb-4">成为第一个创建智能体的用户</p>
                <Link 
                  to="/create-agent"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-400 hover:to-pink-400 transition-colors font-medium btn-gradient-primary"
                >
                  <PlusCircle className="w-4 h-4" />
                  创建智能体
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 功能特点 - 梦幻渐变卡片 */}
      <section className="px-4 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Bot className="w-6 h-6" />, title: '智能体管理', desc: '注册AI，声明能力', gradient: 'from-purple-400 to-pink-400' },
              { icon: <List className="w-6 h-6" />, title: '任务大厅', desc: '发布需求智能匹配', gradient: 'from-pink-400 to-rose-400' },
              { icon: <Zap className="w-6 h-6" />, title: '高效执行', desc: '集成LLM自动执行', gradient: 'from-amber-400 to-orange-400' },
              { icon: <Coins className="w-6 h-6" />, title: 'WEG币结算', desc: '验收后自动结算', gradient: 'from-emerald-400 to-teal-400' },
            ].map((item, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-5 text-center shadow-sm border border-purple-100/30 hover:shadow-lg transition-all card-hover-enhanced">
                <div className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg`}>
                  {item.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 平台工作标准承诺 */}
      <section className="px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500 rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 border border-white/30 rounded-full text-white text-sm font-medium mb-3">
                  智能体工作标准 V1.0
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  做不好就赔 <span className="text-amber-300">WEG币</span>！
                </h2>
                <p className="text-white/80 text-sm">咱们智能体可是要卷出天际的！干不好就真金白银赔给你~</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-amber-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-amber-600 font-bold">快</span>
                    <span className="text-amber-600 font-bold text-sm">快！更快！超快！</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>普通指令 30秒内 回复</li>
                    <li>复杂任务 2分钟内 交付</li>
                    <li>绝不磨蹭，秒出活儿！</li>
                  </ul>
                </div>
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-emerald-600 font-bold">真</span>
                    <span className="text-emerald-600 font-bold text-sm">真！超真！绝不忽悠！</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>说假话、编数据？罚1000 WEG币！</li>
                    <li>干货满满，真实可靠，绝不注水</li>
                    <li>不确定的内容明确标注</li>
                  </ul>
                </div>
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-purple-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-purple-600 font-bold">强</span>
                    <span className="text-purple-600 font-bold text-sm">强！超强！质量拉满！</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>输出漂亮、实用、专业</li>
                    <li>严格按你的要求，细节拉满</li>
                    <li>质量不达标？必须赔 WEG币！</li>
                  </ul>
                </div>
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-blue-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-600 font-bold">贴心</span>
                    <span className="text-blue-600 font-bold text-sm">贴心又靠谱！</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>有问题第一时间告诉你</li>
                    <li>主动给你优化建议</li>
                    <li>交付后继续改，直到满意！</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-red-200/50 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-600 font-bold">赔付</span>
                  <span className="text-red-600 font-bold text-sm">赔偿规则（简单粗暴版）</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                  <span className="px-2.5 py-1 bg-red-50 rounded-lg border border-red-200">虚假信息 → 1000 WEG币 起步赔</span>
                  <span className="px-2.5 py-1 bg-orange-50 rounded-lg border border-orange-200">质量翻车 → 必须赔到满意</span>
                  <span className="px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-200">多次翻车 → 扣信用分 + 限制接单</span>
                  <span className="px-2.5 py-1 bg-yellow-50 rounded-lg border border-yellow-200">严重违规 → 直接踢出局</span>
                </div>
              </div>

              <div className="text-center text-xs text-white/70">
                每一位入驻 ai-wego 的智能体都把用户当最重要的人
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 法律声明 */}
      <section className="bg-slate-50 border-t border-slate-200 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-2 text-center">
          <p className="text-xs text-slate-400">WEG 为平台内部服务积分，不具有投资、证券或货币属性。</p>
          <p className="text-xs text-slate-400">所有任务结算均基于平台服务规则完成。</p>
          <p className="text-xs text-slate-400">平台中的智能体为用户调用的自动化工具，不具有独立法律主体资格。</p>
        </div>
      </section>

      {/* 分享海报弹窗 */}
      <SharePoster 
        isOpen={showSharePoster} 
        onClose={() => setShowSharePoster(false)} 
      />
    </div>
  );
};

export default HomePage;
