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
exports.IpfsController = void 0;
const tsyringe_1 = require("tsyringe");
const IpfsService_1 = require("../../../infrastructure/ipfs/IpfsService");
const Config_1 = require("../../../infrastructure/config/Config");
const tokens_1 = require("../../../shared/container/tokens");
let IpfsController = class IpfsController {
    ipfsService;
    config;
    constructor(ipfsService, config) {
        this.ipfsService = ipfsService;
        this.config = config;
    }
    // Check if wallet is admin
    isAdmin(walletAddress) {
        return walletAddress === this.config.admin.walletAddress;
    }
    // GET /api/v1/ipfs/status
    async getStatus(req, res, next) {
        try {
            res.json({
                success: true,
                configured: this.ipfsService.isConfigured(),
                service: 'Pinata',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/ipfs/gateway/:hash
    async getGatewayUrl(req, res, next) {
        try {
            const { hash } = req.params;
            const ipfsUri = hash.startsWith('ipfs://') ? hash : `ipfs://${hash}`;
            const gatewayUrl = this.ipfsService.getGatewayUrl(ipfsUri);
            res.json({
                success: true,
                ipfsUri,
                gatewayUrl,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/ipfs/metadata/:hash
    async getMetadata(req, res, next) {
        try {
            const { hash } = req.params;
            const ipfsUri = hash.startsWith('ipfs://') ? hash : `ipfs://${hash}`;
            const metadata = await this.ipfsService.fetchMetadata(ipfsUri);
            if (!metadata) {
                res.status(404).json({
                    success: false,
                    error: 'Metadata not found',
                });
                return;
            }
            res.json({
                success: true,
                metadata,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/v1/ipfs/upload/image (admin only)
    async uploadImage(req, res, next) {
        try {
            const walletAddress = req.headers['x-wallet-address'];
            if (!walletAddress || !this.isAdmin(walletAddress)) {
                res.status(403).json({
                    success: false,
                    error: 'Unauthorized - Admin access only',
                });
                return;
            }
            if (!this.ipfsService.isConfigured()) {
                res.status(503).json({
                    success: false,
                    error: 'IPFS service not configured',
                });
                return;
            }
            const file = req.file;
            if (!file) {
                res.status(400).json({
                    success: false,
                    error: 'No image file provided',
                });
                return;
            }
            const result = await this.ipfsService.uploadImage(file.buffer, file.originalname, file.mimetype);
            res.json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/v1/ipfs/upload/images (admin only)
    async uploadImages(req, res, next) {
        try {
            const walletAddress = req.headers['x-wallet-address'];
            if (!walletAddress || !this.isAdmin(walletAddress)) {
                res.status(403).json({
                    success: false,
                    error: 'Unauthorized - Admin access only',
                });
                return;
            }
            if (!this.ipfsService.isConfigured()) {
                res.status(503).json({
                    success: false,
                    error: 'IPFS service not configured',
                });
                return;
            }
            const files = req.files;
            if (!files || files.length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'No image files provided',
                });
                return;
            }
            const results = await Promise.all(files.map((file) => this.ipfsService.uploadImage(file.buffer, file.originalname, file.mimetype)));
            res.json({
                success: true,
                count: results.length,
                uploads: results,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/v1/ipfs/metadata (admin only) - Create new metadata
    async createMetadata(req, res, next) {
        try {
            const walletAddress = req.headers['x-wallet-address'];
            if (!walletAddress || !this.isAdmin(walletAddress)) {
                res.status(403).json({
                    success: false,
                    error: 'Unauthorized - Admin access only',
                });
                return;
            }
            if (!this.ipfsService.isConfigured()) {
                res.status(503).json({
                    success: false,
                    error: 'IPFS service not configured',
                });
                return;
            }
            const input = req.body;
            // Basic validation
            if (!input.name || !input.symbol || !input.images || input.images.length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required fields: name, symbol, images',
                });
                return;
            }
            // Validate status
            const validStatuses = ['active', 'sold_out', 'pending', 'paused'];
            if (!input.status || !validStatuses.includes(input.status)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid or missing status. Valid values: active, sold_out, pending, paused',
                });
                return;
            }
            const result = await this.ipfsService.createPropertyMetadata(input);
            res.json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // PUT /api/v1/ipfs/metadata (admin only) - Update existing metadata
    async updateMetadata(req, res, next) {
        try {
            const walletAddress = req.headers['x-wallet-address'];
            if (!walletAddress || !this.isAdmin(walletAddress)) {
                res.status(403).json({
                    success: false,
                    error: 'Unauthorized - Admin access only',
                });
                return;
            }
            if (!this.ipfsService.isConfigured()) {
                res.status(503).json({
                    success: false,
                    error: 'IPFS service not configured',
                });
                return;
            }
            const input = req.body;
            // Validate required field
            if (!input.currentIpfsUri) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required field: currentIpfsUri',
                });
                return;
            }
            // Validate status if provided
            if (input.status) {
                const validStatuses = ['active', 'sold_out', 'pending', 'paused'];
                if (!validStatuses.includes(input.status)) {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid status. Valid values: active, sold_out, pending, paused',
                    });
                    return;
                }
            }
            const result = await this.ipfsService.updatePropertyMetadata(input);
            res.json({
                success: true,
                message: 'Metadata updated. Remember to update on-chain metadata_uri',
                previousUri: input.currentIpfsUri,
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // DELETE /api/v1/ipfs/unpin/:hash (admin only)
    async unpin(req, res, next) {
        try {
            const walletAddress = req.headers['x-wallet-address'];
            if (!walletAddress || !this.isAdmin(walletAddress)) {
                res.status(403).json({
                    success: false,
                    error: 'Unauthorized - Admin access only',
                });
                return;
            }
            if (!this.ipfsService.isConfigured()) {
                res.status(503).json({
                    success: false,
                    error: 'IPFS service not configured',
                });
                return;
            }
            const { hash } = req.params;
            const success = await this.ipfsService.unpin(hash);
            if (success) {
                res.json({ success: true, message: 'Content unpinned' });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to unpin content',
                });
            }
        }
        catch (error) {
            next(error);
        }
    }
};
exports.IpfsController = IpfsController;
exports.IpfsController = IpfsController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(tokens_1.TOKENS.IpfsService)),
    __param(1, (0, tsyringe_1.inject)(tokens_1.TOKENS.Config)),
    __metadata("design:paramtypes", [IpfsService_1.IpfsService,
        Config_1.Config])
], IpfsController);
//# sourceMappingURL=IpfsController.js.map