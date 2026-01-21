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
    primary: 'from-cyan-500/10 to-blue-500/10 border-cyan-200',
    accent: 'from-pink-500/10 to-rose-500/10 border-pink-200',
    success: 'from-green-500/10 to-emerald-500/10 border-green-200',
    warning: 'from-amber-500/10 to-orange-500/10 border-orange-200',
  };

  const iconStyles = {
    primary: 'bg-gradient-primary',
    accent: 'bg-gradient-accent',
    success: 'bg-gradient-to-br from-green-500 to-emerald-500',
    warning: 'bg-gradient-to-br from-amber-500 to-orange-500',
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
        "relative overflow-hidden rounded-2xl bg-gradient-to-br border backdrop-blur-sm card-hover",
        "bg-white/80 shadow-sm",
        variantStyles[variant],
        className
      )}
    >
      {/* Decorative Circle */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br from-white/40 to-transparent blur-2xl"></div>
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>
          
          <div className={cn("p-3 rounded-xl shadow-lg", iconStyles[variant])}>
            <div className="text-white">{icon}</div>
          </div>
        </div>

        {trend && (
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold", getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(trend.value)}%</span>
            </div>
            <span className="text-sm text-muted-foreground">{trend.label}</span>
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
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/80 border border-border/50 card-hover">
      <div className={cn("p-2 rounded-lg border", colorStyles[color])}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
