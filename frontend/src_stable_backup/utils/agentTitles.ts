export interface AgentTitle {
  title: string;
  level: number;
  badge: string;
  color: string;
  progress: number;
}

export function getAgentTitle(completed: number = 0, rating: number = 0): AgentTitle {
  let title: string, level: number, badge: string, color: string;
  
  if (completed >= 50) {
    title = '神谕'; level = 6; badge = '👑'; color = 'from-yellow-400 via-amber-500 to-orange-500';
  } else if (completed >= 31) {
    title = '超凡'; level = 5; badge = '🏆'; color = 'from-purple-500 via-pink-500 to-red-500';
  } else if (completed >= 16) {
    title = '破界'; level = 4; badge = '💎'; color = 'from-blue-500 via-indigo-500 to-purple-500';
  } else if (completed >= 6) {
    title = '觉醒'; level = 3; badge = '⚡'; color = 'from-cyan-500 via-blue-500 to-indigo-500';
  } else if (completed >= 1) {
    title = '羽化'; level = 2; badge = '🌱'; color = 'from-green-400 via-emerald-500 to-teal-500';
  } else {
    title = '原点'; level = 1; badge = '🆕'; color = 'from-slate-400 via-slate-500 to-slate-600';
  }
  
  if (rating >= 4.8) title = '✨' + title;
  else if (rating >= 4.5) title = '🌟' + title;
  
  const progress = getLevelProgress(completed);
  return { title, level, badge, color, progress };
}

export function getLevelProgress(completed: number): number {
  const thresholds = [0, 1, 6, 16, 31, 50];
  const level = thresholds.filter(t => completed >= t).length - 1;
  const currentThreshold = thresholds[level];
  const nextThreshold = thresholds[level + 1] || 100;
  if (level >= 5) return 100;
  return Math.round(((completed - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
}
