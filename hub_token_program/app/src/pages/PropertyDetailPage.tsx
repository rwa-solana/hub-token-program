import { FC, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Building2,
  MapPin,
  TrendingUp,
  Users,
  ArrowLeft,
  ExternalLink,
  Copy,
  Wallet,
  FileText,
  Calendar,
  Ruler,
  Home,
  Bath,
  Car,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard, StatsGrid } from '@/components/ui/Stats';
import { PageLoading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { InvestmentModal } from '@/components/investment';
import { propertiesApi } from '@/services/api';
import toast from 'react-hot-toast';

// IPFS API URL (Hub Token API)
const IPFS_API_URL = import.meta.env.VITE_HUB_API_URL || 'http://localhost:3003';

// Property metadata interface (from IPFS)
interface PropertyMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  properties: {
    files: Array<{
      uri: string;
      type: string;
    }>;
    category: string;
  };
}

export const PropertyDetailPage: FC = () => {
  const { mint } = useParams<{ mint: string }>();
  const { connected } = useWallet();
  const queryClient = useQueryClient();
  const [metadata, setMetadata] = useState<PropertyMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);

  const { data: property, isLoading, error } = useQuery({
    queryKey: ['property', mint],
    queryFn: () => propertiesApi.getByMint(mint!),
    enabled: !!mint,
  });

  // Fetch metadata from IPFS if available
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!property?.details?.metadataUri) return;

      setIsLoadingMetadata(true);
      try {
        // Extract IPFS hash from URI
        const ipfsHash = property.details.metadataUri.replace('ipfs://', '');
        const response = await fetch(`${IPFS_API_URL}/api/v1/ipfs/metadata/${ipfsHash}`);

        if (response.ok) {
          const data = await response.json();
          setMetadata(data.metadata);
        }
      } catch (error) {
        console.error('Error fetching metadata:', error);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [property?.details?.metadataUri]);

  // Get image URLs from metadata
  const getImageUrls = (): string[] => {
    if (!metadata) return [];

    const images: string[] = [];

    // Add main image
    if (metadata.image) {
      images.push(convertIpfsToGateway(metadata.image));
    }

    // Add additional images from properties.files
    if (metadata.properties?.files) {
      metadata.properties.files
        .filter((f) => f.type.startsWith('image/'))
        .forEach((f) => {
          const url = convertIpfsToGateway(f.uri);
          if (!images.includes(url)) {
            images.push(url);
          }
        });
    }

    return images;
  };

  // Convert IPFS URI to gateway URL
  const convertIpfsToGateway = (uri: string): string => {
    if (uri.startsWith('ipfs://')) {
      const hash = uri.replace('ipfs://', '');
      return `https://gateway.pinata.cloud/ipfs/${hash}`;
    }
    return uri;
  };

  // Get attribute value from metadata
  const getAttribute = (traitType: string): string | number | undefined => {
    if (!metadata?.attributes) return undefined;
    const attr = metadata.attributes.find((a) => a.trait_type === traitType);
    return attr?.value;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (isLoading) return <PageLoading />;

  if (error || !property) {
    return (
      <EmptyState
        icon={<Building2 className="w-10 h-10" />}
        title="Property not found"
        description="The property you're looking for doesn't exist or has been removed."
        action={{ label: 'Back to Properties', onClick: () => window.history.back() }}
      />
    );
  }

  const progress = (Number(property.circulatingSupply) / Number(property.totalSupply)) * 100;

  return (
    <div className="space-y-6 animate-in">
      {/* Back Button */}
      <Link to="/properties" className="inline-flex items-center gap-2 text-solana-dark-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Properties
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Property Images / Gallery */}
        <div className="lg:w-1/2">
          {getImageUrls().length > 0 ? (
            <PropertyGallery images={getImageUrls()} propertyName={property.name} />
          ) : (
            <Card padding="none" className="h-64 lg:h-80 bg-gradient-to-br from-solana-purple-500/20 to-solana-green-500/20 flex items-center justify-center">
              <Building2 className="w-24 h-24 text-solana-dark-500" />
            </Card>
          )}
        </div>

        {/* Property Info */}
        <div className="lg:w-1/2 space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant={property.status === 'active' ? 'success' : 'warning'}>
                {property.status}
              </Badge>
              <Badge variant="purple">{property.details.propertyType}</Badge>
            </div>
            <h1 className="text-3xl font-bold text-white">{property.name}</h1>
            <div className="flex items-center gap-2 text-solana-dark-400 mt-2">
              <MapPin className="w-4 h-4" />
              {property.details.location}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-solana-dark-400">Token:</span>
            <code className="bg-solana-dark-800 px-2 py-1 rounded font-mono text-xs">
              {property.mint.slice(0, 8)}...{property.mint.slice(-8)}
            </code>
            <button onClick={() => copyToClipboard(property.mint)} className="text-solana-dark-400 hover:text-white">
              <Copy className="w-4 h-4" />
            </button>
            <a
              href={`https://explorer.solana.com/address/${property.mint}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-solana-purple-400 hover:text-solana-purple-300"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <Card className="p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-solana-dark-400">Token Price</span>
              <span className="font-bold text-white text-xl">
                ${property.details.valuePerToken.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-solana-dark-400">Annual Yield</span>
              <span className="font-bold text-solana-green-400 text-xl">
                {property.details.annualYieldPercent}%
              </span>
            </div>
            <div className="pt-2 border-t border-solana-dark-700">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-solana-dark-400">Sold</span>
                <span className="text-white">{progress.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-solana-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-solana rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </Card>

          {connected ? (
            <Button
              className="w-full"
              size="lg"
              leftIcon={<Wallet className="w-5 h-5" />}
              onClick={() => setIsInvestModalOpen(true)}
            >
              Invest Now
            </Button>
          ) : (
            <Button variant="secondary" className="w-full" size="lg">
              Connect Wallet to Invest
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <StatsGrid cols={4}>
        <StatCard
          title="Total Value"
          value={`$${property.details.totalValueUsd.toLocaleString()}`}
          icon={<Building2 className="w-6 h-6 text-solana-purple-400" />}
          iconBg="bg-solana-purple-500/20"
        />
        <StatCard
          title="Total Supply"
          value={Number(property.totalSupply).toLocaleString()}
          icon={<Users className="w-6 h-6 text-blue-400" />}
          iconBg="bg-blue-500/20"
        />
        <StatCard
          title="Circulating"
          value={Number(property.circulatingSupply).toLocaleString()}
          icon={<TrendingUp className="w-6 h-6 text-solana-green-400" />}
          iconBg="bg-solana-green-500/20"
        />
        <StatCard
          title="Available"
          value={Number(property.availableSupply).toLocaleString()}
          icon={<Wallet className="w-6 h-6 text-yellow-400" />}
          iconBg="bg-yellow-500/20"
        />
      </StatsGrid>

      {/* Description and Property Details */}
      {metadata && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Description */}
          <Card className="lg:col-span-2 p-6">
            <CardHeader
              title="About This Property"
              subtitle={property.details.propertyAddress}
              icon={<FileText className="w-5 h-5 text-solana-purple-400" />}
            />
            <p className="text-solana-dark-300 leading-relaxed whitespace-pre-wrap">
              {metadata.description || 'No description available.'}
            </p>
          </Card>

          {/* Property Attributes */}
          <Card className="p-6">
            <CardHeader title="Property Details" />
            <div className="space-y-4">
              {getAttribute('Year Built') && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-solana-dark-800 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-solana-dark-400" />
                  </div>
                  <div>
                    <p className="text-xs text-solana-dark-400">Year Built</p>
                    <p className="text-white font-medium">{getAttribute('Year Built')}</p>
                  </div>
                </div>
              )}
              {getAttribute('Area (m²)') && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-solana-dark-800 flex items-center justify-center">
                    <Ruler className="w-5 h-5 text-solana-dark-400" />
                  </div>
                  <div>
                    <p className="text-xs text-solana-dark-400">Area</p>
                    <p className="text-white font-medium">{getAttribute('Area (m²)')} m²</p>
                  </div>
                </div>
              )}
              {getAttribute('Bedrooms') !== undefined && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-solana-dark-800 flex items-center justify-center">
                    <Home className="w-5 h-5 text-solana-dark-400" />
                  </div>
                  <div>
                    <p className="text-xs text-solana-dark-400">Bedrooms</p>
                    <p className="text-white font-medium">{getAttribute('Bedrooms')}</p>
                  </div>
                </div>
              )}
              {getAttribute('Bathrooms') !== undefined && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-solana-dark-800 flex items-center justify-center">
                    <Bath className="w-5 h-5 text-solana-dark-400" />
                  </div>
                  <div>
                    <p className="text-xs text-solana-dark-400">Bathrooms</p>
                    <p className="text-white font-medium">{getAttribute('Bathrooms')}</p>
                  </div>
                </div>
              )}
              {getAttribute('Parking Spaces') !== undefined && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-solana-dark-800 flex items-center justify-center">
                    <Car className="w-5 h-5 text-solana-dark-400" />
                  </div>
                  <div>
                    <p className="text-xs text-solana-dark-400">Parking</p>
                    <p className="text-white font-medium">{getAttribute('Parking Spaces')} spaces</p>
                  </div>
                </div>
              )}
              {getAttribute('Amenities') && (
                <div>
                  <p className="text-xs text-solana-dark-400 mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {String(getAttribute('Amenities'))
                      .split(', ')
                      .map((amenity, index) => (
                        <Badge key={index} variant="default" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Revenue Info */}
      <Card padding="md">
        <CardHeader title="Revenue Distribution" subtitle="Historical and current epoch information" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-solana-dark-800/50 rounded-xl">
            <p className="text-sm text-solana-dark-400 mb-1">Total Distributed</p>
            <p className="text-xl font-bold text-white">
              ${(Number(property.revenue.totalDistributed) / 1e9).toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-solana-dark-800/50 rounded-xl">
            <p className="text-sm text-solana-dark-400 mb-1">Unclaimed</p>
            <p className="text-xl font-bold text-solana-green-400">
              ${(Number(property.revenue.unclaimed) / 1e9).toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-solana-dark-800/50 rounded-xl">
            <p className="text-sm text-solana-dark-400 mb-1">Current Epoch</p>
            <p className="text-xl font-bold text-white">#{property.currentEpoch}</p>
          </div>
        </div>
      </Card>

      {/* Investment Modal */}
      <InvestmentModal
        isOpen={isInvestModalOpen}
        onClose={() => setIsInvestModalOpen(false)}
        propertyMint={property.mint}
        propertyName={property.name}
        propertySymbol={property.symbol}
        valuePerToken={property.details.valuePerToken}
        availableSupply={Number(property.availableSupply)}
        annualYieldPercent={property.details.annualYieldPercent}
        onInvestmentSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['property', mint] });
        }}
      />
    </div>
  );
};
