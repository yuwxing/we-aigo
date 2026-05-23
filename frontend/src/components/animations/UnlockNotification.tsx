import React from 'react';

interface Props {
  text?: string;
  show: boolean;
}

const UnlockNotification: React.FC<Props> = ({ text, show }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">🔓</div>
        <div className="text-2xl font-bold text-emerald-400">
          {text || '新区域'} 已解锁
        </div>
        <div className="mt-2 text-sm text-white/50">世界正在扩大...</div>
      </div>
    </div>
  );
};

export default UnlockNotification;
