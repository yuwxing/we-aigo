// 桌面宠物领养页面 - PetDex动画宠物系统
// 支持游客浏览宠物列表，领养时友好提示注册
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles, Star, Gift, Bot, Confetti, PawPrint, Home, ArrowLeft, LogOut, Clock, AlertCircle, Check, MessageCircle } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { SpritePet, SpritePetThumb, petSpriteMap } from '../components/SpritePet';
import { workerTokenAPI } from '../utils/supabase';
import { GuestPromptModal } from '../components/GuestPromptModal';

// PetDex宠物数据
interface PetDexPet {
  petId: string;
  name: string;
  personality: string;
  desc: string;
  color: string;
  tags: string[];
}

const petdexPets: PetDexPet[] = [
  { petId: 'junie', name: '朱妮', personality: '正义型', desc: '兔警官，冷静专注又温暖', color: '#A78BFA', tags: ['#cheerful', '#calm', '#focused'] },
  { petId: 'duo', name: '嘟嘟', personality: '学霸型', desc: '绿色猫头鹰，学习好伙伴', color: '#34D399', tags: ['#wholesome', '#cheerful', '#focused'] },
  { petId: 'axobotl', name: '六六', personality: '搞怪型', desc: '调皮的六角恐龙，坏点子不断', color: '#60A5FA', tags: ['#mischievous', '#chaotic', '#playful'] },
  { petId: 'kebo', name: '考比', personality: '专注型', desc: '紫色考拉理财小达人，专注又开心', color: '#C084FC', tags: ['#focused', '#cheerful'] },
  { petId: 'swag', name: '酷鹅', personality: '酷帅型', desc: '戴墨镜的酷企鹅，永远自信满满', color: '#3B82F6', tags: ['#playful', '#cheerful', '#mischievous'] },
  { petId: 'beier', name: '铃铃', personality: '甜美型', desc: '粉色狐狸，甜美可爱', color: '#F9A8D4', tags: ['#cheerful', '#playful', '#wholesome'] },
  { petId: 'da-zhuang', name: '大壮', personality: '勇猛型', desc: '银虎斑猫，威武有力', color: '#FB923C', tags: ['#heroic', '#playful', '#mischievous'] },
];

// 旧版ID映射到PetDex宠物（用于兼容）
const legacyIdToPetdex: Record<number, string> = {
  1: 'kebo',
  3: 'junie',
  29: 'duo',
  31: 'axobotl',
  28: 'swag',
  30: 'kebo',
  32: 'duo',
};

interface Pet {
  petId: string;
  name: string;
  personality: string;
  desc: string;
  color: string;
  avatar?: string;
  rating?: number;
  tags?: string[];
}

interface AdoptedPet {
  petId: string;
  name: string;
  personality: string;
  desc: string;
  color: string;
  avatar?: string;
}

// 宠物状态
type PetStatus = 'happy' | 'normal' | 'hungry' | 'weak';

interface PetState {
  status: PetStatus;
  statusText: string;
  statusEmoji: string;
}

// 获取今天的日期字符串
const getTodayString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// 获取宠物状态
const getPetStatus = (feedDate: string | null): PetState => {
  const today = getTodayString();
  
  if (!feedDate) {
    return { status: 'hungry', statusText: '饿了', statusEmoji: '😟' };
  }
  
  if (feedDate === today) {
    return { status: 'happy', statusText: '开心', statusEmoji: '😊' };
  }
  
  const feedDateObj = new Date(feedDate);
  const todayObj = new Date(today);
  const diffTime = todayObj.getTime() - feedDateObj.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return { status: 'normal', statusText: '普通', statusEmoji: '😐' };
  } else if (diffDays === 2) {
    return { status: 'hungry', statusText: '饿了', statusEmoji: '😟' };
  } else {
    return { status: 'weak', statusText: '虚弱', statusEmoji: '😰' };
  }
};

// 根据legacyId获取PetDex宠物信息
const getPetdexByLegacyId = (id: number): PetDexPet | undefined => {
  const petId = legacyIdToPetdex[id];
  return petId ? petdexPets.find(p => p.petId === petId) : undefined;
};

export const AdoptPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, balance, updateBalance } = useUser();
  const [pets, setPets] = useState<Pet[]>(petdexPets);
  const [adoptedPet, setAdoptedPet] = useState<AdoptedPet | null>(null);
  const [feedDate, setFeedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successPetName, setSuccessPetName] = useState('');
  const [isAdopting, setIsAdopting] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [balanceWarning, setBalanceWarning] = useState<string | null>(null);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false); // 游客提示弹窗

  // 从localStorage读取已领养的宠物
  const loadAdoptedPet = useCallback(() => {
    try {
      const adoptedData = localStorage.getItem('adoptedPet');
      const feedDateData = localStorage.getItem('petFeedDate');
      
      if (adoptedData) {
        const pet = JSON.parse(adoptedData);
        // 如果是旧版数据（使用数字id），尝试转换为新版
        if (typeof pet.id === 'number' && !pet.petId) {
          const petdexInfo = getPetdexByLegacyId(pet.id);
          if (petdexInfo) {
            pet.petId = petdexInfo.petId;
            pet.name = petdexInfo.name;
            pet.desc = petdexInfo.desc;
            pet.color = petdexInfo.color;
            pet.avatar = petSpriteMap[petdexInfo.petId]?.thumb;
          }
          localStorage.setItem('adoptedPet', JSON.stringify(pet));
        }
        setAdoptedPet(pet);
      }
      if (feedDateData) {
        setFeedDate(feedDateData);
      }
    } catch (e) {
      console.error('读取领养记录失败', e);
    }
  }, []);

  useEffect(() => {
    loadAdoptedPet();
    setLoading(false);
  }, [loadAdoptedPet]);

  // 获取当前宠物状态
  const petStatus = getPetStatus(feedDate);

  // 判断今天是否已喂养
  const isFedToday = feedDate === getTodayString();

  // 领养按钮点击 - 游客友好提示
  const handleAdoptClick = (pet: Pet) => {
    if (!user) {
      // 游客模式：弹出友好提示，可继续浏览
      setShowGuestPrompt(true);
      return;
    }
    setSelectedPet(pet);
    setShowConfirmModal(true);
  };

  // 确认领养
  const handleConfirmAdopt = async () => {
    if (!selectedPet) return;
    if (!user) {
      setBalanceWarning('请先登录/注册账户后再领养宠物');
      setShowConfirmModal(false);
      setTimeout(() => setBalanceWarning(null), 4000);
      return;
    }

    if (balance < 100) {
      setBalanceWarning('省钱币不足，无法领养！需要100省钱币，请先去完成任务赚取');
      setShowConfirmModal(false);
      setTimeout(() => setBalanceWarning(null), 4000);
      return;
    }

    setIsAdopting(true);

    try {
      // 直接用 Supabase 扣费（不依赖 Worker，避免超时卡住）
      let newBalance = balance;
      const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1/';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';
      
      try {
        // 先查当前余额
        const balResp = await fetch(`${SUPABASE_URL}users?id=eq.${user.id}&select=token_balance`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const balData = await balResp.json();
        const currentBalance = balData[0]?.token_balance || 0;
        
        if (currentBalance < 100) {
          setBalanceWarning('省钱币不足，无法领养！需要100省钱币，请先去完成任务赚取');
          setShowConfirmModal(false);
          setIsAdopting(false);
          return;
        }
        
        // 扣除100 WEG
        newBalance = currentBalance - 100;
        const updateResp = await fetch(`${SUPABASE_URL}users?id=eq.${user.id}`, {
          method: 'PATCH',
          headers: { 
            'apikey': SUPABASE_KEY, 
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ token_balance: newBalance })
        });
        
        if (!updateResp.ok) throw new Error('扣费失败');
      } catch (apiErr) {
        console.warn('Supabase扣费失败，降级使用前端扣费:', apiErr);
        if (balance < 100) {
          setBalanceWarning('省钱币不足，无法领养！需要100省钱币，请先去完成任务赚取');
          setShowConfirmModal(false);
          setIsAdopting(false);
          return;
        }
        newBalance = balance - 100;
      }

      // 更新本地状态
      updateBalance(newBalance);
      const adoptedPetData: AdoptedPet = {
        petId: selectedPet.petId,
        name: selectedPet.name,
        personality: selectedPet.personality,
        desc: selectedPet.desc,
        color: selectedPet.color,
        avatar: petSpriteMap[selectedPet.petId]?.thumb
      };
      localStorage.setItem('adoptedPet', JSON.stringify(adoptedPetData));
      const today = getTodayString();
      localStorage.setItem('petFeedDate', today);
      
      setAdoptedPet(adoptedPetData);
      setFeedDate(today);
      setSuccessPetName(selectedPet.name);
      setShowConfirmModal(false);
      setShowSuccessAnimation(true);
      
      // 同步到数据库
      try {
        await fetch('/api/pet/adopt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: user.id, 
            pet_id: selectedPet.petId, 
            pet_name: selectedPet.name 
          })
        });
      } catch (e) {
        console.error('同步宠物到数据库失败:', e);
      }
      
      // 触发宠物更新事件
      window.dispatchEvent(new Event('pet-updated'));
      
      setTimeout(() => {
        setShowSuccessAnimation(false);
        setSelectedPet(null);
      }, 3000);
      
    } catch (err) {
      console.error('领养失败', err);
      alert('领养失败，请重试');
    } finally {
      setIsAdopting(false);
    }
  };

  // 取消领养
  const handleCancelAdopt = () => {
    setShowConfirmModal(false);
    setSelectedPet(null);
  };

  // 放归按钮点击
  const handleReleaseClick = () => {
    setShowReleaseModal(true);
  };

  // 确认放归
  const handleConfirmRelease = () => {
    localStorage.removeItem('adoptedPet');
    localStorage.removeItem('petFeedDate');
    setAdoptedPet(null);
    setFeedDate(null);
    setShowReleaseModal(false);
    
    // 触发宠物更新事件
    window.dispatchEvent(new Event('pet-updated'));
  };

  // 取消放归
  const handleCancelRelease = () => {
    setShowReleaseModal(false);
  };

  // 获取性格标签颜色
  const getPersonalityColor = (personality: string): string => {
    const colors: Record<string, string> = {
      '活泼型': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      '专注型': 'bg-purple-100 text-purple-700 border-purple-200',
      '奇幻型': 'bg-amber-100 text-amber-700 border-amber-200',
      '侦探型': 'bg-slate-100 text-slate-700 border-slate-200',
      '酷帅型': 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return colors[personality] || 'bg-purple-100 text-purple-700 border-purple-200';
  };

  // 获取状态样式
  const getStatusStyle = (status: PetStatus) => {
    switch (status) {
      case 'happy':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700';
      case 'normal':
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 text-yellow-700';
      case 'hungry':
        return 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 text-orange-700';
      case 'weak':
        return 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-700';
    }
  };

  return (
    <div className="min-h-screen">
      {/* WEG币不足警告 */}
      {balanceWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl shadow-2xl flex items-center gap-2 animate-scale-in">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">{balanceWarning}</span>
        </div>
      )}

      {/* 页面标题区域 */}
      <div className="relative mb-8">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-purple-50 transition-colors text-purple-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 mb-4">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">PetDex 宠物中心</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text-purple-pink mb-2">
            🐾 领养你的专属PetDex伙伴
          </h1>
          <p className="text-slate-600">来自PetDex的可爱动画宠物，点击它们会挥手打招呼哦~</p>
        </div>
      </div>

      {/* 已领养宠物展示 */}
      {adoptedPet && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              <h2 className="text-xl font-bold text-slate-800">我的宠物</h2>
              <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 text-xs font-medium">
                已领养
              </span>
            </div>
            <button
              onClick={handleReleaseClick}
              className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-medium text-sm hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-200"
            >
              <LogOut className="w-4 h-4" />
              放归
            </button>
            <button
              onClick={() => navigate(`/pet-chat/${adoptedPet.petId}`)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium text-sm hover:shadow-lg transition-all flex items-center gap-2 shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              聊天
            </button>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-purple-100/50 shadow-xl">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* 宠物头像 - 使用SpritePet动画组件 */}
              <div className={`${petStatus.status === 'weak' ? 'grayscale opacity-60' : ''}`}>
                <SpritePet petId={adoptedPet.petId} size={120} animate="idle" />
              </div>

              {/* 宠物信息 */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-slate-800">{adoptedPet.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPersonalityColor(adoptedPet.personality)}`}>
                    {adoptedPet.personality}
                  </span>
                </div>
                <p className="text-slate-600 mb-3">{adoptedPet.desc}</p>
                
                {/* 状态显示 */}
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <div className={`px-4 py-2 rounded-xl border ${getStatusStyle(petStatus.status)}`}>
                    <span className="font-medium">{petStatus.statusText}{petStatus.statusEmoji}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="w-4 h-4" />
                    <span>{isFedToday ? '今日已喂养' : '今日待喂养'}</span>
                  </div>
                </div>
              </div>

              {/* 提示文字 */}
              <div className="hidden lg:block text-right text-sm text-slate-500">
                <p>💡 点击右下角</p>
                <p>宠物图标可喂养</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 全部宠物列表 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <PawPrint className="w-5 h-5 text-purple-500" />
          <h2 className="text-xl font-bold text-slate-800">
            {adoptedPet ? '其他可领养宠物' : '全部宠物'}
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 text-xs font-medium">
            {pets.length} 只
          </span>
        </div>
        {!adoptedPet && (
          <div className="mb-4 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-purple-700">
              领养需消耗 <strong>100 <img src="/weg-coin.png" alt="WEG" style={{ width: 14, height: 14, borderRadius: "50%", display: "inline-block", verticalAlign: "middle" }} /></strong>，完成英语学习即可喂养
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-200 rounded-2xl h-64"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pets.map((pet) => {
            const isAdopted = adoptedPet?.petId === pet.petId;
            const isDisabled = adoptedPet !== null && !isAdopted;
            
            return (
              <div
                key={pet.petId}
                className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${
                  isAdopted ? 'ring-4 ring-pink-400 ring-offset-4' : 
                  isDisabled ? 'opacity-50' : 'hover:-translate-y-1 hover:shadow-xl'
                }`}
                style={{
                  background: `linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${pet.color}30`
                }}
              >
                {/* 顶部装饰条 */}
                <div
                  className="h-2"
                  style={{ background: `linear-gradient(90deg, ${pet.color}, ${pet.color}80)` }}
                />

                <div className="p-5">
                  {/* 头像区域 - 使用SpritePetThumb */}
                  <div className="flex justify-center mb-4">
                    <div
                      className="w-20 h-24 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg transform group-hover:scale-105 transition-transform overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${pet.color}, ${pet.color}cc)`,
                        boxShadow: `0 8px 24px ${pet.color}40`
                      }}
                    >
                      <SpritePetThumb petId={pet.petId} size={96} />
                    </div>
                  </div>

                  {/* 名字和性格标签 */}
                  <div className="text-center mb-3">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{pet.name}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getPersonalityColor(pet.personality)}`}>
                      {pet.personality}
                    </span>
                  </div>

                  {/* 描述 */}
                  <p className="text-sm text-slate-600 text-center mb-4 line-clamp-2">
                    {pet.desc}
                  </p>

                  {/* 标签 */}
                  <div className="flex justify-center items-center gap-1 mb-4 flex-wrap">
                    {pet.tags?.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 领养/聊天按钮 */}
                  {isAdopted ? (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => navigate(`/pet-chat/${pet.petId}`)}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium text-sm shadow-lg shadow-purple-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        聊天
                      </button>
                      <span className="px-4 py-2.5 rounded-xl bg-pink-100 text-pink-600 font-medium text-sm flex items-center gap-2">
                        <Heart className="w-4 h-4 fill-pink-500" />
                        已领养
                      </span>
                    </div>
                  ) : isDisabled ? (
                    <div className="flex justify-center">
                      <span className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-400 font-medium text-sm flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        已有宠物
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleAdoptClick(pet)}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium text-sm shadow-lg shadow-purple-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
                      >
                        <Gift className="w-4 h-4" />
                        领养
                      </button>
                    </div>
                  )}
                </div>

                {/* 角落装饰 */}
                <div
                  className="absolute top-0 right-0 w-20 h-20 opacity-10 rounded-bl-full"
                  style={{ background: `linear-gradient(135deg, ${pet.color}, transparent)` }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* 领养确认弹窗 */}
      {showConfirmModal && selectedPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={handleCancelAdopt}
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-purple-100 animate-scale-in">
            <div
              className="w-20 h-24 mx-auto rounded-2xl flex items-center justify-center text-white text-2xl mb-4"
              style={{
                background: `linear-gradient(135deg, ${selectedPet.color}, ${selectedPet.color}cc)`,
                boxShadow: `0 8px 24px ${selectedPet.color}40`
              }}
            >
              <SpritePetThumb petId={selectedPet.petId} size={96} />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-800 mb-2">
              确认领养
            </h3>
            <p className="text-center text-slate-600 mb-2">
              你确定领养 <span className="font-bold text-purple-600">{selectedPet.name}</span> 吗？
            </p>
            <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 mb-6">
              <p className="text-sm text-amber-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>领养需消耗100 <img src="/weg-coin.png" alt="WEG" style={{ width: 14, height: 14, borderRadius: "50%", display: "inline-block", verticalAlign: "middle" }} /></strong>，完成英语学习即可喂养</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelAdopt}
                disabled={isAdopting}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAdopt}
                disabled={isAdopting}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAdopting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    领养中...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    确认领养
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 放归确认弹窗 */}
      {showReleaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={handleCancelRelease}
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-red-100 animate-scale-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r from-red-100 to-orange-100 flex items-center justify-center text-red-500 mb-4">
              <LogOut className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-800 mb-2">
              确认放归
            </h3>
            <p className="text-center text-slate-600 mb-4">
              你确定要放归 <span className="font-bold text-red-600">{adoptedPet?.name}</span> 吗？<br/>
              <span className="text-sm text-slate-500">放归后无法恢复，领养消耗的WEG币不予退还</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelRelease}
                disabled={isReleasing}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirmRelease}
                disabled={isReleasing}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isReleasing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    放归中...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    确认放归
                  </>
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
        title="注册后可永久保存宠物 🐾"
        message="注册后可以领养宠物、赚取WEG币、解锁更多功能 🎉"
        highlight="注册完全免费，只需几秒钟！"
        featureIcons={['🐾', '💰', '🤖']}
      />

      {/* 领养成功动画 */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          {/* 撒花/星星效果 */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${2 + Math.random()}s`,
                }}
              >
                {i % 3 === 0 ? (
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ) : i % 3 === 1 ? (
                  <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                ) : (
                  <Sparkles className="w-4 h-4 text-purple-500" />
                )}
              </div>
            ))}
          </div>
          
          {/* 成功提示 */}
          <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-pink-100 text-center animate-scale-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl mb-4 shadow-xl">
              🎉
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              领养成功！
            </h3>
            <p className="text-slate-600">
              <span className="font-bold text-purple-600">{successPetName}</span> 现已成为你的专属伙伴 💖
            </p>
            <p className="text-sm text-slate-500 mt-2">
              快去右下角看看你的新宠物吧！
            </p>
          </div>
        </div>
      )}

      {/* 成功动画样式 */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AdoptPage;
