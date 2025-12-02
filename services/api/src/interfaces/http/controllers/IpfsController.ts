import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { IpfsService, PropertyMetadataInput, UpdateMetadataInput, PropertyStatus } from '../../../infrastructure/ipfs/IpfsService';
import { Config } from '../../../infrastructure/config/Config';
import { TOKENS } from '../../../shared/container/tokens';

@injectable()
export class IpfsController {
  constructor(
    @inject(TOKENS.IpfsService) private ipfsService: IpfsService,
    @inject(TOKENS.Config) private config: Config
  ) {}

  // Check if wallet is admin
  private isAdmin(walletAddress: string): boolean {
    return walletAddress === this.config.admin.walletAddress;
  }

  // GET /api/v1/ipfs/status
  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({
        success: true,
        configured: this.ipfsService.isConfigured(),
        service: 'Pinata',
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/ipfs/gateway/:hash
  async getGatewayUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hash } = req.params;
      const ipfsUri = hash.startsWith('ipfs://') ? hash : `ipfs://${hash}`;
      const gatewayUrl = this.ipfsService.getGatewayUrl(ipfsUri);

      res.json({
        success: true,
        ipfsUri,
        gatewayUrl,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/ipfs/metadata/:hash
  async getMetadata(req: Request, res: Response, next: NextFunction): Promise<void> {
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
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/ipfs/upload/image (admin only)
  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const walletAddress = req.headers['x-wallet-address'] as string;

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

      const result = await this.ipfsService.uploadImage(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/ipfs/upload/images (admin only)
  async uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const walletAddress = req.headers['x-wallet-address'] as string;

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

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No image files provided',
        });
        return;
      }

      const results = await Promise.all(
        files.map((file) =>
          this.ipfsService.uploadImage(file.buffer, file.originalname, file.mimetype)
        )
      );

      res.json({
        success: true,
        count: results.length,
        uploads: results,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/ipfs/metadata (admin only) - Create new metadata
  async createMetadata(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const walletAddress = req.headers['x-wallet-address'] as string;

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

      const input: PropertyMetadataInput = req.body;

      // Basic validation
      if (!input.name || !input.symbol || !input.images || input.images.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: name, symbol, images',
        });
        return;
      }

      // Validate status
      const validStatuses: PropertyStatus[] = ['active', 'sold_out', 'pending', 'paused'];
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
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/v1/ipfs/metadata (admin only) - Update existing metadata
  async updateMetadata(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const walletAddress = req.headers['x-wallet-address'] as string;

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

      const input: UpdateMetadataInput = req.body;

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
        const validStatuses: PropertyStatus[] = ['active', 'sold_out', 'pending', 'paused'];
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
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/v1/ipfs/unpin/:hash (admin only)
  async unpin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const walletAddress = req.headers['x-wallet-address'] as string;

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
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to unpin content',
        });
      }
    } catch (error) {
      next(error);
    }
  }
}
