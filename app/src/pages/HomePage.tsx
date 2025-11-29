import { FC } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Wallet,
  TrendingUp,
  Shield,
  ArrowRight,
  Sparkles,
  Globe,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatCard, StatsGrid } from '@/components/ui/Stats';
import { Badge } from '@/components/ui/Badge';
import { propertiesApi } from '@/services/api';

export const HomePage: FC = () => {
  const { connected } = useWallet();

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertiesApi.getAll(),
  });

  const totalValue = properties?.reduce((acc, p) => acc + p.details.totalValueUsd, 0) || 0;
  const totalProperties = properties?.length || 0;

  return (
    <div className="space-y-8 animate-in">
      {/* Hero Section */}
      <section className="relative py-8 lg:py-16">
        <div className="max-w-4xl">
          <Badge variant="purple" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by Solana
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            Tokenize Real Estate,
            <span className="gradient-text"> Democratize Wealth</span>
          </h1>
          <p className="text-lg text-solana-dark-300 mb-8 max-w-2xl">
            Invest in fractional real estate ownership through blockchain technology.
            Secure, transparent, and accessible to everyone.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/properties">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Explore Properties
              </Button>
            </Link>
            {!connected && (
              <Button variant="secondary" size="lg">
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <StatsGrid cols={4}>
        <StatCard
          title="Total Value Locked"
          value={`$${(totalValue / 1000000).toFixed(2)}M`}
          change={12.5}
          icon={<TrendingUp className="w-6 h-6 text-solana-purple-400" />}
          iconBg="bg-solana-purple-500/20"
        />
        <StatCard
          title="Properties Listed"
          value={totalProperties}
          icon={<Building2 className="w-6 h-6 text-solana-green-400" />}
          iconBg="bg-solana-green-500/20"
        />
        <StatCard
          title="Active Investors"
          value="2,450+"
          change={8.2}
          icon={<Wallet className="w-6 h-6 text-blue-400" />}
          iconBg="bg-blue-500/20"
        />
        <StatCard
          title="Avg. Annual Yield"
          value="8.5%"
          icon={<TrendingUp className="w-6 h-6 text-yellow-400" />}
          iconBg="bg-yellow-500/20"
        />
      </StatsGrid>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:border-solana-purple-500/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-solana-purple-500/20 flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-solana-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Global Access</h3>
          <p className="text-solana-dark-400">
            Invest in premium real estate from anywhere in the world with just a Solana wallet.
          </p>
        </Card>

        <Card className="p-6 hover:border-solana-green-500/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-solana-green-500/20 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-solana-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">KYC Protected</h3>
          <p className="text-solana-dark-400">
            All transfers are protected by on-chain KYC verification through Transfer Hooks.
          </p>
        </Card>

        <Card className="p-6 hover:border-blue-500/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Revenue Distribution</h3>
          <p className="text-solana-dark-400">
            Automatically receive your share of rental income through our smart revenue vault.
          </p>
        </Card>
      </section>

      {/* Featured Properties */}
      {properties && properties.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Featured Properties</h2>
              <p className="text-solana-dark-400">Explore our top investment opportunities</p>
            </div>
            <Link to="/properties">
              <Button variant="ghost" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View All
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.slice(0, 3).map((property) => (
              <Link key={property.mint} to={`/properties/${property.mint}`}>
                <Card variant="hover" padding="none">
                  <div className="h-48 bg-gradient-to-br from-solana-purple-500/20 to-solana-green-500/20 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-solana-dark-400" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-white">{property.name}</h3>
                        <p className="text-sm text-solana-dark-400">{property.details.location}</p>
                      </div>
                      <Badge variant={property.status === 'active' ? 'success' : 'warning'}>
                        {property.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-solana-dark-800">
                      <div>
                        <p className="text-xs text-solana-dark-400">Token Price</p>
                        <p className="font-semibold text-white">
                          ${property.details.valuePerToken.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-solana-dark-400">Annual Yield</p>
                        <p className="font-semibold text-solana-green-400">
                          {property.details.annualYieldPercent}%
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      {!connected && (
        <Card className="p-8 text-center bg-gradient-to-r from-solana-purple-500/10 to-solana-green-500/10">
          <Shield className="w-12 h-12 text-solana-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Ready to Start Investing?</h2>
          <p className="text-solana-dark-300 mb-6 max-w-md mx-auto">
            Connect your wallet and complete KYC verification to start investing in tokenized real estate.
          </p>
          <Button size="lg">Connect Wallet</Button>
        </Card>
      )}
    </div>
  );
};
