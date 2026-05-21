// Sprite动画宠物组件 - 基于JS逐帧动画
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface SpritePetProps {
  petId: string;
  size?: number;
  animate?: 'idle' | 'wave';
  className?: string;
  onClick?: () => void;
}

// PetDex宠物映射 - 用户精选的可爱宠物
export const petSpriteMap: Record<string, { name: string; desc: string; color: string; personality: string; tags: string[]; frames: { idle: string[]; wave: string[] } }> = {
  junie: {
    name: '朱妮',
    desc: '兔警官，冷静专注又温暖',
    color: '#A78BFA',
    personality: '正义型',
    tags: ['#cheerful', '#calm', '#focused'],
    frames: {
      idle: Array.from({ length: 6 }, (_, i) => `/pets/sprites/frames/junie-idle-${i}.webp`),
      wave: Array.from({ length: 4 }, (_, i) => `/pets/sprites/frames/junie-wave-${i}.webp`),
    }
  },
  duo: {
    name: '嘟嘟',
    desc: '绿色猫头鹰，学习好伙伴',
    color: '#34D399',
    personality: '学霸型',
    tags: ['#wholesome', '#cheerful', '#focused'],
    frames: {
      idle: Array.from({ length: 6 }, (_, i) => `/pets/sprites/frames/duo-idle-${i}.webp`),
      wave: Array.from({ length: 4 }, (_, i) => `/pets/sprites/frames/duo-wave-${i}.webp`),
    }
  },
  axobotl: {
    name: '六六',
    desc: '调皮的六角恐龙，坏点子不断',
    color: '#60A5FA',
    personality: '搞怪型',
    tags: ['#mischievous', '#chaotic', '#playful'],
    frames: {
      idle: Array.from({ length: 6 }, (_, i) => `/pets/sprites/frames/axobotl-idle-${i}.webp`),
      wave: Array.from({ length: 4 }, (_, i) => `/pets/sprites/frames/axobotl-wave-${i}.webp`),
    }
  },
  kebo: {
    name: '考比',
    desc: '紫色考拉理财小达人',
    color: '#C084FC',
    personality: '专注型',
    tags: ['#focused', '#cheerful'],
    frames: {
      idle: Array.from({ length: 6 }, (_, i) => `/pets/sprites/frames/kebo-idle-${i}.webp`),
      wave: Array.from({ length: 4 }, (_, i) => `/pets/sprites/frames/kebo-wave-${i}.webp`),
    }
  },
  swag: {
    name: '酷鹅',
    desc: '戴墨镜的酷企鹅，永远自信',
    color: '#3B82F6',
    personality: '酷帅型',
    tags: ['#playful', '#cheerful', '#mischievous'],
    frames: {
      idle: Array.from({ length: 6 }, (_, i) => `/pets/sprites/frames/swag-idle-${i}.webp`),
      wave: Array.from({ length: 4 }, (_, i) => `/pets/sprites/frames/swag-wave-${i}.webp`),
    }
  },
  beier: {
    name: '铃铃',
    desc: '粉色狐狸，甜美可爱',
    color: '#F9A8D4',
    personality: '甜美型',
    tags: ['#cheerful', '#playful', '#wholesome'],
    frames: {
      idle: Array.from({ length: 6 }, (_, i) => `/pets/sprites/frames/beier-idle-${i}.webp`),
      wave: Array.from({ length: 4 }, (_, i) => `/pets/sprites/frames/beier-wave-${i}.webp`),
    }
  },
  'da-zhuang': {
    name: '大壮',
    desc: '银虎斑猫，威武有力',
    color: '#FB923C',
    personality: '勇猛型',
    tags: ['#heroic', '#playful', '#mischievous'],
    frames: {
      idle: Array.from({ length: 6 }, (_, i) => `/pets/sprites/frames/da-zhuang-idle-${i}.webp`),
      wave: Array.from({ length: 4 }, (_, i) => `/pets/sprites/frames/da-zhuang-wave-${i}.webp`),
    }
  },
};

export const SpritePet: React.FC<SpritePetProps> = ({ 
  petId, 
  size = 96, 
  animate = 'idle',
  className = '',
  onClick
}) => {
  const [currentAnim, setCurrentAnim] = useState<'idle' | 'wave'>(animate);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isClickAnimating, setIsClickAnimating] = useState(false);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const petData = petSpriteMap[petId];

  // 帧动画循环
  useEffect(() => {
    if (!petData) return;
    
    const frameList = petData.frames[currentAnim];
    if (!frameList || frameList.length === 0) return;

    const fps = currentAnim === 'wave' ? 8 : 6;
    const interval = 1000 / fps;

    frameTimerRef.current = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % frameList.length);
    }, interval);

    return () => {
      if (frameTimerRef.current) clearInterval(frameTimerRef.current);
    };
  }, [petData, currentAnim]);

  // 外部animate prop变化
  useEffect(() => {
    if (!isClickAnimating) {
      setCurrentAnim(animate);
      setFrameIndex(0);
    }
  }, [animate, isClickAnimating]);

  // 清理
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      if (frameTimerRef.current) clearInterval(frameTimerRef.current);
    };
  }, []);

  // 点击切换wave动画
  const handleClick = useCallback(() => {
    if (currentAnim === 'idle' && !isClickAnimating) {
      setIsClickAnimating(true);
      setCurrentAnim('wave');
      setFrameIndex(0);
      clickTimerRef.current = setTimeout(() => {
        setCurrentAnim('idle');
        setFrameIndex(0);
        setIsClickAnimating(false);
      }, 2000);
    }
    onClick?.();
  }, [currentAnim, isClickAnimating, onClick]);

  if (!petData) {
    return (
      <div 
        className={`flex items-center justify-center text-white font-bold bg-purple-400 rounded-xl ${className}`}
        style={{ width: size, height: Math.round(size * 1.08) }}
      >
        <span>?</span>
      </div>
    );
  }

  const frameList = petData.frames[currentAnim] || petData.frames.idle;
  const currentFrame = frameList[Math.min(frameIndex, frameList.length - 1)];

  return (
    <img
      src={currentFrame}
      alt={petData.name}
      onClick={handleClick}
      className={`cursor-pointer select-none ${className}`}
      style={{
        width: size,
        height: Math.round(size * 1.08),
        imageRendering: 'pixelated',
      }}
      draggable={false}
    />
  );
};

// 静态缩略图组件 - 也带idle动画
export const SpritePetThumb: React.FC<{ petId: string; size?: number; className?: string }> = ({ 
  petId, 
  size = 96,
  className = ''
}) => {
  const petData = petSpriteMap[petId];
  if (!petData) {
    return (
      <div 
        className={`rounded-xl bg-purple-400 flex items-center justify-center text-white font-bold ${className}`}
        style={{ width: size, height: Math.round(size * 1.08) }}
      >
        <span>?</span>
      </div>
    );
  }

  return (
    <SpritePet petId={petId} size={size} animate="idle" className={className} />
  );
};

export default SpritePet;
