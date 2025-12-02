/**
 * Property Entity - Core domain model for tokenized real estate
 */
export type PropertyStatus = 'active' | 'paused' | 'frozen';

export interface PropertyDetails {
  propertyType: string;
  location: string;
  totalValueUsd: number;
  annualYieldPercent: number;
  metadataUri?: string;
  image?: string;
}

export interface Property {
  mint: string;
  authority: string;
  name: string;
  symbol: string;
  totalSupply: bigint;
  circulatingSupply: bigint;
  decimals: number;
  details: PropertyDetails;
  status: PropertyStatus;
  currentEpoch: number;
  createdAt: Date;
}

export interface TokenHolding {
  propertyMint: string;
  tokenAccount: string;
  balance: bigint;
  percentage: number;
}

export class PropertyEntity implements Property {
  public readonly mint: string;
  public readonly authority: string;
  public readonly name: string;
  public readonly symbol: string;
  public readonly totalSupply: bigint;
  public circulatingSupply: bigint;
  public readonly decimals: number;
  public details: PropertyDetails;
  public status: PropertyStatus;
  public currentEpoch: number;
  public readonly createdAt: Date;

  constructor(data: Property) {
    this.mint = data.mint;
    this.authority = data.authority;
    this.name = data.name;
    this.symbol = data.symbol;
    this.totalSupply = data.totalSupply;
    this.circulatingSupply = data.circulatingSupply;
    this.decimals = data.decimals;
    this.details = data.details;
    this.status = data.status;
    this.currentEpoch = data.currentEpoch;
    this.createdAt = data.createdAt;
  }

  get availableSupply(): bigint {
    return this.totalSupply - this.circulatingSupply;
  }

  get valuePerToken(): number {
    if (this.totalSupply === 0n) return 0;
    return this.details.totalValueUsd / Number(this.totalSupply);
  }

  canMint(amount: bigint): boolean {
    return this.status === 'active' && this.circulatingSupply + amount <= this.totalSupply;
  }

  static fromOnChain(data: any, mint: string): PropertyEntity {
    return new PropertyEntity({
      mint,
      authority: data.authority?.toString() || '',
      name: data.propertyName || data.name || 'Unknown Property',
      symbol: data.propertySymbol || data.symbol || 'UNK',
      totalSupply: BigInt(data.totalSupply?.toString() || '0'),
      circulatingSupply: BigInt(data.circulatingSupply?.toString() || '0'),
      decimals: data.decimals || 9,
      details: {
        propertyType: data.details?.propertyType || 'residential',
        location: data.details?.propertyAddress || data.details?.location || 'Unknown',
        totalValueUsd: Number(data.details?.totalValueUsd?.toString() || '0'),
        annualYieldPercent: (data.details?.rentalYieldBps || 0) / 100,
        metadataUri: data.details?.metadataUri || '',
      },
      status: data.isActive ? 'active' : 'paused',
      currentEpoch: Number(data.currentEpoch?.toString() || '0'),
      createdAt: data.createdAt
        ? new Date(Number(data.createdAt.toString()) * 1000)
        : new Date(),
    });
  }
}
