import { FC, HTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}) => {
  const variants = {
    default: 'bg-solana-dark-900/50 backdrop-blur-xl border border-solana-dark-800 rounded-2xl',
    hover: 'bg-solana-dark-900/50 backdrop-blur-xl border border-solana-dark-800 rounded-2xl hover:border-solana-dark-700 hover:bg-solana-dark-900/70 transition-all duration-300 cursor-pointer',
    glass: 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={clsx(variants[variant], paddings[padding], className)} {...props}>
      {children}
    </div>
  );
};

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const CardHeader: FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  className,
  ...props
}) => {
  return (
    <div className={clsx('flex items-center justify-between mb-4', className)} {...props}>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-solana-dark-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
};
