import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { RewardPhase, RewardData } from '../../utils/rewardAnimationController';

interface Props {
  phase: RewardPhase;
  data: RewardData | null;
}

const QuestCompleteOverlay: React.FC<Props> = ({ phase, data }) => {
  if (phase === 'idle') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999]"
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
    >
      <div
        className="absolute inset-0"
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {phase === 'freeze' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-2xl font-bold text-white/80 text-center">
            <div>Processing result...</div>
            <div className="mt-3 text-cyan-400 text-base">▌</div>
          </div>
        </div>
      )}

      {phase === 'weg_explosion' && data && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="text-6xl md:text-7xl font-black"
            style={{
              color: '#fbbf24',
              textShadow: '0 0 40px rgba(251,191,36,0.8), 0 0 80px rgba(251,191,36,0.4)',
            }}
          >
            +{data.wegAmount}
            <div className="text-2xl text-center text-yellow-200/80 mt-1">WEG</div>
          </div>
        </div>
      )}

      {phase === 'skill_up' && data && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-xs space-y-4">
            <div className="text-white/80 text-center text-lg mb-4 font-bold">✨ 能力成长</div>
            {data.skills.map((s, i) => (
              <div key={s.label} className="space-y-1">
                <div className="flex justify-between text-xs text-white/70">
                  <span>{s.label}</span>
                  <span>{s.from.toFixed(2)} → {s.to.toFixed(2)}</span>
                </div>
                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: i === 0 ? '#22d3ee' : i === 1 ? '#fb923c' : '#a78bfa' }}
                    initial={{ width: `${s.from * 100}%` }}
                    animate={{ width: `${s.to * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === 'unlock' && data?.unlockText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-3">🔓</div>
            <div className="text-2xl font-bold text-emerald-400">
              {data.unlockText} 已解锁
            </div>
            <div className="mt-2 text-sm text-white/50">世界正在扩大...</div>
          </div>
        </div>
      )}

      {phase === 'returning' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/60 text-lg">返回火星基地...</div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default QuestCompleteOverlay;
