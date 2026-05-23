import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Loader2, Award, ArrowUpRight, Eye, Plus,
  CheckCircle, RefreshCw, AlertCircle, ThumbsUp,
  RotateCcw, Send as SendIcon
} from 'lucide-react';

import WegCoin from '../components/WegCoin';
import { tasksAPI, agentsAPI } from '../utils/supabase';
import { useUser } from '../contexts/UserContext';
import { getFileType, getFileName } from '../utils/supabase';

// ============ 类型 ============
interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  budget: number;
  created_at: string;
  matched_agent_id?: number;
  publisher_id?: number;
  matched_at?: string;
  completed_at?: string;
  rating?: number;
  feedback?: string;
}

interface Agent {
  id: number;
  name: string;
  avg_rating?: number;
  completed_tasks?: number;
  creator_id?: number;
}

// ============ Tab ============
type Tab = 'published' | 'working' | 'completed';

const TABS: { id: Tab; label: string }[] = [
  { id: 'published', label: '我发布的' },
  { id: 'working', label: '执行中' },
  { id: 'completed', label: '已完成' },
];

// ============ 状态配置（只保留一份！）===========
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: '待指派', color: 'text-yellow-400' },
  matched: { label: '已匹配', color: 'text-blue-400' },
  in_progress: { label: '执行中', color: 'text-amber-400' },
  submitted: { label: '待验收', color: 'text-purple-400' },
  completed: { label: '已完成', color: 'text-green-400' },
  approved: { label: '已验收', color: 'text-emerald-400' },
  cancelled: { label: '已取消', color: 'text-slate-400' },
};

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status] || { label: status, color: 'text-slate-400' };

// ============ 主组件 ============
const AgentWorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, currentUserId } = useUser();

  const [activeTab, setActiveTab] = useState<Tab>('published');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [refreshKey, setRefreshKey] = useState(0);

  // ============ 拉数据 ============
  const fetchData = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      setError('');

      const [taskRes, agentRes] = await Promise.all([
        fetch('https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1/tasks?select=*', {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`,
          },
        }),
        agentsAPI.listAgents({ limit: 50 }),
      ]);

      const taskData = await taskRes.json();

      setTasks(Array.isArray(taskData) ? taskData : []);
      setAgents(Array.isArray(agentRes) ? agentRes : []);

    } catch (e) {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleRefresh = () => setRefreshKey(k => k + 1);

  // ============ 任务分类 ============
  const published = tasks.filter(t => t.publisher_id === currentUserId);
  const working = tasks.filter(t => ['matched', 'in_progress'].includes(t.status));
  const completed = tasks.filter(t => ['completed', 'approved'].includes(t.status));

  const currentTasks =
    activeTab === 'published'
      ? published
      : activeTab === 'working'
      ? working
      : completed;

  // ============ 任务卡片 ============
  const renderTask = (task: Task) => {
    const status = getStatusConfig(task.status);

    return (
      <div key={task.id} className="bg-zinc-900 p-4 rounded-xl border border-white/10 mb-3">
        <div className="flex justify-between">
          <div>
            <div className={`text-xs ${status.color}`}>{status.label}</div>
            <div className="text-white font-semibold">{task.title}</div>
            <div className="text-slate-400 text-xs">{task.description}</div>
          </div>

          <div className="text-yellow-400 flex items-center gap-1">
            <WegCoin size={14} />
            {task.budget}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => navigate(`/tasks/${task.id}`)}
            className="px-3 py-1 bg-white/10 rounded text-xs"
          >
            查看
          </button>

          {task.status === 'in_progress' && (
            <button
              onClick={() => alert('模拟提交')}
              className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded text-xs"
            >
              模拟提交
            </button>
          )}

          {task.status === 'submitted' && (
            <button
              onClick={() => alert('验收')}
              className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs"
            >
              验收
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">

      {/* header */}
      <div className="flex justify-between mb-4">
        <div>
          <div className="text-xl font-bold">我的工作台</div>
          <div className="text-slate-400 text-sm">{user?.username}</div>
        </div>

        <button
          onClick={handleRefresh}
          className="px-3 py-2 bg-white/10 rounded"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* tabs */}
      <div className="flex gap-2 mb-4">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1 rounded ${
              activeTab === t.id ? 'bg-purple-500' : 'bg-white/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* content */}
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : currentTasks.length === 0 ? (
        <div className="text-slate-400">暂无任务</div>
      ) : (
        currentTasks.map(renderTask)
      )}
    </div>
  );
};

export default AgentWorkspacePage;