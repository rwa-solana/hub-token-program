import { SolanaProgramAdapter } from '../solana/SolanaProgramAdapter';
import { IPropertyRepository, PropertyFilter } from '../../application/ports/IPropertyRepository';
import { Property } from '../../domain/entities';
export declare class PropertyRepositoryImpl implements IPropertyRepository {
    private programAdapter;
    constructor(programAdapter: SolanaProgramAdapter);
    findByMint(mintAddress: string): Promise<Property | null>;
    findAll(filter?: PropertyFilter): Promise<Property[]>;
    findByAuthority(authority: string): Promise<Property[]>;
    exists(mintAddress: string): Promise<boolean>;
    getPropertyStatePda(mint: string): Promise<string>;
    getCirculatingSupply(mintAddress: string): Promise<bigint>;
}
//# sourceMappingURL=PropertyRepositoryImpl.d.ts.map