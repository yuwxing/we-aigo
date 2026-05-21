// AI帮充 · 体验版 + 省钱攻略（动态优惠）
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Loader2, CheckCircle, Clock, AlertCircle, Heart, RefreshCw, ExternalLink } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

const petAvatars: Record<number, string> = {
  1: '/pets/huaxianzi.png', 3: '/pets/mengya.png', 29: '/pets/lianhua.png',
  31: '/pets/nuanyu.png', 28: '/pets/mocai.png', 30: '/pets/huizhi.png', 32: '/pets/huixi.png',
};

const quickTags = ['手机', '笔记本', '空调', '防晒霜', '面膜', '洗衣机', '耳机', '运动鞋'];

// 运营商号段规则
const operatorPrefixes = {
  '中国移动': ['134', '135', '136', '137', '138', '139', '147', '150', '151', '152', '157', '158', '159', '172', '178', '182', '183', '184', '187', '188', '195', '197', '198'],
  '中国联通': ['130', '131', '132', '145', '155', '156', '166', '171', '175', '176', '185', '186', '196'],
  '中国电信': ['133', '149', '153', '173', '174', '177', '180', '181', '189', '190', '191', '193', '199']
};

const operatorColors: Record<string, string> = {
  '中国移动': '#0085D0',
  '中国联通': '#E60012',
  '中国电信': '#0066FF'
};

const operatorLogos: Record<string, string> = {
  '中国移动': '📱',
  '中国联通': '📲',
  '中国电信': '📞'
};

// 运营商官方网页充值URL
const carrierUrls: Record<string, string> = {
  '中国移动': 'https://m.10086.cn/',
  '中国联通': 'https://m.10010.com/',
  '中国电信': 'https://m.189.cn/',
  '未知': 'https://m.10086.cn/'
};

// 体验版金额选项：10/20/30/50元
const rechargeAmounts = [10, 20, 30, 50];

// Supabase配置
const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';

// 优惠信息接口
interface DealInfo {
  id: number;
  title: string;
  description: string;
  budget: number;
  created_at: string;
  parsedDesc?: {
    platform: string;
    category: string;
    summary: string;
    detail: string;
    link?: string;
    discount: string;
    expireDate?: string;
    tags?: string[];
  };
}

// 花仙子智能体ID（保留但不再使用）
const AGENT_ID = 1;

const callDeepSeekAPI = async (userInput: string, retries = 2): Promise<string> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-17df56ac8d1b4544914816f45c3c7064' },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: `你是省钱助手。用户说想买什么，你直接给结论。格式：
📊 最低价：[平台] [价格]
🎫 券：[口令] [怎么领]
💡 建议：[一句话]
🏷️ 买：[推荐渠道]

要求：简短直接，不要废话，价格给具体数字。` },
            { role: 'user', content: userInput }
          ],
          temperature: 0.7,
          max_tokens: 800
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`API错误: ${response.status}`);
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '暂无结果';
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(r => setTimeout(1000));
    }
  }
  throw new Error('API调用失败');
};

// 识别运营商
const identifyOperator = (phone: string): string | null => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 3) return null;
  
  for (const [operator, prefixes] of Object.entries(operatorPrefixes)) {
    for (const prefix of prefixes) {
      if (cleanPhone.startsWith(prefix)) {
        return operator;
      }
    }
  }
  return null;
};

// 打开运营商官方网页充值
const openCarrierRecharge = (operator: string) => {
  const url = carrierUrls[operator] || carrierUrls['未知'];
  window.open(url, '_blank');
};

// 格式化手机号（脱敏）
const formatPhone = (phone: string): string => {
  if (phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
};

// ============ AI帮充组件（体验版 - 纯模拟）============
// 模拟充值记录（仅本地state，不存数据库）
interface SimulatedRecord {
  id: string;
  phone: string;
  amount: number;
  operator: string;
  time: string;
}

interface AIRechargeProps {
  refreshBalance: () => void;
}

const AIRecharge: React.FC<AIRechargeProps> = ({ refreshBalance }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [phone, setPhone] = useState('');
  const [operator, setOperator] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isRecharging, setIsRecharging] = useState(false);
  const [rechargeResult, setRechargeResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  // 模拟充值记录（本地存储，不存数据库）
  const [simulatedRecords, setSimulatedRecords] = useState<SimulatedRecord[]>([]);
  const [todayCount, setTodayCount] = useState(0);

  // 监听手机号变化，识别运营商
  useEffect(() => {
    const op = identifyOperator(phone);
    setOperator(op);
    if (!op) setSelectedAmount(null);
  }, [phone]);

  // 加载当日模拟充值次数（从localStorage）
  useEffect(() => {
    if (user?.id) {
      loadTodayCount();
      loadSimulatedRecords();
    }
  }, [user]);

  // 从localStorage加载当日次数
  const loadTodayCount = () => {
    if (!user?.id) return;
    const today = new Date().toISOString().split('T')[0];
    const key = `recharge_sim_count_${user.id}_${today}`;
    const count = parseInt(localStorage.getItem(key) || '0');
    setTodayCount(count);
  };

  // 从localStorage加载模拟记录
  const loadSimulatedRecords = () => {
    if (!user?.id) return;
    const key = `recharge_sim_records_${user.id}`;
    const records = localStorage.getItem(key);
    if (records) {
      try {
        setSimulatedRecords(JSON.parse(records));
      } catch {
        setSimulatedRecords([]);
      }
    }
  };

  // 保存模拟记录到localStorage
  const saveSimulatedRecord = (record: SimulatedRecord) => {
    if (!user?.id) return;
    const key = `recharge_sim_records_${user.id}`;
    const records = [...simulatedRecords, record];
    localStorage.setItem(key, JSON.stringify(records));
    setSimulatedRecords(records);

    // 更新当日次数
    const today = new Date().toISOString().split('T')[0];
    const countKey = `recharge_sim_count_${user.id}_${today}`;
    const newCount = todayCount + 1;
    localStorage.setItem(countKey, String(newCount));
    setTodayCount(newCount);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setPhone(value);
  };

  // 体验版纯模拟：不检查余额
  const canRecharge = phone.length === 11 && selectedAmount && user;
  const dailyLimitReached = todayCount >= 3;
  const amountLimitReached = selectedAmount && selectedAmount > 50;

  const handleRechargeClick = () => {
    if (!user) {
      setRechargeResult({ success: false, message: '请先登录后再进行充值' });
      return;
    }
    if (dailyLimitReached) {
      setRechargeResult({ success: false, message: '今日充值次数已用完（每日限3次）' });
      return;
    }
    if (amountLimitReached) {
      setRechargeResult({ success: false, message: '体验版单次充值上限50元' });
      return;
    }
    if (!operator) {
      setRechargeResult({ success: false, message: '无法识别运营商，请确认手机号' });
      return;
    }
    setShowConfirm(true);
  };

  // 体验版模拟充值：纯展示，不扣tokens，不记录数据库
  const handleConfirmRecharge = async () => {
    if (!user || !selectedAmount) return;
    
    setShowConfirm(false);
    setIsRecharging(true);
    setRechargeResult(null);

    try {
      // 1. 模拟充值中（3秒）
      setRechargeResult({ success: true, message: '⏳ AI正在帮您充值...' });
      
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 2. 模拟完成，保存本地记录
      const maskedPhone = `${phone.slice(0,3)}****${phone.slice(-4)}`;
      const newRecord: SimulatedRecord = {
        id: Date.now().toString(),
        phone: maskedPhone,
        amount: selectedAmount,
        operator: operator || '未知',
        time: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      };
      saveSimulatedRecord(newRecord);

      // 3. 显示成功结果
      setRechargeResult({ 
        success: true, 
        message: '✅ 体验版模拟完成！正式上线后，AI将自动帮您充值话费，无需下载任何APP' 
      });
      
    } catch (err) {
      setRechargeResult({ success: false, message: '网络错误，请检查网络后重试' });
    } finally {
      setIsRecharging(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-transparent"
      style={{ background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #9333ea, #ec4899) border-box' }}>
      {/* 标题区 */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="font-bold text-white text-lg">AI帮充</h3>
            <p className="text-white/80 text-xs">输入手机号，AI帮你充值话费</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 🧪 体验版标识横幅 */}
        <div 
          className="rounded-lg p-3 text-center"
          style={{ backgroundColor: '#FFF8E1', borderRadius: '8px' }}
        >
          <div className="text-sm font-medium" style={{ color: '#795548' }}>
            <span className="text-base mr-1">🧪</span>
            <strong>AI帮充 · 体验版</strong>
          </div>
          <div className="text-xs mt-1" style={{ color: '#8D6E63' }}>
            小范围测试中，每人每日限3次，单次≤50元
          </div>
        </div>

        {/* 每日次数提示 */}
        {user && (
          <div className="text-center text-sm">
            <span className="text-gray-500">今日已充：</span>
            <span className={`font-bold ${todayCount >= 3 ? 'text-red-500' : 'text-purple-600'}`}>
              {todayCount}/3
            </span>
            {todayCount >= 3 && (
              <span className="text-red-500 ml-2">（已达上限）</span>
            )}
          </div>
        )}

        {/* 手机号输入 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📱 手机号</label>
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="请输入11位手机号"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-gray-800 placeholder-gray-400 text-lg tracking-wider transition-all"
            />
            {phone.length === 11 && operator && (
              <div 
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-white text-sm font-medium flex items-center gap-1"
                style={{ backgroundColor: operatorColors[operator] }}
              >
                <span>{operatorLogos[operator]}</span>
                <span>{operator}</span>
              </div>
            )}
          </div>
        </div>

        {/* 充值金额 */}
        {operator && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">💰 充值金额</label>
            <div className="grid grid-cols-4 gap-2">
              {rechargeAmounts.map(amount => (
                <button
                  key={amount}
                  onClick={() => setSelectedAmount(amount === selectedAmount ? null : amount)}
                  className={`py-3 rounded-xl text-base font-medium transition-all flex items-center justify-center ${
                    selectedAmount === amount
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  ¥{amount}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Token费用提示 - 已移除，体验版不扣tokens */}
        {selectedAmount && selectedAmount > 50 && (
          <div className="text-xs text-red-500 mt-1 font-medium">⚠️ 体验版单次上限50元</div>
        )}

        {/* 未登录提示 */}
        {!user && phone.length === 11 && (
          <div className="bg-yellow-50 rounded-xl p-3 text-center text-yellow-700 text-sm">
            请先登录后再进行充值
          </div>
        )}

        {/* AI帮充按钮 */}
        {user && (
          <button
            onClick={handleRechargeClick}
            disabled={!canRecharge || isRecharging || dailyLimitReached}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              canRecharge && !dailyLimitReached
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-xl active:scale-98'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isRecharging ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AI正在帮您充值...
              </>
            ) : dailyLimitReached ? (
              <>
                <span>🚫</span>
                <span>今日次数已用完</span>
              </>
            ) : (
              <>
                <span>🤖</span>
                <span>AI帮充 {selectedAmount ? `¥${selectedAmount}` : ''}</span>
              </>
            )}
          </button>
        )}

        {/* 结果提示 */}
        {rechargeResult && (
          <div className={`rounded-xl p-4 flex items-start gap-3 ${
            rechargeResult.success && !rechargeResult.message.includes('❌') && !rechargeResult.message.includes('⏳') ? 'bg-green-50' : rechargeResult.message.includes('⏳') ? 'bg-purple-50' : 'bg-orange-50'
          }`}>
            {rechargeResult.message.includes('⏳') ? (
              <Loader2 className="w-6 h-6 text-purple-500 flex-shrink-0 animate-spin" />
            ) : rechargeResult.success && !rechargeResult.message.includes('❌') ? (
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0" />
            )}
            <div>
              <p className={`font-medium ${rechargeResult.message.includes('⏳') ? 'text-purple-700' : rechargeResult.success && !rechargeResult.message.includes('❌') ? 'text-green-700' : 'text-orange-700'}`}>
                {rechargeResult.message}
              </p>
            </div>
          </div>
        )}

        {/* 运营商提示 */}
        {!operator && phone.length === 11 && (
          <div className="text-center py-3 text-gray-500 text-sm">
            未能识别运营商，请确认手机号是否正确
          </div>
        )}

        {/* 模拟充值记录 */}
        <div className="border-t border-gray-100 pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              充值记录
            </h4>
          </div>
          
          {simulatedRecords.length > 0 ? (
            <div className="space-y-2">
              {simulatedRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    <span className="text-gray-700">
                      {record.phone} 
                      <span className="text-gray-400 mx-1">→</span>
                      ¥{record.amount}
                      <span className="text-purple-500 text-xs ml-1">体验版演示</span>
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{record.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-gray-400 text-sm">
              暂无充值记录
            </div>
          )}
        </div>
      </div>

      {/* 充值确认弹窗 - 体验版简化版 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h4 className="font-bold text-lg text-gray-900 mb-4 text-center">体验版模拟充值</h4>
            <div className="text-center space-y-2 mb-4">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <span>📱</span>
                <span>手机号：</span>
                <span className="font-bold">{formatPhone(phone)}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold text-purple-600">¥{selectedAmount}</span>
              </div>
              {operator && (
                <div className="flex items-center justify-center gap-2">
                  <span 
                    className="px-3 py-1 rounded-full text-white text-sm font-medium"
                    style={{ backgroundColor: operatorColors[operator] }}
                  >
                    🤖 {operator}
                  </span>
                </div>
              )}
            </div>
            
            {/* 体验版提示 */}
            <div className="bg-green-50 rounded-xl p-3 mb-4 text-sm text-green-800 text-center">
              这是体验演示，不会扣费<br/>
              正式上线后AI将自动完成充值
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium"
              >
                取消
              </button>
              <button
                onClick={handleConfirmRecharge}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium"
              >
                开始模拟
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============ 动态优惠信息组件 ============
interface DynamicDealsProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

const DynamicDeals: React.FC<DynamicDealsProps> = ({ onRefresh, isRefreshing }) => {
  const [deals, setDeals] = useState<DealInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/tasks?status=eq.deal&select=id,title,description,budget,created_at&order=id.desc&limit=20`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const data = await res.json();
      
      // 解析description JSON并过滤过期
      const today = new Date().toISOString().split('T')[0];
      const validDeals = (data || [])
        .map((item: DealInfo) => {
          try {
            const parsed = JSON.parse(item.description);
            // 过滤已过期的优惠
            if (parsed.expireDate && parsed.expireDate < today) {
              return null;
            }
            return { ...item, parsedDesc: parsed };
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      
      setDeals(validDeals);
      setLastUpdate(new Date().toLocaleDateString('zh-CN'));
    } catch (e) {
      console.error('获取优惠信息失败', e);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleViewDetail = (link?: string) => {
    if (link) {
      window.open(link, '_blank');
    }
  };

  // 平台emoji映射
  const platformEmoji: Record<string, string> = {
    '京东': '🛒',
    '淘宝': '🛍️',
    '天猫': '👑',
    '美团': '🍔',
    '拼多多': '💰',
    '抖音': '📱',
    '支付宝': '💳',
    '微信': '💬',
  };

  return (
    <div className="space-y-4">
      {/* 顶部横幅 */}
      <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              💡 AI帮你省钱 · 每日更新
            </h3>
            <p className="text-white/80 text-sm mt-1">
              AI智能体每天搜索全网优惠，帮你省真金白银
            </p>
            {lastUpdate && (
              <p className="text-white/60 text-xs mt-1">
                更新时间：{lastUpdate}
              </p>
            )}
          </div>
          <button
            onClick={() => { fetchDeals(); onRefresh(); }}
            disabled={isRefreshing}
            className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="bg-white rounded-2xl p-6 text-center">
          <Loader2 className="w-8 h-8 text-orange-500 mx-auto mb-2 animate-spin" />
          <p className="text-gray-500 text-sm">AI正在搜索全网优惠...</p>
        </div>
      )}

      {/* 无数据状态 */}
      {!loading && deals.length === 0 && (
        <div className="bg-white rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-600 font-medium">今日暂无新优惠</p>
          <p className="text-gray-400 text-sm mt-1">明天来看看~</p>
        </div>
      )}

      {/* 优惠卡片列表 */}
      {!loading && deals.length > 0 && (
        <div className="space-y-3">
          {deals.map((deal) => {
            const desc = deal.parsedDesc;
            if (!desc) return null;
            
            return (
              <div
                key={deal.id}
                className="bg-white rounded-2xl shadow-md overflow-hidden"
                style={{
                  borderLeft: '4px solid transparent',
                  borderImage: 'linear-gradient(180deg, #9333ea, #ec4899) 1'
                }}
              >
                <div className="p-4">
                  {/* 标题行：平台+分类+标题 */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xl">
                      {platformEmoji[desc.platform] || '🏷️'}
                    </span>
                    <span className="font-bold text-gray-900">{desc.platform}</span>
                    {desc.category && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full">
                        {desc.category}
                      </span>
                    )}
                    {desc.tags?.filter(tag => tag !== desc.category).slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 优惠标题 */}
                  <h4 className="font-bold text-gray-800 text-base mb-1">
                    {desc.summary}
                  </h4>

                  {/* 优惠详情 */}
                  <p className="text-gray-600 text-sm mb-3">
                    {desc.detail}
                  </p>

                  {/* 底部：折扣金额+提示 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-orange-500 font-bold text-lg">
                        💰 {desc.discount}
                      </span>
                    </div>
                    <span className="text-gray-400 text-xs">
                      打开{desc.platform}APP查看
                    </span>
                  </div>

                  {/* 过期时间 */}
                  {desc.expireDate && (
                    <div className="text-xs text-gray-400 mt-2">
                      ⏰ 有效期至：{desc.expireDate}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============ 固定卡片：套餐降费攻略（保留不变）============
const packageCard = {
  icon: '📊',
  title: '套餐降费攻略',
  color: 'from-green-500 to-emerald-500',
  points: [
    '2026新规：0月租来了！',
    '移动8元保号(30分钟+200MB)',
    '联通8元保号 / 电信5元无忧卡',
    '发短信"0000"一键退订隐形扣费'
  ],
  action: '拨打10086/10010/10000办理，或微信搜索"8元保号"',
  tip: '原来39元套餐→8元，一年省372元'
};

// ============ 主页面 ============
export const BenefitsPage: React.FC = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('帮你比价中...');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, balance, refreshUser } = useUser();

  const getPetAvatar = () => {
    try {
      const raw = localStorage.getItem('adoptedPets');
      if (raw) { const pets = JSON.parse(raw); if (pets?.[0]) return petAvatars[pets[0].id] || '/pets/huaxianzi.png'; }
    } catch {}
    return '/pets/huaxianzi.png';
  };

  // 刷新余额
  const refreshBalance = () => {
    refreshUser();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  useEffect(() => {
    if (!isLoading) return;
    const texts = ['帮你比价中...', '找券中...', '快好了！'];
    let i = 0;
    const t = setInterval(() => { i++; if (i < texts.length) setLoadingText(texts[i]); }, 2000);
    return () => clearInterval(t);
  }, [isLoading]);

  const handleSubmit = async (overrideInput?: string) => {
    const query = (overrideInput || inputValue).trim();
    if (!query || isLoading) return;
    setIsLoading(true); setError(null); setResult(null); setLoadingText('帮你比价中...');
    try {
      const r = await callDeepSeekAPI(query);
      setResult(r);
    } catch { setError('网络开小差，再试一次~'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* 顶部 - 极简 */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-4 pt-5 pb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <img src={getPetAvatar()} className="w-10 h-10 rounded-full border-2 border-white/50 object-cover" />
          <h1 className="text-xl font-bold text-white">省钱助手</h1>
        </div>
        <p className="text-white/80 text-sm">想买什么？帮你找最低价</p>
      </div>

      {/* 输入区 - 紧凑 */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg p-3">
          <div className="relative">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSubmit()}
              placeholder="想买什么？"
              className="w-full px-4 py-3 pr-12 bg-gray-50 rounded-xl border-2 border-orange-100 focus:border-orange-400 focus:outline-none text-gray-700 placeholder-gray-400"
            />
            <button
              onClick={() => handleSubmit()}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl flex items-center justify-center text-white disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {/* 快捷标签 */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {quickTags.map(tag => (
              <button
                key={tag}
                onClick={() => { setInputValue(tag); handleSubmit(tag); }}
                className="px-3 py-1 bg-orange-50 text-orange-600 text-xs rounded-full hover:bg-orange-100 active:scale-95 transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 加载 */}
      {isLoading && (
        <div className="px-4 mt-6 text-center">
          <img src={getPetAvatar()} className="w-14 h-14 rounded-full mx-auto mb-2 animate-bounce object-cover" />
          <p className="text-orange-500 text-sm font-medium">{loadingText}</p>
        </div>
      )}

      {/* 错误 */}
      {error && (
        <div className="px-4 mt-6 text-center">
          <p className="text-red-500 text-sm">{error}</p>
          <button onClick={() => handleSubmit()} className="mt-2 text-orange-500 text-sm font-medium">再试一次</button>
        </div>
      )}

      {/* 结果 */}
      {result && (
        <div className="px-4 mt-4 space-y-3">
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{result}</div>
          </div>
          <button
            onClick={() => navigate('/adopt')}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl p-3 font-medium flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4" /> 领养宠物，每天帮你盯价格
          </button>
        </div>
      )}

      {/* 空状态时显示省钱攻略 */}
      {!result && !isLoading && !error && (
        <>
          {/* AI帮充 */}
          <div className="px-4 mt-6">
            <AIRecharge refreshBalance={refreshBalance} />
          </div>

          {/* 动态优惠信息 */}
          <div className="px-4 mt-8">
            <DynamicDeals onRefresh={handleRefresh} isRefreshing={isRefreshing} />
          </div>

          {/* 固定卡片：套餐降费攻略 */}
          <div className="px-4 mt-8">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">💰</span> 套餐降费
            </h2>
          </div>

          <div className="px-4 mt-4">
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              {/* 左侧彩色竖条 */}
              <div className={`h-1.5 bg-gradient-to-r ${packageCard.color}`} />
              
              <div className="p-4">
                {/* 标题行 */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{packageCard.icon}</span>
                  <h3 className="font-bold text-gray-900 text-base">{packageCard.title}</h3>
                </div>
                
                {/* 要点列表 */}
                <ul className="space-y-1.5 mb-3">
                  {packageCard.points.map((point, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-orange-500 mt-0.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                
                {/* 操作步骤 */}
                <div className="bg-orange-50 rounded-xl p-3 mb-2">
                  <div className="text-xs text-orange-600 font-medium mb-1">操作步骤</div>
                  <div className="text-sm text-gray-800">{packageCard.action}</div>
                </div>
                
                {/* 提示 */}
                <div className="flex items-center gap-1.5 text-xs text-green-600">
                  <span>💡</span>
                  <span>{packageCard.tip}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 领养引导 */}
          <div className="px-4 mt-8">
            <button
              onClick={() => navigate('/adopt')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-4 font-medium flex items-center justify-center gap-3 shadow-lg"
            >
              <Heart className="w-5 h-5" />
              <div className="text-left">
                <div className="font-bold">领养你的AI宠物</div>
                <div className="text-xs text-white/80">让它每天帮你盯价格、找优惠</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BenefitsPage;
