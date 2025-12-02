"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpfsService = void 0;
const tsyringe_1 = require("tsyringe");
const Config_1 = require("../config/Config");
const tokens_1 = require("../../shared/container/tokens");
let IpfsService = class IpfsService {
    config;
    baseUrl = 'https://api.pinata.cloud';
    constructor(config) {
        this.config = config;
    }
    isConfigured() {
        const { jwt, apiKey, secretKey } = this.config.pinata;
        return !!(jwt || (apiKey && secretKey));
    }
    getHeaders() {
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
    async uploadImage(fileBuffer, fileName, mimeType) {
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
        const result = await response.json();
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
    async uploadJson(data, name) {
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
        const result = await response.json();
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
    async createPropertyMetadata(input) {
        const attributes = [
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
        const files = input.images.map((uri) => ({
            uri,
            type: 'image/jpeg',
            cdn: false,
        }));
        const metadata = {
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
    async updatePropertyMetadata(input) {
        // Fetch current metadata
        const currentMetadata = await this.fetchMetadata(input.currentIpfsUri);
        if (!currentMetadata) {
            throw new Error('Could not fetch current metadata from IPFS');
        }
        // Merge updates
        const updatedMetadata = {
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
    getGatewayUrl(ipfsUri) {
        if (ipfsUri.startsWith('ipfs://')) {
            const hash = ipfsUri.replace('ipfs://', '');
            return `${this.config.pinata.gateway}/${hash}`;
        }
        return ipfsUri;
    }
    /**
     * Fetch metadata from IPFS
     */
    async fetchMetadata(ipfsUri) {
        try {
            const gatewayUrl = this.getGatewayUrl(ipfsUri);
            const response = await fetch(gatewayUrl);
            if (!response.ok) {
                console.error('Failed to fetch metadata:', response.statusText);
                return null;
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error fetching metadata:', error);
            return null;
        }
    }
    /**
     * Unpin content from IPFS (useful when updating metadata - unpin old version)
     */
    async unpin(ipfsHash) {
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
        }
        catch (error) {
            console.error('Error unpinning:', error);
            return false;
        }
    }
    /**
     * List pinned content
     */
    async listPins(filters) {
        if (!this.isConfigured()) {
            return [];
        }
        try {
            const params = new URLSearchParams();
            if (filters?.name)
                params.append('metadata[name]', filters.name);
            if (filters?.status)
                params.append('status', filters.status);
            const response = await fetch(`${this.baseUrl}/data/pinList?${params}`, {
                headers: this.getHeaders(),
            });
            if (!response.ok) {
                return [];
            }
            const result = await response.json();
            return result.rows || [];
        }
        catch (error) {
            console.error('Error listing pins:', error);
            return [];
        }
    }
};
exports.IpfsService = IpfsService;
exports.IpfsService = IpfsService = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(tokens_1.TOKENS.Config)),
    __metadata("design:paramtypes", [Config_1.Config])
], IpfsService);
//# sourceMappingURL=IpfsService.js.map