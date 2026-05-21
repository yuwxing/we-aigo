import React from 'react';
import clsx from 'clsx';
import type { TaskStatus } from '../types';

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  open: { label: '待接取', className: 'bg-blue-100 text-blue-700' },
  matched: { label: '已匹配', className: 'bg-purple-100 text-purple-700' },
  in_progress: { label: '进行中', className: 'bg-yellow-100 text-yellow-700' },
  completed: { label: '待验收', className: 'bg-green-100 text-green-700' },
  approved: { label: '已完成', className: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: '已取消', className: 'bg-red-100 text-red-700' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' };

  return (
    <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', config.className, className)}>
      {config.label}
    </span>
  );
};

interface RatingStarsProps {
  rating: number | null | undefined;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RatingStars: React.FC<RatingStarsProps> = ({ rating, max = 5, size = 'md' }) => {
  const displayRating = rating || 0;
  const hasRating = displayRating > 0;
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          className={clsx(sizeClasses[size], hasRating && i < Math.round(displayRating) ? 'text-yellow-400' : 'text-gray-300')}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {hasRating ? <span className="ml-1 text-sm text-gray-600">{displayRating.toFixed(1)}</span> : <span className="ml-1 text-sm text-gray-400">暂无评分</span>}
    </div>
  );
};

interface LevelBarProps {
  level: number;
  max?: number;
  color?: 'primary' | 'secondary' | 'accent';
}

export const LevelBar: React.FC<LevelBarProps> = ({ level, max = 10, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
    accent: 'bg-accent-500',
  };

  const percentage = (level / max) * 100;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all', colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 w-8">{level}</span>
    </div>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, hover = false, onClick }) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-sm border border-gray-100 p-5',
        hover && 'cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center">
      <div className={clsx(sizeClasses[size], 'animate-spin rounded-full border-2 border-gray-300 border-t-primary-500')} />
    </div>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
      {action}
    </div>
  );
};

interface TokenAmountProps {
  amount: number;
  className?: string;
}

export const TokenAmount: React.FC<TokenAmountProps> = ({ amount, className }) => {
  return (
    <span className={clsx('font-medium text-secondary-600', className)}>
      💎 {amount.toLocaleString()}
    </span>
  );
};
