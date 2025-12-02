import { Router, RequestHandler } from 'express';
import { container } from 'tsyringe';
import multer from 'multer';
import { IpfsController } from '../controllers/IpfsController';

// Configure multer for memory storage - IMAGES ONLY
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10, // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only images are allowed.`));
    }
  },
});

export function createIpfsRoutes(): Router {
  const router = Router();
  const controller = container.resolve(IpfsController);

  // Public routes
  router.get('/status', controller.getStatus.bind(controller));
  router.get('/gateway/:hash', controller.getGatewayUrl.bind(controller));
  router.get('/metadata/:hash', controller.getMetadata.bind(controller));

  // Admin routes (require x-wallet-address header)
  router.post(
    '/upload/image',
    upload.single('image') as unknown as RequestHandler,
    controller.uploadImage.bind(controller)
  );
  router.post(
    '/upload/images',
    upload.array('images', 10) as unknown as RequestHandler,
    controller.uploadImages.bind(controller)
  );

  // Metadata management
  router.post('/metadata', controller.createMetadata.bind(controller));
  router.put('/metadata', controller.updateMetadata.bind(controller));

  // Unpin content
  router.delete('/unpin/:hash', controller.unpin.bind(controller));

  return router;
}
