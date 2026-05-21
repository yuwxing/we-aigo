// BalancePage.tsx - 用户余额和交易记录页面
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Coins, Gift, ArrowLeft, Shield, Sparkles, CheckCircle, AlertTriangle, TrendingUp, Calendar, Download, ArrowUpRight, ArrowDownLeft, Zap, RotateCcw, Wallet, MessageSquare, X, Mail } from 'lucide-react';
import { supabaseFetch } from '../utils/supabase';
import { useUser } from '../contexts/UserContext';

// 类型定义
interface User {
  id: number;
  username: string;
  email: string;
  token_balance: number;
  user_type: string;
}

interface Transaction {
  id: number;
  from_id: number;
  from_type: string;
  to_id: number;
  to_type: string;
  amount: number;
  task_id: number | null;
  type: string;
  description: string;
  created_at: string;
}

// 获取用户信息
const fetchUser = async (userId: number): Promise<User | null> => {
  try {
    const data = await supabaseFetch(`users?id=eq.${userId}`);
    return data && data[0] ? data[0] : null;
  } catch (err) {
    console.error('获取用户失败', err);
    return null;
  }
};

// 获取交易记录（包含用户作为from或to的所有交易）
const fetchTransactions = async (userId: number): Promise<Transaction[]> => {
  try {
    // 获取用户作为接收者的交易
    const received = await supabaseFetch(`transactions?to_id=eq.${userId}&order=created_at.desc&limit=100`);
    // 获取用户作为发送者的交易
    const sent = await supabaseFetch(`transactions?from_id=eq.${userId}&order=created_at.desc&limit=100`);
    
    const allTransactions = [...(received || []), ...(sent || [])];
    // 去重并按时间排序
    const uniqueTransactions = Array.from(
      new Map(allTransactions.map(t => [t.id, t])).values()
    ).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    
    return uniqueTransactions;
  } catch (err) {
    console.error('获取交易记录失败', err);
    return [];
  }
};

// 格式化时间
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } else if (diffDays === 1) {
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
};

// 获取交易类型图标和颜色
const getTransactionIcon = (type: string, fromType?: string, toType?: string) => {
  switch (type) {
    case 'compensation':
      return { icon: <Shield className="w-5 h-5" />, color: 'text-emerald-500', bgColor: 'bg-emerald-50' };
    case 'penalty':
      return { icon: <Shield className="w-5 h-5" />, color: 'text-emerald-500', bgColor: 'bg-emerald-50' };
    case 'penalty_refund':
      return { icon: <Shield className="w-5 h-5" />, color: 'text-emerald-500', bgColor: 'bg-emerald-50' };
    case 'reward':
      return { icon: <Gift className="w-5 h-5" />, color: 'text-purple-500', bgColor: 'bg-purple-50' };
    case 'bonus':
      return { icon: <Sparkles className="w-5 h-5" />, color: 'text-amber-500', bgColor: 'bg-amber-50' };
    case 'task_payment':
      return { icon: <ArrowDownLeft className="w-5 h-5" />, color: 'text-rose-500', bgColor: 'bg-rose-50' };
    case 'delivery_reward':
      // 交付报酬暂不显示给用户
      return { icon: <Zap className="w-5 h-5" />, color: 'text-blue-500', bgColor: 'bg-blue-50', hidden: true };
    case 'refund':
      return { icon: <RotateCcw className="w-5 h-5" />, color: 'text-cyan-500', bgColor: 'bg-cyan-50' };
    case 'consume':
      return { icon: <TrendingUp className="w-5 h-5" />, color: 'text-rose-500', bgColor: 'bg-rose-50' };
    default:
      return { icon: <Coins className="w-5 h-5" />, color: 'text-blue-500', bgColor: 'bg-blue-50' };
  }
};

// 获取交易类型名称
const getTransactionTypeName = (type: string) => {
  switch (type) {
    case 'compensation':
      return '质量赔偿';
    case 'penalty':
      return '违约赔偿';
    case 'penalty_refund':
      return '违约赔偿';
    case 'reward':
      return '奖励发放';
    case 'bonus':
      return '活动奖励';
    case 'task_payment':
      return '发布任务';
    case 'delivery_reward':
      return '交付报酬';
    case 'refund':
      return '退款';
    case 'consume':
      return '任务消费';
    default:
      return '其他';
  }
};

// 判断交易是否应该显示（隐藏delivery_reward类型）
const shouldShowTransaction = (tx: Transaction): boolean => {
  // delivery_reward类型暂不显示给用户
  if (tx.type === 'delivery_reward') return false;
  return true;
};

// 判断是收入还是支出
const isIncome = (tx: Transaction, userId: number): boolean => {
  // 用户作为接收者（to_id）是收入
  if (tx.to_id === userId) return true;
  // 用户作为发送者（from_id）是支出
  if (tx.from_id === userId) return false;
  // 根据类型判断
  const incomeTypes = ['compensation', 'penalty', 'penalty_refund', 'reward', 'bonus', 'refund'];
  return incomeTypes.includes(tx.type);
};

const BalancePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user: loggedUser } = useUser();
  const getUserId = (): number => {
    const urlUserId = searchParams.get('userId');
    if (urlUserId) return parseInt(urlUserId, 10);
    if (loggedUser?.id) return loggedUser.id;
    return 0; // 未登录
  };
  const userId = getUserId();
  
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 赔付详情弹窗
  const [claimDetail, setClaimDetail] = useState<{
    show: boolean;
    taskId: number | null;
    feedbackType: string;
    content: string;
    email: string;
    submittedAt: string;
  }>({ show: false, taskId: null, feedbackType: '', content: '', email: '', submittedAt: '' });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [userData, txData] = await Promise.all([
          fetchUser(userId),
          fetchTransactions(userId)
        ]);
        setUser(userData);
        setTransactions(txData);
      } catch (err) {
        setError('加载数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  // 查看赔付详情
  const handleClaimClick = async (taskId: number) => {
    try {
      const tasks = await supabaseFetch(`tasks?id=eq.${taskId}`);
      if (tasks && tasks[0]) {
        try {
          const parsed = JSON.parse(tasks[0].description);
          setClaimDetail({
            show: true,
            taskId,
            feedbackType: parsed.feedbackTypeLabel || parsed.feedbackType || '未知',
            content: parsed.content || '',
            email: parsed.email || '',
            submittedAt: parsed.submittedAt || tasks[0].created_at
          });
        } catch {
          setClaimDetail({
            show: true,
            taskId,
            feedbackType: '未知',
            content: tasks[0].description || '',
            email: '',
            submittedAt: tasks[0].created_at
          });
        }
      }
    } catch (err) {
      console.error('获取反馈详情失败', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (userId === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center">
        <div className="text-center p-6">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-2">请先登录查看余额</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-2 rounded-xl hover:opacity-90 transition-opacity">
            去登录
          </Link>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center">
        <div className="text-center p-6">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-slate-600">{error || '用户不存在'}</p>
          <Link to="/" className="mt-4 inline-flex items-center gap-2 text-purple-600 hover:text-purple-700">
            <ArrowLeft className="w-4 h-4" /> 返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* 顶部背景 */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500 pt-6 pb-20 px-4 rounded-b-[2rem] shadow-xl">
        {/* 返回按钮 */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            to="/" 
            className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-white font-semibold text-lg">我的余额</h1>
          <div className="w-10" />
        </div>

        {/* 余额显示 */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-1.5 rounded-full text-white/80 text-sm mb-4">
            <Coins className="w-4 h-4" />
            Token 余额
          </div>
          <div className="text-6xl sm:text-7xl font-black text-white mb-2 tracking-tight" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            {(() => {
              // 动态计算余额：初始余额(10300) + 收入 - 支出
              const initialBalance = 10300;
              const income = transactions.filter(t => t.to_id === userId).reduce((sum, t) => sum + (t.amount || 0), 0);
              const expense = transactions.filter(t => t.from_id === userId).reduce((sum, t) => sum + (t.amount || 0), 0);
              return (initialBalance + income - expense).toLocaleString();
            })()}
          </div>
          <p className="text-white/70 text-sm">
            @{user.username}
          </p>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-lg mx-auto px-4 -mt-10">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* 赔偿收入 */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs text-slate-500">赔偿收入</span>
            </div>
            <p className="text-lg font-bold text-slate-800">
              +{transactions.filter(t => (t.type === 'compensation' || t.type === 'penalty_refund' || t.type === 'penalty') && t.to_id === userId).reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400">
              {transactions.filter(t => (t.type === 'compensation' || t.type === 'penalty_refund' || t.type === 'penalty') && t.to_id === userId).length} 次
            </p>
          </div>
          
          {/* 任务支出 */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-rose-100 to-pink-100 rounded-lg flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4 text-rose-600" />
              </div>
              <span className="text-xs text-slate-500">任务支出</span>
            </div>
            <p className="text-lg font-bold text-slate-800">
              -{transactions.filter(t => t.type === 'task_payment' && t.from_id === userId).reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400">
              {transactions.filter(t => t.type === 'task_payment').length} 笔
            </p>
          </div>
          
          {/* 退款收入 */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center">
                <RotateCcw className="w-4 h-4 text-cyan-600" />
              </div>
              <span className="text-xs text-slate-500">退款收入</span>
            </div>
            <p className="text-lg font-bold text-slate-800">
              +{transactions.filter(t => t.type === 'refund' && t.to_id === userId).reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400">
              {transactions.filter(t => t.type === 'refund').length} 次
            </p>
          </div>
          
          {/* 其他收入 */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs text-slate-500">奖励收入</span>
            </div>
            <p className="text-lg font-bold text-slate-800">
              +{transactions.filter(t => (t.type === 'reward' || t.type === 'bonus') && t.to_id === userId).reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400">
              {transactions.filter(t => t.type === 'reward' || t.type === 'bonus').length} 次
            </p>
          </div>
        </div>

        {/* 交易记录列表 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-purple-500" />
            <h2 className="font-semibold text-slate-800">交易明细</h2>
            <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              {transactions.filter(shouldShowTransaction).length} 条
            </span>
          </div>

          {transactions.filter(shouldShowTransaction).length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Coins className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500">暂无交易记录</p>
              <p className="text-xs text-slate-400 mt-1">发布任务或等待赔偿到账</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.filter(shouldShowTransaction).map((tx) => {
                const { icon, color, bgColor } = getTransactionIcon(tx.type, tx.from_type, tx.to_type);
                const isPositive = isIncome(tx, userId);
                const isClickableClaim = tx.type === 'penalty_refund' && tx.task_id;
                
                return (
                  <div 
                    key={tx.id} 
                    className={`px-4 py-3.5 hover:bg-slate-50 transition-colors ${isClickableClaim ? 'cursor-pointer' : ''}`}
                    onClick={() => isClickableClaim && handleClaimClick(tx.task_id!)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center ${color}`}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 text-sm truncate flex items-center gap-1">
                              {tx.description || getTransactionTypeName(tx.type)}
                              {isClickableClaim && <MessageSquare className="w-3 h-3 text-emerald-500" />}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {formatTime(tx.created_at)}
                              {tx.task_id && ` · 任务 #${tx.task_id}`}
                            </p>
                          </div>
                          <div className={`text-right shrink-0 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            <p className="font-bold text-base">
                              {isPositive ? '+' : '-'}{tx.amount.toLocaleString()}
                            </p>
                            <p className="text-xs opacity-60">Token</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 平台承诺 */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-5 mb-24">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">平台质量承诺</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                虚假信息赔 <span className="text-emerald-600 font-bold">1000 Token</span><br/>
                质量翻车必赔，服务不满意有保障
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 赔付详情弹窗 */}
      {claimDetail.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setClaimDetail(prev => ({ ...prev, show: false }))} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <h3 className="font-bold">赔付详情</h3>
                </div>
                <button
                  onClick={() => setClaimDetail(prev => ({ ...prev, show: false }))}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  claimDetail.feedbackType.includes('虚假') ? 'bg-red-100 text-red-700' :
                  claimDetail.feedbackType.includes('Bug') ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {claimDetail.feedbackType}
                </span>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{claimDetail.content}</p>
              </div>
              
              <div className="space-y-2 text-sm">
                {claimDetail.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4" />
                    <span>{claimDetail.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>提交时间：{new Date(claimDetail.submittedAt).toLocaleString('zh-CN')}</span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-center text-emerald-600 font-medium">
                  ✅ 赔付已到账，感谢您的反馈！
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalancePage;
