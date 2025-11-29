import { FC } from 'react';
import { clsx } from 'clsx';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Loading: FC<LoadingProps> = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div
        className={clsx(
          'animate-spin rounded-full border-2 border-solana-dark-700 border-t-solana-green-500',
          sizes[size]
        )}
      />
    </div>
  );
};

export const PageLoading: FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-solana-dark-700 animate-pulse" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-solana-purple-500 animate-spin" />
      </div>
      <p className="mt-4 text-solana-dark-400 animate-pulse">Loading...</p>
    </div>
  );
};

export const SkeletonCard: FC = () => {
  return (
    <div className="card p-6 animate-pulse">
      <div className="h-40 bg-solana-dark-800 rounded-xl mb-4" />
      <div className="h-4 bg-solana-dark-800 rounded w-3/4 mb-2" />
      <div className="h-3 bg-solana-dark-800 rounded w-1/2 mb-4" />
      <div className="flex justify-between">
        <div className="h-6 bg-solana-dark-800 rounded w-20" />
        <div className="h-6 bg-solana-dark-800 rounded w-16" />
      </div>
    </div>
  );
};
