import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'primary' | 'accent' | 'success' | 'warning';
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  variant = 'primary',
  className 
}: StatsCardProps) {
  const variantStyles = {
    primary: 'from-blue-50/50 to-blue-100/50 border-blue-200',
    accent: 'from-pink-50/50 to-rose-100/50 border-pink-200',
    success: 'from-green-50/50 to-emerald-100/50 border-green-200',
    warning: 'from-amber-50/50 to-orange-100/50 border-orange-200',
  };

  const iconStyles = {
    primary: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30',
    accent: 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-500/30',
    success: 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/30',
    warning: 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-orange-500/30',
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-4 w-4" />;
    if (trend.value < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-green-600 bg-green-50';
    if (trend.value < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br border card-hover",
        "bg-white shadow-lg",
        variantStyles[variant],
        className
      )}
    >
      {/* Decorative Circle */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br from-white/60 to-transparent blur-2xl"></div>
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          
          <div className={cn("p-3 rounded-xl", iconStyles[variant])}>
            <div className="text-white">{icon}</div>
          </div>
        </div>

        {trend && (
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold", getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(trend.value)}%</span>
            </div>
            <span className="text-sm text-gray-600">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface MiniStatsCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'purple';
}

export function MiniStatsCard({ label, value, icon, color = 'blue' }: MiniStatsCardProps) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200 card-hover shadow-sm">
      <div className={cn("p-2 rounded-lg border", colorStyles[color])}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-600 truncate">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
