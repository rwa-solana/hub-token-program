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
export declare class PropertyEntity implements Property {
    readonly mint: string;
    readonly authority: string;
    readonly name: string;
    readonly symbol: string;
    readonly totalSupply: bigint;
    circulatingSupply: bigint;
    readonly decimals: number;
    details: PropertyDetails;
    status: PropertyStatus;
    currentEpoch: number;
    readonly createdAt: Date;
    constructor(data: Property);
    get availableSupply(): bigint;
    get valuePerToken(): number;
    canMint(amount: bigint): boolean;
    static fromOnChain(data: any, mint: string): PropertyEntity;
}
//# sourceMappingURL=Property.d.ts.map