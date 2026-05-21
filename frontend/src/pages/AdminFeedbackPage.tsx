import WegCoin from '../components/WegCoin';
// AdminFeedbackPage.tsx - 反馈审核管理页面
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { 
  ArrowLeft, CheckCircle, XCircle, MessageSquare, Coins, 
  Clock, AlertTriangle, User, Mail, History, Filter,
  ThumbsUp, X, Send, Loader2, ChevronDown, RefreshCw
} from 'lucide-react';

const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1/';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';

// 类型定义
interface FeedbackTask {
  id: number;
  title: string;
  description: string;
  status: string;
  budget: number;
  publisher_id: number;
  created_at: string;
  // 附加信息（从description解析）
  feedbackType?: string;
  feedbackTypeLabel?: string;
  content?: string;
  email?: string;
  submitterId?: string;
  submitterName?: string;
  submittedAt?: string;
  replyNote?: string;
  replyTime?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  token_balance: number;
}

// API 请求封装
const supabaseFetch = async (table: string, params?: string) => {
  const url = `${SUPABASE_URL}${table}${params ? `?${params}` : ''}`;
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
  });
  if (!response.ok) throw new Error(`请求失败: ${response.status}`);
  return response.json();
};

const supabasePost = async (table: string, data: object) => {
  const response = await fetch(`${SUPABASE_URL}${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(`请求失败: ${response.status}`);
  return response.json();
};

const supabasePatch = async (table: string, id: number, data: object) => {
  const response = await fetch(`${SUPABASE_URL}${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(`请求失败: ${response.status}`);
  return response.json();
};

// 解析反馈描述
const parseFeedbackDescription = (task: FeedbackTask): FeedbackTask => {
  try {
    const parsed = JSON.parse(task.description);
    return {
      ...task,
      feedbackType: parsed.feedbackType,
      feedbackTypeLabel: parsed.feedbackTypeLabel,
      content: parsed.content,
      email: parsed.email,
      submitterId: parsed.submitterId,
      submitterName: parsed.submitterName,
      submittedAt: parsed.submittedAt,
      replyNote: parsed.replyNote,
      replyTime: parsed.replyTime,
    };
  } catch {
    return task;
  }
};

// 格式化时间
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};

const AdminFeedbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const currentUserId = user?.id || parseInt(searchParams.get('userId') || '0', 10);
  
  const [pendingList, setPendingList] = useState<FeedbackTask[]>([]);
  const [processedList, setProcessedList] = useState<FeedbackTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'processed'>('pending');
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // 回复弹窗状态
  const [replyModal, setReplyModal] = useState<{show: boolean; task: FeedbackTask | null; message: string}>({
    show: false, task: null, message: ''
  });
  
  // 驳回弹窗状态
  const [rejectModal, setRejectModal] = useState<{show: boolean; task: FeedbackTask | null; reason: string}>({
    show: false, task: null, reason: ''
  });

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 获取反馈任务（title以【反馈】开头）
      const tasks = await supabaseFetch('tasks', "title=ilike.*%E5%8F%8D%E9%A6%88*&order=created_at.desc&limit=100");
      
      const parsedTasks = tasks.map(parseFeedbackDescription);
      
      // 分离待审核和已处理
      const pending = parsedTasks.filter(t => t.status === 'pending_review');
      const processed = parsedTasks.filter(t => 
        t.status === 'feedback_approved' || t.status === 'feedback_rejected'
      );
      
      setPendingList(pending);
      setProcessedList(processed);
    } catch (err) {
      console.error('加载数据失败', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 获取用户信息
  const getUserInfo = async (userId: number): Promise<User | null> => {
    try {
      const users = await supabaseFetch('users', `id=eq.${userId}`);
      return users[0] || null;
    } catch {
      return null;
    }
  };

  // 确认赔付
  const handleApprove = async (task: FeedbackTask) => {
    if (task.budget <= 0) {
      alert('该反馈没有申请赔付');
      return;
    }
    
    if (!confirm(`确认向 ${task.submitterName || '用户'} 赔付 ${task.budget} <WegCoin size={14} />？`)) {
      return;
    }

    setProcessingId(task.id);
    try {
      // 1. 创建赔付交易记录（写入 token_transactions 表）
      await supabasePost('token_transactions', {
        user_id: task.publisher_id,
        amount: task.budget,
        type: 'compensation',
        description: `反馈赔付：${task.feedbackTypeLabel || task.title}`,
        related_task_id: task.id,
        created_at: new Date().toISOString()
      });

      // 2. 同时写入 transactions 表保持兼容性
      await supabasePost('transactions', {
        from_id: 3, // 平台账户
        from_type: 'platform',
        to_id: task.publisher_id,
        to_type: 'user',
        amount: task.budget,
        task_id: task.id,
        type: 'compensation',
        description: `反馈赔付：${task.feedbackTypeLabel || task.title}`
      });

      // 3. 更新用户余额
      const user = await getUserInfo(task.publisher_id);
      if (user) {
        await supabasePatch('users', task.publisher_id, {
          token_balance: (user.token_balance || 0) + task.budget
        });
      }

      // 4. 更新任务状态
      await supabasePatch('tasks', task.id, {
        status: 'feedback_approved',
        description: JSON.stringify({
          ...JSON.parse(task.description),
          approvedAt: new Date().toISOString(),
          approvedBy: currentUserId,
          compensationAmount: task.budget
        })
      });

      alert(`✅ 赔付成功！已向用户赔付 ${task.budget} <WegCoin size={14} />`);
      loadData();
    } catch (err) {
      console.error('赔付失败', err);
      alert('操作失败，请重试');
    } finally {
      setProcessingId(null);
    }
  };

  // 驳回反馈
  const handleReject = async () => {
    if (!rejectModal.task || !rejectModal.reason.trim()) {
      alert('请填写驳回原因');
      return;
    }

    setProcessingId(rejectModal.task.id);
    try {
      await supabasePatch('tasks', rejectModal.task.id, {
        status: 'feedback_rejected',
        description: JSON.stringify({
          ...JSON.parse(rejectModal.task.description),
          rejectedAt: new Date().toISOString(),
          rejectedBy: currentUserId,
          rejectReason: rejectModal.reason
        })
      });

      setRejectModal({ show: false, task: null, reason: '' });
      loadData();
    } catch (err) {
      console.error('驳回失败', err);
      alert('操作失败，请重试');
    } finally {
      setProcessingId(null);
    }
  };

  // 回复反馈
  const handleReply = async () => {
    if (!replyModal.task || !replyModal.message.trim()) {
      alert('请填写回复内容');
      return;
    }

    setProcessingId(replyModal.task.id);
    try {
      const now = new Date().toISOString();
      const existingReply = replyModal.task.replyNote ? `${replyModal.task.replyNote}\n` : '';
      
      await supabasePatch('tasks', replyModal.task.id, {
        description: JSON.stringify({
          ...JSON.parse(replyModal.task.description),
          replyNote: `${existingReply}[${formatTime(now)}] 平台回复：${replyModal.message}`,
          replyTime: now
        })
      });

      setReplyModal({ show: false, task: null, message: '' });
      loadData();
    } catch (err) {
      console.error('回复失败', err);
      alert('操作失败，请重试');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = pendingList.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* 顶部 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              to="/"
              className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-purple-500" />
                反馈审核中心
              </h1>
              <p className="text-sm text-slate-500">处理用户提交的质量反馈和赔付申请</p>
            </div>
            <button
              onClick={loadData}
              className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 待审核角标提示 */}
      {pendingCount > 0 && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
              {pendingCount}
            </div>
            <div>
              <p className="font-semibold text-red-800">待审核反馈</p>
              <p className="text-sm text-red-600">有 {pendingCount} 条反馈等待处理</p>
            </div>
          </div>
        </div>
      )}

      {/* 内容区 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 标签切换 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            待审核
            {pendingCount > 0 && (
              <span className="w-6 h-6 bg-white/20 rounded-full text-sm flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('processed')}
            className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
              activeTab === 'processed'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            已处理
            <span className="text-sm opacity-70">({processedList.length})</span>
          </button>
        </div>

        {/* 待审核列表 */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <Loader2 className="w-10 h-10 text-purple-500 mx-auto mb-4 animate-spin" />
                <p className="text-slate-500">加载中...</p>
              </div>
            ) : pendingList.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-700">太棒了！</p>
                <p className="text-slate-500 mt-1">暂无待审核的反馈</p>
              </div>
            ) : (
              pendingList.map(task => (
                <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  {/* 头部 */}
                  <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                          task.feedbackType === 'quality' ? 'bg-red-100 text-red-600' :
                          task.feedbackType === 'bug' ? 'bg-orange-100 text-orange-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {task.feedbackTypeLabel?.match(/[^\x00-\xff]/g)?.[0] || '📝'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{task.title}</p>
                          <p className="text-xs text-slate-500">#{task.id} · {formatTime(task.created_at)}</p>
                        </div>
                      </div>
                      
                      {task.budget > 0 && (
                        <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-bold flex items-center gap-1">
                          <Coins className="w-4 h-4" />
                          {task.budget.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 内容 */}
                  <div className="px-5 py-4">
                    {/* 用户信息 */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>{task.submitterName || '匿名用户'}</span>
                      </div>
                      {task.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4" />
                          <span>{task.email}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* 反馈详情 */}
                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{task.content}</p>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex items-center gap-3">
                      {/* 确认赔付 */}
                      {task.budget > 0 && (
                        <button
                          onClick={() => handleApprove(task)}
                          disabled={processingId === task.id}
                          className={`flex-1 py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                            processingId === task.id
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:-translate-y-0.5'
                          }`}
                        >
                          {processingId === task.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <ThumbsUp className="w-5 h-5" />
                          )}
                          确认赔付 {task.budget.toLocaleString()} <WegCoin size={14} />币
                        </button>
                      )}
                      
                      {/* 回复 */}
                      <button
                        onClick={() => setReplyModal({ show: true, task, message: '' })}
                        className="px-4 py-3 rounded-xl bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition-colors flex items-center gap-2"
                      >
                        <MessageSquare className="w-5 h-5" />
                        回复
                      </button>
                      
                      {/* 驳回 */}
                      <button
                        onClick={() => setRejectModal({ show: true, task, reason: '' })}
                        className="px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
                      >
                        <XCircle className="w-5 h-5" />
                        驳回
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 已处理列表 */}
        {activeTab === 'processed' && (
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <Loader2 className="w-10 h-10 text-purple-500 mx-auto mb-4 animate-spin" />
                <p className="text-slate-500">加载中...</p>
              </div>
            ) : processedList.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">暂无已处理的反馈</p>
              </div>
            ) : (
              processedList.map(task => (
                <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        task.status === 'feedback_approved' ? 'bg-emerald-100' : 'bg-slate-100'
                      }`}>
                        {task.status === 'feedback_approved' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{task.title}</p>
                        <p className="text-xs text-slate-500">
                          {task.status === 'feedback_approved' ? '✅ 已赔付' : '❌ 已驳回'} · {formatTime(task.created_at)}
                        </p>
                      </div>
                    </div>
                    {task.budget > 0 && (
                      <div className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 ${
                        task.status === 'feedback_approved' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Coins className="w-4 h-4" />
                        {task.budget.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-sm text-slate-600 line-clamp-2">{task.content}</p>
                    {task.replyNote && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                        <strong>平台回复：</strong>{task.replyNote}
                      </div>
                    )}
                    {task.status === 'feedback_rejected' && JSON.parse(task.description).rejectReason && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                        <strong>驳回原因：</strong>{JSON.parse(task.description).rejectReason}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 回复弹窗 */}
      {replyModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setReplyModal({ show: false, task: null, message: '' })} />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">回复反馈</h3>
            <textarea
              value={replyModal.message}
              onChange={e => setReplyModal(prev => ({ ...prev, message: e.target.value }))}
              placeholder="请输入回复内容..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setReplyModal({ show: false, task: null, message: '' })}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReply}
                disabled={processingId !== null}
                className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                {processingId !== null ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                发送回复
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 驳回弹窗 */}
      {rejectModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRejectModal({ show: false, task: null, reason: '' })} />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">驳回反馈</h3>
            <textarea
              value={rejectModal.reason}
              onChange={e => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="请输入驳回原因（将通知用户）..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRejectModal({ show: false, task: null, reason: '' })}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={processingId !== null}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                {processingId !== null ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <X className="w-5 h-5" />
                )}
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedbackPage;
