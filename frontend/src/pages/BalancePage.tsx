import WegCoin from '../components/WegCoin';
// BalancePage.tsx - 用户余额和交易记录页面
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Coins, Gift, ArrowLeft, Shield, Sparkles, CheckCircle, AlertTriangle, TrendingUp, Calendar, Download, ArrowUpRight, ArrowDownLeft, Zap, RotateCcw, Wallet, MessageSquare, X, Mail, Gift as GiftIcon, Bug, Unlock, HandCoins } from 'lucide-react';
import { supabaseFetch, type TokenTransaction } from '../utils/supabase';
import { workerTokenAPI } from '../utils/supabase';
import { useUser } from '../contexts/UserContext';

// 类型定义
interface User {
  id: number;
  username: string;
  email: string;
  token_balance: number;
  user_type: string;
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

// 获取交易记录（从 transactions 表获取用户18相关的所有交易）
const fetchTransactions = async (userId: number): Promise<TokenTransaction[]> => {
  try {
    // 获取所有与用户18相关的交易（to_id=18 为收入，from_id=18 为支出）
    const transactions = await supabaseFetch(
      `transactions?or=(from_id.eq.${userId},to_id.eq.${userId})&order=created_at.desc&limit=50`
    );
    
    // 转换为 TokenTransaction 格式
    const formattedTransactions: TokenTransaction[] = (transactions || []).map((tx: any) => {
      // 判断是收入还是支出
      const isIncome = tx.to_id === userId;
      const amount = isIncome ? Math.abs(tx.amount) : -Math.abs(tx.amount);
      
      return {
        id: tx.id,
        user_id: userId,
        amount: amount,
        type: tx.type,
        description: tx.description,
        related_task_id: tx.task_id,
        related_agent_id: tx.agent_id,
        created_at: tx.created_at,
      };
    });
    
    return formattedTransactions;
  } catch (err) {
    console.error('获取交易记录失败', err);
    return [];
  }
};

// 获取余额（直接读取users表的真实余额，而不是从交易记录汇总）
const fetchCalculatedBalance = async (userId: number): Promise<number> => {
  try {
    const data = await supabaseFetch(`users?id=eq.${userId}&select=token_balance`);
    if (data && data[0]) {
      return data[0].token_balance;
    }
    return 0;
  } catch (err) {
    console.error('获取余额失败', err);
    return 0;
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
const getTransactionIcon = (type: string, tx: TokenTransaction) => {
  switch (type) {
    case 'task_settlement':
      return { icon: <ArrowDownLeft className="w-5 h-5" />, color: 'text-rose-500', bgColor: 'bg-rose-50' };
    case 'task_payment':
      return { icon: <TrendingUp className="w-5 h-5" />, color: 'text-rose-500', bgColor: 'bg-rose-50' };
    case 'platform_fee':
      return { icon: <TrendingUp className="w-5 h-5" />, color: 'text-rose-500', bgColor: 'bg-rose-50' };
    case 'platform_fee_burned':
      return { icon: <TrendingUp className="w-5 h-5" />, color: 'text-orange-500', bgColor: 'bg-orange-50' };
    case 'task_reward':
      return { icon: <Gift className="w-5 h-5" />, color: 'text-emerald-500', bgColor: 'bg-emerald-50' };
    case 'daily_login':
    case 'daily_reward':
      return { icon: <Sparkles className="w-5 h-5" />, color: 'text-amber-500', bgColor: 'bg-amber-50' };
    case 'agent_unlock':
      return { icon: <Unlock className="w-5 h-5" />, color: 'text-purple-500', bgColor: 'bg-purple-50' };
    case 'compensation':
    case 'penalty':
    case 'settlement_refund':
      return { icon: <Shield className="w-5 h-5" />, color: 'text-emerald-500', bgColor: 'bg-emerald-50' };
    case 'bug_feedback_reward':
    case 'bug_reward':
      return { icon: <Bug className="w-5 h-5" />, color: 'text-blue-500', bgColor: 'bg-blue-50' };
    case 'adoption':
      return { icon: <Gift className="w-5 h-5" />, color: 'text-pink-500', bgColor: 'bg-pink-50' };
    default:
      return { icon: <Coins className="w-5 h-5" />, color: 'text-blue-500', bgColor: 'bg-blue-50' };
  }
};

// 获取交易类型名称
const getTransactionTypeName = (type: string) => {
  switch (type) {
    case 'task_settlement':
      return '任务结算';
    case 'task_payment':
      return '发布任务';
    case 'platform_fee':
      return '平台手续费';
    case 'platform_fee_burned':
      return '手续费销毁';
    case 'task_reward':
      return '任务奖励';
    case 'daily_login':
    case 'daily_reward':
      return '每日登录';
    case 'agent_unlock':
      return '解锁智能体';
    case 'compensation':
    case 'penalty':
      return '补偿赔付';
    case 'settlement_refund':
      return '结算退款';
    case 'bug_feedback_reward':
    case 'bug_reward':
      return 'Bug反馈奖励';
    case 'adoption':
      return '宠物领养';
    default:
      return '其他';
  }
};

// 判断是收入还是支出（正数=收入，负数=支出）
const isIncome = (tx: TokenTransaction): boolean => {
  return tx.amount > 0;
};

// 判断交易是否应该显示
const shouldShowTransaction = (tx: TokenTransaction): boolean => {
  return true; // token_transactions 表中的记录默认都显示
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
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [calculatedBalance, setCalculatedBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingReward, setClaimingReward] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  
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
        const [userData, txData, balance] = await Promise.all([
          fetchUser(userId),
          fetchTransactions(userId),
          fetchCalculatedBalance(userId)
        ]);
        setUser(userData);
        setTransactions(txData);
        setCalculatedBalance(balance);
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

  // 领取每日登录奖励
  const handleClaimDailyReward = async () => {
    if (!userId || claimingReward) return;
    
    try {
      setClaimingReward(true);
      setRewardMessage(null);
      
      const result = await workerTokenAPI.claimDailyReward(userId);
      
      if (result.success) {
        setRewardClaimed(true);
        setRewardMessage(result.message);
        // 更新用户余额
        if (user) {
          setUser({ ...user, token_balance: result.newBalance });
        }
        // 刷新交易记录
        const txData = await fetchTransactions(userId);
        setTransactions(txData);
      } else if (result.error === 'ALREADY_CLAIMED') {
        setRewardClaimed(true);
        setRewardMessage('今日已领取过登录奖励，明天再来吧！');
      } else {
        setRewardMessage(result.message || '领取失败');
      }
    } catch (err) {
      console.error('领取每日奖励失败:', err);
      setRewardMessage('领取失败，请稍后重试');
    } finally {
      setClaimingReward(false);
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
            WEG币 余额
          </div>
          <div className="text-6xl sm:text-7xl font-black text-white mb-1 tracking-tight" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            {calculatedBalance.toLocaleString()}
          </div>
          <p className="text-white/70 text-sm mb-3">
            平台内部服务积分
          </p>
          
          {/* 每日登录奖励按钮 */}
          <div className="flex justify-center">
            {!rewardClaimed ? (
              <button
                onClick={handleClaimDailyReward}
                disabled={claimingReward}
                className="inline-flex items-center gap-2 bg-white/25 backdrop-blur hover:bg-white/35 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all disabled:opacity-50"
              >
                {claimingReward ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    领取中...
                  </>
                ) : (
                  <>
                    <GiftIcon className="w-4 h-4" />
                    每日登录奖励 +20 <WegCoin size={14} />
                  </>
                )}
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full text-white/90 text-sm">
                <CheckCircle className="w-4 h-4" />
                今日已领取
              </div>
            )}
          </div>
          {rewardMessage && (
            <p className="text-white/90 text-sm mt-2">{rewardMessage}</p>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-lg mx-auto px-4 -mt-10">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* 赔付收入 */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs text-slate-500">赔付收入</span>
            </div>
            <p className="text-lg font-bold text-slate-800">
              +{transactions.filter(t => ['compensation', 'penalty', 'settlement_refund'].includes(t.type) && t.amount > 0).reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400">
              {transactions.filter(t => ['compensation', 'penalty', 'settlement_refund'].includes(t.type) && t.amount > 0).length} 次
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
              -{Math.abs(transactions.filter((t) => ['task_settlement', 'task_payment', 'adoption'].includes(t.type) && t.amount < 0).reduce((sum, t) => sum + t.amount, 0)).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400">
              {transactions.filter(t => ['task_settlement', 'task_payment', 'adoption'].includes(t.type) && t.amount < 0).length} 笔
            </p>
          </div>
          
          {/* 奖励收入 */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center">
                <Gift className="w-4 h-4 text-cyan-600" />
              </div>
              <span className="text-xs text-slate-500">奖励收入</span>
            </div>
            <p className="text-lg font-bold text-slate-800">
              +{transactions.filter(t => ['task_reward', 'daily_login', 'daily_reward', 'bug_feedback_reward', 'bug_reward'].includes(t.type) && t.amount > 0).reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400">
              {transactions.filter(t => ['task_reward', 'daily_login', 'daily_reward', 'bug_feedback_reward', 'bug_reward'].includes(t.type) && t.amount > 0).length} 次
            </p>
          </div>
          
          {/* 其他支出 */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs text-slate-500">其他支出</span>
            </div>
            <p className="text-lg font-bold text-slate-800">
              -{Math.abs(transactions.filter(t => ['platform_fee', 'agent_unlock'].includes(t.type) && t.amount < 0).reduce((sum, t) => sum + t.amount, 0)).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400">
              {transactions.filter(t => ['platform_fee', 'agent_unlock'].includes(t.type) && t.amount < 0).length} 笔
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
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
                <img src="/weg-coin.png" alt="WEG币" className="w-12 h-12 rounded-xl" style={{ objectFit: 'cover', opacity: 0.3 }} />
              </div>
              <p className="text-slate-500">暂无交易记录</p>
              <p className="text-xs text-slate-400 mt-1">发布任务或等待赔付到账</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.filter(shouldShowTransaction).map((tx) => {
                const { icon, color, bgColor } = getTransactionIcon(tx.type, tx);
                const isPositive = isIncome(tx);
                
                return (
                  <div 
                    key={tx.id} 
                    className="px-4 py-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center ${color}`}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 text-sm truncate">
                              {tx.description || getTransactionTypeName(tx.type)}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {formatTime(tx.created_at)}
                              {tx.related_task_id && ` · 任务 #${tx.related_task_id}`}
                            </p>
                          </div>
                          <div className={`text-right shrink-0 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            <p className="font-bold text-base">
                              {isPositive ? '+' : ''}{tx.amount.toLocaleString()}
                            </p>
                            <WegCoin size={14} />
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
                虚假信息赔 <span className="text-emerald-600 font-bold">1000 WEG币</span><br/>
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
