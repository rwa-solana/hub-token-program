import { FC, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet, Building2, ArrowRight, Shield, Send, Coins } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard, StatsGrid } from '@/components/ui/Stats';
import { PageLoading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { TransferModal } from '@/components/transfer';
import { RevenueCard } from '@/components/revenue';
import { useClaimableRevenue } from '@/hooks/useClaimableRevenue';
import { investorApi } from '@/services/api';
import { TokenHolding } from '@/types';

export const PortfolioPage: FC = () => {
  const { publicKey, connected } = useWallet();
  const queryClient = useQueryClient();

  // Transfer modal state
  const [selectedHolding, setSelectedHolding] = useState<TokenHolding | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const openTransferModal = (holding: TokenHolding) => {
    setSelectedHolding(holding);
    setIsTransferModalOpen(true);
  };

  const closeTransferModal = () => {
    setSelectedHolding(null);
    setIsTransferModalOpen(false);
  };

  const handleTransferSuccess = () => {
    // Refresh portfolio data after successful transfer
    queryClient.invalidateQueries({ queryKey: ['portfolio', publicKey?.toString()] });
  };

  const { data: portfolio, isLoading, error } = useQuery({
    queryKey: ['portfolio', publicKey?.toString()],
    queryFn: () => investorApi.getPortfolio(publicKey!.toString()),
    enabled: !!publicKey,
  });

  const { data: claimableRevenue } = useClaimableRevenue();

  if (!connected) {
    return (
      <EmptyState
        icon={<Wallet className="w-10 h-10" />}
        title="Connect Your Wallet"
        description="Connect your Solana wallet to view your portfolio and investment holdings."
      />
    );
  }

  if (isLoading) return <PageLoading />;

  if (error) {
    return (
      <EmptyState
        icon={<Wallet className="w-10 h-10" />}
        title="Failed to load portfolio"
        description="There was an error loading your portfolio. Please try again later."
      />
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">My Portfolio</h1>
        <p className="text-solana-dark-400">Track your real estate investments</p>
      </div>

      {/* KYC Status Banner */}
      {portfolio && !portfolio.kycVerified && (
        <Card className="p-4 bg-yellow-500/10 border-yellow-500/50">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/20">
              <Shield className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">KYC Verification Required</h3>
              <p className="text-sm text-solana-dark-300">
                Complete KYC verification to transfer tokens and claim revenue.
              </p>
            </div>
            <Link to="/kyc">
              <Button variant="secondary" size="sm">
                Verify Now
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Stats */}
      <StatsGrid cols={3}>
        <StatCard
          title="Total Value"
          value={`$${portfolio?.totalValueUsd.toLocaleString() || '0'}`}
          icon={<Wallet className="w-6 h-6 text-solana-purple-400" />}
          iconBg="bg-solana-purple-500/20"
        />
        <StatCard
          title="Properties Owned"
          value={portfolio?.totalProperties || 0}
          icon={<Building2 className="w-6 h-6 text-solana-green-400" />}
          iconBg="bg-solana-green-500/20"
        />
        <StatCard
          title="KYC Status"
          value={portfolio?.kycStatus || 'Unknown'}
          icon={<Shield className="w-6 h-6 text-blue-400" />}
          iconBg="bg-blue-500/20"
        />
      </StatsGrid>

      {/* Claimable Revenue */}
      {claimableRevenue && claimableRevenue.epochs.length > 0 && (
        <Card>
          <CardHeader
            title="Claimable Revenue"
            subtitle="Your share of rental income distributions"
            action={
              <div className="flex items-center gap-2 text-sm text-solana-dark-400">
                <Coins className="w-4 h-4" />
                <span>{(parseInt(claimableRevenue.totalClaimable) / 1e9).toFixed(4)} SOL Available</span>
              </div>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {claimableRevenue.epochs.map((epoch) => (
              <RevenueCard
                key={`${epoch.propertyMint}-${epoch.epochNumber}`}
                epochNumber={epoch.epochNumber}
                propertyMint={epoch.propertyMint}
                propertyName={epoch.propertyName}
                totalRevenue={epoch.totalRevenue}
                claimableAmount={epoch.claimableAmount}
                depositedAt={epoch.depositedAt}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Holdings */}
      <Card>
        <CardHeader
          title="Holdings"
          subtitle="Your property token holdings"
          action={
            <Link to="/properties">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Browse Properties
              </Button>
            </Link>
          }
        />

        {portfolio?.holdings && portfolio.holdings.length > 0 ? (
          <div className="space-y-4">
            {portfolio.holdings.map((holding) => (
              <div
                key={holding.propertyMint}
                className="flex items-center gap-4 p-4 bg-solana-dark-800/50 rounded-xl"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-solana-purple-500/20 to-solana-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-solana-dark-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate">{holding.propertyName}</h4>
                  <p className="text-sm text-solana-dark-400">
                    {Number(holding.balance).toLocaleString()} {holding.propertySymbol}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">${holding.valueUsd.toFixed(2)}</p>
                  <p className="text-sm text-solana-green-400">{holding.percentage.toFixed(2)}%</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openTransferModal(holding)}
                    leftIcon={<Send className="w-4 h-4" />}
                    disabled={!portfolio.kycVerified}
                    title={!portfolio.kycVerified ? 'Complete KYC to transfer' : 'Transfer tokens'}
                  >
                    Transfer
                  </Button>
                  <Link to={`/properties/${holding.propertyMint}`}>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Building2 className="w-8 h-8" />}
            title="No holdings yet"
            description="Start investing in tokenized real estate to build your portfolio."
            action={{
              label: 'Browse Properties',
              onClick: () => window.location.href = '/properties',
            }}
          />
        )}
      </Card>

      {/* Transfer Modal */}
      {selectedHolding && (
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={closeTransferModal}
          propertyMint={selectedHolding.propertyMint}
          propertyName={selectedHolding.propertyName}
          propertySymbol={selectedHolding.propertySymbol}
          balance={selectedHolding.balance}
          onTransferSuccess={handleTransferSuccess}
        />
      )}
    </div>
  );
};
