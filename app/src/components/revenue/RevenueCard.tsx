import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Coins, Calendar, TrendingUp } from 'lucide-react';
import { useClaimRevenue } from '@/hooks/useClaimRevenue';
import { formatDistanceToNow } from 'date-fns';

interface RevenueCardProps {
  epochNumber: number;
  propertyMint: string;
  propertyName: string;
  totalRevenue: string;
  claimableAmount: string;
  depositedAt: string;
}

export function RevenueCard({
  epochNumber,
  propertyMint,
  propertyName,
  totalRevenue,
  claimableAmount,
  depositedAt,
}: RevenueCardProps) {
  const claimMutation = useClaimRevenue();

  const handleClaim = () => {
    claimMutation.mutate({
      propertyMint,
      epochNumber,
    });
  };

  const claimableSOL = (parseInt(claimableAmount) / 1e9).toFixed(4);
  const totalSOL = (parseInt(totalRevenue) / 1e9).toFixed(4);

  return (
    <Card className="hover:shadow-lg transition-shadow space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-lg font-semibold text-white">{propertyName}</h4>
          <p className="flex items-center gap-2 mt-1 text-sm text-solana-dark-400">
            <Calendar className="h-3 w-3" />
            Epoch #{epochNumber} · {formatDistanceToNow(new Date(depositedAt), { addSuffix: true })}
          </p>
        </div>
        <Badge variant="purple" className="flex items-center gap-1">
          <Coins className="h-3 w-3" />
          Claimable
        </Badge>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-solana-dark-400">Your Share</p>
            <p className="text-2xl font-bold text-solana-green-400">{claimableSOL} SOL</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-solana-dark-400">Total Distributed</p>
            <p className="text-lg font-semibold text-white">{totalSOL} SOL</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-solana-dark-400">
          <TrendingUp className="h-4 w-4" />
          <span>Proportional to your token holdings</span>
        </div>
      </div>

      {/* Footer */}
      <Button
        onClick={handleClaim}
        isLoading={claimMutation.isPending}
        className="w-full"
        size="lg"
      >
        {claimMutation.isPending ? 'Claiming...' : `Claim ${claimableSOL} SOL`}
      </Button>
    </Card>
  );
}
