import { injectable, inject } from 'tsyringe';
import { Config } from '../config/Config';
import { TOKENS } from '../../shared/container/tokens';

// Property status enum
export type PropertyStatus = 'active' | 'sold_out' | 'pending' | 'paused';

// Metadata stored on IPFS - includes dynamic fields
export interface PropertyMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string; // Primary image
  external_url?: string;
  attributes: PropertyAttribute[];
  properties: {
    files: PropertyFile[];
    category: string;
  };
  // Dynamic fields
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

// Input for creating property metadata
export interface PropertyMetadataInput {
  name: string;
  symbol: string;
  description: string;
  // Property details
  propertyType: string;
  location: string; // City/Region
  propertyAddress: string; // Full address
  // Pricing (dynamic)
  totalValueUsd: number;
  pricePerToken: number;
  // Token info
  totalSupply: number;
  annualYieldPercent: number;
  // Status (dynamic)
  status: PropertyStatus;
  // Images
  images: string[]; // IPFS URIs
  // Optional attributes
  amenities?: string[];
  yearBuilt?: number;
  squareMeters?: number;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
}

// Input for updating metadata (partial)
export interface UpdateMetadataInput {
  currentIpfsUri: string;
  // Fields that can be updated
  totalValueUsd?: number;
  pricePerToken?: number;
  status?: PropertyStatus;
  description?: string;
  images?: string[];
  annualYieldPercent?: number;
}

interface PinataUploadResponse {
  IpfsHash: string;
  PinSize?: number;
  Timestamp?: string;
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

@injectable()
export class IpfsService {
  private baseUrl = 'https://api.pinata.cloud';

  constructor(@inject(TOKENS.Config) private config: Config) {}

  isConfigured(): boolean {
    const { jwt, apiKey, secretKey } = this.config.pinata;
    return !!(jwt || (apiKey && secretKey));
  }

  private getHeaders(): Record<string, string> {
    const { jwt, apiKey, secretKey } = this.config.pinata;
    if (jwt) {
      return { Authorization: `Bearer ${jwt}` };
    }
    return {
      pinata_api_key: apiKey,
      pinata_secret_api_key: secretKey,
    };
  }

  /**
   * Upload image file to IPFS
   */
  async uploadImage(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<UploadResult> {
    if (!this.isConfigured()) {
      throw new Error('IPFS service not configured. Set PINATA_JWT or PINATA_API_KEY/PINATA_SECRET_KEY');
    }

    // Validate mime type is image
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
      throw new Error(`Invalid file type: ${mimeType}. Only images are allowed.`);
    }

    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append('file', blob, fileName);

    const pinataOptions = JSON.stringify({ cidVersion: 1 });
    formData.append('pinataOptions', pinataOptions);

    const pinataMetadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        type: 'property-image',
        uploadedAt: new Date().toISOString(),
      },
    });
    formData.append('pinataMetadata', pinataMetadata);

    const response = await fetch(`${this.baseUrl}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload to IPFS: ${error}`);
    }

    const result = await response.json() as PinataUploadResponse;
    const gateway = this.config.pinata.gateway;

    return {
      ipfsHash: result.IpfsHash,
      ipfsUri: `ipfs://${result.IpfsHash}`,
      gatewayUrl: `${gateway}/${result.IpfsHash}`,
      size: result.PinSize,
    };
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadJson(data: object, name: string): Promise<UploadResult> {
    if (!this.isConfigured()) {
      throw new Error('IPFS service not configured');
    }

    const response = await fetch(`${this.baseUrl}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataOptions: { cidVersion: 1 },
        pinataMetadata: {
          name: name,
          keyvalues: {
            type: 'property-metadata',
            uploadedAt: new Date().toISOString(),
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload JSON to IPFS: ${error}`);
    }

    const result = await response.json() as PinataUploadResponse;
    const gateway = this.config.pinata.gateway;

    return {
      ipfsHash: result.IpfsHash,
      ipfsUri: `ipfs://${result.IpfsHash}`,
      gatewayUrl: `${gateway}/${result.IpfsHash}`,
    };
  }

  /**
   * Create initial property metadata and upload to IPFS
   */
  async createPropertyMetadata(input: PropertyMetadataInput): Promise<UploadResult> {
    const attributes: PropertyAttribute[] = [
      { trait_type: 'Property Type', value: input.propertyType },
      { trait_type: 'Location', value: input.location },
      { trait_type: 'Address', value: input.propertyAddress },
      { trait_type: 'Total Supply', value: input.totalSupply, display_type: 'number' },
      { trait_type: 'Annual Yield', value: `${input.annualYieldPercent}%` },
    ];

    if (input.yearBuilt) {
      attributes.push({ trait_type: 'Year Built', value: input.yearBuilt, display_type: 'number' });
    }
    if (input.squareMeters) {
      attributes.push({ trait_type: 'Area (m²)', value: input.squareMeters, display_type: 'number' });
    }
    if (input.bedrooms !== undefined) {
      attributes.push({ trait_type: 'Bedrooms', value: input.bedrooms, display_type: 'number' });
    }
    if (input.bathrooms !== undefined) {
      attributes.push({ trait_type: 'Bathrooms', value: input.bathrooms, display_type: 'number' });
    }
    if (input.parkingSpaces !== undefined) {
      attributes.push({ trait_type: 'Parking Spaces', value: input.parkingSpaces, display_type: 'number' });
    }
    if (input.amenities && input.amenities.length > 0) {
      attributes.push({ trait_type: 'Amenities', value: input.amenities.join(', ') });
    }

    const files: PropertyFile[] = input.images.map((uri) => ({
      uri,
      type: 'image/jpeg',
      cdn: false,
    }));

    const metadata: PropertyMetadata = {
      name: input.name,
      symbol: input.symbol,
      description: input.description,
      image: input.images[0] || '',
      external_url: `https://hubtoken.io/properties/${input.symbol.toLowerCase()}`,
      attributes,
      properties: {
        files,
        category: 'real-estate',
      },
      // Dynamic fields
      price: {
        totalValueUsd: input.totalValueUsd,
        pricePerToken: input.pricePerToken,
        currency: 'USD',
      },
      status: input.status,
      updatedAt: new Date().toISOString(),
    };

    return this.uploadJson(metadata, `${input.symbol}-metadata.json`);
  }

  /**
   * Update property metadata (creates new IPFS hash)
   * Fetches current metadata, merges updates, and uploads new version
   */
  async updatePropertyMetadata(input: UpdateMetadataInput): Promise<UploadResult> {
    // Fetch current metadata
    const currentMetadata = await this.fetchMetadata(input.currentIpfsUri);

    if (!currentMetadata) {
      throw new Error('Could not fetch current metadata from IPFS');
    }

    // Merge updates
    const updatedMetadata: PropertyMetadata = {
      ...currentMetadata,
      updatedAt: new Date().toISOString(),
    };

    // Update price if provided
    if (input.totalValueUsd !== undefined || input.pricePerToken !== undefined) {
      updatedMetadata.price = {
        ...currentMetadata.price,
        ...(input.totalValueUsd !== undefined && { totalValueUsd: input.totalValueUsd }),
        ...(input.pricePerToken !== undefined && { pricePerToken: input.pricePerToken }),
      };
    }

    // Update status if provided
    if (input.status !== undefined) {
      updatedMetadata.status = input.status;
    }

    // Update description if provided
    if (input.description !== undefined) {
      updatedMetadata.description = input.description;
    }

    // Update images if provided
    if (input.images !== undefined) {
      updatedMetadata.image = input.images[0] || '';
      updatedMetadata.properties.files = input.images.map((uri) => ({
        uri,
        type: 'image/jpeg',
        cdn: false,
      }));
    }

    // Update annual yield if provided
    if (input.annualYieldPercent !== undefined) {
      const yieldAttr = updatedMetadata.attributes.find(a => a.trait_type === 'Annual Yield');
      if (yieldAttr) {
        yieldAttr.value = `${input.annualYieldPercent}%`;
      }
    }

    // Upload updated metadata
    return this.uploadJson(updatedMetadata, `${currentMetadata.symbol}-metadata.json`);
  }

  /**
   * Convert IPFS URI to gateway URL
   */
  getGatewayUrl(ipfsUri: string): string {
    if (ipfsUri.startsWith('ipfs://')) {
      const hash = ipfsUri.replace('ipfs://', '');
      return `${this.config.pinata.gateway}/${hash}`;
    }
    return ipfsUri;
  }

  /**
   * Fetch metadata from IPFS
   */
  async fetchMetadata(ipfsUri: string): Promise<PropertyMetadata | null> {
    try {
      const gatewayUrl = this.getGatewayUrl(ipfsUri);
      const response = await fetch(gatewayUrl);

      if (!response.ok) {
        console.error('Failed to fetch metadata:', response.statusText);
        return null;
      }

      return await response.json() as PropertyMetadata;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }
  }

  /**
   * Unpin content from IPFS (useful when updating metadata - unpin old version)
   */
  async unpin(ipfsHash: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      // Remove ipfs:// prefix if present
      const hash = ipfsHash.replace('ipfs://', '');

      const response = await fetch(`${this.baseUrl}/pinning/unpin/${hash}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error('Error unpinning:', error);
      return false;
    }
  }

  /**
   * List pinned content
   */
  async listPins(filters?: { name?: string; status?: string }): Promise<PinataListResponse['rows']> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const params = new URLSearchParams();
      if (filters?.name) params.append('metadata[name]', filters.name);
      if (filters?.status) params.append('status', filters.status);

      const response = await fetch(`${this.baseUrl}/data/pinList?${params}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return [];
      }

      const result = await response.json() as PinataListResponse;
      return result.rows || [];
    } catch (error) {
      console.error('Error listing pins:', error);
      return [];
    }
  }
}
