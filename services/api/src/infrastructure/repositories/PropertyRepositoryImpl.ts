import { injectable, inject } from 'tsyringe';
import { PublicKey } from '@solana/web3.js';
import axios from 'axios';
import { TOKENS } from '../../shared/container/tokens';
import { SolanaProgramAdapter } from '../solana/SolanaProgramAdapter';
import { Config } from '../config/Config';
import { IPropertyRepository, PropertyFilter } from '../../application/ports/IPropertyRepository';
import { PropertyEntity, Property } from '../../domain/entities';

@injectable()
export class PropertyRepositoryImpl implements IPropertyRepository {
  constructor(
    @inject(TOKENS.SolanaProgram) private programAdapter: SolanaProgramAdapter,
    @inject(TOKENS.Config) private config: Config
  ) {}

  async findByMint(mintAddress: string): Promise<Property | null> {
    try {
      // Try fetching from indexer first
      const response = await axios.get(`${this.config.indexer.url}/api/v1/properties/${mintAddress}`);
      if (response.data?.success && response.data?.data) {
        return this.mapIndexerToProperty(response.data.data);
      }
    } catch (error) {
      console.warn('Indexer fetch failed, falling back to on-chain fetch:', error);
    }

    // Fallback to on-chain fetch
    try {
      const mint = new PublicKey(mintAddress);
      const data = await this.programAdapter.fetchPropertyState(mint);

      if (!data) return null;

      return PropertyEntity.fromOnChain(data, mintAddress);
    } catch {
      return null;
    }
  }

  async findAll(filter?: PropertyFilter): Promise<Property[]> {
    try {
      // Try fetching from indexer first
      const params = new URLSearchParams();
      if (filter?.status) params.append('status', filter.status);
      if (filter?.minValue) params.append('minValue', filter.minValue.toString());
      if (filter?.maxValue) params.append('maxValue', filter.maxValue.toString());
      if (filter?.propertyType) params.append('propertyType', filter.propertyType);

      const url = `${this.config.indexer.url}/api/v1/properties?${params.toString()}`;
      const response = await axios.get(url);

      if (response.data?.success && Array.isArray(response.data?.data)) {
        return response.data.data.map((p: any) => this.mapIndexerToProperty(p));
      }
    } catch (error) {
      console.warn('Indexer fetch failed, falling back to on-chain fetch:', error);
    }

    // Fallback to on-chain fetch (this will fail with free tier Alchemy)
    try {
      const allProperties = await this.programAdapter.fetchAllProperties();
      let properties: Property[] = allProperties.map((acc: any) =>
        PropertyEntity.fromOnChain(acc.account, acc.publicKey.toString())
      );

      if (filter?.status) {
        properties = properties.filter((p) => p.status === filter.status);
      }

      if (filter?.minValue) {
        properties = properties.filter((p) => p.details.totalValueUsd >= filter.minValue!);
      }

      if (filter?.maxValue) {
        properties = properties.filter((p) => p.details.totalValueUsd <= filter.maxValue!);
      }

      if (filter?.propertyType) {
        properties = properties.filter((p) => p.details.propertyType === filter.propertyType);
      }

      return properties;
    } catch (error) {
      console.error('Failed to fetch properties from both indexer and on-chain:', error);
      return [];
    }
  }

  private mapIndexerToProperty(data: any): Property {
    return {
      mint: data.mint,
      authority: data.authority,
      name: data.name,
      symbol: data.symbol,
      status: data.status,
      totalSupply: BigInt(data.totalSupply || data.total_supply || 0),
      circulatingSupply: BigInt(data.circulatingSupply || data.circulating_supply || 0),
      decimals: data.decimals,
      details: {
        propertyType: data.propertyType || data.property_type || '',
        location: data.location || '',
        // Indexer stores totalValueUsd in cents already, no conversion needed
        totalValueUsd: Number(data.totalValueUsd || data.total_value_usd || 0),
        // Indexer stores annualYield in basis points (e.g., 480 = 4.8%)
        annualYieldPercent: Number(data.annualYield || data.annual_yield || 0),
        metadataUri: data.metadataUri || data.metadata_uri || '',
        image: data.image || '',
      },
      currentEpoch: Number(data.currentEpoch || data.current_epoch || 0),
      createdAt: new Date(data.createdAt || data.created_at || Date.now()),
    };
  }

  async findByAuthority(authority: string): Promise<Property[]> {
    const allProperties = await this.findAll();
    return allProperties.filter((p) => p.authority === authority);
  }

  async exists(mintAddress: string): Promise<boolean> {
    const property = await this.findByMint(mintAddress);
    return property !== null;
  }

  async getPropertyStatePda(mint: string): Promise<string> {
    const [pda] = this.programAdapter.derivePropertyStatePda(new PublicKey(mint));
    return pda.toString();
  }

  async getCirculatingSupply(mintAddress: string): Promise<bigint> {
    const property = await this.findByMint(mintAddress);
    return property?.circulatingSupply ?? 0n;
  }
}
