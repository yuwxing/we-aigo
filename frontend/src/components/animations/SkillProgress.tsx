import React from 'react';
import { motion } from 'framer-motion';

interface SkillItem {
  label: string;
  from: number;
  to: number;
}

interface Props {
  skills: SkillItem[];
  show: boolean;
}

const SkillProgress: React.FC<Props> = ({ skills, show }) => {
  if (!show) return null;

  const colors = ['#22d3ee', '#fb923c', '#a78bfa'];

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full max-w-xs space-y-4">
        <div className="text-white/80 text-center text-lg mb-4 font-bold">✨ 能力成长</div>
        {skills.map((s, i) => (
          <div key={s.label} className="space-y-1">
            <div className="flex justify-between text-xs text-white/70">
              <span>{s.label}</span>
              <span className="font-mono">{s.from.toFixed(2)} → {s.to.toFixed(2)}</span>
            </div>
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: colors[i] || '#a78bfa',
                  boxShadow: `0 0 10px ${colors[i] || '#a78bfa'}66`,
                }}
                initial={{ width: `${s.from * 100}%` }}
                animate={{ width: `${s.to * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillProgress;
