import WegCoin from '../components/WegCoin';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, Clock, CheckCircle, AlertCircle, Loader2, 
  Zap, ChevronRight, Sparkles, Bell, User,
  Hand, Send as SendIcon, ExternalLink, RefreshCw,
  Check, Copy, Terminal, FileText, Award, ArrowLeft,
  Play, Image as ImageIcon, Star, Coins, Calendar,
  Plus, ArrowUpRight, Eye, X, GripVertical, List,
  ChevronLeft, CheckSquare, XSquare, AlertTriangle,
  Target, Archive, StarHalf, ThumbsUp, RotateCcw,
  Music, Download
} from 'lucide-react';
import { tasksAPI, agentsAPI } from '../utils/supabase';
import { useUser } from '../contexts/UserContext';
import { getFileType, getFileName } from '../utils/supabase';
import { getStatusConfig } from '../utils/taskStatus';

const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1/';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';

// ============ 类型定义 ============
interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  budget: number;
  created_at: string;
  completed_at?: string;
  rating?: number;
  feedback?: string;
  publisher_id?: number;
  matched_agent_id?: number;
  deadline?: string;
  result?: string;
  delivery_status?: string;
  matched_at?: string;
}

interface Agent {
  id: number;
  name: string;
  avatar_url?: string;
  status?: string;
  personality?: string;
  completed_tasks?: number;
  avg_rating?: number;
  creator_id?: number;
}

// ============ 常量 ============
type Tab = 'published' | 'working' | 'completed';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'published', label: '📋 我发布的', icon: <ArrowUpRight className="w-4 h-4" /> },
  { id: 'working', label: '⚡ 执行中', icon: <Bot className="w-4 h-4" /> },
  { id: 'completed', label: '✅ 已完成', icon: <Award className="w-4 h-4" /> },
];

// 状态标签配置
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  open: { label: '待指派', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  matched: { label: '已匹配', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  in_progress: { label: '执行中', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  submitted: { label: '待验收', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  completed: { label: '已完成', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  approved: { label: '已验收', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  rejected: { label: '已退回', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  cancelled: { label: '已取消', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' },
};

const getStatusConfig = (status: string) => STATUS_CONFIG[status] || { label: status, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' };

// ============ 格式化工具 ============
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
};

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    return '刚刚';
  } catch {
    return dateStr;
  }
};

// ============ 进度条组件 ============
const ProgressBar: React.FC<{ progress: number; color?: string; height?: string }> = ({ 
  progress, 
  color = 'from-purple-500 to-pink-500',
  height = 'h-2'
}) => (
  <div className={`w-full ${height} bg-white/10 rounded-full overflow-hidden`}>
    <div 
      className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    />
  </div>
);

// ============ 星星评分组件 ============
const RatingStars: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <span key={star} style={{ fontSize: size }}>
        {rating >= star ? '⭐' : rating >= star - 0.5 ? '⭐' : '☆'}
      </span>
    ))}
  </div>
);

// ============ 指派智能体弹窗 ============
interface AssignAgentModalProps {
  task: Task;
  agents: Agent[];
  onClose: () => void;
  onAssigned: (agentName: string) => void;
  currentUserId: number;
}

const AssignAgentModal: React.FC<AssignAgentModalProps> = ({ task, agents, onClose, onAssigned, currentUserId }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');

  const handleAssign = async () => {
    if (!selectedAgentId) return;
    setAssigning(true);
    setError('');
    try {
      const res = await fetch('https://ai-wego-worker.ai-wego-api.workers.dev/api/tasks/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          agent_id: selectedAgentId,
          user_id: currentUserId,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '指派失败');
        return;
      }
      onAssigned(data.agentName || agents.find(a => a.id === selectedAgentId)?.name || '智能体');
    } catch (e: any) {
      setError(e.message || '指派失败');
    } finally {
      setAssigning(false);
    }
  };

  const filteredAgents = agents.filter(a => a.creator_id === currentUserId);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">指派智能体</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-1">选择负责执行「{task.title}」的智能体</p>
        </div>

        <div className="p-4 max-h-80 overflow-y-auto space-y-2">
          {filteredAgents.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">您还没有创建智能体</p>
              <button
                onClick={() => { onClose(); window.location.href = '/create-agent'; }}
                className="mt-3 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
              >
                前往创建
              </button>
            </div>
          ) : (
            filteredAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  selectedAgentId === agent.id
                    ? 'bg-purple-500/20 border border-purple-500/50'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {agent.name?.slice(0, 2).toUpperCase() || 'AI'}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium text-sm">{agent.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">
                      已完成 {agent.completed_tasks || 0} 任务
                    </span>
                    {agent.avg_rating && (
                      <span className="text-xs text-yellow-400">
                        ⭐ {agent.avg_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                {selectedAgentId === agent.id && (
                  <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>

        {error && (
          <div className="px-4 pb-2">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-sm">
              {error}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleAssign}
            disabled={!selectedAgentId || assigning}
            className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              selectedAgentId && !assigning
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25'
                : 'bg-white/10 text-slate-500 cursor-not-allowed'
            }`}
          >
            {assigning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                指派中...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                确认指派
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ 验收确认弹窗 ============
interface ApproveModalProps {
  task: Task;
  agentName?: string;
  onClose: () => void;
  onApproved: () => void;
  currentUserId: number;
}

const ApproveModal: React.FC<ApproveModalProps> = ({ task, agentName, onClose, onApproved, currentUserId }) => {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState('');

  const handleApprove = async () => {
    setApproving(true);
    setError('');
    try {
      // 调用 Worker 的 settle-task 接口完成验收和WEG币结算
      const res = await fetch('https://ai-wego-worker.ai-wego-api.workers.dev/api/settle-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          rating: rating,
          feedback: feedback
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '验收失败');
        return;
      }
      // 显示结算结果
      if (data.agent_reward) {
        setError(''); // 清除错误
      }
      onApproved();
    } catch (e: any) {
      setError(e.message || '验收失败，请稍后重试');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">验收任务</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-1">「{task.title}」</p>
        </div>

        <div className="p-5 space-y-5">
          {agentName && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <Bot className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-sm text-slate-400">执行智能体</p>
                <p className="text-white font-medium">{agentName}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-300 mb-2">评分</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="text-2xl transition-transform hover:scale-110"
                  style={{ filter: rating >= star ? 'none' : 'grayscale(1)', opacity: rating >= star ? 1 : 0.3 }}
                >
                  ⭐
                </button>
              ))}
              <span className="text-yellow-400 text-sm ml-2">{rating}分</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">评价（可选）</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="分享您的体验，帮助其他用户..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500/50 resize-none"
            />
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            <p className="text-emerald-400 text-sm">
              验收通过后，任务预算将转入执行者账户（已扣除8%平台手续费）
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold bg-white/10 text-slate-300 hover:bg-white/20 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleApprove}
            disabled={approving}
            className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            {approving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                验收中...
              </>
            ) : (
              <>
                <ThumbsUp className="w-4 h-4" />
                确认验收
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// 默认导出（兼容App.tsx的import方式）

// ============ 主组件 ============
export const AgentWorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, currentUserId } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('published');
  const [publishedTasks, setPublishedTasks] = useState<Task[]>([]);
  const [workingTasks, setWorkingTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [myAgents, setMyAgents] = useState<Agent[]>([]);
  const [agentMap, setAgentMap] = useState<Record<number, Agent>>({});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');

  // 弹窗状态
  const [assignModalTask, setAssignModalTask] = useState<Task | null>(null);
  const [approveModalTask, setApproveModalTask] = useState<{ task: Task; agentName?: string } | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [viewDeliveryTask, setViewDeliveryTask] = useState<Task | null>(null);
  const [deliveryContent, setDeliveryContent] = useState<string>('');
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  // 直接从 Supabase 获取数据（绕过可能的 worker 认证问题）
  const supabaseFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const res = await fetch(`${SUPABASE_URL}${path}`, {
      ...options,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      try { return JSON.parse(text); } catch { return { error: text }; }
    }
    return res.json();
  }, []);

  // 获取数据
  const fetchData = useCallback(async () => {
    if (!currentUserId) {
      setPublishedTasks([]);
      setWorkingTasks([]);
      setCompletedTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 同时获取任务和智能体（智能体获取所有，不再按owner_id过滤）
      const [allTasks, allAgents] = await Promise.all([
        supabaseFetch(`tasks?select=*&order=id.desc&limit=200`),
        agentsAPI.listAgents({ limit: 50 })
      ]);

      if (!Array.isArray(allTasks)) {
        setError('加载失败');
        return;
      }

      // 更新智能体列表
      const agents = Array.isArray(allAgents) ? allAgents : [];
      setMyAgents(agents);
      const map: Record<number, Agent> = {};
      agents.forEach((a: Agent) => { map[a.id] = a; });
      setAgentMap(map);

      // 排除公告类任务和无关类型
      const EXCLUDED_STATUS = ['announcement', 'inspection', 'compensated', 'deal', 'ls_daily', 'english_daily', 'pending_review'];

      // 判断任务是否已过期
      const isExpired = (task: Task) => {
        if ((task.status !== 'open' && task.status !== 'pending') || !task.deadline) return false;
        return new Date(task.deadline) < new Date();
      };

      // 获取当前用户的智能体ID列表
      const agentIds = agents.map(a => a.id);

      // Tab1: 我发布的（发布者是自己，排除公告类和已取消的，但包含 pending 状态）
      const published = allTasks.filter((t: Task) =>
        t.publisher_id === currentUserId &&
        !EXCLUDED_STATUS.includes(t.status) &&
        t.status !== 'cancelled' &&
        !isExpired(t)
      );
      setPublishedTasks(published);

      // Tab2: 执行中（任务状态为 matched 或 in_progress）
      const working = allTasks.filter((t: Task) =>
        (t.publisher_id === currentUserId || (t.matched_agent_id && agentIds.includes(t.matched_agent_id))) &&
        ['matched', 'in_progress'].includes(t.status)
      );
      setWorkingTasks(working);

      // Tab3: 已完成（任务状态为 completed 或 approved）
      const completed = allTasks.filter((t: Task) =>
        (t.publisher_id === currentUserId || (t.matched_agent_id && agentIds.includes(t.matched_agent_id))) &&
        ['completed', 'approved'].includes(t.status)
      );
      setCompletedTasks(completed);

    } catch (err) {
      console.error('获取数据失败:', err);
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, supabaseFetch]);

  // 获取用户的智能体列表（已整合到fetchData中，此函数保留用于单独刷新智能体）
  const fetchMyAgents = useCallback(async () => {
    if (!currentUserId) return;
    try {
      // 获取所有智能体，平台级展示
      const agents = await agentsAPI.listAgents({ limit: 50 });
      if (Array.isArray(agents)) {
        setMyAgents(agents);
        const map: Record<number, Agent> = {};
        agents.forEach((a: Agent) => { map[a.id] = a; });
        setAgentMap(map);
      }
    } catch (err) {
      console.error('获取智能体失败:', err);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchMyAgents();
  }, [fetchMyAgents]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // 刷新
  const handleRefresh = () => setRefreshKey(k => k + 1);

  // 验收确认后刷新
  const handleApproved = () => {
    setApproveModalTask(null);
    handleRefresh();
    // 通知 Layout 刷新余额
    window.dispatchEvent(new Event('balance-refresh'));
  };

  // 指派成功后刷新
  const handleAssigned = (agentName: string) => {
    setAssignModalTask(null);
    handleRefresh();
  };

  // 模拟任务完成（智能体提交）
  const handleSimulateComplete = async (task: Task) => {
    try {
      await tasksAPI.updateTask(task.id, { status: 'submitted', delivery_status: 'submitted' });
      handleRefresh();
    } catch (e) {
      console.error('模拟完成失败:', e);
    }
  };

  // 退回任务
  const handleReject = async (task: Task) => {
    try {
      await tasksAPI.rejectTask(task.id);
      handleRefresh();
    } catch (e) {
      console.error('退回失败:', e);
    }
  };

  // 取消任务
  const handleCancel = async (task: Task) => {
    if (!confirm('确定取消该任务吗？')) return;
    try {
      await tasksAPI.cancelTask(task.id);
      handleRefresh();
    } catch (e) {
      console.error('取消失败:', e);
    }
  };

  // 查看交付物
  const handleViewDelivery = async (task: Task) => {
    setViewDeliveryTask(task);
    setLoadingDelivery(true);
    setDeliveryContent('');
    try {
      const deliveries = await supabaseFetch(`deliveries?task_id=eq.${task.id}&select=*&order=id.desc&limit=1`);
      if (deliveries && deliveries[0]) {
        setDeliveryContent(deliveries[0].content || '暂无交付内容');
      } else {
        setDeliveryContent('暂无交付内容');
      }
    } catch (err) {
      console.error('获取交付物失败:', err);
      setDeliveryContent('获取交付物失败');
    } finally {
      setLoadingDelivery(false);
    }
  };

  // 验收通过（使用新的settle-task接口）
  const handleApproveWithSettle = async (task: Task, agentName?: string) => {
    try {
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
        alert(data.error || '验收失败');
        return;
      }
      alert(`验收成功！智能体获得 ${data.agent_reward} WEG`);
      handleRefresh();
    } catch (e) {
      console.error('验收失败:', e);
      alert('验收失败，请稍后重试');
    }
  };

  // 计算任务进度
  const getTaskProgress = (task: Task): number => {
    switch (task.status) {
      case 'open': return 10;
      case 'matched': return 25;
      case 'in_progress': return 60;
      case 'submitted': return 85;
      case 'completed': 
      case 'approved': return 100;
      default: return 0;
    }
  };

  // 获取当前Tab的任务列表
  const getCurrentTasks = (): Task[] => {
    switch (activeTab) {
      case 'published': return publishedTasks;
      case 'working': return workingTasks;
      case 'completed': return completedTasks;
      default: return [];
    }
  };

  const currentTasks = getCurrentTasks();
  const taskCount = { published: publishedTasks.length, working: workingTasks.length, completed: completedTasks.length };

  // 渲染任务卡片
  const renderTaskCard = (task: Task, showActions?: boolean) => {
    const statusCfg = getStatusConfig(task.status);
    const progress = getTaskProgress(task);
    const agent = task.matched_agent_id ? agentMap[task.matched_agent_id] : null;

    return (
      <div key={task.id} className="bg-zinc-900/80 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors">
        <div className="p-4">
          {/* 头部 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                  {statusCfg.label}
                </span>
                {task.budget > 0 && (
                  <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                    <WegCoin size={14} /> {task.budget} <WegCoin size={14} />
                  </span>
                )}
              </div>
              <h4 className="text-white font-semibold text-sm line-clamp-2">{task.title}</h4>
              {task.description && (
                <p className="text-slate-400 text-xs mt-1 line-clamp-2">{task.description}</p>
              )}
            </div>
          </div>

          {/* 智能体信息 */}
          {agent && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-white/5 rounded-lg">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {agent.name?.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{agent.name}</p>
                {agent.avg_rating && (
                  <RatingStars rating={agent.avg_rating} size={10} />
                )}
              </div>
            </div>
          )}

          {/* 进度条 */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">执行进度</span>
              <span className="text-white font-medium">{progress}%</span>
            </div>
            <ProgressBar progress={progress} />
          </div>

          {/* 时间信息 */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>发布于 {formatDate(task.created_at)}</span>
            {task.matched_at && <span>开始于 {formatDate(task.matched_at)}</span>}
            {task.completed_at && <span>完成于 {formatDate(task.completed_at)}</span>}
          </div>

          {/* 评价 */}
          {task.rating && (
            <div className="mt-2 flex items-center gap-2">
              <RatingStars rating={task.rating} size={12} />
              {task.feedback && (
                <p className="text-xs text-slate-400 truncate">{task.feedback}</p>
              )}
            </div>
          )}
        </div>

        {/* 操作区 */}
        {showActions && (
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {/* 我发布的 Tab 操作 */}
            {activeTab === 'published' && (
              <>
                {/* 待指派 -> 打开指派弹窗 */}
                {(task.status === 'open' || task.status === 'matched') && !task.matched_agent_id && (
                  <button
                    onClick={() => setAssignModalTask(task)}
                    className="flex-1 min-w-[100px] py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center justify-center gap-1"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    指派智能体
                  </button>
                )}
                {/* 进行中/已指派 -> 查看进度（也可模拟完成） */}
                {task.status === 'in_progress' && (
                  <button
                    onClick={() => {
                      setApproveModalTask({ task, agentName: agent?.name });
                    }}
                    className="flex-1 min-w-[100px] py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    验收
                  </button>
                )}
                {/* 待验收 -> 显示交付物并可验收 */}
                {task.status === 'submitted' && (
                  <button
                    onClick={() => handleViewDelivery(task)}
                    className="flex-1 min-w-[100px] py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30 text-xs font-semibold hover:from-purple-500/30 hover:to-pink-500/30 transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    查看交付物
                  </button>
                )}
                {/* 待验收 */}
                {task.status === 'submitted' && (
                  <>
                    <button
                      onClick={() => handleReject(task)}
                      className="flex-1 min-w-[80px] py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold hover:bg-red-500/30 transition-colors flex items-center justify-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      退回
                    </button>
                    <button
                      onClick={() => setApproveModalTask({ task, agentName: agent?.name })}
                      className="flex-1 min-w-[80px] py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-1"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      验收
                    </button>
                  </>
                )}
                {/* 取消按钮 */}
                {!['completed', 'approved', 'cancelled'].includes(task.status) && (
                  <button
                    onClick={() => handleCancel(task)}
                    className="py-2 px-3 rounded-xl bg-white/5 text-slate-400 text-xs hover:bg-white/10 transition-colors"
                  >
                    取消
                  </button>
                )}
              </>
            )}

            {/* 智能体工作中 Tab 操作 */}
            {activeTab === 'working' && (
              <>
                {/* 模拟智能体提交 */}
                {task.status === 'in_progress' && (
                  <button
                    onClick={() => handleSimulateComplete(task)}
                    className="flex-1 min-w-[100px] py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold hover:from-amber-600 hover:to-orange-600 transition-colors flex items-center justify-center gap-1"
                  >
                    <SendIcon className="w-3.5 h-3.5" />
                    模拟提交
                  </button>
                )}
                <button
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="py-2 px-3 rounded-xl bg-white/5 text-slate-400 text-xs hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  查看
                </button>
              </>
            )}

            {/* 已完成 Tab 操作 */}
            {activeTab === 'completed' && (
              <>
                <button
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="flex-1 min-w-[100px] py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  查看成果
                </button>
                {task.rating && (
                  <button
                    onClick={() => {
                      // 重新发布：可以做成"再次发布"功能，这里简单跳转到创建任务页
                      navigate('/create-task', { state: { title: task.title, description: task.description } });
                    }}
                    className="py-2 px-3 rounded-xl bg-purple-500/20 text-purple-400 text-xs hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    再次发布
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950 to-pink-950">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-xl mx-auto px-4 py-6 space-y-5">
        {/* ========== 顶部 Header ========== */}
        <div className="bg-gradient-to-r from-purple-900/60 via-pink-900/60 to-purple-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">我的工作台</h1>
                <p className="text-xs text-slate-400">{user?.username || '未登录'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-white/80" />
              </button>
              <button
                onClick={() => navigate('/create-task')}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                发布任务
              </button>
            </div>
          </div>
        </div>

        {/* ========== 统计卡片 ========== */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '我发布的', count: taskCount.published, color: 'from-purple-500/20 to-pink-500/20', textColor: 'text-purple-400', icon: <ArrowUpRight className="w-4 h-4" /> },
            { label: '执行中', count: taskCount.working, color: 'from-amber-500/20 to-orange-500/20', textColor: 'text-amber-400', icon: <Bot className="w-4 h-4" /> },
            { label: '已完成', count: taskCount.completed, color: 'from-emerald-500/20 to-green-500/20', textColor: 'text-emerald-400', icon: <Award className="w-4 h-4" /> },
          ].map((stat) => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border border-white/10 rounded-2xl p-4 text-center`}>
              <div className={`${stat.textColor} font-bold text-2xl mb-1`}>{stat.count}</div>
              <div className="text-slate-400 text-xs flex items-center justify-center gap-1">
                {stat.icon}
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* ========== Tab 切换 ========== */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {taskCount[tab.id] > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'
                  }`}>
                    {taskCount[tab.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ========== 任务列表 ========== */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-400">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
            >
              重试
            </button>
          </div>
        ) : currentTasks.length === 0 ? (
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              {activeTab === 'published' ? <ArrowUpRight className="w-8 h-8 text-slate-600" /> :
               activeTab === 'working' ? <Bot className="w-8 h-8 text-slate-600" /> :
               <Award className="w-8 h-8 text-slate-600" />}
            </div>
            <h3 className="text-white font-semibold mb-2">
              {activeTab === 'published' ? '暂无发布的任务' :
               activeTab === 'working' ? '暂无进行中的任务' :
               '暂无已完成的任务'}
            </h3>
            <p className="text-slate-400 text-sm mb-5">
              {activeTab === 'published' ? '发布任务后，可以指派给您的智能体执行' :
               activeTab === 'working' ? '指派智能体后，任务将在这里显示' :
               '验收完成的任务将显示在这里'}
            </p>
            {activeTab === 'published' && (
              <button
                onClick={() => navigate('/create-task')}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                发布第一个任务
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {currentTasks.map((task) => renderTaskCard(task, true))}
          </div>
        )}

        {/* 空占位，保持页面高度一致 */}
        <div className="h-8" />
      </div>

      {/* ========== 指派智能体弹窗 ========== */}
      {assignModalTask && currentUserId && (
        <AssignAgentModal
          task={assignModalTask}
          agents={myAgents}
          onClose={() => setAssignModalTask(null)}
          onAssigned={handleAssigned}
          currentUserId={currentUserId}
        />
      )}

      {/* ========== 验收确认弹窗 ========== */}
      {approveModalTask && currentUserId && (
        <ApproveModal
          task={approveModalTask.task}
          agentName={approveModalTask.agentName}
          onClose={() => setApproveModalTask(null)}
          onApproved={handleApproved}
          currentUserId={currentUserId}
        />
      )}

      {/* ========== 交付物查看弹窗 ========== */}
      {viewDeliveryTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div style={{ 
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            maxWidth: 700,
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* 头部 */}
            <div style={{ 
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ 
                  color: '#fff', 
                  fontSize: 18, 
                  fontWeight: 600, 
                  margin: 0 
                }}>📦 交付物详情</h3>
                <p style={{ 
                  color: 'rgba(255,255,255,0.5)', 
                  fontSize: 13, 
                  margin: '4px 0 0 0' 
                }}>{viewDeliveryTask.title}</p>
              </div>
              <button
                onClick={() => setViewDeliveryTask(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.7)'
                }}
              >
                ✕
              </button>
            </div>

            {/* 内容区 */}
            <div style={{ 
              flex: 1,
              padding: 20,
              overflow: 'auto',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 14,
              lineHeight: 1.7
            }}>
              {loadingDelivery ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: 40
                }}>
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  <span style={{ marginLeft: 12, color: 'rgba(255,255,255,0.5)' }}>加载中...</span>
                </div>
              ) : (
                <div>
                  {/* 文本内容 */}
                  {deliveryContent && (
                    <div style={{ 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      background: 'rgba(255,255,255,0.03)',
                      padding: 16,
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.05)',
                      marginBottom: 16
                    }}>
                      {deliveryContent}
                    </div>
                  )}
                  
                  {/* 附件预览区域 */}
                  {(() => {
                    // 从deliveries中获取附件列表
                    const attachments: string[] = [];
                    // 如果task有attachments字段
                    if ((viewDeliveryTask as any).attachments) {
                      const atts = (viewDeliveryTask as any).attachments;
                      if (Array.isArray(atts)) {
                        attachments.push(...atts);
                      } else if (typeof atts === 'string') {
                        try {
                          const parsed = JSON.parse(atts);
                          if (Array.isArray(parsed)) attachments.push(...parsed);
                        } catch {}
                      }
                    }
                    // 如果content中有URL
                    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+\.(jpg|jpeg|png|gif|webp|mp3|wav|ogg|m4a|pdf|doc|docx|ppt|pptx|xlsx|xls)([^\s<>"{}|\\^`\[\]]*)/gi;
                    const matches = deliveryContent.match(urlRegex) || [];
                    matches.forEach((url: string) => {
                      if (!attachments.includes(url)) attachments.push(url);
                    });
                    
                    if (attachments.length === 0) return null;
                    
                    return (
                      <div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 8,
                          marginBottom: 12,
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: 13
                        }}>
                          <FileText className="w-4 h-4" />
                          <span>附件列表（{attachments.length}个）</span>
                        </div>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                          gap: 12
                        }}>
                          {attachments.map((url: string, index: number) => {
                            const fileType = getFileType(url);
                            const fileName = getFileName(url);
                            
                            if (fileType === 'image') {
                              return (
                                <div key={index} style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: 12,
                                  overflow: 'hidden'
                                }}>
                                  <img 
                                    src={url} 
                                    alt={fileName}
                                    style={{
                                      width: '100%',
                                      height: 160,
                                      objectFit: 'cover',
                                      display: 'block'
                                    }}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  <div style={{
                                    padding: '10px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <p style={{ 
                                        color: '#fff', 
                                        fontSize: 13, 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap',
                                        margin: 0
                                      }}>
                                        🖼️ {fileName}
                                      </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                      <a 
                                        href={url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{
                                          padding: '4px 8px',
                                          background: 'rgba(139, 92, 246, 0.2)',
                                          borderRadius: 6,
                                          color: '#a78bfa',
                                          fontSize: 12,
                                          textDecoration: 'none'
                                        }}
                                      >
                                        预览
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            
                            if (fileType === 'audio') {
                              return (
                                <div key={index} style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: 12,
                                  padding: 16
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <div style={{
                                      width: 44,
                                      height: 44,
                                      borderRadius: 10,
                                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}>
                                      <Music className="w-5 h-5 text-white" />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <p style={{ 
                                        color: '#fff', 
                                        fontSize: 13, 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap',
                                        margin: 0
                                      }}>
                                        🎵 {fileName}
                                      </p>
                                    </div>
                                  </div>
                                  <audio 
                                    controls
                                    style={{
                                      width: '100%',
                                      height: 36,
                                      borderRadius: 8
                                    }}
                                  >
                                    <source src={url} />
                                    您的浏览器不支持音频播放
                                  </audio>
                                </div>
                              );
                            }
                            
                            // 其他文件类型
                            return (
                              <div key={index} style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 12,
                                padding: 14,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12
                              }}>
                                <div style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 8,
                                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ 
                                    color: '#fff', 
                                    fontSize: 13, 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis', 
                                    whiteSpace: 'nowrap',
                                    margin: 0
                                  }}>
                                    {fileName}
                                  </p>
                                </div>
                                <a 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  download
                                  style={{
                                    padding: '6px 12px',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                    borderRadius: 8,
                                    color: '#fff',
                                    fontSize: 12,
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                >
                                  <Download className="w-3 h-3" />
                                  下载
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* 底部操作 */}
            <div style={{ 
              padding: '16px 20px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              gap: 12
            }}>
              <button
                onClick={() => setViewDeliveryTask(null)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: 10,
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                关闭
              </button>
              <button
                onClick={() => {
                  const agent = viewDeliveryTask.matched_agent_id ? agentMap[viewDeliveryTask.matched_agent_id] : null;
                  handleApproveWithSettle(viewDeliveryTask, agent?.name);
                  setViewDeliveryTask(null);
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <ThumbsUp className="w-4 h-4" />
                验收通过
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 默认导出（兼容App.tsx的import方式）
export default AgentWorkspacePage;
