import { IPropertyRepository, PropertyFilter } from '../ports/IPropertyRepository';
export interface GetPropertiesInput {
    filter?: PropertyFilter;
}
export interface PropertyDTO {
    mint: string;
    name: string;
    symbol: string;
    authority: string;
    status: string;
    totalSupply: string;
    circulatingSupply: string;
    availableSupply: string;
    decimals: number;
    details: {
        propertyType: string;
        location: string;
        totalValueUsd: number;
        valuePerToken: number;
        annualYieldPercent: number;
    };
    currentEpoch: number;
    createdAt: string;
}
export declare class GetPropertiesUseCase {
    private propertyRepository;
    constructor(propertyRepository: IPropertyRepository);
    execute(input?: GetPropertiesInput): Promise<PropertyDTO[]>;
    private toDTO;
}
//# sourceMappingURL=GetPropertiesUseCase.d.ts.map