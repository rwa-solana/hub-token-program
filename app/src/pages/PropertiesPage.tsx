import { FC, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Search, Grid, List } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { propertiesApi } from '@/services/api';
import { Property, PropertyStatus } from '@/types';

export const PropertiesPage: FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | 'all'>('all');

  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertiesApi.getAll(),
  });

  const filteredProperties = properties?.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.details.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-solana-dark-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<Building2 className="w-10 h-10" />}
        title="Failed to load properties"
        description="There was an error loading the properties. Please try again later."
        action={{ label: 'Retry', onClick: () => window.location.reload() }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Properties</h1>
          <p className="text-solana-dark-400">Browse available real estate investments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm" className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-solana-dark-400" />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'paused'] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </Card>

      {/* Properties Grid/List */}
      {filteredProperties && filteredProperties.length > 0 ? (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredProperties.map((property) => (
            viewMode === 'grid' ? (
              <PropertyCard key={property.mint} property={property} />
            ) : (
              <PropertyListItem key={property.mint} property={property} />
            )
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Building2 className="w-10 h-10" />}
          title="No properties found"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      )}
    </div>
  );
};

const PropertyCard: FC<{ property: Property }> = ({ property }) => {
  return (
    <Link to={`/properties/${property.mint}`}>
      <Card variant="hover" padding="none">
        <div className="h-48 bg-gradient-to-br from-solana-purple-500/20 to-solana-green-500/20 flex items-center justify-center relative overflow-hidden">
          {property.details.image ? (
            <img
              src={property.details.image}
              alt={property.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <Building2 className={`w-16 h-16 text-solana-dark-500 ${property.details.image ? 'hidden' : ''}`} />
          <div className="absolute top-4 right-4">
            <Badge variant={property.status === 'active' ? 'success' : 'warning'}>
              {property.status}
            </Badge>
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-semibold text-white text-lg mb-1">{property.name}</h3>
          <p className="text-sm text-solana-dark-400 mb-4">{property.details.location}</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-solana-dark-500 uppercase tracking-wide">Total Value</p>
              <p className="font-semibold text-white">
                ${property.details.totalValueUsd.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-solana-dark-500 uppercase tracking-wide">Token Price</p>
              <p className="font-semibold text-white">
                ${property.details.valuePerToken.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-solana-dark-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-solana-dark-400">Annual Yield</span>
              <span className="font-semibold text-solana-green-400">
                {property.details.annualYieldPercent}%
              </span>
            </div>
            <Badge variant="purple" size="sm">
              {property.details.propertyType}
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
};

const PropertyListItem: FC<{ property: Property }> = ({ property }) => {
  return (
    <Link to={`/properties/${property.mint}`}>
      <Card variant="hover" className="flex flex-col sm:flex-row gap-4">
        <div className="sm:w-48 h-32 bg-gradient-to-br from-solana-purple-500/20 to-solana-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
          {property.details.image ? (
            <img
              src={property.details.image}
              alt={property.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <Building2 className={`w-10 h-10 text-solana-dark-500 ${property.details.image ? 'hidden' : ''}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-white text-lg">{property.name}</h3>
              <p className="text-sm text-solana-dark-400">{property.details.location}</p>
            </div>
            <Badge variant={property.status === 'active' ? 'success' : 'warning'}>
              {property.status}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <div>
              <p className="text-xs text-solana-dark-500">Total Value</p>
              <p className="font-semibold text-white">
                ${property.details.totalValueUsd.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-solana-dark-500">Token Price</p>
              <p className="font-semibold text-white">
                ${property.details.valuePerToken.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-solana-dark-500">Annual Yield</p>
              <p className="font-semibold text-solana-green-400">
                {property.details.annualYieldPercent}%
              </p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
