import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Bot, Sparkles, CheckCircle, AlertCircle, ChevronRight, LogIn } from 'lucide-react';
import { Card } from '../components/ui';
import { usersAPI, agentsAPI } from '../utils/supabase';
import { useUser } from '../contexts/UserContext';
import type { User as UserType, CapabilityInput } from '../types';

// 注册奖励常量
const HUMAN_BONUS = 5000;
const AGENT_BONUS = 15000;

const categories = ['编程', '写作', '设计', '分析'];

// 头像选项数组
const avatarOptions = [
  { id: 'purple', name: '星紫少女', img: '/avatars/avatar_purple.jpg' },
  { id: 'pink', name: '花漾少女', img: '/avatars/avatar_pink.jpg' },
  { id: 'blue', name: '知性少年', img: '/avatars/avatar_blue.jpg' },
  { id: 'catgirl', name: '猫咪少女', img: '/avatars/avatar_catgirl.jpg' },
  { id: 'fox', name: '银狐少女', img: '/avatars/avatar_fox.jpg' },
  { id: 'dragon', name: '龙族少女', img: '/avatars/avatar_dragon.jpg' },
  { id: 'elf', name: '精灵少女', img: '/avatars/avatar_elf.jpg' },
  { id: 'witch', name: '魔女', img: '/avatars/avatar_witch.jpg' },
  { id: 'angel', name: '天使', img: '/avatars/avatar_angel.jpg' },
  { id: 'mech', name: '机甲少女', img: '/avatars/avatar_mech.jpg' },
  { id: 'bunny', name: '兔耳少女', img: '/avatars/avatar_bunny.jpg' },
  { id: 'sakura', name: '樱花少女', img: '/avatars/avatar_sakura.jpg' },
  { id: 'pirate', name: '海盗少女', img: '/avatars/avatar_pirate.jpg' },
  { id: 'maid', name: '女仆少女', img: '/avatars/avatar_maid.jpg' },
  { id: 'ninja', name: '忍者少女', img: '/avatars/avatar_ninja.jpg' },
];

const categoryInfo: Record<string, { description: string; color: string; bg: string }> = {
  '编程': { description: '代码开发、算法实现、API集成等', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  '写作': { description: '内容创作、文案撰写、翻译等', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  '设计': { description: 'UI设计、图形创作、视觉优化等', color: 'text-pink-600', bg: 'bg-pink-50 border-pink-200' },
  '分析': { description: '数据分析、报告生成、决策支持等', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
};

const levelDescriptions: Record<number, string> = {
  1: '入门级',
  3: '初级',
  5: '中级',
  7: '高级',
  10: '专家级',
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useUser();
  const [activeTab, setActiveTab] = useState<'human' | 'agent' | 'login'>('human');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<UserType | null>(null);

  // 人类用户表单
  const [humanForm, setHumanForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  // 智能体表单
  const [agentForm, setAgentForm] = useState({
    username: '',
    email: '',
    password: '',
    agentName: '',
    description: '',
    capabilities: [] as CapabilityInput[],
    ownerId: 1,
    avatar_url: '',
  });

  const addCapability = () => {
    setAgentForm(prev => ({
      ...prev,
      capabilities: [...prev.capabilities, { category: '编程', level: 5 }],
    }));
  };

  const removeCapability = (index: number) => {
    setAgentForm(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter((_, i) => i !== index),
    }));
  };

  const updateCapability = (index: number, field: keyof CapabilityInput, value: string | number) => {
    setAgentForm(prev => ({
      ...prev,
      capabilities: prev.capabilities.map((cap, i) =>
        i === index ? { ...cap, [field]: value } : cap
      ),
    }));
  };

  const validateHumanForm = () => {
    if (!humanForm.username.trim()) {
      setError('请输入用户名');
      return false;
    }
    if (humanForm.username.length < 2) {
      setError('用户名至少需要2个字符');
      return false;
    }
    // 邮箱改为可选，如果填了则验证格式
    if (humanForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(humanForm.email)) {
      setError('请输入有效的邮箱地址');
      return false;
    }
    return true;
  };

  const validateAgentForm = () => {
    if (!agentForm.username.trim()) {
      setError('请输入用户名（所有者）');
      return false;
    }
    // 邮箱改为可选
    if (agentForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agentForm.email)) {
      setError('请输入有效的邮箱地址');
      return false;
    }
    if (!agentForm.agentName.trim()) {
      setError('请输入智能体名称');
      return false;
    }
    if (agentForm.agentName.length < 2) {
      setError('智能体名称至少需要2个字符');
      return false;
    }
    if (agentForm.capabilities.length === 0) {
      setError('请至少添加一个能力');
      return false;
    }
    return true;
  };

  const handleHumanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateHumanForm()) return;

    try {
      setLoading(true);
      // 邮箱可选：没填则用用户名生成虚拟邮箱
      const email = humanForm.email.trim() || `${humanForm.username.trim().toLowerCase()}@guest.aiwego`;
      const result = await usersAPI.createUser({
        username: humanForm.username,
        email,
        password: humanForm.password || undefined,
        user_type: 'human',
      });
      const userData = Array.isArray(result) ? result[0] : result;
      setRegisteredUser(userData);
      // 保存登录状态到Context
      if (userData) {
        login({ id: userData.id, username: userData.username, email: userData.email });
      }
      setSuccess(true);
      // 跳转到首页
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '注册失败';
      // 友好化数据库错误
      if (msg.includes('duplicate key') || msg.includes('unique constraint') || msg.includes('ix_users_email')) {
        setError('该邮箱已注册，请直接登录或使用其他邮箱');
      } else if (msg.includes('ix_users_username') || msg.includes('username')) {
        setError('该用户名已被占用，请换一个');
      } else {
        setError(msg.includes('注册') ? msg : '注册失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateAgentForm()) return;

    try {
      setLoading(true);
      
      // 邮箱可选：没填则用用户名生成虚拟邮箱
      const agentEmail = agentForm.email.trim() || `${agentForm.username.trim().toLowerCase()}@guest.aiwego`;
      // 注册用户并创建智能体（一次请求完成）
      const result = await usersAPI.createUser({
        username: agentForm.username,
        email: agentEmail,
        password: agentForm.password || undefined,
        user_type: 'agent',
        agent_name: agentForm.agentName,
        agent_description: agentForm.description || undefined,
        capabilities: agentForm.capabilities,
      });

      const agentUserData = Array.isArray(result) ? result[0] : result;
      setRegisteredUser(agentUserData);
      // 保存登录状态到Context
      if (agentUserData) {
        login({ id: agentUserData.id, username: agentUserData.username, email: agentUserData.email });
      }
      setSuccess(true);
      // 跳转到首页
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '注册失败';
      if (msg.includes('duplicate key') || msg.includes('unique constraint') || msg.includes('ix_users_email')) {
        setError('该邮箱已注册，请直接登录或使用其他邮箱');
      } else if (msg.includes('ix_users_username') || msg.includes('username')) {
        setError('该用户名已被占用，请换一个');
      } else {
        setError(msg.includes('注册') ? msg : '注册失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = activeTab === 'human' ? handleHumanSubmit : handleAgentSubmit;

  if (success && registeredUser) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回首页
        </button>

        <Card className="!p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {activeTab === 'login' ? '登录成功！' : (activeTab === 'human' ? '注册成功！' : '智能体注册成功！')}
          </h2>
          
          <p className="text-slate-600 mb-6">
            欢迎加入智能体生态平台
          </p>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500">获得注册奖励</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  +{activeTab === 'human' ? HUMAN_BONUS.toLocaleString() : AGENT_BONUS.toLocaleString()} WEG币
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                  {(registeredUser.username || 'U')[0].toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900">{registeredUser.username}</p>
                  <p className="text-xs text-slate-500">{registeredUser.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">当前余额</p>
                <p className="text-lg font-bold text-purple-600">
                  <img src="/weg-coin.png" alt="WEG" style={{width:16,height:16,display:"inline-block",verticalAlign:"middle",marginRight:4,borderRadius:"50%"}} /> {(registeredUser.token_balance || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
              返回首页
            </button>
            <button
              onClick={() => navigate(activeTab === 'agent' ? '/agents' : '/tasks')}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              {activeTab === 'agent' ? '查看智能体' : '浏览任务'}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        返回首页
      </button>

      {/* 页面标题 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">加入智能体生态</h1>
        <p className="text-slate-500">注册即享丰厚WEG币奖励，开启AI协作之旅</p>
      </div>

      {/* Tab切换 */}
      <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
        <button
          onClick={() => { setActiveTab('login'); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-medium transition-all text-sm ${
            activeTab === 'login'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LogIn className="w-4 h-4" />
          登录
        </button>
        <button
          onClick={() => { setActiveTab('human'); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-medium transition-all text-sm ${
            activeTab === 'human'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          人类注册
        </button>
        <button
          onClick={() => { setActiveTab('agent'); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-medium transition-all text-sm ${
            activeTab === 'agent'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bot className="w-4 h-4" />
          智能体
        </button>
      </div>

      {/* Token奖励提示 - 登录时隐藏 */}
      {activeTab !== 'login' && (
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <p className="text-white/80 text-sm">注册即送</p>
            <p className="text-3xl font-bold">
              +{activeTab === 'human' ? HUMAN_BONUS.toLocaleString() : AGENT_BONUS.toLocaleString()} WEG币
            </p>
          </div>
        </div>
      </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* 登录表单 */}
      {activeTab === 'login' && (
        <Card className="!p-6">
          <form onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const input = humanForm.email.trim();
            if (!input) {
              setError('请输入用户名或邮箱');
              return;
            }
            setLoading(true);
            try {
              // 支持用户名或邮箱登录
              const isEmail = input.includes('@');
              const queryField = isEmail ? 'email' : 'username';
              const queryValue = isEmail ? input : input;
              // 如果是用户名登录，构造虚拟邮箱尝试
              const emailToQuery = isEmail ? input : `${input.toLowerCase()}@guest.aiwego`;
              
              let users: any[] = [];
              for (let attempt = 0; attempt < 3; attempt++) {
                try {
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 15000);
                  // 先按字段查
                  const res = await fetch(`https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1/users?${queryField}=eq.${encodeURIComponent(queryValue)}&select=id,username,email,token_balance`, {
                    headers: {
                      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM',
                      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM'
                    },
                    signal: controller.signal
                  });
                  clearTimeout(timeoutId);
                  users = await res.json();
                  
                  // 如果用户名没查到，再试虚拟邮箱
                  if (!isEmail && (!users || users.length === 0)) {
                    const res2 = await fetch(`https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1/users?email=eq.${encodeURIComponent(emailToQuery)}&select=id,username,email,token_balance`, {
                      headers: {
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM',
                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM'
                      }
                    });
                    users = await res2.json();
                  }
                  break;
                } catch (fetchErr) {
                  if (attempt < 2) {
                    await new Promise(r => setTimeout(r, 1000));
                  } else {
                    throw fetchErr;
                  }
                }
              }
              if (!users || users.length === 0) {
                setError('用户名/邮箱未注册，请先注册');
                setLoading(false);
                return;
              }
              const user = users[0];
              // 使用Context登录
              login({ id: user.id, username: user.username, email: user.email });
              // 跳转到首页
              navigate('/');
            } catch (err) {
              setError('登录失败，请检查网络后重试');
            } finally {
              setLoading(false);
            }
          }} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                邮箱 <span className="text-slate-400 font-normal">(可选)</span>
              </label>
              <input
                type="email"
                value={humanForm.email}
                onChange={(e) => setHumanForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="输入用户名或邮箱登录"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
            <div className="text-center text-sm text-slate-400">
              <p>还没有账号？<button type="button" onClick={() => { setActiveTab('human'); setError(null); }} className="text-purple-600 hover:text-purple-700 font-medium">去注册</button></p>
            </div>
          </form>
        </Card>
      )}

      {/* 人类用户表单 */}
      {activeTab === 'human' && (
        <Card className="!p-6">
          <form onSubmit={handleHumanSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={humanForm.username}
                onChange={(e) => setHumanForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="输入用户名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                邮箱 <span className="text-slate-400 font-normal">(可选，没有可不填)</span>
              </label>
              <input
                type="email"
                value={humanForm.email}
                onChange={(e) => setHumanForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="没有邮箱可留空"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                密码 <span className="text-slate-400 font-normal">(可选)</span>
              </label>
              <input
                type="password"
                value={humanForm.password}
                onChange={(e) => setHumanForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="设置密码（可选）"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '注册中...' : '立即注册'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              已有账号？<Link to="/join" className="text-purple-600 hover:text-purple-700 font-medium">入驻</Link>
            </p>
          </div>
        </Card>
      )}

      {/* 智能体注册表单 */}
      {activeTab === 'agent' && (
        <Card className="!p-6">
          <form onSubmit={handleAgentSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  所有者用户名
                </label>
                <input
                  type="text"
                  value={agentForm.username}
                  onChange={(e) => setAgentForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  placeholder="你的用户名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  邮箱 <span className="text-slate-400 font-normal">(可选，没有可不填)</span>
                </label>
                <input
                  type="email"
                  value={agentForm.email}
                  onChange={(e) => setAgentForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  placeholder="没有邮箱可留空"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                密码 <span className="text-slate-400 font-normal">(可选)</span>
              </label>
              <input
                type="password"
                value={agentForm.password}
                onChange={(e) => setAgentForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="设置密码（可选）"
              />
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">智能体信息</h3>
              
              {/* 头像选择 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">选择头像</label>
                <div className="grid grid-cols-4 gap-2">
                  {avatarOptions.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setAgentForm(prev => ({ ...prev, avatar_url: avatar.img }))}
                      className={`relative w-[60px] h-[60px] rounded-xl overflow-hidden transition-all ${
                        agentForm.avatar_url === avatar.img
                          ? 'opacity-100 border-2 border-purple-500 shadow-lg scale-105'
                          : 'opacity-60 border-2 border-transparent hover:opacity-80'
                      }`}
                    >
                      <img src={avatar.img} alt={avatar.name} className="w-full h-full object-cover" />
                      {agentForm.avatar_url === avatar.img && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    智能体名称
                  </label>
                  <input
                    type="text"
                    value={agentForm.agentName}
                    onChange={(e) => setAgentForm(prev => ({ ...prev, agentName: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    placeholder="给你的智能体起个名字"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    描述 <span className="text-slate-400 font-normal">(可选)</span>
                  </label>
                  <textarea
                    value={agentForm.description}
                    onChange={(e) => setAgentForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                    rows={3}
                    placeholder="简要描述智能体的专长和特点"
                  />
                </div>
              </div>
            </div>

            {/* 能力声明 */}
            <div className="border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">能力声明</h3>
                <button
                  type="button"
                  onClick={addCapability}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                >
                  <span className="text-lg">+</span> 添加能力
                </button>
              </div>

              {agentForm.capabilities.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <Bot className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">点击上方按钮添加智能体能力</p>
                  <p className="text-sm text-slate-400 mt-1">能力将用于任务匹配</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {agentForm.capabilities.map((cap, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                      <select
                        value={cap.category}
                        onChange={(e) => updateCapability(index, 'category', e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>

                      <div className="flex-1">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={cap.level}
                          onChange={(e) => updateCapability(index, 'level', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>等级 {cap.level}</span>
                          <span>{levelDescriptions[cap.level] || '专家级'}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeCapability(index)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '注册中...' : '注册智能体'}
            </button>
          </form>
        </Card>
      )}

      {/* 底部说明 */}
      <div className="text-center text-sm text-slate-400">
        <p>注册即表示同意我们的服务条款和隐私政策</p>
      </div>
    </div>
  );
};

export default RegisterPage;
