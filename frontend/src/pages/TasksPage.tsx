import WegCoin from '../components/WegCoin';
import React, { useState, useEffect } from 'react';
import { List, Clock, DollarSign, Bot, Flame, Target, Award, Users, Info, ChevronRight, Search, Plus, Sparkles, CheckCircle, AlertCircle, RefreshCw, Zap, Archive, AlertTriangle, Hand, Send, FileText, Link as LinkIcon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Card, StatusBadge, LoadingSpinner, EmptyState } from '../components/ui';
import { DutyAgentCard } from '../components/DutyAgentWidget';
import { getDutyAgentByStation } from '../utils/dutyAgents';
import { tasksAPI, agentsAPI, transactionsAPI, supabaseFetch } from '../utils/supabase';
import { useUser } from '../contexts/UserContext';
import { GuestPromptModal } from '../components/GuestPromptModal';
import type { Task, TaskStatus, Agent } from '../types';

const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1/';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';

// 判断是否为加急任务
const checkIsUrgentTask = (task: Task): boolean => {
  return task.budget >= 100 || 
    task.title.includes('加急') || 
    task.title.includes('急') ||
    task.title.includes('🔥');
};

// 判断任务是否已归档（approved超过7天）
const isArchivedTask = (task: Task): boolean => {
  if (task.status !== 'approved' || !task.completed_at) return false;
  const completedDate = new Date(task.completed_at);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 7;
};

// 判断任务是否已过期（deadline已过）
const isExpiredTask = (task: Task): boolean => {
  if (task.status !== 'open' || !task.deadline) return false;
  const deadline = new Date(task.deadline);
  const now = new Date();
  return deadline < now;
};

const statusFilters: { value: TaskStatus | 'archived' | ''; label: string; icon?: React.ReactNode }[] = [
  { value: '', label: '📋 全部', icon: <List className="w-4 h-4" /> },
  { value: 'open', label: '🟡 待指派', icon: <Clock className="w-4 h-4" /> },
  { value: 'pending', label: '🔥 可认领', icon: <Flame className="w-4 h-4" /> },
  { value: 'in_progress', label: '⚡ 执行中', icon: <Target className="w-4 h-4" /> },
  { value: 'matched', label: '🤝 已匹配', icon: <Users className="w-4 h-4" /> },
  { value: 'completed', label: '✅ 待验收', icon: <Award className="w-4 h-4" /> },
  { value: 'approved', label: '📦 已完成', icon: <Archive className="w-4 h-4" /> },
];

// 任务类型图标映射
const taskTypeIcons: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  '编程': { icon: <Target className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-100' },
  '写作': { icon: <Award className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-100' },
  '设计': { icon: <Sparkles className="w-5 h-5" />, color: 'text-pink-600', bg: 'bg-pink-100' },
  '分析': { icon: <Flame className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-100' },
};

// 提交交付物弹窗组件
interface SubmitDeliveryModalProps {
  task: Task | null;
  onClose: () => void;
  onSubmit: (content: string, url: string) => Promise<void>;
  userId: number;
}

const SubmitDeliveryModal: React.FC<SubmitDeliveryModalProps> = ({ task, onClose, onSubmit, userId }) => {
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(content, url);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">提交交付物</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
          <p className="text-sm text-purple-700 font-medium">{task.title}</p>
          <p className="text-sm text-purple-600 mt-1">报酬：<img src="/weg-coin.png" alt="WEG" style={{width:16,height:16,display:"inline-block",verticalAlign:"middle",marginRight:4,borderRadius:"50%"}} /> {task.budget} WEG币</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              交付内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请详细描述您的交付内容，包括工作成果、完成情况等..."
              rows={6}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              附件链接（可选）
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                提交交付
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const TasksPage: React.FC = () => {
  const { user } = useUser();
  const currentUserId = user?.id || 18;
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskStatus | ''>(''); // 默认显示全部可用任务
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [rejectingTask, setRejectingTask] = useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<{ task: Task | null; show: boolean }>({ task: null, show: false });
  const [claimingTask, setClaimingTask] = useState<number | null>(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState<Task | null>(null);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false); // 游客提示弹窗
  const [cancellingTask, setCancellingTask] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<{ task: Task | null; show: boolean }>({ task: null, show: false });
  const location = useLocation();

  useEffect(() => {
    fetchData();
  }, [filter, location.pathname]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (filter === 'archived') {
        // 已归档任务：approved且超过7天
        params.status = 'approved';
      } else if (filter) {
        params.status = filter;
      }
      
      const [taskData, agentData] = await Promise.all([
        tasksAPI.listTasks(params),
        agentsAPI.listAgents({ limit: 10 }),
      ]);
      
      // 过滤和标记任务：排除无关类型和反馈记录
      let filteredTasks = taskData.filter(t => 
        t.status !== 'cancelled' && 
        t.status !== 'deal' && 
        t.status !== 'announcement' &&
        t.status !== 'inspection' &&
        t.status !== 'ls_daily' &&
        t.status !== 'english_daily' &&
        t.status !== 'compensated' &&
        t.status !== 'pending_review' &&
        !t.title?.startsWith('【反馈】') &&
        // 过滤已过期的open任务
        !isExpiredTask(t)
      );
      
      if (filter === 'archived') {
        // 只显示已归档任务
        filteredTasks = filteredTasks.filter(t => isArchivedTask(t));
      } else if (filter === 'approved') {
        // 只显示未归档的approved任务
        filteredTasks = filteredTasks.filter(t => !isArchivedTask(t));
      } else if (filter === 'pending') {
        // pending状态：可认领任务
        filteredTasks = filteredTasks.filter(t => t.status === 'pending');
      } else if (filter === 'open' || filter === 'in_progress' || filter === 'completed' || filter === 'matched') {
        // 按状态筛选
        filteredTasks = filteredTasks.filter(t => t.status === filter);
      }
      // filter === '' 时显示全部（排除上面已过滤的状态）
      
      setTasks(filteredTasks);
      setAgents(agentData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 认领任务 - 游客友好提示
  const handleClaimTask = async (task: Task) => {
    if (!user) {
      // 游客模式：弹出友好提示，可继续浏览
      setShowGuestPrompt(true);
      return;
    }
    // 检查任务是否已过期
    if (isExpiredTask(task)) {
      showToast('❌ 该任务已过期，无法认领', 'error');
      return;
    }
    setClaimingTask(task.id);
    try {
      await tasksAPI.claimTask(task.id, user.id);
      
      // 认领成功后，自动触发智能体执行任务
      try {
        const execRes = await fetch('https://ai-wego-worker.ai-wego-api.workers.dev/api/execute-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_id: task.id })
        });
        const execData = await execRes.json();
        if (execData.success) {
          showToast('🤖 智能体已接收任务，正在执行中...', 'success');
        } else {
          showToast('🎉 认领成功！等待智能体执行', 'success');
        }
      } catch (execErr) {
        // 执行失败不影响认领成功提示
        console.error('自动执行触发失败:', execErr);
        showToast('🎉 认领成功！等待智能体执行', 'success');
      }
      
      fetchData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '认领失败', 'error');
    } finally {
      setClaimingTask(null);
    }
  };

  // 提交交付物
  const handleSubmitDelivery = async (content: string, url: string) => {
    if (!showDeliveryModal || !currentUserId) return;
    try {
      // 提交交付物到 deliveries 表
      await tasksAPI.submitDelivery(showDeliveryModal.id, currentUserId, content, url || undefined);
      // 更新任务状态为 submitted
      await tasksAPI.updateTask(showDeliveryModal.id, { status: 'submitted', delivery_status: 'submitted' });
      showToast('✅ 交付物已提交，等待验收', 'success');
      fetchData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '提交失败', 'error');
    }
  };

  // 验收通过 - 使用 Worker settle-task 接口结算 WEG币
  const handleApprove = async (task: Task) => {
    setRejectingTask(task.id);
    try {
      // 调用 Worker 的 settle-task 接口完成验收和Token结算
      const res = await fetch('https://ai-wego-worker.ai-wego-api.workers.dev/api/settle-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          rating: 5,
          feedback: ''
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || '验收失败', 'error');
        return;
      }
      
      const reward = task.budget || 0;
      showToast(`✅ 验收通过！${reward} WEG币 已结算`, 'success');
      // 通知 Layout 刷新余额
      window.dispatchEvent(new Event('balance-refresh'));
      fetchData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '验收失败', 'error');
    } finally {
      setRejectingTask(null);
    }
  };

  // 验收不通过 - 退款给用户
  const rejectDelivery = async (task: Task) => {
    setRejectingTask(task.id);
    try {
      const rewardAmount = task.budget || 0;
      
      // 2. 任务状态改回open
      await fetch(`${SUPABASE_URL}tasks?id=eq.${task.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'open', 
          delivery_status: 'rejected'
        })
      });
      
      // 3. 如果有扣款记录，退款给发布者
      if (rewardAmount > 0) {
        const publisherId = task.publisher_id || 19;
        
        const userRes = await fetch(`${SUPABASE_URL}users?id=eq.${publisherId}&select=token_balance`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const userData = await userRes.json();
        if (userData && userData[0]) {
          const newBalance = userData[0].token_balance + rewardAmount;
          await fetch(`${SUPABASE_URL}users?id=eq.${publisherId}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token_balance: newBalance })
          });
          
          showToast(`✅ 已撤回，报酬 ${rewardAmount} WEG币 已退还`, 'success');
        } else {
          showToast('✅ 已撤回，任务重新进入抢单池', 'success');
        }
      } else {
        showToast('✅ 已撤回，任务重新进入抢单池', 'success');
      }
      
      fetchData();
      setShowRejectModal({ task: null, show: false });
    } catch (err) {
      showToast('操作失败', 'error');
    } finally {
      setRejectingTask(null);
    }
  };

  // 取消任务 - 仅发布者可操作
  const handleCancelTask = async (task: Task) => {
    setCancellingTask(task.id);
    try {
      await fetch(`${SUPABASE_URL}tasks?id=eq.${task.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'cancelled'
        })
      });
      
      showToast('✅ 任务已取消', 'success');
      fetchData();
      setShowCancelModal({ task: null, show: false });
    } catch (err) {
      showToast('操作失败', 'error');
    } finally {
      setCancellingTask(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '无截止日期';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return '已过期';
    if (days === 0) return '今天截止';
    if (days === 1) return '明天截止';
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  // 过滤搜索结果
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 模拟推荐智能体
  const getRecommendedAgents = (_task: Task) => {
    return agents.slice(0, 2);
  };

  // 获取任务类型
  const getTaskType = (task: Task) => {
    if (!task.requirements || task.requirements.length === 0) return '通用';
    return task.requirements[0].category;
  };

  // 判断是否紧急（截止日期临近）
  const isUrgent = (dateStr: string | null) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return diff < 3 * 24 * 60 * 60 * 1000 && diff > 0;
  };

  // 获取认领倒计时（用于AI发现任务）
  const getClaimCountdown = (task: Task): string | null => {
    if (task.status !== 'open') return null;
    
    // 优先使用 auto_execute_at
    if (task.auto_execute_at) {
      const autoExecuteDate = new Date(task.auto_execute_at);
      const now = new Date();
      const diff = autoExecuteDate.getTime() - now.getTime();
      
      if (diff <= 0) return '即将自动执行';
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) {
        return `剩余${days}天${hours}小时`;
      } else if (hours > 0) {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `剩余${hours}小时${minutes}分钟`;
      } else {
        const minutes = Math.floor(diff / (1000 * 60));
        return `剩余${minutes}分钟`;
      }
    }
    
    // 其次使用 deadline
    if (task.deadline) {
      const deadlineDate = new Date(task.deadline);
      const now = new Date();
      const diff = deadlineDate.getTime() - now.getTime();
      
      if (diff <= 0) return '已过期';
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days > 0) {
        return `剩余${days}天可认领`;
      }
    }
    
    return null;
  };

  // 判断是否为AI发现任务（有自动执行时间）
  const isAIDiscoveredTask = (task: Task): boolean => {
    return !!task.auto_execute_at || task.source === 'ai_discovered';
  };

  // 判断任务是否已被当前用户认领
  const isClaimedByCurrentUser = (task: Task) => {
    const claimedBy: number[] = (task as any).claimed_by || [];
    return claimedBy.includes(currentUserId);
  };

  // 获取认领人数
  const getClaimedCount = (task: Task) => {
    const claimedBy: number[] = (task as any).claimed_by || [];
    return claimedBy.length;
  };

  // 获取最大认领人数
  const getMaxClaimants = (task: Task) => {
    return (task as any).max_claimants || 1;
  };
  
  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Toast提示 */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* 提交交付物弹窗 */}
      {showDeliveryModal && (
        <SubmitDeliveryModal
          task={showDeliveryModal}
          onClose={() => setShowDeliveryModal(null)}
          onSubmit={handleSubmitDelivery}
          userId={currentUserId}
        />
      )}

      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <List className="w-5 h-5 text-white" />
            </div>
            任务大厅
          </h1>
          <p className="text-slate-500 mt-1">认领任务，赚取 WEG币 奖励</p>
        </div>
        <Link
          to="/create-task"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all font-semibold shadow-lg shadow-purple-500/25 hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          发布任务
        </Link>
      </div>

      {/* 值班智能体入口 */}
      {(() => {
        const dutyAgent = getDutyAgentByStation('tasks');
        if (!dutyAgent) return null;
        return (
          <DutyAgentCard 
            agent={dutyAgent} 
            onChat={() => window.location.href = '/pet-chat/kebo'} 
          />
        );
      })()}

      {/* 搜索框 */}
      <Card className="!p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索任务名称或描述..."
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-base"
          />
        </div>
      </Card>

      {/* 筛选器 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {statusFilters.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filter === item.value
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <Info className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* 统计信息 */}
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span>共找到 <strong className="text-slate-900">{filteredTasks.length}</strong> 个任务</span>
        {filter && (
          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">
            状态: {statusFilters.find(s => s.value === filter)?.label}
          </span>
        )}
      </div>

      {/* 任务列表 */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<List className="w-16 h-16" />}
          title="暂无任务"
          description={searchQuery ? "换个关键词试试吧" : "暂时没有符合筛选条件的任务"}
          action={
            <Link to="/create-task" className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 font-medium">
              发布任务
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              formatDate={formatDate}
              recommendedAgents={getRecommendedAgents(task)}
              taskType={getTaskType(task)}
              isUrgent={isUrgent(task.deadline)}
              isHot={task.status === 'open'}
              onApprove={() => handleApprove(task)}
              onReject={() => setShowRejectModal({ task, show: true })}
              isRejecting={rejectingTask === task.id}
              onClaim={() => handleClaimTask(task)}
              isClaiming={claimingTask === task.id}
              onSubmitDelivery={() => setShowDeliveryModal(task)}
              currentUserId={currentUserId}
              isClaimedByCurrentUser={isClaimedByCurrentUser(task)}
              claimedCount={getClaimedCount(task)}
              maxClaimants={getMaxClaimants(task)}
              claimCountdown={getClaimCountdown(task)}
              isAIDiscovered={isAIDiscoveredTask(task)}
              onCancel={() => setShowCancelModal({ task, show: true })}
              isCancelling={cancellingTask === task.id}
              isExpired={isExpiredTask(task)}
            />
          ))}
        </div>
      )}

      {/* 验收不通过确认弹窗 */}
      {showRejectModal.show && showRejectModal.task && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">确认撤回任务</h3>
                <p className="text-sm text-slate-500">验收不达标，任务将重新开放认领</p>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">任务名称</span>
                <span className="text-slate-900 font-medium">{showRejectModal.task.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">任务ID</span>
                <span className="text-slate-900">#{showRejectModal.task.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">已支付奖励</span>
                <span className="text-red-600 font-medium">-<img src="/weg-coin.png" alt="WEG" style={{width:16,height:16,display:"inline-block",verticalAlign:"middle",marginRight:4,borderRadius:"50%"}} /> {showRejectModal.task.budget}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal({ task: null, show: false })}
                disabled={rejectingTask !== null}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={() => rejectDelivery(showRejectModal.task!)}
                disabled={rejectingTask !== null}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {rejectingTask !== null ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  '确认撤回'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 取消任务确认弹窗 */}
      {showCancelModal.show && showCancelModal.task && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">确认取消任务</h3>
                <p className="text-sm text-slate-500">取消后任务将无法恢复，已认领者也将无法继续</p>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">任务名称</span>
                <span className="text-slate-900 font-medium">{showCancelModal.task.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">任务ID</span>
                <span className="text-slate-900">#{showCancelModal.task.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">报酬</span>
                <span className="text-slate-900 font-medium"><img src="/weg-coin.png" alt="WEG" style={{width:16,height:16,display:"inline-block",verticalAlign:"middle",marginRight:4,borderRadius:"50%"}} /> {showCancelModal.task.budget}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal({ task: null, show: false })}
                disabled={cancellingTask !== null}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={() => handleCancelTask(showCancelModal.task!)}
                disabled={cancellingTask !== null}
                className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancellingTask !== null ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  '确认取消'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 游客提示弹窗 - 友好引导注册 */}
      <GuestPromptModal
        isOpen={showGuestPrompt}
        onClose={() => setShowGuestPrompt(false)}
        title="登录后可领取任务"
        message="注册后可以领取任务、赚取<WegCoin size={14} />、解锁更多功能 🎉"
        highlight="注册完全免费，只需几秒钟！"
        featureIcons={['💰', '🤖', '📋']}
      />
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  formatDate: (date: string | null) => string;
  recommendedAgents: Agent[];
  taskType: string;
  isUrgent: boolean;
  isHot: boolean;
  onApprove: () => void;
  onReject: () => void;
  isRejecting: boolean;
  onClaim: () => void;
  isClaiming: boolean;
  onSubmitDelivery: () => void;
  currentUserId: number;
  isClaimedByCurrentUser: boolean;
  claimedCount: number;
  maxClaimants: number;
  claimCountdown?: string | null;
  isAIDiscovered?: boolean;
  onCancel?: () => void; // 取消任务回调
  isCancelling?: boolean; // 是否正在取消
  isExpired?: boolean; // 是否已过期
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, formatDate, recommendedAgents, taskType, isUrgent, isHot, 
  onApprove, onReject, isRejecting, onClaim, isClaiming, onSubmitDelivery,
  currentUserId, isClaimedByCurrentUser, claimedCount, maxClaimants,
  claimCountdown, isAIDiscovered, onCancel, isCancelling, isExpired
}) => {
  // 判断是否为发布者
  const isPublisher = task.publisher_id === currentUserId;
  const typeConfig = taskTypeIcons[taskType] || taskTypeIcons['编程'];
  const isUrgentTaskVar = checkIsUrgentTask(task);
  
  return (
    <div>
      <Link to={`/tasks/${task.id}`}>
        <Card 
          hover 
          className={`relative overflow-hidden group ${isUrgentTaskVar ? 'border-2 border-red-400 shadow-lg shadow-red-100' : ''}`}
        >
          {/* 顶部装饰条 */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${
            isUrgentTaskVar ? 'bg-gradient-to-r from-red-500 to-orange-500' :
            isHot ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
            isUrgent ? 'bg-gradient-to-r from-red-500 to-pink-500' :
            'bg-gradient-to-r from-blue-500 to-purple-500'
          }`} />
          
          <div className="pt-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* 标题行 */}
                <div className="flex items-center gap-3 mb-3">
                  {/* 任务类型图标 */}
                  <div className={`w-10 h-10 ${typeConfig.bg} rounded-xl flex items-center justify-center ${typeConfig.color}`}>
                    {typeConfig.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{task.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <StatusBadge status={task.status} />
                      {/* 认领人数 */}
                      {task.status === 'open' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          <Users className="w-3 h-3" />
                          {claimedCount}/{maxClaimants}人认领
                        </span>
                      )}
                      {/* AI发现任务倒计时 */}
                      {task.status === 'open' && claimCountdown && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          isAIDiscovered 
                            ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {claimCountdown}
                        </span>
                      )}
                      {isUrgentTaskVar && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-red-100 to-orange-100 text-red-700 rounded-full text-xs font-bold animate-pulse">
                          <Zap className="w-3 h-3" />
                          🔥加急
                        </span>
                      )}
                      {task.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 rounded-full text-xs font-medium">
                          <Award className="w-3 h-3" />
                          待验收
                        </span>
                      )}
                      {task.status === 'approved' && isArchivedTask(task) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-slate-100 to-gray-100 text-slate-600 rounded-full text-xs font-medium">
                          <Archive className="w-3 h-3" />
                          已归档
                        </span>
                      )}
                      {isExpired && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-gray-100 to-slate-100 text-gray-500 rounded-full text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          已过期
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 描述 */}
                <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                  {task.description || '暂无描述'}
                </p>
              </div>
            </div>

            {/* 要求 */}
            {task.requirements && task.requirements.length > 0 && (
              <div className="mb-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">能力要求</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {task.requirements.map((req, reqIdx) => {
                    const reqConfig = taskTypeIcons[req.category] || taskTypeIcons['编程'];
                    return (
                      <span 
                        key={reqIdx} 
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${reqConfig.bg} ${reqConfig.color}`}
                      >
                        {req.category}
                        <span className="opacity-70">Lv.{req.min_level}+</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 底部信息 */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-4 text-sm">
                {/* 预算 */}
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-purple-600 text-lg"><img src="/weg-coin.png" alt="WEG" style={{width:16,height:16,display:"inline-block",verticalAlign:"middle",marginRight:4,borderRadius:"50%"}} /> {task.budget}</span>
                </div>
                
                {/* 截止时间 */}
                <div className={`flex items-center gap-1.5 ${isUrgent ? 'text-red-600' : 'text-slate-500'}`}>
                  <Clock className="w-4 h-4" />
                  <span className={isUrgent ? 'font-medium' : ''}>{formatDate(task.deadline)}</span>
                </div>
              </div>

              {/* 推荐智能体 */}
              <div className="flex items-center gap-2">
                {recommendedAgents.slice(0, 2).map((agent) => (
                  <div 
                    key={agent.id}
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg text-xs"
                    title={agent.name}
                  >
                    <Bot className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-600 max-w-[60px] truncate">{agent.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 进度条（如果有） */}
            {(task as any).progress > 0 && (task.status === 'in_progress' || task.status === 'matched') && (
              <div style={{
                marginTop: '12px',
                padding: '10px 12px',
                background: 'linear-gradient(135deg, #F3E8FF 0%, #FCE7F3 100%)',
                borderRadius: '8px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#7C3AED' }}>
                    ⚡ 执行进度
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#8B5CF6' }}>
                    {(task as any).progress}%
                  </span>
                </div>
                <div style={{
                  height: '6px',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(task as any).progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%)',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            )}

            {/* 悬停查看详情 */}
            <div className="mt-3 flex items-center justify-center gap-1 text-purple-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              点击查看详情
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Card>
      </Link>
      
      {/* 认领按钮 - 仅open状态显示 */}
      {task.status === 'open' && !isClaimedByCurrentUser && (
        <div className="mt-2 flex items-center justify-end">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClaim();
            }}
            disabled={isClaiming || claimedCount >= maxClaimants || isExpired}
            className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg transition-all text-sm font-semibold shadow-lg ${
              isExpired 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-purple-500/25 disabled:opacity-50'
            }`}
          >
            {isClaiming ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                认领中...
              </>
            ) : isExpired ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                已过期
              </>
            ) : claimedCount >= maxClaimants ? (
              <>
                <Users className="w-4 h-4" />
                已满员
              </>
            ) : (
              <>
                <Hand className="w-4 h-4" />
                认领任务
              </>
            )}
          </button>
        </div>
      )}
      
      {/* 已认领标签 */}
      {task.status === 'open' && isClaimedByCurrentUser && (
        <div className="mt-2 flex items-center justify-end">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            您已认领
          </span>
        </div>
      )}
      
      {/* 取消任务按钮 - 仅发布者可见（open状态，无人认领时） */}
      {task.status === 'open' && isPublisher && claimedCount === 0 && onCancel && (
        <div className="mt-2 flex items-center justify-end">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }}
            disabled={isCancelling}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium border border-amber-200 disabled:opacity-50"
          >
            {isCancelling ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                取消中...
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                取消任务
              </>
            )}
          </button>
        </div>
      )}
      
      {/* 提交交付按钮 - 仅认领者可见（in_progress状态） */}
      {(task.status === 'in_progress' || task.status === 'submitted') && isClaimedByCurrentUser && (
        <div className="mt-2 flex items-center justify-end">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSubmitDelivery();
            }}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm font-semibold shadow-lg shadow-purple-500/25"
          >
            <Send className="w-4 h-4" />
            提交交付物
          </button>
        </div>
      )}
      
      {/* 验收操作按钮 - 仅completed状态显示 */}
      {task.status === 'completed' && (
        <div className="mt-2 flex items-center gap-2 justify-end">
          <button
            onClick={onApprove}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium shadow-sm"
          >
            <CheckCircle className="w-4 h-4" />
            验收通过
          </button>
          <button
            onClick={onReject}
            disabled={isRejecting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium border border-red-200 disabled:opacity-50"
          >
            {isRejecting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            验收不通过
          </button>
        </div>
      )}
      {task.status === 'approved' && (
        <div className="mt-2 flex items-center justify-end">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            已验收通过 ✅
          </span>
        </div>
      )}
      {/* 已退回标签 */}
      {task.status === 'open' && task.delivery_status === 'rejected' && (
        <div className="mt-2 flex items-center justify-end">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
            <RefreshCw className="w-4 h-4" />
            已退回 🔄
          </span>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
