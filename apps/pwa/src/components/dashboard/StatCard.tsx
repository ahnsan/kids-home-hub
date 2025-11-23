/**
 * StatCard component - Display metric statistics
 */

import { type FunctionComponent } from 'preact';
import { Card } from '../common/Card';
import { clsx } from 'clsx';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'purple' | 'orange';
  onClick?: () => void;
}

const colorStyles = {
  primary: {
    bg: 'bg-primary-50',
    text: 'text-primary-600',
    iconBg: 'bg-primary-100',
    trendPositive: 'text-success-600',
    trendNegative: 'text-error-600'
  },
  success: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    iconBg: 'bg-green-100',
    trendPositive: 'text-success-600',
    trendNegative: 'text-error-600'
  },
  warning: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    iconBg: 'bg-orange-100',
    trendPositive: 'text-success-600',
    trendNegative: 'text-error-600'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    iconBg: 'bg-purple-100',
    trendPositive: 'text-success-600',
    trendNegative: 'text-error-600'
  },
  orange: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    iconBg: 'bg-amber-100',
    trendPositive: 'text-success-600',
    trendNegative: 'text-error-600'
  }
};

export const StatCard: FunctionComponent<StatCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  trend,
  color = 'primary',
  onClick
}) => {
  const styles = colorStyles[color];

  return (
    <Card
      interactive={!!onClick}
      class={clsx(
        'transition-all duration-200',
        onClick && 'hover:shadow-card-hover active:scale-98'
      )}
    >
      <div onClick={onClick} class={clsx(onClick && 'cursor-pointer')}>
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="text-sm text-surface-500 font-medium">{title}</p>
          </div>
          <div class={clsx('w-10 h-10 rounded-xl flex items-center justify-center', styles.iconBg)}>
            <span class="text-xl">{icon}</span>
          </div>
        </div>

        <div class="mb-2">
          <p class={clsx('text-3xl font-bold', styles.text)}>{value}</p>
        </div>

        {subtitle && <p class="text-xs text-surface-400 mb-2">{subtitle}</p>}

        {trend && (
          <div class="flex items-center gap-1">
            <span
              class={clsx(
                'text-xs font-semibold',
                trend.positive ? styles.trendPositive : styles.trendNegative
              )}
            >
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span class="text-xs text-surface-400">{trend.label}</span>
          </div>
        )}
      </div>
    </Card>
  );
};
