import { Config } from '../config/Config';
export type PropertyStatus = 'active' | 'sold_out' | 'pending' | 'paused';
export interface PropertyMetadata {
    name: string;
    symbol: string;
    description: string;
    image: string;
    external_url?: string;
    attributes: PropertyAttribute[];
    properties: {
        files: PropertyFile[];
        category: string;
    };
    price: {
        totalValueUsd: number;
        pricePerToken: number;
        currency: string;
    };
    status: PropertyStatus;
    updatedAt: string;
}
export interface PropertyAttribute {
    trait_type: string;
    value: string | number;
    display_type?: string;
}
export interface PropertyFile {
    uri: string;
    type: string;
    cdn?: boolean;
}
export interface UploadResult {
    ipfsHash: string;
    ipfsUri: string;
    gatewayUrl: string;
    size?: number;
}
export interface PropertyMetadataInput {
    name: string;
    symbol: string;
    description: string;
    propertyType: string;
    location: string;
    propertyAddress: string;
    totalValueUsd: number;
    pricePerToken: number;
    totalSupply: number;
    annualYieldPercent: number;
    status: PropertyStatus;
    images: string[];
    amenities?: string[];
    yearBuilt?: number;
    squareMeters?: number;
    bedrooms?: number;
    bathrooms?: number;
    parkingSpaces?: number;
}
export interface UpdateMetadataInput {
    currentIpfsUri: string;
    totalValueUsd?: number;
    pricePerToken?: number;
    status?: PropertyStatus;
    description?: string;
    images?: string[];
    annualYieldPercent?: number;
}
interface PinataListResponse {
    rows: Array<{
        ipfs_pin_hash: string;
        size: number;
        date_pinned: string;
        metadata: {
            name: string;
            keyvalues: Record<string, string>;
        };
    }>;
}
export declare class IpfsService {
    private config;
    private baseUrl;
    constructor(config: Config);
    isConfigured(): boolean;
    private getHeaders;
    /**
     * Upload image file to IPFS
     */
    uploadImage(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult>;
    /**
     * Upload JSON metadata to IPFS
     */
    uploadJson(data: object, name: string): Promise<UploadResult>;
    /**
     * Create initial property metadata and upload to IPFS
     */
    createPropertyMetadata(input: PropertyMetadataInput): Promise<UploadResult>;
    /**
     * Update property metadata (creates new IPFS hash)
     * Fetches current metadata, merges updates, and uploads new version
     */
    updatePropertyMetadata(input: UpdateMetadataInput): Promise<UploadResult>;
    /**
     * Convert IPFS URI to gateway URL
     */
    getGatewayUrl(ipfsUri: string): string;
    /**
     * Fetch metadata from IPFS
     */
    fetchMetadata(ipfsUri: string): Promise<PropertyMetadata | null>;
    /**
     * Unpin content from IPFS (useful when updating metadata - unpin old version)
     */
    unpin(ipfsHash: string): Promise<boolean>;
    /**
     * List pinned content
     */
    listPins(filters?: {
        name?: string;
        status?: string;
    }): Promise<PinataListResponse['rows']>;
}
export {};
//# sourceMappingURL=IpfsService.d.ts.map