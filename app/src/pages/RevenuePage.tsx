import { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Wallet, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard, StatsGrid } from '@/components/ui/Stats';
import { PageLoading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { investorApi } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';

export const RevenuePage: FC = () => {
  const { publicKey, connected } = useWallet();

  const { data: claimable, isLoading, error } = useQuery({
    queryKey: ['claimable', publicKey?.toString()],
    queryFn: () => investorApi.getClaimable(publicKey!.toString()),
    enabled: !!publicKey,
  });

  if (!connected) {
    return (
      <EmptyState
        icon={<Wallet className="w-10 h-10" />}
        title="Connect Your Wallet"
        description="Connect your Solana wallet to view and claim your revenue."
      />
    );
  }

  if (isLoading) return <PageLoading />;

  if (error) {
    return (
      <EmptyState
        icon={<TrendingUp className="w-10 h-10" />}
        title="Failed to load revenue"
        description="There was an error loading your revenue. Please try again later."
      />
    );
  }

  const totalClaimable = Number(claimable?.totalClaimable || 0) / 1e9;
  const unclaimedEpochs = claimable?.epochs.filter(e => !e.claimed) || [];
  const claimedEpochs = claimable?.epochs.filter(e => e.claimed) || [];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Revenue</h1>
          <p className="text-solana-dark-400">Claim your rental income distributions</p>
        </div>
        {totalClaimable > 0 && (
          <Button size="lg" leftIcon={<DollarSign className="w-5 h-5" />}>
            Claim All ({totalClaimable.toFixed(4)} SOL)
          </Button>
        )}
      </div>

      {/* Stats */}
      <StatsGrid cols={3}>
        <StatCard
          title="Available to Claim"
          value={`${totalClaimable.toFixed(4)} SOL`}
          icon={<DollarSign className="w-6 h-6 text-solana-green-400" />}
          iconBg="bg-solana-green-500/20"
        />
        <StatCard
          title="Unclaimed Epochs"
          value={unclaimedEpochs.length}
          icon={<Clock className="w-6 h-6 text-yellow-400" />}
          iconBg="bg-yellow-500/20"
        />
        <StatCard
          title="Total Claimed"
          value={claimedEpochs.length}
          icon={<CheckCircle2 className="w-6 h-6 text-solana-purple-400" />}
          iconBg="bg-solana-purple-500/20"
        />
      </StatsGrid>

      {/* Unclaimed Revenue */}
      {unclaimedEpochs.length > 0 && (
        <Card>
          <CardHeader title="Available to Claim" subtitle="Revenue ready for withdrawal" />
          <div className="space-y-3">
            {unclaimedEpochs.map((epoch) => (
              <div
                key={epoch.epochAccount}
                className="flex items-center gap-4 p-4 bg-solana-green-500/10 border border-solana-green-500/30 rounded-xl"
              >
                <div className="p-3 rounded-xl bg-solana-green-500/20">
                  <DollarSign className="w-6 h-6 text-solana-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{epoch.propertyName}</h4>
                  <p className="text-sm text-solana-dark-400">
                    Epoch #{epoch.epochNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-solana-green-400">
                    {(Number(epoch.claimableAmount) / 1e9).toFixed(4)} SOL
                  </p>
                </div>
                <Button size="sm">Claim</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Claimed History */}
      <Card>
        <CardHeader title="Claim History" subtitle="Previously claimed revenue" />
        {claimedEpochs.length > 0 ? (
          <div className="space-y-3">
            {claimedEpochs.map((epoch) => (
              <div
                key={epoch.epochAccount}
                className="flex items-center gap-4 p-4 bg-solana-dark-800/50 rounded-xl"
              >
                <div className="p-3 rounded-xl bg-solana-dark-700">
                  <CheckCircle2 className="w-6 h-6 text-solana-dark-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{epoch.propertyName}</h4>
                  <p className="text-sm text-solana-dark-400">
                    Epoch #{epoch.epochNumber} - Claimed{' '}
                    {epoch.claimedAt && formatDistanceToNow(new Date(epoch.claimedAt), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant="success">Claimed</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-solana-dark-400">
            No claimed revenue yet
          </div>
        )}
      </Card>
    </div>
  );
};
