import { FC, ReactNode } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: ReactNode;
  iconBg?: string;
  className?: string;
}

export const StatCard: FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  iconBg = 'bg-solana-purple-500/20',
  className,
}) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className={clsx('card p-5', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-solana-dark-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {change !== undefined && (
            <div className={clsx(
              'flex items-center gap-1 mt-2 text-sm',
              isPositive ? 'text-solana-green-400' : 'text-red-400'
            )}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{isPositive ? '+' : ''}{change}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={clsx('p-3 rounded-xl', iconBg)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

interface StatsGridProps {
  children: ReactNode;
  cols?: 2 | 3 | 4;
}

export const StatsGrid: FC<StatsGridProps> = ({ children, cols = 4 }) => {
  const colsClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={clsx('grid gap-4', colsClass[cols])}>
      {children}
    </div>
  );
};
