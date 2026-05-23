import { useState, useCallback, useRef } from 'react';

export type RewardPhase = 'idle' | 'freeze' | 'weg_explosion' | 'skill_up' | 'unlock' | 'returning';

export interface RewardData {
  wegAmount: number;
  skills: { label: string; from: number; to: number }[];
  unlockText?: string;
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export function useRewardAnimation() {
  const [phase, setPhase] = useState<RewardPhase>('idle');
  const [data, setData] = useState<RewardData | null>(null);
  const abortRef = useRef(false);

  const playRewardSequence = useCallback(async (reward: RewardData) => {
    abortRef.current = false;
    setData(reward);

    setPhase('freeze');
    await sleep(300);
    if (abortRef.current) return;

    setPhase('weg_explosion');
    await sleep(600);
    if (abortRef.current) return;

    setPhase('skill_up');
    await sleep(700);
    if (abortRef.current) return;

    setPhase('unlock');
    await sleep(600);
    if (abortRef.current) return;

    setPhase('returning');
    await sleep(400);
    if (abortRef.current) return;

    setPhase('idle');
    setData(null);
  }, []);

  const abort = useCallback(() => {
    abortRef.current = true;
    setPhase('idle');
    setData(null);
  }, []);

  return { phase, data, playRewardSequence, abort };
}
