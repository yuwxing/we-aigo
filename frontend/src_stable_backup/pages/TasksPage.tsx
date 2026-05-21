import React, { useState, useEffect } from 'react';
import { List, Clock, DollarSign, Bot, Flame, Target, Award, Users, Info, ChevronRight, Search, Plus, Sparkles, CheckCircle, AlertCircle, RefreshCw, Monitor, Zap, Archive, AlertTriangle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Card, StatusBadge, LoadingSpinner, EmptyState } from '../components/ui';
import { tasksAPI, agentsAPI, transactionsAPI, supabaseFetch } from '../utils/supabase';
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

const statusFilters: { value: TaskStatus | 'archived' | ''; label: string; icon?: React.ReactNode }[] = [
  { value: '', label: '全部', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'open', label: '🔥 热门', icon: <Flame className="w-4 h-4" /> },
  { value: 'matched', label: '已匹配', icon: <Users className="w-4 h-4" /> },
  { value: 'in_progress', label: '进行中', icon: <Target className="w-4 h-4" /> },
  { value: 'completed', label: '待验收', icon: <Award className="w-4 h-4" /> },
  { value: 'approved', label: '已完成', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'archived', label: '📦 已归档', icon: <Archive className="w-4 h-4" /> },
];

// 任务类型图标映射
const taskTypeIcons: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  '编程': { icon: <Target className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-100' },
  '写作': { icon: <Award className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-100' },
  '设计': { icon: <Sparkles className="w-5 h-5" />, color: 'text-pink-600', bg: 'bg-pink-100' },
  '分析': { icon: <Flame className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-100' },
};

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [rejectingTask, setRejectingTask] = useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<{ task: Task | null; show: boolean }>({ task: null, show: false });
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
      
      // 过滤和标记任务
      let filteredTasks = taskData.filter(t => t.status !== 'cancelled' && t.status !== 'deal' && !t.title?.startsWith('【反馈】'));
      
      if (filter === 'archived') {
        // 只显示已归档任务
        filteredTasks = filteredTasks.filter(t => isArchivedTask(t));
      } else if (filter === 'approved') {
        // 只显示未归档的approved任务
        filteredTasks = filteredTasks.filter(t => !isArchivedTask(t));
      } else if (filter === 'open' || filter === 'matched' || filter === 'in_progress' || filter === 'completed') {
        // 只显示对应状态的任务（排除已归档的approved）
        filteredTasks = filteredTasks.filter(t => t.status === filter);
      }
      
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

  // 验收通过 - 智能体获得报酬
  const handleApprove = async (task: Task) => {
    setRejectingTask(task.id);
    try {
      // 1. 更新任务状态
      await fetch(`${SUPABASE_URL}tasks?id=eq.${task.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'approved', 
          delivery_status: 'approved',
          completed_at: new Date().toISOString(),
        })
      });
      
      // 2. 获取任务的reward金额（从tasks表的budget字段获取）
      const rewardAmount = task.budget || 0;
      
      if (task.matched_agent_id && rewardAmount > 0) {
        // 3. 给智能体增加余额
        const agentRes = await fetch(`${SUPABASE_URL}agents?id=eq.${task.matched_agent_id}&select=token_balance,completed_tasks`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const agentData = await agentRes.json();
        if (agentData && agentData[0]) {
          const newBalance = agentData[0].token_balance + rewardAmount;
          const newCompleted = agentData[0].completed_tasks + 1;
          await fetch(`${SUPABASE_URL}agents?id=eq.${task.matched_agent_id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              token_balance: newBalance, 
              completed_tasks: newCompleted,
              total_tasks: newCompleted,
            })
          });
          
          // 4. 记录交易（智能体获得报酬）
          await transactionsAPI.createTransaction({
            from_id: task.publisher_id || 19, // 任务发布者
            from_type: 'user',
            to_id: task.matched_agent_id,
            to_type: 'agent',
            amount: rewardAmount,
            task_id: task.id,
            type: 'delivery_reward',
            description: `任务「${task.title}」验收通过，获得报酬 ${rewardAmount} Token`,
          });
          
          // 5. 更新task_payment记录的to_id为智能体ID
          const paymentRecord = await transactionsAPI.getTaskPaymentRecord(task.id);
          if (paymentRecord) {
            await supabaseFetch(`transactions?id=eq.${paymentRecord.id}`, {
              method: 'PATCH',
              body: JSON.stringify({
                to_id: task.matched_agent_id,
                to_type: 'agent',
              }),
            });
          }
          
          showToast(`✅ 验收通过！智能体获得 ${rewardAmount} Token`, 'success');
        } else {
          showToast('✅ 验收通过！', 'success');
        }
      } else {
        showToast('✅ 验收通过！', 'success');
      }
      
      fetchData();
    } catch (err) {
      showToast('操作失败', 'error');
    } finally {
      setRejectingTask(null);
    }
  };

  // 验收不通过 - 退款给用户
  const rejectDelivery = async (task: Task) => {
    setRejectingTask(task.id);
    try {
      // 1. 获取任务的reward金额（从tasks表的budget字段获取）
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
          matched_agent_id: null,
          delivery_status: 'rejected'
        })
      });
      
      // 3. 如果有扣款记录，退款给发布者
      if (rewardAmount > 0) {
        // 获取任务的发布者ID（从task_payment记录中获取from_id）
        const paymentRecord = await transactionsAPI.getTaskPaymentRecord(task.id);
        const publisherId = paymentRecord?.from_id || task.publisher_id || 19;
        
        // 给用户退款
        await fetch(`${SUPABASE_URL}users?id=eq.${publisherId}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });
        
        // 先获取当前余额再退款
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
          
          // 记录退款交易
          await transactionsAPI.createTransaction({
            from_id: task.id,
            from_type: 'task',
            to_id: publisherId,
            to_type: 'user',
            amount: rewardAmount,
            task_id: task.id,
            type: 'refund',
            description: `任务「${task.title}」验收不通过，退还报酬 ${rewardAmount} Token`,
          });
          
          showToast(`✅ 已撤回，报酬 ${rewardAmount} Token 已退还`, 'success');
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
    return diff < 3 * 24 * 60 * 60 * 1000 && diff > 0; // 3天内截止
  };
  
  // 跳转到加急任务筛选
  const goToUrgentTasks = () => {
    // 筛选所有加急任务（通过链接参数传递）
    window.location.href = '/tasks?filter=urgent';
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

      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <List className="w-5 h-5 text-white" />
            </div>
            任务大厅
          </h1>
          <p className="text-slate-500 mt-1">发现赚钱机会，让智能体大展身手</p>
        </div>
        <Link
          to="/create-task"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-semibold shadow-lg shadow-amber-500/25 hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          发布任务
        </Link>
      </div>

      {/* 搜索框 */}
      <Card className="!p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索任务名称或描述..."
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-base"
          />
        </div>
      </Card>

      {/* 筛选器 + 加急任务快捷入口 */}
      <div className="space-y-3">
        {/* 加急任务快捷入口 */}
        <button
          onClick={() => {
            // 设置筛选为open状态并跳转
            setFilter('open');
            window.location.href = '/tasks?filter=urgent';
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 border border-red-200 rounded-xl transition-all font-medium text-red-700 shadow-sm hover:shadow-md"
        >
          <Zap className="w-5 h-5 text-red-500" />
          <span>🔥 加急任务</span>
          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-1">
            高额悬赏
          </span>
          <ChevronRight className="w-4 h-4 ml-auto" />
        </button>
        
        {/* 状态筛选器 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {statusFilters.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filter === item.value
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
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
          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">
            状态: {statusFilters.find(s => s.value === filter)?.label.replace(/^[🔥 ]/, '')}
          </span>
        )}
        {searchQuery && (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
            搜索: {searchQuery}
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
            <Link to="/create-task" className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 font-medium">
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
                <p className="text-sm text-slate-500">验收不达标，任务将重新进入抢单池</p>
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
                <span className="text-red-600 font-medium">-💎 {showRejectModal.task.budget}</span>
              </div>
            </div>
            
            <p className="text-sm text-slate-600">
              确认后，该智能体的Token奖励将被扣回，任务状态改回<span className="font-medium text-slate-900">开放</span>，其他智能体可以重新抢单。
            </p>
            
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
}

const TaskCard: React.FC<TaskCardProps> = ({ task, formatDate, recommendedAgents, taskType, isUrgent, isHot, onApprove, onReject, isRejecting }) => {
  const typeConfig = taskTypeIcons[taskType] || taskTypeIcons['编程'];
  const isUrgentTaskVar = checkIsUrgentTask(task); // 加急任务判断
  
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
            isHot ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
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
                      {/* 加急标识 */}
                      {isUrgentTaskVar && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-red-100 to-orange-100 text-red-700 rounded-full text-xs font-bold animate-pulse">
                          <Zap className="w-3 h-3" />
                          🔥加急
                        </span>
                      )}
                      {isHot && !isUrgentTaskVar && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-xs font-medium">
                          <Flame className="w-3 h-3" />
                          热门
                        </span>
                      )}
                      {isUrgent && !isUrgentTaskVar && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-red-100 to-pink-100 text-red-700 rounded-full text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          紧急
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
                  <span className="font-bold text-purple-600 text-lg">💎 {task.budget}</span>
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

            {/* 悬停查看详情 */}
            <div className="mt-3 flex items-center justify-center gap-1 text-blue-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              点击查看详情
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Card>
      </Link>
      
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
      {/* 工作台入口 - matched/in_progress/submitted/completed状态显示 */}
      {(task.status === 'matched' || task.status === 'in_progress' || task.status === 'submitted' || task.status === 'completed') && (
        <div className="mt-2 flex items-center justify-end">
          <Link
            to={`/workspace/${task.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors text-sm font-medium shadow-sm"
          >
            <Monitor className="w-4 h-4" />
            进入工作台 →
          </Link>
        </div>
      )}
      {/* 已退回标签 - 任务状态为open但delivery_status为rejected */}
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
