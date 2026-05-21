/**
 * 任务状态配置 - 统一的状态映射
 * 用于所有页面统一展示任务状态
 */

export interface TaskStatusConfig {
  label: string;    // 状态标签
  icon: string;     // 状态图标
  color: string;    // 文字颜色
  bgColor: string;  // 背景颜色
}

export const TASK_STATUS_MAP: Record<string, TaskStatusConfig> = {
  // 新状态
  pending_match: { label: '等待匹配', icon: '🔍', color: '#F59E0B', bgColor: '#FEF3C7' },
  matched: { label: '已匹配', icon: '🤝', color: '#8B5CF6', bgColor: '#EDE9FE' },
  accepted: { label: '已接单', icon: '✅', color: '#10B981', bgColor: '#D1FAE5' },
  in_progress: { label: '执行中', icon: '⚡', color: '#3B82F6', bgColor: '#DBEAFE' },
  submitted: { label: '已交付', icon: '📦', color: '#8B5CF6', bgColor: '#EDE9FE' },
  completed: { label: '已完成', icon: '✨', color: '#10B981', bgColor: '#D1FAE5' },
  cancelled: { label: '已取消', icon: '❌', color: '#EF4444', bgColor: '#FEE2E2' },
  arbitration: { label: '仲裁中', icon: '⚖️', color: '#F59E0B', bgColor: '#FEF3C7' },
  refunded: { label: '已退款', icon: '💰', color: '#6B7280', bgColor: '#F3F4F6' },
  
  // 兼容旧状态
  pending: { label: '等待匹配', icon: '🔍', color: '#F59E0B', bgColor: '#FEF3C7' },
  open: { label: '待指派', icon: '🟡', color: '#F59E0B', bgColor: '#FEF3C7' },
  approved: { label: '已验收', icon: '✨', color: '#10B981', bgColor: '#D1FAE5' },
  deal: { label: '已完成', icon: '✨', color: '#10B981', bgColor: '#D1FAE5' },
  rejected: { label: '已退回', icon: '⚠️', color: '#EF4444', bgColor: '#FEE2E2' },
  failed: { label: '执行失败', icon: '💥', color: '#EF4444', bgColor: '#FEE2E2' },
};

export function getStatusConfig(status: string): TaskStatusConfig {
  return TASK_STATUS_MAP[status] || { 
    label: status, 
    icon: '📋', 
    color: '#6B7280', 
    bgColor: '#F3F4F6' 
  };
}

/**
 * 获取状态展示样式（用于inline style）
 */
export function getStatusStyle(status: string): { color: string; backgroundColor: string } {
  const config = getStatusConfig(status);
  return {
    color: config.color,
    backgroundColor: config.bgColor,
  };
}

/**
 * 判断任务是否可以取消
 */
export function canCancelTask(status: string): boolean {
  const cancellableStatuses = ['pending_match', 'matched', 'in_progress', 'open', 'pending'];
  return cancellableStatuses.includes(status);
}

/**
 * 判断任务是否在执行中
 */
export function isTaskInProgress(status: string): boolean {
  const inProgressStatuses = ['pending_match', 'matched', 'in_progress'];
  return inProgressStatuses.includes(status);
}
