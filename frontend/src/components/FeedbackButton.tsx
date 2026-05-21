import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, CheckCircle, Coins, Sparkles } from 'lucide-react';

const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1/';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';

// 反馈类型映射到数据库type字段值
const typeMapping: Record<string, string> = {
  'bug': 'Bug',
  'quality': '虚假信息',
  'feature': '功能建议',
  'experience': '体验优化',
  'agent': '智能体问题',
  'other': '其他'
};

// 反馈类型配置
const feedbackTypes = [
  { id: 'bug', label: '🐛 Bug', desc: '功能异常或错误', claimable: true, defaultClaim: 100 },
  { id: 'quality', label: '⛔ 虚假信息', desc: '链接失效/信息不实', claimable: true, defaultClaim: 1000 },
  { id: 'feature', label: '💡 功能建议', desc: '希望新增的功能', claimable: false },
  { id: 'experience', label: '🎨 体验优化', desc: '界面或交互改进', claimable: false },
  { id: 'agent', label: '🤖 智能体问题', desc: '智能体表现不佳', claimable: true, defaultClaim: 100 },
  { id: 'other', label: '💬 其他', desc: '其他问题和建议', claimable: false },
];

// 获取当前用户
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const FeedbackButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('');
  const [content, setContent] = useState('');
  const [email, setEmail] = useState('');
  const [claimAmount, setClaimAmount] = useState(0);
  const [claimEnabled, setClaimEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentUser = getCurrentUser();
  const selectedType = feedbackTypes.find(t => t.id === type);

  // 当选择类型时，更新可赔付金额
  useEffect(() => {
    if (selectedType?.claimable) {
      setClaimAmount(selectedType.defaultClaim || 0);
      setClaimEnabled(true);
    } else {
      setClaimAmount(0);
      setClaimEnabled(false);
    }
  }, [type, selectedType]);

  const submit = async () => {
    if (!type || !content.trim()) return;
    
    // 如果启用赔付但未填写邮箱
    if (claimEnabled && claimAmount > 0 && !email.trim()) {
      alert('请填写邮箱以便接收赔付通知');
      return;
    }
    
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const userId = currentUser?.id || null;
      
      console.log('[反馈提交] 开始提交反馈', {
        type,
        typeLabel: typeMapping[type] || type,
        content: content.substring(0, 50),
        userId,
        claimEnabled,
        claimAmount,
        email: email.trim()
      });
      
      // 提交到 feedbacks 表
      const response = await fetch(`${SUPABASE_URL}feedbacks`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: userId,
          type: typeMapping[type] || type,
          content: content,
          status: 'pending',
          created_at: now,
          contact: email.trim() || null
        })
      });
      
      console.log('[反馈提交] API响应状态:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[反馈提交] 提交失败:', errorText);
        throw new Error(`提交失败: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[反馈提交] 提交成功:', result);
      
      // 如果启用赔付，创建赔付记录
      if (claimEnabled && claimAmount > 0 && currentUser?.id) {
        try {
          // 1. 更新用户token_balance
          const userRes = await fetch(`${SUPABASE_URL}users?id=eq.${currentUser.id}&select=token_balance`, {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            }
          });
          const userData = await userRes.json();
          const currentBalance = userData[0]?.token_balance || 0;
          const newBalance = currentBalance + claimAmount;
          
          await fetch(`${SUPABASE_URL}users?id=eq.${currentUser.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token_balance: newBalance })
          });
          
          // 2. 添加token交易记录
          await fetch(`${SUPABASE_URL}token_transactions`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: currentUser.id,
              amount: claimAmount,
              type: 'feedback_compensation',
              description: `反馈赔付奖励 - ${typeMapping[type] || type}类型反馈`,
              created_at: now
            })
          });
          
          console.log(`[反馈赔付] 已向用户 ${currentUser.id} 发放 ${claimAmount} WEG币`);
        } catch (rewardErr) {
          console.error('[反馈赔付] 自动赔付失败:', rewardErr);
        }
      } else if (type === 'bug' && currentUser?.id && !claimEnabled) {
        // Bug反馈默认奖励500省钱币（不申请赔付时）
        try {
          // 1. 更新用户token_balance
          const userRes = await fetch(`${SUPABASE_URL}users?id=eq.${currentUser.id}&select=token_balance`, {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            }
          });
          const userData = await userRes.json();
          const currentBalance = userData[0]?.token_balance || 0;
          const newBalance = currentBalance + 500;
          
          await fetch(`${SUPABASE_URL}users?id=eq.${currentUser.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token_balance: newBalance })
          });
          
          // 2. 添加token交易记录
          await fetch(`${SUPABASE_URL}token_transactions`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: currentUser.id,
              amount: 500,
              type: 'bug_feedback_reward',
              description: 'Bug反馈奖励 - 感谢您帮助改进平台',
              created_at: now
            })
          });
          
          console.log(`[反馈赔付] 已向用户 ${currentUser.id} 发放500省钱币`);
        } catch (rewardErr) {
          console.error('[反馈赔付] 自动赔付失败:', rewardErr);
        }
      }
      
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setType('');
        setContent('');
        setEmail('');
        setClaimAmount(0);
        setClaimEnabled(false);
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      console.error('提交反馈失败', err);
      alert('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* 浮动按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center md:bottom-6 md:right-6"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* 反馈弹窗 - 底部弹出 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 pb-8 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <X className="w-5 h-5 text-slate-500" />
            </button>

            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900">🎉 提交成功！</h3>
                <p className="text-slate-600 mt-2">
                  {claimEnabled && claimAmount > 0 ? (
                    <>
                      已提交！审核通过后<br/>
                      <span className="text-emerald-600 font-bold text-lg">{claimAmount.toLocaleString()} WEG币</span><br/>
                      将自动到账，可在余额页面查看
                    </>
                  ) : (
                    '反馈收集师·倾听者已收到，将尽快处理'
                  )}
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-slate-900">🔍 发现错误，赚WEG币！</h3>
                  <p className="text-sm text-slate-500 mt-1">平台承诺：虚假信息赔1000WEG币，Bug按程度赔50-200WEG币</p>
                </div>

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
                            ? 'border-emerald-500 bg-emerald-50' 
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
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
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
                          <label className="block text-xs text-slate-600 mb-1.5">赔付金额（WEG币）</label>
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
                              {selectedType.id === 'quality' ? '固定1000' : '50-200'}
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
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg'
                  }`}
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {submitting ? '提交中...' : claimEnabled && claimAmount > 0 ? `提交并申请赔付` : '提交反馈'}
                </button>

                {/* 登录提示 */}
                {!currentUser && (
                  <p className="text-xs text-slate-400 text-center mt-3">
                    💡 登录后可追踪赔付进度
                  </p>
                )}
              </>
            )}

            <style>{`
              @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
              .animate-slide-up { animation: slide-up 0.3s ease-out; }
            `}</style>
          </div>
        </div>
      )}
    </>
  );
};
