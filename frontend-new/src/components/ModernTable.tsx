import { type ReactNode } from 'react';
import { cn } from '../lib/utils';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface ModernTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function ModernTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  emptyMessage = "Aucune donnée disponible",
  className,
}: ModernTableProps<T>) {
  return (
    <div className={cn("bg-white/80 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-6 py-4 text-left text-sm font-semibold text-foreground",
                    column.className
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={index}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "transition-colors hover:bg-primary/5",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn("px-6 py-4 text-sm text-foreground", column.className)}
                    >
                      {column.render ? column.render(item) : item[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  children?: ReactNode;
}

export function StatusBadge({ status, variant = 'default', children }: StatusBadgeProps) {
  const variants = {
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    default: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border",
      variants[variant]
    )}>
      {children || status}
    </span>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
  className?: string;
}

export function ActionButton({ onClick, variant = 'primary', children, className }: ActionButtonProps) {
  const variants = {
    primary: 'bg-gradient-primary hover:opacity-90 text-white',
    secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
    danger: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}
