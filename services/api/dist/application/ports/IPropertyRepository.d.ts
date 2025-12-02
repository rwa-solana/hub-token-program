import { Property, PropertyStatus } from '../../domain/entities';
export interface PropertyFilter {
    status?: PropertyStatus;
    minValue?: number;
    maxValue?: number;
    propertyType?: string;
}
export interface IPropertyRepository {
    findByMint(mintAddress: string): Promise<Property | null>;
    findAll(filter?: PropertyFilter): Promise<Property[]>;
    findByAuthority(authority: string): Promise<Property[]>;
    exists(mintAddress: string): Promise<boolean>;
    getPropertyStatePda(mint: string): Promise<string>;
    getCirculatingSupply(mintAddress: string): Promise<bigint>;
}
//# sourceMappingURL=IPropertyRepository.d.ts.map