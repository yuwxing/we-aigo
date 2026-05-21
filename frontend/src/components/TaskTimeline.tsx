/**
 * TaskTimeline 组件 - 任务执行时间线
 * 紫粉渐变风格，inline style（鸿蒙兼容）
 * 节点颜色按actor_type：用户紫 #8B5CF6 / Agent绿 #10B981 / 系统灰 #94A3B8
 */

import React from 'react';

export interface TaskLogItem {
  id?: number;
  action: string;
  content: string;
  created_at: string;
  actor_type: string;
  actor_id?: number | null;
  metadata?: any;
}

// 节点颜色映射
const ACTOR_COLORS = {
  user: '#8B5CF6',      // 紫色 - 用户
  agent: '#10B981',     // 绿色 - Agent
  system: '#94A3B8',    // 灰色 - 系统
};

function getActorColor(actorType: string): string {
  return ACTOR_COLORS[actorType as keyof typeof ACTOR_COLORS] || ACTOR_COLORS.system;
}

// 格式化时间
function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  } catch {
    return dateStr;
  }
}

// 获取操作显示名称
function getActionLabel(action: string): string {
  const actionMap: Record<string, string> = {
    task_started: '任务创建',
    agent_matched: '智能体匹配',
    accepted: '接单执行',
    progress_update: '进度更新',
    delivery_submitted: '交付完成',
    task_cancelled: '任务取消',
    refund_processed: '退款处理',
    execution_failed: '执行失败',
    agent_not_found: '匹配失败',
    settled: '验收结算',
    user_feedback: '用户反馈',
  };
  return actionMap[action] || action;
}

// 获取进度（从metadata中）
function getProgressFromMetadata(metadata: any): number | null {
  if (metadata && typeof metadata === 'object' && 'progress' in metadata) {
    return metadata.progress;
  }
  return null;
}

interface TaskTimelineProps {
  logs: TaskLogItem[];
  maxHeight?: string;
}

export default function TaskTimeline({ logs, maxHeight = '400px' }: TaskTimelineProps) {
  if (!logs || logs.length === 0) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: '14px',
      }}>
        暂无执行记录
      </div>
    );
  }

  const isLatestPulse = logs.length > 0;

  return (
    <div style={{
      maxHeight,
      overflowY: 'auto',
      padding: '16px',
      background: 'linear-gradient(135deg, #F3E8FF 0%, #FCE7F3 100%)',
      borderRadius: '16px',
    }}>
      {/* 时间轴容器 */}
      <div style={{ position: 'relative' }}>
        {logs.map((log, index) => {
          const isLast = index === logs.length - 1;
          const isFirst = index === 0;
          const nodeColor = getActorColor(log.actor_type);
          const progress = getProgressFromMetadata(log.metadata);
          
          return (
            <div 
              key={log.id || index} 
              style={{ 
                display: 'flex', 
                position: 'relative',
                paddingBottom: isLast ? '0' : '24px',
              }}
            >
              {/* 连接线 */}
              {!isFirst && (
                <div style={{
                  position: 'absolute',
                  left: '11px',
                  top: '-24px',
                  width: '2px',
                  height: '24px',
                  background: 'linear-gradient(180deg, #E9D5FF 0%, #FBCFE8 100%)',
                }} />
              )}
              
              {/* 节点 */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {/* 脉冲动画（最新节点） */}
                {isLast && isLatestPulse && (
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: nodeColor,
                    opacity: 0.3,
                    animation: 'pulse 2s ease-in-out infinite',
                  }} />
                )}
                
                {/* 圆点 */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: nodeColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: '#fff',
                  fontWeight: 'bold',
                  boxShadow: `0 2px 8px ${nodeColor}40`,
                  zIndex: 1,
                  position: 'relative',
                }}>
                  {log.actor_type === 'user' ? '👤' : log.actor_type === 'agent' ? '🤖' : '⚙️'}
                </div>
              </div>
              
              {/* 内容区域 */}
              <div style={{ 
                marginLeft: '16px', 
                flex: 1,
                minWidth: 0,
              }}>
                {/* 头部：操作类型 + 时间 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#4B5563',
                  }}>
                    {getActionLabel(log.action)}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: '#9CA3AF',
                  }}>
                    {formatTime(log.created_at)}
                  </span>
                </div>
                
                {/* 内容 */}
                <div style={{
                  fontSize: '14px',
                  color: '#374151',
                  lineHeight: '1.5',
                  wordBreak: 'break-word',
                }}>
                  {log.content}
                </div>
                
                {/* 进度显示（如果有） */}
                {progress !== null && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <div style={{
                        flex: 1,
                        height: '6px',
                        backgroundColor: '#E5E7EB',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%)',
                          borderRadius: '3px',
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#8B5CF6',
                        minWidth: '36px',
                      }}>
                        {progress}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 脉冲动画样式 */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0.1;
          }
        }
      `}</style>
    </div>
  );
}
