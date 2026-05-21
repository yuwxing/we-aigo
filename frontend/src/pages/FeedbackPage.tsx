import WegCoin from '../components/WegCoin';
import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Loader2, CheckCircle, Coins, Sparkles, Bell } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { Link } from 'react-router-dom';
import { DutyAgentCard } from '../components/DutyAgentWidget';
import { getDutyAgentByStation } from '../utils/dutyAgents';

const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1/';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';

const feedbackTypes = [
  { id: 'bug', label: '🐛 Bug', desc: '功能异常或错误', claimable: true, defaultClaim: 200 },
  { id: 'quality', label: '⛔ 虚假信息', desc: '链接失效/信息不实', claimable: true, defaultClaim: 1000 },
  { id: 'feature', label: '💡 功能建议', desc: '希望新增的功能', claimable: false },
  { id: 'experience', label: '🎨 体验优化', desc: '界面或交互改进', claimable: false },
  { id: 'agent', label: '🤖 智能体问题', desc: '智能体表现不佳', claimable: true, defaultClaim: 100 },
  { id: 'other', label: '💬 其他', desc: '其他问题和建议', claimable: false },
];

// 获取用户的最新赔付记录
const fetchLatestCompensation = async (userId: number): Promise<{ amount: number; description: string; created_at: string } | null> => {
  try {
    const res = await fetch(
      `${SUPABASE_URL}token_transactions?user_id=eq.${userId}&type=eq.compensation&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data[0]) {
        return data[0];
      }
    }
  } catch (e) {
    console.error('检查赔付失败', e);
  }
  return null;
};

const FeedbackPage: React.FC = () => {
  const { user } = useUser();
  const [type, setType] = useState('');
  const [content, setContent] = useState('');
  const [email, setEmail] = useState('');
  const [claimAmount, setClaimAmount] = useState(0);
  const [claimEnabled, setClaimEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string>('');
  
  // 赔付通知相关状态
  const [compensationPending, setCompensationPending] = useState(false);
  const [compensationReceived, setCompensationReceived] = useState<{ amount: number; description: string } | null>(null);
  const [lastKnownTxId, setLastKnownTxId] = useState<number | null>(null);

  const selectedType = feedbackTypes.find(t => t.id === type);

  useEffect(() => {
    if (selectedType?.claimable) {
      setClaimAmount(selectedType.defaultClaim || 0);
      setClaimEnabled(true);
    } else {
      setClaimAmount(0);
      setClaimEnabled(false);
    }
  }, [type, selectedType]);

  // 检测赔付是否到账
  useEffect(() => {
    if (!submitted || !user?.id || !claimEnabled) return;
    
    setCompensationPending(true);
    const checkInterval = setInterval(async () => {
      try {
        const latest = await fetchLatestCompensation(user.id);
        if (latest) {
          // 如果发现新的赔付记录
          if (!lastKnownTxId || latest.id !== lastKnownTxId) {
            // 检查是否与反馈相关（描述中包含反馈关键词）
            if (latest.description?.includes('赔付') || latest.description?.includes('反馈')) {
              setCompensationReceived({
                amount: latest.amount,
                description: latest.description
              });
              setCompensationPending(false);
              setLastKnownTxId(latest.id);
              clearInterval(checkInterval);
            }
          }
        }
      } catch (e) {
        console.error('检查赔付失败', e);
      }
    }, 5000); // 每5秒检查一次

    // 30秒后停止检查
    setTimeout(() => {
      clearInterval(checkInterval);
      setCompensationPending(false);
    }, 30000);

    return () => clearInterval(checkInterval);
  }, [submitted, user?.id, claimEnabled, lastKnownTxId]);

  const submit = async () => {
    if (!type || !content.trim()) return;
    if (claimEnabled && claimAmount > 0 && !email.trim()) {
      alert('请填写邮箱以便接收赔付通知');
      return;
    }

    setSubmitting(true);
    try {
      const typeLabel = selectedType?.label || type;
      const now = new Date().toISOString();
      setSubmittedAt(now);

      await fetch(`${SUPABASE_URL}tasks`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `【反馈】${typeLabel}`,
          description: JSON.stringify({
            feedbackType: type,
            feedbackTypeLabel: typeLabel,
            content: content,
            claimAmount: claimEnabled ? claimAmount : 0,
            email: email.trim(),
            submitterId: user?.id || 'anonymous',
            submitterName: user?.username || '匿名用户',
            submittedAt: now,
            source: '反馈页面'
          }),
          status: 'pending_review',
          matched_agent_id: 25,
          budget: claimEnabled ? claimAmount : 0,
          publisher_id: user?.id || 3,
          requirements: []
        })
      });

      setSubmitted(true);
      setTimeout(() => {
        setType('');
        setContent('');
        setEmail('');
        setClaimAmount(0);
        setClaimEnabled(false);
        setSubmitted(false);
        setCompensationReceived(null);
        setCompensationPending(false);
      }, 3000);
    } catch (err) {
      console.error('提交反馈失败', err);
      alert('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 p-4">
        <div className="text-center bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-900">🎉 提交成功！</h3>
          <p className="text-slate-600 mt-3">
            {claimEnabled && claimAmount > 0 ? (
              <>
                已提交！审核通过后<br />
                <span className="text-emerald-600 font-bold text-lg">{claimAmount.toLocaleString()} <WegCoin size={14} />币</span><br />
                将自动到账
              </>
            ) : (
              '反馈收集师·倾听者已收到，将尽快处理'
            )}
          </p>
          
          {/* 赔付通知 */}
          {compensationReceived && (
            <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl animate-pulse">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-emerald-700">🎉 赔付已到账！</span>
              </div>
              <p className="text-emerald-600 font-bold text-lg">
                +{compensationReceived.amount.toLocaleString()} <WegCoin size={14} />
              </p>
              <Link 
                to="/balance"
                className="inline-flex items-center gap-1 mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                去余额页面查看 →
              </Link>
            </div>
          )}
          
          {/* 等待赔付状态 */}
          {compensationPending && !compensationReceived && claimEnabled && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center justify-center gap-2 text-amber-700">
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">等待赔付审核...</span>
              </div>
              <p className="text-xs text-amber-600 mt-1">审核通过后会自动通知您</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 p-4 pb-24">
      <div className="max-w-lg mx-auto">
        {/* 标题区 */}
        <div className="text-center mb-6 pt-4">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full mb-3">
            <Sparkles className="w-5 h-5" />
            <span className="font-bold">发现错误，赚<WegCoin size={14} />币！</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">平台反馈</h1>
          <p className="text-sm text-slate-500 mt-1">虚假信息赔1000<WegCoin size={14} />币，Bug按程度赔50-1000<WegCoin size={14} />币</p>
        </div>

        {/* 值班智能体入口 */}
        {(() => {
          const dutyAgent = getDutyAgentByStation('feedback');
          if (!dutyAgent) return null;
          return (
            <div className="mb-4">
              <DutyAgentCard 
                agent={dutyAgent} 
                onChat={() => window.location.href = '/pet-chat/da-zhuang'} 
              />
            </div>
          );
        })()}

        {/* 反馈表单卡片 */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/50">
          {/* 反馈类型选择 */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">反馈类型</label>
            <div className="grid grid-cols-2 gap-2">
              {feedbackTypes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    type === t.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="font-medium text-sm">{t.label}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                  {t.claimable && type !== t.id && (
                    <span className="inline-block mt-1 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">可赔付</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 反馈内容 */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">详细描述</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="请描述您遇到的问题，包括具体的时间、内容等..."
              rows={5}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* 赔付申请区域 */}
          {selectedType?.claimable && (
            <div className="mb-5 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Coins className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-emerald-800">申请赔付</span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={claimEnabled}
                    onChange={e => setClaimEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">启用赔付申请</span>
                </label>
              </div>
              {claimEnabled && (
                <>
                  <div className="mb-3">
                    <label className="block text-xs text-slate-600 mb-1.5">赔付金额（<WegCoin size={14} />币）</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={claimAmount}
                        onChange={e => setClaimAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        min="0"
                        max="10000"
                        className="flex-1 px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <span className="text-sm text-slate-500">
                        {selectedType.id === 'quality' ? '固定1000' : '50-1000'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1.5">通知邮箱（用于接收赔付结果）</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* 提交 */}
          <button
            onClick={submit}
            disabled={submitting || !type || !content.trim() || (claimEnabled && claimAmount > 0 && !email.trim())}
            className={`w-full py-3.5 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
              submitting || !type || !content.trim() || (claimEnabled && claimAmount > 0 && !email.trim())
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
            }`}
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {submitting ? '提交中...' : claimEnabled && claimAmount > 0 ? `提交并申请赔付` : '提交反馈'}
          </button>

          {!user && (
            <p className="text-xs text-slate-400 text-center mt-3">
              💡 登录后可追踪赔付进度
            </p>
          )}
        </div>

        {/* 客服联系方式 */}
        <div className="mt-4 bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/50 text-center">
          <p className="text-sm text-slate-500">📧 客服邮箱</p>
          <p className="text-base font-semibold text-purple-600 mt-1">huaxianzi@coze.email</p>
          <p className="text-xs text-slate-400 mt-1">工作日24小时内回复 · 虚假信息赔1000token</p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
