// 宠物漂浮组件 - PetDex动画宠物系统
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Heart, Sparkles, Star, Clock, Palette, ListPlus, BookOpen, ExternalLink, Zap } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { SpritePet, petSpriteMap } from './SpritePet';

interface AdoptedPet {
  petId: string;
  name: string;
  personality: string;
  desc: string;
  color: string;
}

// 宠物状态枚举
type PetStatus = 'happy' | 'normal' | 'hungry' | 'weak';

// 宠物动作枚举
type PetAction = 'idle' | 'bounce' | 'flip' | 'sleep' | 'wave' | 'dance' | 'look' | 'happyJump' | 'scatter' | 'walk';

// 随机话语
const randomMessages = {
  happy: ['你终于来看我啦！💕', '今天完成任务了吗？✨', '摸摸我~', '嘿嘿，我好开心！', '主人最棒啦！', '今天天气真好~', '我想和你一起玩！'],
  normal: ['嗯...有点无聊', '你在忙吗？', '在想什么呢...', '有点想念你哦', '今天的云好好看', '主人~', '...', '可以陪我玩吗？'],
  hungry: ['好饿啊...', '主人，做任务喂我嘛😭', '咕噜咕噜...', '好想吃好吃的', '什么时候能吃饭呀...', '呜呜...', '我需要能量！'],
  weak: ['......', '救...救命...', '好难受...', '快不行了...', '...help...', '虚虚的...', '需要帮助...']
};

// 特殊动作话语
const actionMessages: Record<PetAction, string[]> = {
  idle: [],
  bounce: ['蹦蹦跳跳~', '开心！', '耶耶耶！'],
  flip: ['看我翻跟头！', '炫技时间！', '嘿哈！'],
  sleep: ['zzZ...', '打瞌睡中...', '嗯...困了'],
  wave: ['你好呀！', '嗨~', '打个招呼！'],
  dance: ['一起跳舞吧！💃', '扭扭~', '舞动起来！'],
  look: ['那边有什么？', '好像有动静...', '看看看！'],
  happyJump: ['太开心啦！', '耶！', '嘿嘿嘿！'],
  scatter: ['撒花~🌸', '花瓣雨！', '美美美！'],
  walk: ['出去走走~', '逛一逛', '溜达溜达']
};

// 获取今天的日期字符串
const getTodayString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// 获取宠物状态
const getPetState = (feedDate: string | null): { status: PetStatus; statusText: string; statusEmoji: string; actionText: string } => {
  const today = getTodayString();
  
  if (!feedDate) {
    return { status: 'hungry', statusText: '饿了', statusEmoji: '😟', actionText: '肚子咕咕叫...' };
  }
  
  if (feedDate === today) {
    return { status: 'happy', statusText: '开心', statusEmoji: '😊', actionText: '正在开心地玩耍！' };
  }
  
  const feedDateObj = new Date(feedDate);
  const todayObj = new Date(today);
  const diffTime = todayObj.getTime() - feedDateObj.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return { status: 'normal', statusText: '普通', statusEmoji: '😐', actionText: '安静地坐着' };
  } else if (diffDays === 2) {
    return { status: 'hungry', statusText: '饿了', statusEmoji: '😟', actionText: '肚子咕咕叫...' };
  } else {
    return { status: 'weak', statusText: '虚弱', statusEmoji: '😰', actionText: '虚弱地闭上了眼睛' };
  }
};

// 旧版ID映射到PetDex宠物
const legacyIdToPetdex: Record<number, string> = {
  1: 'cosmo',
  3: 'kwehlet',
  29: 'noir-webling',
  31: 'swag',
  28: 'kebo',
  30: 'kebo',
  32: 'cosmo',
};

export const PetWidget: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [pet, setPet] = useState<AdoptedPet | null>(null);
  const [feedDate, setFeedDate] = useState<string | null>(null);
  const [showFeedSuccess, setShowFeedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 宠物动作状态
  const [currentAction, setCurrentAction] = useState<PetAction>('idle');
  const [isInteracting, setIsInteracting] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleText, setBubbleText] = useState('');
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  
  // 拖拽状态
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const petRef = useRef<HTMLDivElement>(null);
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartIdRef = useRef(0);

  // 加载宠物数据
  const loadPetData = useCallback(() => {
    try {
      const adoptedData = localStorage.getItem('adoptedPet');
      const feedDateData = localStorage.getItem('petFeedDate');
      
      if (adoptedData) {
        const petData = JSON.parse(adoptedData);
        // 如果是旧版数据（使用数字id），尝试转换为新版
        if (typeof petData.id === 'number' && !petData.petId) {
          const legacyPetId = petData.id;
          const petdexId = legacyIdToPetdex[legacyPetId];
          if (petdexId) {
            const petdexInfo = petSpriteMap[petdexId];
            if (petdexInfo) {
              petData.petId = petdexId;
              petData.name = petdexInfo.name;
              petData.desc = petdexInfo.desc;
              petData.color = petdexInfo.color;
              petData.avatar = petdexInfo.thumb;
              localStorage.setItem('adoptedPet', JSON.stringify(petData));
            }
          }
        }
        setPet(petData);
      }
      if (feedDateData) {
        setFeedDate(feedDateData);
      }
    } catch (e) {
      console.error('读取宠物数据失败', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPetData();
    
    const handlePetUpdate = () => loadPetData();
    const handleFeedComplete = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.feedType) {
        handleFeedCompleteAction(customEvent.detail.feedType);
      }
    };
    
    window.addEventListener('pet-updated', handlePetUpdate);
    window.addEventListener('pet-feed-complete', handleFeedComplete);
    
    return () => {
      window.removeEventListener('pet-updated', handlePetUpdate);
      window.removeEventListener('pet-feed-complete', handleFeedComplete);
    };
  }, [loadPetData]);

  // 随机动作系统
  useEffect(() => {
    if (!pet || isInteracting) return;
    
    const petState = getPetState(feedDate);
    const actions: PetAction[] = petState.status === 'happy' 
      ? ['bounce', 'flip', 'dance', 'wave', 'happyJump', 'walk', 'look', 'scatter']
      : petState.status === 'normal'
      ? ['idle', 'wave', 'look', 'walk', 'sleep']
      : petState.status === 'hungry'
      ? ['idle', 'look', 'sleep']
      : ['sleep', 'idle'];
    
    const doRandomAction = () => {
      const action = actions[Math.floor(Math.random() * actions.length)];
      setCurrentAction(action);
      
      // 特殊动作显示气泡
      if (actionMessages[action]?.length > 0 && Math.random() > 0.5) {
        const msg = actionMessages[action][Math.floor(Math.random() * actionMessages[action].length)];
        showBubbleMessage(msg);
      }
      
      // 动作持续时间
      const duration = action === 'sleep' ? 3000 : action === 'walk' ? 4000 : 2000;
      actionTimeoutRef.current = setTimeout(() => {
        setCurrentAction('idle');
      }, duration);
    };
    
    // 随机间隔 15-30 秒
    const interval = setInterval(() => {
      doRandomAction();
    }, 15000 + Math.random() * 15000);
    
    // 初始延迟后执行一次
    const initialTimeout = setTimeout(() => {
      doRandomAction();
    }, 3000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
      if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
    };
  }, [pet, feedDate, isInteracting]);

  // 显示气泡消息
  const showBubbleMessage = (text: string) => {
    setBubbleText(text);
    setShowBubble(true);
    setTimeout(() => setShowBubble(false), 4000);
  };

  // 点击宠物互动
  const handlePetClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragStarted) return; // 拖拽过就不触发点击
    e.stopPropagation();
    
    const petState = getPetState(feedDate);
    const messages = randomMessages[petState.status];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    
    setIsInteracting(true);
    setCurrentAction('happyJump');
    showBubbleMessage(msg);
    
    // 生成爱心
    const newHearts = Array.from({ length: 5 }, (_, i) => ({
      id: heartIdRef.current++,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 30
    }));
    setHearts(newHearts);
    setTimeout(() => setHearts([]), 1500);
    
    setTimeout(() => {
      setIsInteracting(false);
      setCurrentAction('idle');
    }, 1500);
  };

  // 拖拽功能 - 支持鼠标和触摸
  const [dragStarted, setDragStarted] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleDragStart = (clientX: number, clientY: number) => {
    setDragStarted(false);
    if (petRef.current) {
      const rect = petRef.current.getBoundingClientRect();
      dragOffset.current = { x: clientX - rect.left, y: clientY - rect.top };
      dragStartPos.current = { x: clientX, y: clientY };
    }
    setIsDragging(true);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragStartPos.current.x;
    const dy = clientY - dragStartPos.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) setDragStarted(true);
    const newX = clientX - dragOffset.current.x;
    const newY = clientY - dragOffset.current.y;
    const boundedX = Math.max(0, Math.min(newX, window.innerWidth - 80));
    const boundedY = Math.max(0, Math.min(newY, window.innerHeight - 80));
    setPosition({ x: boundedX, y: boundedY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setTimeout(() => setDragStarted(false), 100);
  };

  // 鼠标事件
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const onMouseUp = () => handleDragEnd();
    if (isDragging) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  // 触摸事件
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    handleDragStart(t.clientX, t.clientY);
  };

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const t = e.touches[0];
      handleDragMove(t.clientX, t.clientY);
    };
    const onTouchEnd = () => handleDragEnd();
    if (isDragging) {
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging]);

  // 处理喂养完成
  const handleFeedCompleteAction = (feedType: string) => {
    const today = getTodayString();
    setFeedDate(today);
    localStorage.setItem('petFeedDate', today);
    setShowFeedSuccess(true);
    setTimeout(() => setShowFeedSuccess(false), 2000);
    window.dispatchEvent(new Event('pet-updated'));
    
    // 喂养成功特殊动画
    setCurrentAction('happyJump');
    showBubbleMessage('吃饱啦！谢谢主人~ 💕');
    setTimeout(() => setCurrentAction('idle'), 2000);
  };

  // 获取当前状态
  const petState = getPetState(feedDate);
  const isFedToday = feedDate === getTodayString();

  // 喂养任务选项
  const feedTasks = [
    { id: 'create', icon: <Palette className="w-5 h-5" />, label: '去创作', desc: '完成一次创意作品', path: '/create' },
    { id: 'task', icon: <ListPlus className="w-5 h-5" />, label: '发任务', desc: '发布一个新任务', path: '/create-task' },
    { id: 'study', icon: <BookOpen className="w-5 h-5" />, label: '背单词', desc: '完成每日英语学习', url: 'https://x97wj9x8mw.coze.site' }
  ];

  const handleTaskClick = (task: typeof feedTasks[0]) => {
    if (isFedToday) return;
    if (task.url) {
      window.open(task.url, '_blank');
    } else if (task.path) {
      navigate(task.path);
    }
  };

  if (loading || !pet) return null;

  return (
    <>
      {/* CSS动画样式 */}
      <style>{`
        @keyframes petBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          25% { transform: translateY(-15px) scale(1.05); }
          50% { transform: translateY(-20px) scale(1.1); }
          75% { transform: translateY(-10px) scale(1.05); }
        }
        @keyframes petFlip {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(90deg) scale(0.9); }
          50% { transform: rotate(180deg) scale(0.8); }
          75% { transform: rotate(270deg) scale(0.9); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes petSleep {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          20% { transform: rotate(5deg) translateY(2px); }
          40% { transform: rotate(-3deg) translateY(0); }
          60% { transform: rotate(3deg) translateY(2px); }
          80% { transform: rotate(-2deg) translateY(0); }
        }
        @keyframes petWave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg) scale(1.1); }
          50% { transform: rotate(15deg) scale(1.1); }
          75% { transform: rotate(-10deg) scale(1.05); }
        }
        @keyframes petDance {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(-15deg) translateY(-5px); }
          75% { transform: rotate(15deg) translateY(-5px); }
        }
        @keyframes petLook {
          0%, 100% { transform: rotate(0deg); }
          30% { transform: rotate(-20deg) translateX(-10px); }
          70% { transform: rotate(20deg) translateX(10px); }
        }
        @keyframes petHappyJump {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-25px) scale(1.15); }
        }
        @keyframes petScatter {
          0% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-5deg); }
          50% { transform: scale(1.15) rotate(5deg); }
          75% { transform: scale(1.1) rotate(-3deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes petWalk {
          0% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-20px) rotate(-5deg); }
          50% { transform: translateX(-40px) rotate(0deg); }
          75% { transform: translateX(-20px) rotate(5deg); }
          100% { transform: translateX(0) rotate(0deg); }
        }
        @keyframes petShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        @keyframes bubbleIn {
          0% { opacity: 0; transform: translateY(10px) scale(0.8); }
          20% { opacity: 1; transform: translateY(-5px) scale(1.05); }
          100% { opacity: 0; transform: translateY(-30px) scale(0.9); }
        }
        @keyframes heartFloat {
          0% { opacity: 1; transform: translateY(0) scale(0.5); }
          50% { opacity: 1; transform: translateY(-20px) scale(1); }
          100% { opacity: 0; transform: translateY(-40px) scale(0.8); }
        }
        @keyframes petalFall {
          0% { transform: translateY(0) rotate(0deg) translateX(0); opacity: 1; }
          100% { transform: translateY(60px) rotate(180deg) translateX(30px); opacity: 0; }
        }
        .pet-action-bounce { animation: petBounce 0.6s ease-in-out infinite; }
        .pet-action-flip { animation: petFlip 1s ease-in-out; }
        .pet-action-sleep { animation: petSleep 2s ease-in-out infinite; }
        .pet-action-wave { animation: petWave 0.5s ease-in-out infinite; }
        .pet-action-dance { animation: petDance 0.4s ease-in-out infinite; }
        .pet-action-look { animation: petLook 1.5s ease-in-out; }
        .pet-action-happyJump { animation: petHappyJump 0.4s ease-in-out infinite; }
        .pet-action-scatter { animation: petScatter 0.8s ease-in-out infinite; }
        .pet-action-walk { animation: petWalk 2s ease-in-out; }
        .pet-action-shake { animation: petShake 0.3s ease-in-out infinite; }
        .pet-action-idle { animation: none; }
        .bubble-animate { animation: bubbleIn 4s ease-out forwards; }
        .heart-animate { animation: heartFloat 1.5s ease-out forwards; }
        .petal {
          position: absolute;
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, #f9a8d4, #e879f9);
          border-radius: 50% 0 50% 50%;
          animation: petalFall 1.5s ease-in forwards;
        }
        .pet-glow {
          filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.6));
        }
      `}</style>

      {/* 喂养成功提示 */}
      {showFeedSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl shadow-2xl flex items-center gap-2 animate-scale-in">
          <Sparkles className="w-5 h-5" />
          <span className="font-medium">喂养成功！💖 今日任务完成</span>
        </div>
      )}

      {/* 展开状态下的详情面板 */}
      {isExpanded && (
        <div 
          className="fixed bottom-24 right-4 w-80 z-[60]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-purple-100/50">
            {/* 关闭按钮 */}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute -top-2 -right-2 w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>

            {/* 宠物头像 - 使用SpritePet组件 */}
            <div className="flex flex-col items-center mb-4">
              <div 
                className="w-20 h-24 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${pet.color}, ${pet.color}cc)`,
                  boxShadow: `0 8px 24px ${pet.color}40`
                }}
              >
                <SpritePet petId={pet.petId} size={80} animate="idle" />
              </div>
              <h3 className="mt-3 text-lg font-bold text-slate-800">{pet.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  petState.status === 'happy' ? 'bg-green-100 text-green-700' :
                  petState.status === 'normal' ? 'bg-yellow-100 text-yellow-700' :
                  petState.status === 'hungry' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {petState.statusText}{petState.statusEmoji}
                </span>
              </div>
            </div>

            {/* 状态描述 */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-700">当前状态</span>
              </div>
              <p className="text-sm text-slate-600">{petState.actionText}</p>
            </div>

            {/* 喂养状态 */}
            {isFedToday ? (
              <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-green-50 text-green-700 font-medium mb-4">
                <Heart className="w-5 h-5 fill-green-500" />
                <span>今日已喂养 ✨</span>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm text-slate-600 mb-3 text-center">
                    完成以下任一任务即可喂养：
                  </p>
                  
                  <div className="space-y-2">
                    {feedTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 hover:from-purple-100 hover:to-pink-100 transition-all flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                          {task.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-slate-800">{task.label}</p>
                          <p className="text-xs text-slate-500">{task.desc}</p>
                        </div>
                        {task.url ? (
                          <ExternalLink className="w-4 h-4 text-slate-400" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-purple-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!isFedToday && (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                <span>完成任务后自动喂养</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 背景遮罩 */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-[55] bg-black/10"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* 宠物主容器 - 绝对定位，支持拖拽 */}
      <div
        ref={petRef}
        className={`fixed z-[60] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          right: position.x === 0 ? 24 : undefined,
          bottom: position.y === 0 ? 24 : undefined,
          left: position.x !== 0 ? position.x : undefined,
          top: position.y !== 0 ? position.y : undefined,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* 对话气泡 */}
        {showBubble && (
          <div 
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bubble-animate"
            style={{ minWidth: '100px' }}
          >
            <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-lg border border-purple-100 relative">
              <p className="text-sm text-slate-700 text-center whitespace-nowrap">{bubbleText}</p>
              {/* 气泡小三角 */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white/95" />
            </div>
          </div>
        )}

        {/* 爱心动画 */}
        {hearts.map((heart, i) => (
          <div
            key={heart.id}
            className="heart-animate absolute text-2xl"
            style={{
              left: `${heart.x}%`,
              top: `${heart.y}%`,
              animationDelay: `${i * 0.15}s`
            }}
          >
            ❤️
          </div>
        ))}

        {/* 花瓣飘落（cosmo特效） */}
        {currentAction === 'scatter' && pet?.petId === 'cosmo' && (
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="petal"
                style={{
                  left: `${30 + Math.random() * 40}%`,
                  top: `${20 + Math.random() * 20}%`,
                  animationDelay: `${i * 0.15}s`,
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              />
            ))}
          </div>
        )}

        {/* 宠物按钮 */}
        <button
          onClick={handlePetClick}
          className={`
            relative group
            ${currentAction === 'bounce' ? 'pet-action-bounce' : ''}
            ${currentAction === 'flip' ? 'pet-action-flip' : ''}
            ${currentAction === 'sleep' ? 'pet-action-sleep' : ''}
            ${currentAction === 'wave' ? 'pet-action-wave' : ''}
            ${currentAction === 'dance' ? 'pet-action-dance' : ''}
            ${currentAction === 'look' ? 'pet-action-look' : ''}
            ${currentAction === 'happyJump' ? 'pet-action-happyJump' : ''}
            ${currentAction === 'scatter' ? 'pet-action-scatter' : ''}
            ${currentAction === 'walk' ? 'pet-action-walk' : ''}
            ${currentAction === 'idle' ? (petState.status === 'weak' ? 'pet-action-shake' : '') : ''}
            ${petState.status === 'weak' ? 'opacity-70 grayscale' : ''}
            ${petState.status === 'hungry' && currentAction === 'idle' ? 'pet-action-shake' : ''}
            transition-transform
          `}
          title={`点击和${pet.name}互动~`}
        >
          {/* 发光效果 + SpritePet */}
          <div 
            className="w-14 h-16 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl transition-all group-hover:scale-110 group-hover:shadow-2xl pet-glow overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${pet.color}, ${pet.color}cc)`,
              boxShadow: `0 8px 24px ${pet.color}50, 0 0 20px ${pet.color}30`
            }}
          >
            <SpritePet petId={pet.petId} size={56} animate={currentAction === 'wave' ? 'wave' : 'idle'} />
          </div>
          
          {/* 状态气泡 */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <span className="text-lg">{petState.statusEmoji}</span>
          </div>

          {/* 未喂养提示 */}
          {!isFedToday && (
            <div className="absolute -top-1 -left-1 w-4 h-4 bg-orange-500 rounded-full animate-ping" />
          )}

          {/* 悬停提示 */}
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap">
              点击互动~
            </div>
          </div>
        </button>
      </div>
    </>
  );
};

export default PetWidget;
